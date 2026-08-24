import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import CartPreviewDrawer from '../components/CartPreviewDrawer';
import { ShoppingCart } from 'lucide-react';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileNavMenu from '../components/MobileNavMenu';
import ScrollToTopButton from '../components/ScrollToTopButton';
import ProductDescriptionDialog from '../components/ProductDescriptionDialog';
import { formatCopCurrency } from '../utils/currency';
import { addProductToCart, getCachedCartItems, getCartItemsCount, getCartSubtotal, loadCartItems } from '../utils/cart';
import { getAvailableProducts, groupProductsByCategory, loadProductsCatalog, loadProductsCatalogFromBackend, ProductCategory, ProductCatalogItem, ProductSortOrder, sortProductsCatalog } from '../utils/productCatalog';
import { DEFAULT_CATEGORIES, getCategoryIcon, loadCategories } from '../utils/categories';

/**
 * Componente Products
 *
 * Página de productos de Joyería Wuepa. Permite navegar por categorías,
 * buscar productos y ver detalles básicos. Muestra productos filtrados
 * según la búsqueda y la categoría seleccionada.
 *
 * Estructura:
 * - Header: Barra de navegación, buscador y enlaces principales.
 * - Sección principal: Hero, navegación de categorías, productos.
 * - Footer: Información y enlaces rápidos.
 *
 * @returns {JSX.Element} Página de productos con categorías y búsqueda.
 */

/**
 * Componente funcional principal para la página de productos.
 */
