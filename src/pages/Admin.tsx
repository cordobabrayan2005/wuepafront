import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { storage } from '../config/firebase';
import {
  createEmptyProduct,
  loadProductsCatalog,
  ProductCatalogItem,
  ProductCategory,
  resetProductsCatalog,
  saveProductsCatalog,
} from '../utils/productCatalog';

const categoryLabels: Record<ProductCategory, string> = {
  collares: 'Collares',
  aretes: 'Aretes',
  pulseras: 'Pulseras',
};

export default function Admin() {
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  const [selectedProductId, setSelectedProductId] = useState<number | null>(() => loadProductsCatalog()[0]?.id ?? null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');
  const [draft, setDraft] = useState<ProductCatalogItem>(() => createEmptyProduct(loadProductsCatalog()));
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const visibleProducts = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();

    if (!normalizedFilter) {
      return products;
    }

    return products.filter((product) => {
      return product.name.toLowerCase().includes(normalizedFilter)
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

  function updateDraft<K extends keyof ProductCatalogItem>(field: K, value: ProductCatalogItem[K]) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  }

  function handleSelectProduct(product: ProductCatalogItem) {
    setSelectedProductId(product.id);
    setDraft(product);
    setIsCreating(false);
    setSelectedImageFile(null);
    setLocalPreviewUrl('');
    setMessage('');
  }

  function handleCreateProduct() {
    const newProduct = createEmptyProduct(products);
    setDraft(newProduct);
    setSelectedProductId(newProduct.id);
    setIsCreating(true);
    setSelectedImageFile(null);
    setLocalPreviewUrl('');
    setMessage('Nuevo producto listo para completar.');
  }

  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage('Selecciona un archivo de imagen valido.');
      return;
    }

    if (localPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setLocalPreviewUrl(previewUrl);
    setMessage('Imagen lista para subir.');
  }

  async function handleImageUpload() {
    if (!selectedImageFile) {
      setMessage('Primero selecciona una imagen desde tu computadora.');
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
      setMessage('Imagen subida correctamente. Ahora puedes guardar el producto.');
    } catch (error) {
      console.error(error);
      setMessage('No se pudo subir la imagen. Revisa la configuracion de Firebase Storage.');
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleSaveProduct() {
    const name = draft.name.trim();
    const description = draft.description.trim();
    const image = draft.image.trim() || '/collar.png';

    if (!name || !description) {
      setMessage('Completa al menos el nombre y la descripcion del producto.');
      return;
    }

    if (draft.units < 0 || draft.price < 0) {
      setMessage('Las unidades y el precio no pueden ser negativos.');
      return;
    }

    const normalizedDraft: ProductCatalogItem = {
      ...draft,
      name,
      description,
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
    setMessage('Producto guardado correctamente.');
  }

  function handleDeleteProduct() {
    if (isCreating) {
      setIsCreating(false);
      const fallbackProduct = products[0] ?? createEmptyProduct([]);
      setSelectedProductId(fallbackProduct.id);
      setDraft(fallbackProduct);
      setMessage('Creacion cancelada.');
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
      setSelectedProductId(emptyProduct.id);
      setIsCreating(true);
    } else {
      setSelectedProductId(updatedProducts[0].id);
      setDraft(updatedProducts[0]);
    }

    setMessage('Producto eliminado.');
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
    setIsCreating(false);
    setMessage('Catalogo restaurado.');
  }

  const totalUnits = products.reduce((total, product) => total + product.units, 0);
  const totalValue = products.reduce((total, product) => total + (product.units * product.price), 0);

  return (
    <section className="admin-page">
      <div className="admin-shell">
        <header className="admin-hero">
          <div>
            <p className="admin-kicker">Panel interno</p>
            <h1>Admin de productos</h1>
            <p className="admin-subtitle">
              Edita nombre, descripcion, unidades, precio, imagen y categoria desde una sola pantalla.
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
            <strong>${totalValue.toFixed(2)}</strong>
          </article>
        </section>

        <div className="admin-layout">
          <aside className="admin-sidebar-panel">
            <div className="admin-sidebar-header">
              <div>
                <h2>Inventario</h2>
                <p>Selecciona un producto o crea uno nuevo.</p>
              </div>
              <button type="button" className="admin-primary-btn" onClick={handleCreateProduct}>
                Nuevo producto
              </button>
            </div>

            <input
              type="search"
              className="admin-search"
              placeholder="Buscar por nombre o categoria"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />

            <div className="admin-product-list">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className={`admin-product-row ${!isCreating && selectedProductId === product.id ? 'active' : ''}`}
                  onClick={() => handleSelectProduct(product)}
                >
                  <span>{product.name}</span>
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

          <div className="admin-editor-panel">
            <div className="admin-editor-header">
              <div>
                <p className="admin-kicker">{isCreating ? 'Nuevo registro' : 'Edicion activa'}</p>
                <h2>{draft.name || 'Producto sin nombre'}</h2>
              </div>
              <span className="admin-chip">ID {draft.id}</span>
            </div>

            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Nombre</span>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) => updateDraft('name', event.target.value)}
                  placeholder="Ej. Collar Lunar"
                />
              </label>

              <label className="admin-field">
                <span>Categoria</span>
                <select
                  value={draft.category}
                  onChange={(event) => updateDraft('category', event.target.value as ProductCategory)}
                >
                  <option value="collares">Collares</option>
                  <option value="aretes">Aretes</option>
                  <option value="pulseras">Pulseras</option>
                </select>
              </label>

              <label className="admin-field admin-field-wide">
                <span>Descripcion</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => updateDraft('description', event.target.value)}
                  rows={5}
                  placeholder="Describe el producto, materiales, estilo o uso recomendado."
                />
              </label>

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
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => updateDraft('price', Number(event.target.value))}
                />
              </label>

              <label className="admin-field admin-field-wide">
                <span>Imagen</span>
                <input
                  type="text"
                  value={draft.image}
                  onChange={(event) => updateDraft('image', event.target.value)}
                  placeholder="/collar.png"
                />
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

            <div className="admin-preview-card">
              <div>
                <p className="admin-preview-label">Vista previa</p>
                <h3>{draft.name || 'Nombre pendiente'}</h3>
                <p>{draft.description || 'La descripcion aparecera aqui cuando la completes.'}</p>
              </div>
              <div className="admin-preview-meta">
                <span>{categoryLabels[draft.category]}</span>
                <span>{draft.units} unidades</span>
                <span>${draft.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="admin-image-preview-card">
              <p className="admin-preview-label">Previsualizacion de imagen</p>
              <div className="admin-image-preview-frame">
                <ImageWithFallback
                  src={localPreviewUrl || draft.image || '/W.png'}
                  alt={draft.name || 'Vista previa del producto'}
                  className="admin-image-preview"
                />
              </div>
            </div>

            <div className="admin-editor-actions">
              <button type="button" className="admin-primary-btn" onClick={handleSaveProduct}>
                Guardar producto
              </button>
              <button type="button" className="admin-danger-btn" onClick={handleDeleteProduct}>
                {isCreating ? 'Cancelar' : 'Eliminar'}
              </button>
            </div>

            {message && <p className="admin-message">{message}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}