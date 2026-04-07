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
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Lista de productos disponibles
const products = [
  { id: 1, name: 'Collar Corazón', price: 25, image: '/collar.png' },
  { id: 2, name: 'Aretes Perla', price: 18, image: '/arete.png' },
  { id: 3, name: 'Pulsera Clásica', price: 20, image: '/pulsera.png' },
  { id: 4, name: 'Collar Minimal', price: 22, image: '/collar-min.png' },
  { id: 5, name: 'Anillo Elegante', price: 28, image: '/anillo.png' },
  { id: 6, name: 'Tobillera Dorada', price: 19, image: '/tobillera.png' },
  { id: 7, name: 'Collar Diamante', price: 35, image: '/collar-diamante.png' },
  { id: 8, name: 'Aretes Gota', price: 21, image: '/aretes-gota.png' },
  { id: 9, name: 'Pulsera Perlas', price: 26, image: '/pulsera-perlas.png' },
  { id: 10, name: 'Collar Cadena', price: 23, image: '/collar-cadena.png' },
  { id: 11, name: 'Arete Cristal', price: 24, image: '/arete-cristal.png' },
  { id: 12, name: 'Pulsera Plata', price: 30, image: '/pulsera-plata.png' }
];

// Lista de productos más vendidos o nuevos
const bestSellers = [
  { id: 101, name: 'Arete Flor', price: 16, image: '/arete-flor.png' },
  { id: 102, name: 'Pulsera Doble', price: 24, image: '/pulsera-doble.png' },
  { id: 103, name: 'Collar Oro', price: 29, image: '/collar-oro.png' },
  { id: 104, name: 'Anillo Perla', price: 27, image: '/anillo-perla.png' }
];

/**
 * Componente funcional principal para la página de compra.
 */
export default function Buy() {
  // Estado para la búsqueda de productos
  const [searchQuery, setSearchQuery] = useState('');
  // Usuario autenticado y logout obtenido del store
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Filtra productos según la búsqueda
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtra productos destacados según la búsqueda
  const filteredBestSellers = bestSellers.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              <ImageWithFallback src="/Collareswue.png" alt="Collares" />
              <div className="backdrop" />
              <div className="content">
                <h4>COLLARES</h4>
              </div>
            </Link>
            <Link to="/products?category=aretes" className="category-card">
              <ImageWithFallback src="/AretesWue.png" alt="Aretes" />
              <div className="backdrop" />
              <div className="content">
                <h4>ARETES</h4>
              </div>
            </Link>
            <Link to="/products?category=pulseras" className="category-card">
              <ImageWithFallback src="/Pulseraswue.png" alt="Pulseras" />
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
                <Link className="whatsapp-btn" to="#">WHATSAPP</Link>
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
                  <Link className="whatsapp-btn" to="#">WHATSAPP</Link>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

