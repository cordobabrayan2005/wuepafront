import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import MobileNavMenu from '../components/MobileNavMenu';
import { groupProductsByCategory, loadProductsCatalog, ProductCategory, ProductCatalogItem } from '../utils/productCatalog';

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
export default function Products() {
  // Categoría activa seleccionada
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('collares');
  // Estado para la búsqueda de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  const location = useLocation();
  const categoryLabels: Record<ProductCategory, string> = {
    collares: 'Collares',
    aretes: 'Aretes',
    pulseras: 'Pulseras',
  };

  useEffect(() => {
    function syncProducts() {
      setProducts(loadProductsCatalog());
    }

    window.addEventListener('storage', syncProducts);
    return () => window.removeEventListener('storage', syncProducts);
  }, []);

  // Cambia la categoría activa según el parámetro de la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category === 'collares' || category === 'aretes' || category === 'pulseras') {
      setActiveCategory(category);
    }
  }, [location.search]);

  // Definición de categorías disponibles
  const categories: Array<{ key: ProductCategory; label: string; icon: string }> = [
    { key: 'collares', label: 'Collares', icon: '💎' },
    { key: 'aretes', label: 'Aretes', icon: '✨' },
    { key: 'pulseras', label: 'Pulseras', icon: '💍' }
  ];
  const mobileMenuItems = [
    { label: 'Inicio', to: '/buy' },
    { label: 'Productos', to: '/products', isActive: true },
    { label: 'Nosotros', to: '/about' },
  ];

  // Productos de la categoría activa
  const productsByCategory = groupProductsByCategory(products);
  const currentProducts = productsByCategory[activeCategory];
  // Filtra productos según la búsqueda (nombre o descripción)
  const filteredProducts = currentProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Renderizado principal de la página de productos
  return (
    <div className="products-page">
      {/* Header */}
      <header className="products-header">
        <div className="header-left">
          <h1>WUEPA</h1>
          <p>ACCESORIOS</p>
        </div>
        <MobileNavMenu title="Menu de compra" items={mobileMenuItems} />
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
          <Link to="/buy">Inicio</Link>
          <Link to="/products" className="active">Productos</Link>
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

        {/* Products Grid */}
        <section className="products-section">
          <h3>{categories.find(c => c.key === activeCategory)?.label}</h3>
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card-simple">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="product-card-image"
                  sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 25vw"
                />
                <div className="product-card-content">
                  <p className="product-card-category">{categoryLabels[product.category]}</p>
                  <h4 className="product-card-title">{product.name}</h4>
                  <p className="product-card-description">{product.description}</p>
                  <div className="product-card-meta">
                    <span>{product.units} unidades</span>
                    <strong>${product.price.toFixed(2)}</strong>
                  </div>
                </div>
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
            <Link to="/products">Productos</Link>
            <Link to="/about">Nosotros</Link>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 wuepa. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}