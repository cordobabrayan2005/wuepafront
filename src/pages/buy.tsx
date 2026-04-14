/**
 * Componente Buy
 *
 * Página principal de compra de Joyería Wuepa. Permite buscar productos, ver categorías,
 * productos destacados y nuevos productos. Muestra información del usuario autenticado.
 *
 * Estructura:
 * - Header: Barra de navegación, buscador y enlaces principales.
 * - Sección principal: Banner, categorías, productos destacados.
 * - Sidebar: Información del usuario y nuevos productos.
 *
 * @returns {JSX.Element} Página de compra con productos y categorías.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuthStore } from '../stores/authStore';
import { loadProductsCatalog, ProductCatalogItem } from '../utils/productCatalog';

/**
 * Componente funcional principal para la página de compra.
 */
export default function Buy() {
  // Estado para la búsqueda de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  // Usuario autenticado y logout obtenido del store
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    function syncProducts() {
      setProducts(loadProductsCatalog());
    }

    window.addEventListener('storage', syncProducts);
    return () => window.removeEventListener('storage', syncProducts);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const featuredProducts = useMemo(() => products.slice(0, 6), [products]);
  const newProducts = useMemo(() => [...products].sort((leftProduct, rightProduct) => rightProduct.id - leftProduct.id).slice(0, 4), [products]);

  // Filtra productos según la búsqueda
  const filteredProducts = featuredProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
    || product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtra productos destacados según la búsqueda
  const filteredBestSellers = newProducts.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
    || item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Renderizado principal de la página
  return (
    <main className="buy-page">
      <header className="buy-header">
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
          <Link to="/products">Productos</Link>
          <Link to="/about">Nosotros</Link>
          <button onClick={handleLogout} className="logout-btn" style={{marginLeft: 16, background: 'transparent', color: '#e74c3c', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer'}}>Cerrar sesión</button>
        </nav>
      </header>

      <section className="buy-content">
        <section className="buy-grid">
          <article className="hero-card">
            <div>
              <h2>BRILLA CON <span>ELEGANCIA</span></h2>
              <p>Descubre nuestras colecciones exclusivas de joyas</p>
              <Link to="/products" className="primary-button">VER PRODUCTOS →</Link>
            </div>
            <img src="/collagewue.png" alt="Destacados" />
          </article>

          <div className="wuepa-categories">
            <Link to="/products?category=collares" className="category-card">
              <img src="/Collareswue.png" alt="Collares" />
              <div className="backdrop" />
              <div className="content">
                <h4>COLLARES</h4>
              </div>
            </Link>
            <Link to="/products?category=aretes" className="category-card">
              <img src="/AretesWue.png" alt="Aretes" />
              <div className="backdrop" />
              <div className="content">
                <h4>ARETES</h4>
              </div>
            </Link>
            <Link to="/products?category=pulseras" className="category-card">
              <img src="/Pulseraswue.png" alt="Pulseras" />
              <div className="backdrop" />
              <div className="content">
                <h4>PULSERAS</h4>
              </div>
            </Link>
          </div>

          <h3>PRODUCTOS DESTACADOS</h3>
          <div className="product-list">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-card-media">
                  <ImageWithFallback src={product.image} alt={product.name} />
                  <span className="product-stock-badge">{product.units} disponibles</span>
                </div>
                <h4 className="product-card-title">{product.name}</h4>
                <p>${product.price.toFixed(2)}</p>
                <a
                  className="whatsapp-btn"
                  href={`https://wa.me/?text=${encodeURIComponent(`Hola, me interesa ${product.name}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WHATSAPP
                </a>
              </article>
            ))}
          </div>
        </section>

        <aside className="buy-sidebar">
          <div className="user-card">
            <h3>Bienvenid@ {user?.name}</h3>
            <p>{user?.email}</p>
            <Link to="/profile" className="profile-btn">Ver Perfil</Link>
          </div>

          <div className="best-seller">
            <h4>NUEVOS PRODUCTOS</h4>
            <div className="product-list">
              {filteredBestSellers.map((item) => (
                <article key={item.id} className="product-card">
                  <div className="product-card-media">
                    <ImageWithFallback src={item.image} alt={item.name} />
                    <span className="product-stock-badge">{item.units} disponibles</span>
                  </div>
                  <h4 className="product-card-title">{item.name}</h4>
                  <p>${item.price.toFixed(2)}</p>
                  <a
                    className="whatsapp-btn"
                    href={`https://wa.me/?text=${encodeURIComponent(`Hola, me interesa ${item.name}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WHATSAPP
                  </a>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

