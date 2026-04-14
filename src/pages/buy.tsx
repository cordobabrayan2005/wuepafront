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
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import MobileNavMenu from '../components/MobileNavMenu';
import { useAuthStore } from '../stores/authStore';
import { loadProductsCatalog, ProductCatalogItem } from '../utils/productCatalog';

/**
 * Componente funcional principal para la página de compra.
 */
export default function Buy() {
  const FLASH_STORAGE_KEY = 'wuepa-auth-flash';
  // Estado para la búsqueda de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  // Usuario autenticado y logout obtenido del store
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function syncProducts() {
      setProducts(loadProductsCatalog());
    }

    window.addEventListener('storage', syncProducts);
    return () => window.removeEventListener('storage', syncProducts);
  }, []);

  useEffect(() => {
    const state = location.state as { flash?: { text?: string; type?: 'success' | 'error' | 'info' } } | null;
    if (!state?.flash) {
      return;
    }

    setMsg(state.flash.text || 'Acción completada correctamente.');
    setMsgType(state.flash.type || 'info');
    navigate(location.pathname, { replace: true });
  }, [location, navigate]);

  useEffect(() => {
    if (!msg || isLoggingOut) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMsg('');
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [msg, isLoggingOut]);

  const handleLogout = () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setMsg('Cerrando sesión...');
    setMsgType('info');

    window.setTimeout(() => {
      sessionStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify({ type: 'info', text: 'Se cerró sesión correctamente.' }));
      logout();
      navigate('/login', { state: { flash: { type: 'info', text: 'Se cerró sesión correctamente.' } } });
    }, 650);
  };

  const featuredProducts = useMemo(() => products.slice(0, 6), [products]);
  const newProducts = useMemo(() => [...products].sort((leftProduct, rightProduct) => rightProduct.id - leftProduct.id).slice(0, 4), [products]);
  const mobileMenuItems = [
    { label: 'Inicio', to: '/buy', isActive: true },
    { label: 'Productos', to: '/products' },
    { label: 'Nosotros', to: '/about' },
    { label: isLoggingOut ? 'Cerrando...' : 'Cerrar sesion', onClick: handleLogout, tone: 'danger' as const },
  ];

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
        <MobileNavMenu title="Menu principal" items={mobileMenuItems} />
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
          <button onClick={handleLogout} disabled={isLoggingOut} className="logout-btn" style={{marginLeft: 16, background: 'transparent', color: '#e74c3c', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: isLoggingOut ? 'wait' : 'pointer', opacity: isLoggingOut ? 0.7 : 1}}>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</button>
        </nav>
      </header>

      {msg && (
        <div role="status" aria-live="polite" className={`auth-toast ${msgType}`}>
          {msg}
        </div>
      )}

      <section className="buy-content">
        <section className="buy-grid">
          <article className="hero-card">
            <div>
              <h2>BRILLA CON <span>ELEGANCIA</span></h2>
              <p>Descubre nuestras colecciones exclusivas de joyas</p>
              <Link to="/products" className="primary-button">VER PRODUCTOS →</Link>
            </div>
            <img src="/collagewue.png" alt="Destacados" loading="eager" fetchPriority="high" />
          </article>

          <div className="wuepa-categories">
            <Link to="/products?category=collares" className="category-card">
              <img src="/Collareswue.png" alt="Collares" loading="lazy" decoding="async" />
              <div className="backdrop" />
              <div className="content">
                <h4>COLLARES</h4>
              </div>
            </Link>
            <Link to="/products?category=aretes" className="category-card">
              <img src="/AretesWue.png" alt="Aretes" loading="lazy" decoding="async" />
              <div className="backdrop" />
              <div className="content">
                <h4>ARETES</h4>
              </div>
            </Link>
            <Link to="/products?category=pulseras" className="category-card">
              <img src="/Pulseraswue.png" alt="Pulseras" loading="lazy" decoding="async" />
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
                  <ImageWithFallback src={product.image} alt={product.name} sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 25vw" />
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
            <p className="user-email" title={user?.email ?? ''}>{user?.email}</p>
            <Link to="/profile" className="profile-btn">Ver Perfil</Link>
          </div>

          <div className="best-seller">
            <h4>NUEVOS PRODUCTOS</h4>
            <div className="product-list">
              {filteredBestSellers.map((item) => (
                <article key={item.id} className="product-card">
                  <div className="product-card-media">
                    <ImageWithFallback src={item.image} alt={item.name} sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 25vw" />
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

