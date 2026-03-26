import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Datos de productos por categoría
const productsData = {
  collares: [
    { id: 1, name: 'Collar Corazón', price: 25, image: '/collar.png', description: 'Elegante collar con diseño de corazón' },
    { id: 2, name: 'Collar Minimal', price: 22, image: '/collar-min.png', description: 'Collar minimalista y sofisticado' },
    { id: 3, name: 'Collar Diamante', price: 35, image: '/collar-diamante.png', description: 'Collar con detalles en diamante' },
    { id: 4, name: 'Collar Cadena', price: 23, image: '/collar-cadena.png', description: 'Collar de cadena delicada' },
    { id: 5, name: 'Collar Oro', price: 29, image: '/collar-oro.png', description: 'Collar en tono dorado elegante' }
  ],
  aretes: [
    { id: 6, name: 'Aretes Perla', price: 18, image: '/arete.png', description: 'Aretes con perlas delicadas' },
    { id: 7, name: 'Aretes Gota', price: 21, image: '/aretes-gota.png', description: 'Aretes en forma de gota' },
    { id: 8, name: 'Arete Flor', price: 16, image: '/arete-flor.png', description: 'Aretes con diseño floral' },
    { id: 9, name: 'Arete Cristal', price: 24, image: '/arete-cristal.png', description: 'Aretes con cristales brillantes' },
    { id: 10, name: 'Aretes Minimal', price: 19, image: '/aretes-minimal.png', description: 'Aretes minimalistas' }
  ],
  pulseras: [
    { id: 11, name: 'Pulsera Clásica', price: 20, image: '/pulsera.png', description: 'Pulsera clásica y elegante' },
    { id: 12, name: 'Pulsera Doble', price: 24, image: '/pulsera-doble.png', description: 'Pulsera con doble cadena' },
    { id: 13, name: 'Pulsera Perlas', price: 26, image: '/pulsera-perlas.png', description: 'Pulsera con perlas' },
    { id: 14, name: 'Pulsera Plata', price: 30, image: '/pulsera-plata.png', description: 'Pulsera en tono plata' },
    { id: 15, name: 'Pulsera Oro', price: 28, image: '/pulsera-oro.png', description: 'Pulsera en tono dorado' }
  ]
};

export default function Products() {
  const [activeCategory, setActiveCategory] = useState<'collares' | 'aretes' | 'pulseras'>('collares');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category === 'collares' || category === 'aretes' || category === 'pulseras') {
      setActiveCategory(category);
    }
  }, [location.search]);

  const categories = [
    { key: 'collares', label: 'Collares', icon: '💎' },
    { key: 'aretes', label: 'Aretes', icon: '✨' },
    { key: 'pulseras', label: 'Pulseras', icon: '💍' }
  ];

  const currentProducts = productsData[activeCategory];
  const filteredProducts = currentProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="products-page">
      {/* Header */}
      <header className="products-header">
        <div className="header-left">
          <h1>WUEPA</h1>
          <p>ACCESORIOS</p>
        </div>
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
          <Link to="/contact">Contacto</Link>
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
                <button className="product-whatsapp-btn">
                  WhatsApp
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
            <Link to="/products">Productos</Link>
            <Link to="/about">Nosotros</Link>
            <Link to="/contact">Contacto</Link>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 wuepa. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}