export default function ProductsSin() {
  // Categoría activa seleccionada
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('collares');
  // Estado para la búsqueda de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [sortOrder, setSortOrder] = useState<ProductSortOrder>('recent');
  const [cartCount, setCartCount] = useState(() => getCartItemsCount(getCachedCartItems()));
  const [cartTotal, setCartTotal] = useState(() => getCartSubtotal(getCachedCartItems()));
  const [cartMessage, setCartMessage] = useState('');
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);
  // Navegación y ubicación para manejo de rutas
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    function syncProducts() {
      setProducts(loadProductsCatalog());
    }

    function refreshProductsFromBackend() {
      loadProductsCatalogFromBackend()
        .then((backendProducts) => {
          if (isMounted) {
            setProducts(backendProducts);
          }
        })
        .catch(() => {
          if (isMounted) {
            setProducts(loadProductsCatalog());
          }
        });
    }

    function refreshProductsWhenVisible() {
      if (document.visibilityState === 'visible') {
        refreshProductsFromBackend();
      }
    }

    refreshProductsFromBackend();
    const refreshIntervalId = window.setInterval(refreshProductsFromBackend, 10000);
    window.addEventListener('storage', syncProducts);
    window.addEventListener('focus', refreshProductsFromBackend);
    document.addEventListener('visibilitychange', refreshProductsWhenVisible);
    return () => {
      isMounted = false;
      window.clearInterval(refreshIntervalId);
      window.removeEventListener('storage', syncProducts);
      window.removeEventListener('focus', refreshProductsFromBackend);
      document.removeEventListener('visibilitychange', refreshProductsWhenVisible);
    };
  }, []);

  useEffect(() => {
    loadCategories().then((nextCategories) => {
      setCategories(nextCategories);
      setActiveCategory((current) => nextCategories.some((category) => category.id === current)
        ? current
        : nextCategories[0]?.id ?? 'collares');
    });
  }, []);

  useEffect(() => {
    function setCartSummary(items: ReturnType<typeof getCachedCartItems>) {
      setCartCount(getCartItemsCount(items));
      setCartTotal(getCartSubtotal(items));
    }

    function syncCartSummary() {
      setCartSummary(getCachedCartItems());
    }

    loadCartItems().then(setCartSummary).catch(() => setCartSummary([]));
    window.addEventListener('wuepa-cart-updated', syncCartSummary as EventListener);

    return () => window.removeEventListener('wuepa-cart-updated', syncCartSummary as EventListener);
  }, []);

  useEffect(() => {
    if (!cartMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCartMessage(''), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [cartMessage]);

  // Cambia la categoría activa según el parámetro de la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category && categories.some((item) => item.id === category)) {
      setActiveCategory(category);
    }
  }, [categories, location.search]);

  const mobileMenuItems = [
    { label: 'Inicio', to: '/' },
    { label: 'Catálogo', to: '/productssin', isActive: true },
    { label: `Carrito (${cartCount}) · ${formatCopCurrency(cartTotal)}`, to: '/cart' },
    { label: 'Nosotros', to: '/about' },
    { label: 'Iniciar sesión', to: '/login', tone: 'accent' as const },
  ];

  async function handleAddToCart(product: ProductCatalogItem) {
    if (product.units <= 0) {
      setCartMessage(`${product.name} está agotado.`);
      return;
    }

    try {
      const nextItems = await addProductToCart(product);
      setCartCount(getCartItemsCount(nextItems));
      setCartTotal(getCartSubtotal(nextItems));
      setCartMessage(`${product.name} se agregó al carrito.`);
    } catch (error) {
      setCartMessage(error instanceof Error ? error.message : 'No se pudo agregar el producto al carrito.');
    }
  }

  // Productos de la categoría activa
  const currentProducts = groupProductsByCategory(getAvailableProducts(products))[activeCategory] ?? [];
  // Filtra productos según la búsqueda (nombre o descripción)
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    return sortProductsCatalog(currentProducts, sortOrder).filter(product =>
      product.code.toLowerCase().includes(normalizedSearch) ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.description.toLowerCase().includes(normalizedSearch)
    );
  }, [currentProducts, searchQuery, sortOrder]);

  // Renderizado principal de la página de productos
  return (
    <div className="products-page">
      {/* Header */}
      <header className="products-header">
        <div className="header-left">
          <h1>WUEPA</h1>
          <p>ACCESORIOS</p>
        </div>
        <MobileNavMenu title="Catálogo público" items={mobileMenuItems} />
        <div className="header-center">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar"
          />
        </div>
        <nav className="header-right">
          <Link to="/">Inicio</Link>
          <Link to="/productssin" className="active">Productos</Link>
          <button type="button" className="products-cart-link" onClick={() => setIsCartPreviewOpen(true)} aria-label={`Ver carrito con ${cartCount} productos por ${formatCopCurrency(cartTotal)}`}>
            <span className="products-cart-icon" aria-hidden="true">
              <ShoppingCart size={17} />
              <span className="products-cart-count">{cartCount}</span>
            </span>
            <span className="products-cart-total" aria-hidden="true">{formatCopCurrency(cartTotal)}</span>
          </button>
          <Link to="/about">Nosotros</Link>
        </nav>
      </header>
      <CartPreviewDrawer isOpen={isCartPreviewOpen} onClose={() => setIsCartPreviewOpen(false)} />

      {cartMessage ? (
        <div className="auth-toast info" role="status" aria-live="polite">
          {cartMessage}
        </div>
      ) : null}

      <div className="products-container">
        {/* Hero Section */}
        <section className="products-hero">
          <h2>Descubre Nuestra Colección</h2>
          <p>Accesorios únicos y elegantes para cada ocasión</p>
        </section>

        {/* Categories Navigation */}
        <section className="categories-nav">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="category-icon">{getCategoryIcon(category.id)}</span>
              <span className="category-label">{category.nombre}</span>
            </button>
          ))}
        </section>

        <div className="products-toolbar">
          <span className="products-toolbar-label">Ordenar por</span>
          <div className="products-sort-options" role="group" aria-label="Ordenar productos">
            {[
              { value: 'az', label: 'A-Z' },
              { value: 'za', label: 'Z-A' },
              { value: 'recent', label: 'Más reciente' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`products-sort-option ${sortOrder === option.value ? 'active' : ''}`}
                onClick={() => setSortOrder(option.value as ProductSortOrder)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <section className="products-section">
          <h3>{categories.find(c => c.id === activeCategory)?.nombre}</h3>
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="product-card-simple product-card-openable"
                role="button"
                tabIndex={0}
                aria-label={`Ver descripción completa de ${product.name}`}
                onClick={() => setSelectedProduct(product)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedProduct(product);
                  }
                }}
              >
                <div className="product-card-media product-card-media-simple">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="product-card-image"
                    sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 25vw"
                  />
                  <span className="product-stock-badge">{product.units} disponibles</span>
                </div>
                <div className="product-card-content">
                  <h4 className="product-card-title">{product.name}</h4>
                  <p className="product-card-price">{formatCopCurrency(product.price)}</p>
                </div>
                <button
                  className="product-login-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleAddToCart(product);
                  }}
                  disabled={product.units <= 0}
                >
                  {product.units > 0 ? 'Agregar al carrito' : 'Agotado'}
                </button>
              </article>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="no-results">
              <p>No se encontraron productos que coincidan con tu búsqueda.</p>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="products-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h2>WUEPA</h2>
            <p>Accesorios que realzan tu belleza</p>
          </div>
          <div className="footer-links">
            <Link to="/">Inicio</Link>
            <Link to="/productssin">Productos</Link>
            <Link to="/about">Nosotros</Link>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 Wuepa. Todos los derechos reservados.
        </div>
      </footer>
      <ProductDescriptionDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <ScrollToTopButton />
      {/* Navegacion inferior solo visible en movil para accesos publicos rapidos. */}
      <MobileBottomNav active="products" cartCount={cartCount} />
    </div>
  );
}
