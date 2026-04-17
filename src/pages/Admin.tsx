import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { storage } from '../config/firebase';
import { formatCopCurrency } from '../utils/currency';
import {
  createEmptyProduct,
  generateProductCode,
  loadProductsCatalog,
  ProductCatalogItem,
  ProductCategory,
  resetProductsCatalog,
  saveProductsCatalog,
} from '../utils/productCatalog';

type AdminMobileView = 'inventory' | 'editor' | 'preview';

const categoryLabels: Record<ProductCategory, string> = {
  collares: 'Collares',
  aretes: 'Aretes',
  pulseras: 'Pulseras',
};

export default function Admin() {
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  const [selectedProductId, setSelectedProductId] = useState<number | null>(() => loadProductsCatalog()[0]?.id ?? null);
  const [mobileView, setMobileView] = useState<AdminMobileView>('inventory');
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'code' | 'name' | 'price', string>>>({});
  const [filter, setFilter] = useState('');
  const initialDraft = createEmptyProduct(loadProductsCatalog());
  const [draft, setDraft] = useState<ProductCatalogItem>(() => initialDraft);
  const [priceInput, setPriceInput] = useState(() => (initialDraft.price > 0 ? String(initialDraft.price) : ''));
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      const freshDraft = createEmptyProduct([]);
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
    if (!toast) {
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
    setToast(null);
  }

  function handleCreateProduct() {
    const newProduct = createEmptyProduct(products);
    setDraft(newProduct);
    setPriceInput(newProduct.price > 0 ? String(newProduct.price) : '');
    setSelectedProductId(newProduct.id);
    setIsCreating(true);
    setMobileView('editor');
    setSelectedImageFile(null);
    setLocalPreviewUrl('');
    setFieldErrors({});
    setToast({ text: 'Nuevo producto listo para completar.', type: 'info' });
  }

  function handleCategoryChange(category: ProductCategory) {
    setDraft((currentDraft) => {
      const defaultCurrentCode = generateProductCode(currentDraft.category, currentDraft.id);
      const nextDefaultCode = generateProductCode(category, currentDraft.id);

      return {
        ...currentDraft,
        category,
        code: currentDraft.code === defaultCurrentCode ? nextDefaultCode : currentDraft.code,
      };
    });
  }

  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setToast({ text: 'Selecciona un archivo de imagen valido.', type: 'error' });
      return;
    }

    if (localPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setLocalPreviewUrl(previewUrl);
    setToast({ text: 'Imagen lista para subir.', type: 'info' });
  }

  async function handleImageUpload() {
    if (!selectedImageFile) {
      setToast({ text: 'Primero selecciona una imagen desde tu computadora.', type: 'error' });
      return;
    }

    try {
      setIsUploadingImage(true);
      const safeFileName = selectedImageFile.name.replace(/\s+/g, '-').toLowerCase();
      const storageRef = ref(storage, `products/${draft.id}-${Date.now()}-${safeFileName}`);

      await uploadBytes(storageRef, selectedImageFile);
      const downloadUrl = await getDownloadURL(storageRef);

      updateDraft('image', downloadUrl);
      setSelectedImageFile(null);
      if (localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl('');
      setMobileView('preview');
      setToast({ text: 'Imagen subida correctamente. Ahora puedes guardar el producto.', type: 'success' });
    } catch (error) {
      console.error(error);
      setToast({ text: 'No se pudo subir la imagen. Revisa la configuracion de Firebase Storage.', type: 'error' });
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleSaveProduct() {
    if (!validateDraft()) {
      setToast({ text: 'Faltan campos obligatorios. Revisa el codigo, el nombre y el precio.', type: 'error' });
      return;
    }

    const code = draft.code.trim().toUpperCase();
    const name = draft.name.trim();
    const description = draft.description.trim();
    const image = draft.image.trim() || '/collar.png';
    const parsedPrice = Number(priceInput);

    if (draft.units < 0 || parsedPrice < 0) {
      setToast({ text: 'Las unidades y el precio no pueden ser negativos.', type: 'error' });
      return;
    }

    const duplicateCodeMessage = getDuplicateCodeMessage(code);

    if (duplicateCodeMessage) {
      setFieldErrors((currentErrors) => ({ ...currentErrors, code: duplicateCodeMessage }));
      setToast({ text: 'El codigo del producto ya existe. Usa un codigo unico.', type: 'error' });
      return;
    }

    const normalizedDraft: ProductCatalogItem = {
      ...draft,
      code,
      name,
      description,
      price: parsedPrice,
      image,
    };

    const updatedProducts = isCreating
      ? [...products, normalizedDraft]
      : products.map((product) => (product.id === normalizedDraft.id ? normalizedDraft : product));

    updatedProducts.sort((leftProduct, rightProduct) => leftProduct.id - rightProduct.id);
    saveProductsCatalog(updatedProducts);
    setProducts(updatedProducts);
    setSelectedProductId(normalizedDraft.id);
    setDraft(normalizedDraft);
    setIsCreating(false);
    setMobileView('preview');
    setFieldErrors({});
    setToast({
      text: isCreating ? 'Producto creado correctamente.' : 'Producto guardado correctamente.',
      type: 'success',
    });
  }

  function handleDeleteProduct() {
    if (isCreating) {
      setIsCreating(false);
      const fallbackProduct = products[0] ?? createEmptyProduct([]);
      setSelectedProductId(fallbackProduct.id);
      setDraft(fallbackProduct);
      setPriceInput(fallbackProduct.price > 0 ? String(fallbackProduct.price) : '');
      setMobileView('inventory');
      setFieldErrors({});
      setToast({ text: 'Creacion cancelada.', type: 'info' });
      return;
    }

    const confirmDelete = window.confirm(`¿Eliminar ${draft.name || 'este producto'}?`);

    if (!confirmDelete) {
      return;
    }

    const updatedProducts = products.filter((product) => product.id !== draft.id);
    saveProductsCatalog(updatedProducts);
    setProducts(updatedProducts);

    if (updatedProducts.length === 0) {
      const emptyProduct = createEmptyProduct([]);
      setDraft(emptyProduct);
      setPriceInput(emptyProduct.price > 0 ? String(emptyProduct.price) : '');
      setSelectedProductId(emptyProduct.id);
      setIsCreating(true);
      setMobileView('editor');
    } else {
      setSelectedProductId(updatedProducts[0].id);
      setDraft(updatedProducts[0]);
      setPriceInput(updatedProducts[0].price > 0 ? String(updatedProducts[0].price) : '');
      setMobileView('inventory');
    }

    setFieldErrors({});
    setToast({ text: 'Producto eliminado.', type: 'success' });
  }

  function handleResetCatalog() {
    const confirmReset = window.confirm('¿Restaurar el catalogo inicial? Se perderan los cambios guardados en esta pagina.');

    if (!confirmReset) {
      return;
    }

    const restoredProducts = resetProductsCatalog();
    setProducts(restoredProducts);
    setSelectedProductId(restoredProducts[0]?.id ?? null);
    setDraft(restoredProducts[0] ?? createEmptyProduct(restoredProducts));
    setPriceInput(restoredProducts[0]?.price ? String(restoredProducts[0].price) : '');
    setIsCreating(false);
    setMobileView('inventory');
    setFieldErrors({});
    setToast({ text: 'Catalogo restaurado.', type: 'success' });
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
              <button type="button" className="admin-primary-btn" onClick={handleCreateProduct}>
                Nuevo producto
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
              {visibleProducts.length === 0 && (
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
                        placeholder="WUE-COL-001"
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
                        type="number"
                        min="0"
                        value={draft.units}
                        onChange={(event) => updateDraft('units', Number(event.target.value))}
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
                          accept="image/*"
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
                  <button type="button" className="admin-primary-btn" onClick={handleSaveProduct}>
                    Guardar producto
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
                  <button type="button" className="admin-primary-btn" onClick={handleSaveProduct}>
                    Guardar desde aqui
                  </button>
                </div>

                <div className="admin-image-preview-card">
                  <div className="admin-section-heading compact">
                    <p className="admin-kicker">Vista de imagen</p>
                    <h3>Imagen actual</h3>
                    <p>La imagen mostrada se actualiza con la URL escrita o con la ultima seleccionada para subir.</p>
                  </div>
                  <div className="admin-image-preview-frame">
                    <ImageWithFallback
                      src={localPreviewUrl || draft.image || '/W.png'}
                      alt={draft.name || 'Vista previa del producto'}
                      className="admin-image-preview"
                    />
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