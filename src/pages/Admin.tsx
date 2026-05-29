import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { formatCopCurrency } from '../utils/currency';
import { api } from '../services/api';
import {
  createEmptyProduct,
  generateProductCode,
  isCurrentProductCode,
  mapBackendProductToCatalogItem,
  ProductCatalogItem,
  ProductCategory,
  saveProductsCatalog,
} from '../utils/productCatalog';

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

type AdminMobileView = 'inventory' | 'editor' | 'preview';
type AdminToast = {
  text: string;
  type: 'success' | 'error' | 'info';
  persistent?: boolean;
};

const PRODUCT_IMAGE_REQUIREMENTS = {
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeMb: 5,
  minWidth: 900,
  minHeight: 900,
  minAspectRatio: 0.72,
  maxAspectRatio: 1.35,
};

const categoryLabels: Record<ProductCategory, string> = {
  collares: 'Collares',
  aretes: 'Aretes',
  pulseras: 'Pulseras',
};

export default function Admin() {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<AdminMobileView>('inventory');
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<AdminToast | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'code' | 'name' | 'price', string>>>({});
  const [filter, setFilter] = useState('');
  const initialDraft = createEmptyProduct();
  const [draft, setDraft] = useState<ProductCatalogItem>(() => initialDraft);
  const [priceInput, setPriceInput] = useState(() => (initialDraft.price > 0 ? String(initialDraft.price) : ''));
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [isAdjustingImage, setIsAdjustingImage] = useState(false);
  const imagePreviewFrameRef = useRef<HTMLDivElement | null>(null);

  function showToast(nextToast: AdminToast) {
    setToast(nextToast);
  }

  function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  const visibleProducts = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();

    if (!normalizedFilter) {
      return products;
    }

    return products.filter((product) => {
      return product.code.toLowerCase().includes(normalizedFilter)
        || product.name.toLowerCase().includes(normalizedFilter)
        || product.description.toLowerCase().includes(normalizedFilter)
        || categoryLabels[product.category].toLowerCase().includes(normalizedFilter);
    });
  }, [filter, products]);

  useEffect(() => {
    if (products.length === 0) {
      if (isCreating) {
        return;
      }

      const freshDraft = createEmptyProduct();
      setDraft(freshDraft);
      setSelectedProductId(freshDraft.id);
      setIsCreating(true);
      return;
    }

    if (isCreating) {
      return;
    }

    const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0];

    if (selectedProduct) {
      setSelectedProductId(selectedProduct.id);
      setDraft(selectedProduct);
    }
  }, [isCreating, products, selectedProductId]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    showToast({ text: 'Cargando inventario desde el backend...', type: 'info', persistent: true });
    setIsLoadingProducts(true);

    api.getProducts()
      .then(async (backendProducts) => {
        const outdatedProducts = backendProducts.filter((product) => !isCurrentProductCode(product.codigo || ''));

        if (outdatedProducts.length > 0) {
          await Promise.all(outdatedProducts.map((product) => {
            const mappedProduct = mapBackendProductToCatalogItem(product);
            return api.updateProduct(product.id, { codigo: mappedProduct.code });
          }));
        }

        const mappedProducts = backendProducts.map(mapBackendProductToCatalogItem);

        saveProductsCatalog(mappedProducts);
        setProducts(mappedProducts);
        setSelectedProductId(mappedProducts[0]?.id ?? null);

        if (mappedProducts[0]) {
          setIsCreating(false);
          setDraft(mappedProducts[0]);
          setPriceInput(String(mappedProducts[0].price));
          showToast({
            text: `Inventario cargado: ${mappedProducts.length} producto${mappedProducts.length === 1 ? '' : 's'} disponibles.`,
            type: 'success',
          });
        } else {
          setIsCreating(true);
          showToast({
            text: 'No hay productos registrados. Puedes crear el primero desde el panel.',
            type: 'info',
          });
        }
      })
      .catch((error) => {
        showToast({
          text: getErrorMessage(error, 'No se pudieron cargar los productos.'),
          type: 'error',
        });
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  }, []);

  useEffect(() => {
    if (!toast || toast.persistent) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function getDuplicateCodeMessage(code: string) {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      return undefined;
    }

    const duplicatedCode = products.some(
      (product) => product.id !== draft.id && product.code.trim().toUpperCase() === normalizedCode,
    );

    return duplicatedCode ? 'Este codigo ya esta registrado.' : undefined;
  }

  function getPriceErrorMessage(value: string) {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return 'Ingresa un precio para el producto.';
    }

    if (!/^\d+$/.test(normalizedValue)) {
      return 'Esta casilla solo acepta numeros.';
    }

    return undefined;
  }

  function updateDraft<K extends keyof ProductCatalogItem>(field: K, value: ProductCatalogItem[K]) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    if (field === 'code') {
      const duplicateCodeMessage = getDuplicateCodeMessage(String(value));
      setFieldErrors((currentErrors) => ({
        ...currentErrors,
        code: duplicateCodeMessage,
      }));
      return;
    }

    if (field === 'name') {
      setFieldErrors((currentErrors) => ({ ...currentErrors, name: undefined }));
    }
  }

  function handlePriceChange(value: string) {
    setPriceInput(value);

    if (value === '') {
      setFieldErrors((currentErrors) => ({ ...currentErrors, price: undefined }));
      return;
    }

    const priceErrorMessage = getPriceErrorMessage(value);
    setFieldErrors((currentErrors) => ({ ...currentErrors, price: priceErrorMessage }));

    if (!priceErrorMessage) {
      setDraft((currentDraft) => ({ ...currentDraft, price: Number(value) }));
    }
  }

  function resetImagePosition() {
    setImagePosition({ x: 50, y: 50 });
  }

  function updateImagePositionFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    const frame = imagePreviewFrameRef.current;

    if (!frame) {
      return;
    }

    const rect = frame.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));

    setImagePosition({
      x: Math.round(x),
      y: Math.round(y),
    });
  }

  function handleImagePreviewPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    setIsAdjustingImage(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateImagePositionFromPointer(event);
  }

  function handleImagePreviewPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isAdjustingImage) {
      return;
    }

    updateImagePositionFromPointer(event);
  }

  function handleImagePreviewPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    setIsAdjustingImage(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleUnitsChange(value: string) {
    const numericValue = value.replace(/\D/g, '');
    updateDraft('units', numericValue ? Number(numericValue) : 0);
  }

  function validateDraft() {
    const nextErrors: Partial<Record<'code' | 'name' | 'price', string>> = {};

    if (!draft.code.trim()) {
      nextErrors.code = 'Ingresa un codigo para el producto.';
    }

    if (!draft.name.trim()) {
      nextErrors.name = 'Ingresa el nombre del producto.';
    }

    const priceErrorMessage = getPriceErrorMessage(priceInput);

    if (priceErrorMessage) {
      nextErrors.price = priceErrorMessage;
    }

    const duplicateCodeMessage = getDuplicateCodeMessage(draft.code);

    if (duplicateCodeMessage) {
      nextErrors.code = duplicateCodeMessage;
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSelectProduct(product: ProductCatalogItem) {
    setSelectedProductId(product.id);
    setDraft(product);
    setPriceInput(product.price > 0 ? String(product.price) : '');
    setIsCreating(false);
    setMobileView('editor');
    setSelectedImageFile(null);
    setLocalPreviewUrl('');
    setFieldErrors({});
    resetImagePosition();
    showToast({ text: `Editando ${product.name}. Los cambios se aplicaran cuando guardes.`, type: 'info' });
  }

  function handleCreateProduct() {
    const newProduct = createEmptyProduct();
    setDraft(newProduct);
    setPriceInput(newProduct.price > 0 ? String(newProduct.price) : '');
    setSelectedProductId(newProduct.id);
    setIsCreating(true);
    setMobileView('editor');
    setSelectedImageFile(null);
    setLocalPreviewUrl('');
    setFieldErrors({});
    resetImagePosition();
    showToast({ text: 'Nuevo producto listo para completar. Guardalo para subirlo al backend.', type: 'info' });
  }

  function handleCategoryChange(category: ProductCategory) {
    setDraft((currentDraft) => {
      const defaultCurrentCode = generateProductCode(currentDraft.category, currentDraft.id);
      const nextDefaultCode = generateProductCode(category, currentDraft.id);
      const shouldRefreshCode = currentDraft.code === defaultCurrentCode || !/^W-\d{6}$/.test(currentDraft.code.trim().toUpperCase());

      return {
        ...currentDraft,
        category,
        code: shouldRefreshCode ? nextDefaultCode : currentDraft.code,
      };
    });
  }

  function getImageDimensions(file: File) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        const dimensions = {
          width: image.naturalWidth,
          height: image.naturalHeight,
        };
        URL.revokeObjectURL(imageUrl);
        resolve(dimensions);
      };

      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('No pudimos leer las dimensiones de la imagen.'));
      };

      image.src = imageUrl;
    });
  }

  async function validateProductImageFile(file: File) {
    if (!PRODUCT_IMAGE_REQUIREMENTS.acceptedTypes.includes(file.type)) {
      return 'Sube una imagen JPG, PNG o WebP para asegurar compatibilidad con la tienda.';
    }

    const maxSizeBytes = PRODUCT_IMAGE_REQUIREMENTS.maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return `La imagen pesa demasiado. Usa un archivo de maximo ${PRODUCT_IMAGE_REQUIREMENTS.maxSizeMb} MB.`;
    }

    try {
      const { width, height } = await getImageDimensions(file);
      const aspectRatio = width / height;

      if (width < PRODUCT_IMAGE_REQUIREMENTS.minWidth || height < PRODUCT_IMAGE_REQUIREMENTS.minHeight) {
        return `La imagen debe medir al menos ${PRODUCT_IMAGE_REQUIREMENTS.minWidth} x ${PRODUCT_IMAGE_REQUIREMENTS.minHeight} px para verse nitida.`;
      }

      if (
        aspectRatio < PRODUCT_IMAGE_REQUIREMENTS.minAspectRatio
        || aspectRatio > PRODUCT_IMAGE_REQUIREMENTS.maxAspectRatio
      ) {
        return 'Usa una imagen cuadrada o ligeramente vertical. Las fotos muy panoramicas o muy estrechas se recortan mal en el catalogo.';
      }
    } catch (error) {
      return getErrorMessage(error, 'No pudimos validar la imagen. Intenta con otro archivo.');
    }

    return undefined;
  }

  async function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imageErrorMessage = await validateProductImageFile(file);

    if (imageErrorMessage) {
      event.target.value = '';
      showToast({ text: imageErrorMessage, type: 'error' });
      return;
    }

    if (localPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setLocalPreviewUrl(previewUrl);
    resetImagePosition();
    showToast({ text: `Imagen "${file.name}" lista para subir.`, type: 'info' });
  }

  async function uploadSelectedImageToStorage() {
    if (!selectedImageFile) {
      showToast({ text: 'Primero selecciona una imagen desde tu computadora.', type: 'error' });
      return null;
    }

    try {
      setIsUploadingImage(true);
      showToast({ text: `Subiendo imagen "${selectedImageFile.name}"...`, type: 'info', persistent: true });
      const safeFileName = selectedImageFile.name
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .toLowerCase();
      const storageRef = ref(storage, `products/${draft.id}-${Date.now()}-${safeFileName}`);

      await uploadBytes(storageRef, selectedImageFile);
      showToast({ text: 'Imagen subida. Preparando vista previa...', type: 'info', persistent: true });
      const downloadUrl = await getDownloadURL(storageRef);

      updateDraft('image', downloadUrl);
      setSelectedImageFile(null);
      if (localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl('');
      setMobileView('preview');
      showToast({ text: 'Imagen subida correctamente. Ahora guarda el producto para publicar el cambio.', type: 'success' });
      return downloadUrl;
    } catch (error) {
      console.error(error);
      showToast({
        text: getErrorMessage(error, 'No se pudo subir la imagen. Revisa la configuracion de Firebase Storage.'),
        type: 'error',
      });
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleImageUpload() {
    await uploadSelectedImageToStorage();
  }

  async function deleteImageFromStorageUrl(imageUrl: string) {
    const normalizedImageUrl = imageUrl.trim();

    if (
      !normalizedImageUrl.startsWith('gs://')
      && !normalizedImageUrl.startsWith('https://firebasestorage.googleapis.com/')
      && !normalizedImageUrl.startsWith('https://storage.googleapis.com/')
    ) {
      return;
    }

    try {
      await deleteObject(ref(storage, normalizedImageUrl));
    } catch (error) {
      if (
        typeof error === 'object'
        && error
        && 'code' in error
        && String((error as { code?: string }).code) === 'storage/object-not-found'
      ) {
        return;
      }

      throw error;
    }
  }

  async function handleSaveProduct() {
    if (isSavingProduct || isUploadingImage) {
      return;
    }

    if (!validateDraft()) {
      showToast({ text: 'Faltan campos obligatorios. Revisa los campos marcados antes de guardar.', type: 'error' });
      return;
    }

    if (draft.image.trim().startsWith('blob:')) {
      showToast({ text: 'La vista previa local no se puede guardar. Sube la imagen o escribe una URL valida.', type: 'error' });
      return;
    }

    const normalizedDraft: ProductCatalogItem = {
      ...draft,
      code: draft.code.trim().toUpperCase(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: Number(priceInput),
      image: draft.image.trim() || '/collar.png',
    };

    try {
      setIsSavingProduct(true);

      if (selectedImageFile) {
        showToast({ text: 'Hay una imagen pendiente. La subiremos antes de guardar el producto.', type: 'info', persistent: true });
        const uploadedImageUrl = await uploadSelectedImageToStorage();

        if (!uploadedImageUrl) {
          showToast({ text: 'No se guardo el producto porque la imagen no pudo subirse.', type: 'error' });
          return;
        }

        normalizedDraft.image = uploadedImageUrl;
      }

      showToast({
        text: isCreating
          ? `Creando producto "${normalizedDraft.name}" en el backend...`
          : `Guardando modificaciones de "${normalizedDraft.name}"...`,
        type: 'info',
        persistent: true,
      });

      if (isCreating) {
        await api.createProduct({
          nombre: normalizedDraft.name,
          descripcion: normalizedDraft.description,
          precio: normalizedDraft.price,
          categoria: normalizedDraft.category,
          imagenUrl: normalizedDraft.image,
          codigo: normalizedDraft.code,
          stock: normalizedDraft.units,
        });
      } else {
        await api.updateProduct(String(normalizedDraft.id), {
          nombre: normalizedDraft.name,
          descripcion: normalizedDraft.description,
          precio: normalizedDraft.price,
          categoria: normalizedDraft.category,
          imagenUrl: normalizedDraft.image,
          codigo: normalizedDraft.code,
          stock: normalizedDraft.units,
        });
      }

      showToast({ text: 'Cambios recibidos. Actualizando inventario...', type: 'info', persistent: true });
      const refreshed = await api.getProducts();

      const mappedProducts = refreshed.map(mapBackendProductToCatalogItem);

      saveProductsCatalog(mappedProducts);
      setProducts(mappedProducts);
      setIsCreating(false);
      const savedProduct = mappedProducts.find((product) => product.code === normalizedDraft.code) ?? mappedProducts[0];
      setSelectedProductId(savedProduct?.id ?? null);
      setDraft(savedProduct ?? normalizedDraft);
      setPriceInput(savedProduct ? String(savedProduct.price) : String(normalizedDraft.price));
      showToast({
        text: isCreating
          ? `Producto "${normalizedDraft.name}" creado correctamente.`
          : `Producto "${normalizedDraft.name}" actualizado correctamente.`,
        type: 'success',
      });

    } catch (error) {
      console.error(error);
      showToast({
        text: getErrorMessage(error, 'Error guardando producto.'),
        type: 'error',
      });
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleDeleteProduct() {
    if (isCreating) {
      await deleteImageFromStorageUrl(draft.image).catch((error) => {
        console.error(error);
      });
      setIsCreating(false);
      showToast({ text: 'Creacion de producto cancelada.', type: 'info' });
      return;
    }

    const confirmDelete = window.confirm(`¿Eliminar ${draft.name}?`);
    if (!confirmDelete) return;

    try {
      showToast({ text: `Eliminando "${draft.name}" del inventario...`, type: 'info', persistent: true });
      await api.deleteProduct(String(draft.id));
      await deleteImageFromStorageUrl(draft.image).catch((error) => {
        console.error(error);
      });

      showToast({ text: 'Producto eliminado. Actualizando inventario...', type: 'info', persistent: true });
      const refreshed = await api.getProducts();

      const mappedProducts = refreshed.map(mapBackendProductToCatalogItem);

      saveProductsCatalog(mappedProducts);
      setProducts(mappedProducts);
      showToast({ text: 'Producto eliminado correctamente.', type: 'success' });

    } catch (error) {
      console.error(error);
      showToast({
        text: getErrorMessage(error, 'Error eliminando producto.'),
        type: 'error',
      });
    }
  }

  async function handleResetCatalog() {
    setToast({ text: 'Esta función ahora depende del backend.', type: 'info' });
  }

  const totalUnits = products.reduce((total, product) => total + product.units, 0);
  const totalValue = products.reduce((total, product) => total + (product.units * product.price), 0);
  const selectedCategoryLabel = categoryLabels[draft.category];
  const activeProductLabel = isCreating ? 'Nuevo producto' : draft.name || 'Producto sin nombre';

  return (
    <section className="admin-page">
      {toast && (
        <div role="status" aria-live="polite" className={`auth-toast ${toast.type}`}>
          {toast.text}
        </div>
      )}

      <div className="admin-shell">
        <header className="admin-hero">
          <div>
            <p className="admin-kicker">Panel interno</p>
            <h1>Admin de productos</h1>
            <p className="admin-subtitle">
              Gestiona el catalogo desde una vista mas clara: selecciona un producto, edita sus datos y revisa la vista previa antes de guardar.
            </p>
          </div>
          <div className="admin-hero-actions">
            <Link to="/admin/orders" className="admin-secondary-link">Ver pedidos</Link>
            <Link to="/products" className="admin-secondary-link">Ver catalogo</Link>
            <Link to="/buy" className="admin-secondary-link">Volver al inicio</Link>
          </div>
        </header>

        <section className="admin-summary-grid" aria-label="Resumen del catalogo">
          <article className="admin-summary-card">
            <span>Productos</span>
            <strong>{products.length}</strong>
          </article>
          <article className="admin-summary-card">
            <span>Unidades</span>
            <strong>{totalUnits}</strong>
          </article>
          <article className="admin-summary-card">
            <span>Valor estimado</span>
            <strong>{formatCopCurrency(totalValue)}</strong>
          </article>
          <article className="admin-summary-card">
            <span>Coincidencias</span>
            <strong>{visibleProducts.length}</strong>
          </article>
        </section>

        <section className="admin-mobile-toolbar" aria-label="Controles rapidos del admin">
          <div className="admin-mobile-status">
            <p className="admin-kicker">Control rapido</p>
            <strong>{activeProductLabel}</strong>
            <span>
              {draft.code || 'Sin codigo'} · {selectedCategoryLabel}
            </span>
          </div>

          <div className="admin-mobile-tabs" role="tablist" aria-label="Cambiar vista del panel admin">
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === 'inventory'}
              className={`admin-mobile-tab ${mobileView === 'inventory' ? 'active' : ''}`}
              onClick={() => setMobileView('inventory')}
            >
              <span>Inventario</span>
              <small>{visibleProducts.length} items</small>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === 'editor'}
              className={`admin-mobile-tab ${mobileView === 'editor' ? 'active' : ''}`}
              onClick={() => setMobileView('editor')}
            >
              <span>Editar</span>
              <small>{activeProductLabel}</small>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileView === 'preview'}
              className={`admin-mobile-tab ${mobileView === 'preview' ? 'active' : ''}`}
              onClick={() => setMobileView('preview')}
            >
              <span>Vista previa</span>
              <small>{draft.image || 'Sin imagen'}</small>
            </button>
          </div>
        </section>

        <div className="admin-layout">
          <aside className={`admin-sidebar-panel ${mobileView === 'inventory' ? 'mobile-active' : 'mobile-hidden'}`}>
            <div className="admin-sidebar-header">
              <div>
                <h2>Inventario</h2>
                <p>Selecciona un producto o crea uno nuevo.</p>
              </div>
              <button type="button" className="admin-primary-btn" onClick={handleCreateProduct} disabled={isLoadingProducts}>
                {isLoadingProducts ? 'Cargando...' : 'Nuevo producto'}
              </button>
            </div>

            <div className="admin-sidebar-tools">
              <input
                type="search"
                className="admin-search"
                placeholder="Buscar por codigo, nombre o categoria"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
              <div className="admin-sidebar-tip">
                <p className="admin-sidebar-tip-title">Flujo recomendado</p>
                <p>1. Elige un producto del inventario.</p>
                <p>2. Actualiza los datos del formulario.</p>
                <p>3. Revisa la vista previa y guarda.</p>
              </div>
            </div>

            <div className="admin-product-list">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className={`admin-product-row ${!isCreating && selectedProductId === product.id ? 'active' : ''}`}
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="admin-product-row-top">
                    <span>{product.name}</span>
                    <small>{product.code}</small>
                  </div>
                  <small>{categoryLabels[product.category]} · {product.units} unidades</small>
                </button>
              ))}
              {isLoadingProducts && (
                <p className="admin-empty-list">Cargando inventario...</p>
              )}
              {!isLoadingProducts && visibleProducts.length === 0 && (
                <p className="admin-empty-list">No hay productos que coincidan con el filtro.</p>
              )}
            </div>

            <button type="button" className="admin-reset-btn" onClick={handleResetCatalog}>
              Restaurar catalogo base
            </button>
          </aside>

          <div className={`admin-editor-panel ${mobileView === 'inventory' ? 'mobile-hidden' : 'mobile-active'}`}>
            <div className="admin-editor-header">
              <div>
                <p className="admin-kicker">{isCreating ? 'Nuevo registro' : 'Edicion activa'}</p>
                <h2>{draft.name || 'Producto sin nombre'}</h2>
                <p className="admin-editor-subtitle">
                  {isCreating
                    ? 'Completa primero los datos principales y luego guarda el nuevo producto.'
                    : 'Haz ajustes en el formulario y revisa el resultado antes de guardar cambios.'}
                </p>
              </div>
              <div className="admin-editor-badges">
                <span className="admin-chip">ID {draft.id}</span>
                <span className="admin-chip soft">{selectedCategoryLabel}</span>
              </div>
            </div>

            <div className="admin-workspace-grid">
              <div className={`admin-form-stack ${mobileView === 'preview' ? 'mobile-hidden' : 'mobile-active'}`}>
                <section className="admin-section-card">
                  <div className="admin-section-heading">
                    <p className="admin-kicker">Paso 1</p>
                    <h3>Datos principales</h3>
                    <p>Define la identidad del producto para encontrarlo y reconocerlo rapido dentro del catalogo.</p>
                  </div>

                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Codigo</span>
                      <input
                        type="text"
                        value={draft.code}
                        onChange={(event) => updateDraft('code', event.target.value.toUpperCase())}
                        placeholder="W-123456"
                        aria-invalid={Boolean(fieldErrors.code)}
                        className={fieldErrors.code ? 'admin-input-error' : ''}
                      />
                      <small className="admin-field-help">Usa un codigo corto y unico para ubicar el producto.</small>
                      {fieldErrors.code && <small className="admin-field-error">{fieldErrors.code}</small>}
                    </label>

                    <label className="admin-field">
                      <span>Nombre</span>
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(event) => updateDraft('name', event.target.value)}
                        placeholder="Ej. Collar Lunar"
                        aria-invalid={Boolean(fieldErrors.name)}
                        className={fieldErrors.name ? 'admin-input-error' : ''}
                      />
                      <small className="admin-field-help">El nombre es el texto principal que vera el cliente.</small>
                      {fieldErrors.name && <small className="admin-field-error">{fieldErrors.name}</small>}
                    </label>

                    <label className="admin-field">
                      <span>Categoria</span>
                      <select
                        value={draft.category}
                        onChange={(event) => handleCategoryChange(event.target.value as ProductCategory)}
                      >
                        <option value="collares">Collares</option>
                        <option value="aretes">Aretes</option>
                        <option value="pulseras">Pulseras</option>
                      </select>
                      <small className="admin-field-help">Esto define donde aparecera dentro del catalogo.</small>
                    </label>

                    <label className="admin-field admin-field-wide">
                      <span>Descripcion</span>
                      <textarea
                        value={draft.description}
                        onChange={(event) => updateDraft('description', event.target.value)}
                        rows={5}
                        placeholder="Describe el producto, materiales, estilo o uso recomendado."
                      />
                      <small className="admin-field-help">Opcional, pero util para dar contexto al producto.</small>
                    </label>
                  </div>
                </section>

                <section className="admin-section-card">
                  <div className="admin-section-heading">
                    <p className="admin-kicker">Paso 2</p>
                    <h3>Stock y precio</h3>
                    <p>Actualiza la disponibilidad y el valor estimado del producto.</p>
                  </div>

                  <div className="admin-form-grid compact">
                    <label className="admin-field">
                      <span>Unidades disponibles</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={draft.units}
                        onChange={(event) => handleUnitsChange(event.target.value)}
                      />
                    </label>

                    <label className="admin-field">
                      <span>Precio</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={priceInput}
                        onChange={(event) => handlePriceChange(event.target.value)}
                        placeholder="25000"
                        aria-invalid={Boolean(fieldErrors.price)}
                        className={fieldErrors.price ? 'admin-input-error' : ''}
                      />
                      <small className="admin-field-help">Solo se permiten numeros.</small>
                      {fieldErrors.price && <small className="admin-field-error">{fieldErrors.price}</small>}
                    </label>
                  </div>
                </section>

                <section className="admin-section-card">
                  <div className="admin-section-heading">
                    <p className="admin-kicker">Paso 3</p>
                    <h3>Imagen del producto</h3>
                    <p>Puedes usar una URL existente o subir una imagen nueva para actualizar la vista previa.</p>
                  </div>

                  <div className="admin-form-grid compact">
                    <label className="admin-field admin-field-wide">
                      <span>Imagen</span>
                      <input
                        type="text"
                        value={draft.image}
                        onChange={(event) => updateDraft('image', event.target.value)}
                        placeholder="/collar.png"
                      />
                      <small className="admin-field-help">Acepta una ruta local o una URL completa.</small>
                    </label>

                    <div className="admin-field admin-field-wide">
                      <span>Subir imagen</span>
                      <div className="admin-upload-panel">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageSelection}
                          className="admin-file-input"
                        />
                        <button
                          type="button"
                          className="admin-primary-btn"
                          onClick={handleImageUpload}
                          disabled={isUploadingImage || !selectedImageFile}
                        >
                          {isUploadingImage ? 'Subiendo imagen...' : 'Subir imagen'}
                        </button>
                      </div>
                      <small className="admin-field-help">
                        Formatos permitidos: JPG, PNG o WebP. Minimo 900 x 900 px, maximo 5 MB y proporcion cuadrada o ligeramente vertical.
                      </small>
                    </div>
                  </div>
                </section>

                <div className="admin-editor-actions">
                  <button type="button" className="admin-secondary-btn admin-mobile-only-action" onClick={() => setMobileView('inventory')}>
                    Ver inventario
                  </button>
                  <button type="button" className="admin-secondary-btn admin-mobile-only-action" onClick={() => setMobileView('preview')}>
                    Ver vista previa
                  </button>
                  <button type="button" className="admin-primary-btn" onClick={handleSaveProduct} disabled={isSavingProduct || isUploadingImage}>
                    {isUploadingImage ? 'Subiendo imagen...' : isSavingProduct ? 'Guardando producto...' : 'Guardar producto'}
                  </button>
                  <button type="button" className="admin-danger-btn" onClick={handleDeleteProduct}>
                    {isCreating ? 'Cancelar' : 'Eliminar'}
                  </button>
                </div>
              </div>

              <aside className={`admin-preview-stack ${mobileView === 'preview' ? 'mobile-active' : 'mobile-hidden'}`}>
                <div className="admin-preview-card">
                  <div>
                    <p className="admin-preview-label">Vista previa</p>
                    <p className="admin-kicker">{draft.code || 'Sin codigo'}</p>
                    <h3>{draft.name || 'Nombre pendiente'}</h3>
                    <p>{draft.description || 'La descripcion aparecera aqui cuando la completes.'}</p>
                  </div>
                  <div className="admin-preview-meta">
                    <span>{selectedCategoryLabel}</span>
                    <span>{draft.units} unidades</span>
                    <span>{priceInput ? formatCopCurrency(Number(priceInput)) : 'Sin precio'}</span>
                  </div>
                </div>

                <div className="admin-preview-actions admin-mobile-only">
                  <button type="button" className="admin-secondary-btn" onClick={() => setMobileView('editor')}>
                    Volver a editar
                  </button>
                  <button type="button" className="admin-primary-btn" onClick={handleSaveProduct} disabled={isSavingProduct || isUploadingImage}>
                    {isUploadingImage ? 'Subiendo imagen...' : isSavingProduct ? 'Guardando producto...' : 'Guardar desde aqui'}
                  </button>
                </div>

                <div className="admin-image-preview-card">
                  <div className="admin-section-heading compact">
                    <p className="admin-kicker">Vista de imagen</p>
                    <h3>Imagen actual</h3>
                    <p>La imagen mostrada se actualiza con la URL escrita o con la ultima seleccionada para subir.</p>
                  </div>
                  <div
                    ref={imagePreviewFrameRef}
                    className={`admin-image-preview-frame ${isAdjustingImage ? 'is-adjusting' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label="Mover encuadre de la imagen"
                    onPointerDown={handleImagePreviewPointerDown}
                    onPointerMove={handleImagePreviewPointerMove}
                    onPointerUp={handleImagePreviewPointerUp}
                    onPointerCancel={handleImagePreviewPointerUp}
                  >
                    <ImageWithFallback
                      src={localPreviewUrl || draft.image || '/W.png'}
                      alt={draft.name || 'Vista previa del producto'}
                      className="admin-image-preview"
                      draggable={false}
                      style={{ objectPosition: `${imagePosition.x}% ${imagePosition.y}%` }}
                    />
                  </div>
                  <div className="admin-image-position-controls" aria-label="Controles de encuadre de imagen">
                    <label>
                      <span>Horizontal</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imagePosition.x}
                        onChange={(event) => setImagePosition((current) => ({ ...current, x: Number(event.target.value) }))}
                      />
                    </label>
                    <label>
                      <span>Vertical</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imagePosition.y}
                        onChange={(event) => setImagePosition((current) => ({ ...current, y: Number(event.target.value) }))}
                      />
                    </label>
                    <button type="button" className="admin-secondary-btn" onClick={resetImagePosition}>
                      Centrar imagen
                    </button>
                  </div>
                </div>

                <div className="admin-helper-card">
                  <p className="admin-kicker">Antes de guardar</p>
                  <h3>Checklist rapido</h3>
                  <ul>
                    <li>Verifica que el codigo sea unico.</li>
                    <li>Confirma que el nombre y el precio se vean correctos.</li>
                    <li>Comprueba que la imagen coincida con el producto.</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
