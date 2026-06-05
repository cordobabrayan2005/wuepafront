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
import MobileBottomNav from '../components/MobileBottomNav';
import MobileNavMenu from '../components/MobileNavMenu';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { useAuthStore } from '../stores/authStore';
import { addProductToCart, getCartItemsCount, loadCartItems } from '../utils/cart';
import { formatCopCurrency } from '../utils/currency';
import { loadProductsCatalog, loadProductsCatalogFromBackend, ProductCatalogItem, ProductSortOrder, sortProductsCatalog } from '../utils/productCatalog';

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
  const [cartCount, setCartCount] = useState(() => getCartItemsCount(loadCartItems()));
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  const [sortOrder, setSortOrder] = useState<ProductSortOrder>('recent');
  // Usuario autenticado y logout obtenido del store
  const { user, logout } = useAuthStore();
  const isAdmin = user?.rol === 'admin';
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    function syncProducts() {
      setProducts(loadProductsCatalog());
    }

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

    window.addEventListener('storage', syncProducts);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncProducts);
    };
  }, []);

  useEffect(() => {
    function syncCartCount() {
      setCartCount(getCartItemsCount(loadCartItems()));
    }

    window.addEventListener('storage', syncCartCount);
    window.addEventListener('wuepa-cart-updated', syncCartCount as EventListener);
    return () => {
      window.removeEventListener('storage', syncCartCount);
      window.removeEventListener('wuepa-cart-updated', syncCartCount as EventListener);
    };
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

  const sortedProducts = useMemo(() => sortProductsCatalog(products, sortOrder), [products, sortOrder]);
  const newProducts = useMemo(() => sortedProducts.slice(0, 4), [sortedProducts]);
  const mobileMenuItems = [
    { label: 'Inicio', to: '/buy', isActive: true },

    { label: 'Productos', to: '/products' },

    { label: `Carrito (${cartCount})`, to: '/cart' },

    { label: 'Nosotros', to: '/about' },

    ...(isAdmin
      ? [{ label: 'Admin', to: '/admin' }]
      : []),

    {
      label: isLoggingOut
        ? 'Cerrando...'
        : 'Cerrar sesion',

      onClick: handleLogout,

      tone: 'danger' as const
    },
  ];

  const handleAddToCart = (product: ProductCatalogItem) => {
    const nextItems = addProductToCart(product);
    setCartCount(getCartItemsCount(nextItems));
    setMsg(`${product.name} se agrego al carrito.`);
    setMsgType('success');
  };

  // Filtra productos según la búsqueda
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    return sortedProducts.filter((product) =>
      product.code.toLowerCase().includes(normalizedSearch)
      || product.name.toLowerCase().includes(normalizedSearch)
      || product.description.toLowerCase().includes(normalizedSearch)
    );
  }, [searchQuery, sortedProducts]);

  // Filtra productos destacados según la búsqueda
  const filteredBestSellers = newProducts.filter((item) =>
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
    || item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Link to="/cart" className="cart-link-inline">Carrito <span className="cart-link-count">{cartCount}</span></Link>
          <Link to="/about">Nosotros</Link>
          {
            isAdmin && (
              <Link to="/admin">Admin</Link>
            )
          }
          <button onClick={handleLogout} disabled={isLoggingOut} className="logout-btn" style={{ marginLeft: 16, background: 'transparent', color: '#e74c3c', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: isLoggingOut ? 'wait' : 'pointer', opacity: isLoggingOut ? 0.7 : 1 }}>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</button>
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
            <div className="hero-card-media">
              <img src="/collagewue.png" alt="Destacados" loading="eager" fetchPriority="high" />
            </div>
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
            <Link to="/products?category=anillos" className="category-card category-card-anillos">
              <img src="/Anilloswue.png" alt="Anillos" className="category-image-anillos" loading="lazy" decoding="async" />
              <div className="backdrop" />
              <div className="content">
                <h4>ANILLOS</h4>
              </div>
            </Link>
            <Link to="/products?category=paquetes" className="category-card category-card-paquetes">
              <img src="/CatPaquetes.png" alt="Paquetes" className="category-image-paquetes" loading="lazy" decoding="async" />
              <div className="backdrop" />
              <div className="content">
                <h4>PAQUETES</h4>
              </div>
            </Link>
          </div>

          <div className="products-toolbar buy-products-toolbar">
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

          <h3>PRODUCTOS DESTACADOS</h3>
          <div className="product-list">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-card-media">
                  <ImageWithFallback src={product.image} alt={product.name} sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 25vw" />
                  <span className="product-stock-badge">{product.units} disponibles</span>
                </div>
                <h4 className="product-card-title">{product.name}</h4>
                <p className="product-card-description buy-product-description">{product.description}</p>
                <p className="product-card-price">{formatCopCurrency(product.price)}</p>
                <div className="product-card-actions">
                  <button type="button" className="add-cart-btn" onClick={() => handleAddToCart(product)}>Agregar al carrito</button>
                </div>
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
                  <p className="product-card-description buy-product-description">{item.description}</p>
                  <p className="product-card-price">{formatCopCurrency(item.price)}</p>
                  <div className="product-card-actions">
                    <button type="button" className="add-cart-btn" onClick={() => handleAddToCart(item)}>Agregar al carrito</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </section>
      <ScrollToTopButton />
      {/* Barra inferior autenticada visible solo en movil despues de iniciar sesion. */}
      <MobileBottomNav active="home" cartCount={cartCount} variant="auth" />
    </main>
  );
}

