import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileNavMenu from '../components/MobileNavMenu';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { formatCopCurrency } from '../utils/currency';
import { getAvailableProducts, groupProductsByCategory, loadProductsCatalog, loadProductsCatalogFromBackend, ProductCategory, ProductCatalogItem, ProductSortOrder, sortProductsCatalog } from '../utils/productCatalog';

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
  const [sortOrder, setSortOrder] = useState<ProductSortOrder>('recent');
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
    const refreshIntervalId = window.setInterval(refreshProductsFromBackend, 30000);
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

  // Cambia la categoría activa según el parámetro de la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category === 'collares' || category === 'aretes' || category === 'pulseras' || category === 'anillos' || category === 'paquetes') {
      setActiveCategory(category);
    }
  }, [location.search]);

  // Definición de categorías disponibles
  const categories: Array<{ key: ProductCategory; label: string; icon: string }> = [
    { key: 'collares', label: 'Collares', icon: '💎' },
    { key: 'aretes', label: 'Aretes', icon: '✨' },
    { key: 'pulseras', label: 'Pulseras', icon: '📿' }
  ];
  categories.push(
    { key: 'anillos', label: 'Anillos', icon: '💍' },
    { key: 'paquetes', label: 'Paquetes', icon: '🎁' }
  );

  const mobileMenuItems = [
    { label: 'Inicio', to: '/' },
    { label: 'Catalogo', to: '/productssin', isActive: true },
    { label: 'Nosotros', to: '/about' },
    { label: 'Iniciar sesion', to: '/login', tone: 'accent' as const },
  ];

  // Productos de la categoría activa
  const currentProducts = groupProductsByCategory(getAvailableProducts(products))[activeCategory];
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
        <MobileNavMenu title="Catalogo publico" items={mobileMenuItems} />
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
          <Link to="/about">Nosotros</Link>
        </nav>
      </header>

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
              key={category.key}
              className={`category-tab ${activeCategory === category.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.key as any)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
            </button>
          ))}
        </section>

        <div className="products-toolbar">
          <span className="products-toolbar-label">Ordenar por</span>
          <div className="products-sort-options" role="group" aria-label="Ordenar productos">
            {[
              { value: 'az', label: 'A-Z' },
              { value: 'za', label: 'Z-A' },
              { value: 'recent', label: 'Mas reciente' },
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
          <h3>{categories.find(c => c.key === activeCategory)?.label}</h3>
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card-simple">
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
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesión
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
          © 2026 wuepa. Todos los derechos reservados.
        </div>
      </footer>
      <ScrollToTopButton />
      {/* Navegacion inferior solo visible en movil para accesos publicos rapidos. */}
      <MobileBottomNav active="products" />
    </div>
  );
}
