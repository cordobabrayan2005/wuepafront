import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, LogOut, Search, Send, ShoppingCart, Sparkles, User } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import CartPreviewDrawer from '../components/CartPreviewDrawer';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileNavMenu from '../components/MobileNavMenu';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { useAuthStore } from '../stores/authStore';
import { addProductToCart, getCachedCartItems, getCartItemsCount, loadCartItems } from '../utils/cart';
import { formatCopCurrency } from '../utils/currency';
import { getAvailableProducts, loadProductsCatalog, loadProductsCatalogFromBackend, ProductCatalogItem, ProductSortOrder, sortProductsCatalog } from '../utils/productCatalog';

export default function Buy() {
  const FLASH_STORAGE_KEY = 'wuepa-auth-flash';
  const [searchQuery, setSearchQuery] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [cartCount, setCartCount] = useState(() => getCartItemsCount(getCachedCartItems()));
  const [isCartPreviewOpen, setIsCartPreviewOpen] = useState(false);
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  const [sortOrder, setSortOrder] = useState<ProductSortOrder>('recent');
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const { user, logout } = useAuthStore();
  const isAdmin = user?.rol === 'admin';
  const location = useLocation();
  const navigate = useNavigate();

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
    function syncCartCount() {
      setCartCount(getCartItemsCount(getCachedCartItems()));
    }

    loadCartItems().then((items) => setCartCount(getCartItemsCount(items))).catch(() => setCartCount(0));
    window.addEventListener('wuepa-cart-updated', syncCartCount as EventListener);

    return () => {
      window.removeEventListener('wuepa-cart-updated', syncCartCount as EventListener);
    };
  }, []);

  useEffect(() => {
    const state = location.state as { flash?: { text?: string; type?: 'success' | 'error' | 'info' } } | null;

    if (!state?.flash) {
      return;
    }

    setMsg(state.flash.text || 'Accion completada correctamente.');
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

  const featuredCategories = [
    {
      label: 'Collares',
      image: '/Collareswue.png',
      to: '/products?category=collares',
      imageClassName: 'category-image-collares',
    },
    {
      label: 'Pulseras',
      image: '/Pulseraswue.png',
      to: '/products?category=pulseras',
    },
    {
      label: 'Aretes',
      image: '/AretesWue.png',
      to: '/products?category=aretes',
      imageClassName: 'category-image-aretes',
    },
    {
      label: 'Anillos',
      image: '/Anilloswue.png',
      to: '/products?category=anillos',
      imageClassName: 'category-image-anillos',
    },
    {
      label: 'Set de accesorios',
      image: '/SetsWue.jpeg',
      to: '/products?category=paquetes',
      imageClassName: 'category-image-paquetes',
    },
  ];

  const heroSlides = [
    {
      label: 'Wuepa',
      image: '/collagewue.png',
      to: '/products',
      alt: 'Accesorios dorados Wuepa',
    },
    ...featuredCategories.map((category) => ({
      label: category.label,
      image: category.image,
      to: category.to,
      alt: category.label,
    })),
  ];

  useEffect(() => {
    if (heroSlides.length === 0) {
      return;
    }

    const heroInterval = window.setInterval(() => {
      setHeroSlideIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
    }, 4500);

    return () => window.clearInterval(heroInterval);
  }, [heroSlides.length]);

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

  const sortedProducts = useMemo(() => sortProductsCatalog(getAvailableProducts(products), sortOrder), [products, sortOrder]);
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase();

    return sortedProducts.filter((product) =>
      product.code.toLowerCase().includes(normalizedSearch)
      || product.name.toLowerCase().includes(normalizedSearch)
      || product.description.toLowerCase().includes(normalizedSearch)
    );
  }, [searchQuery, sortedProducts]);

  const mobileMenuItems = [
    { label: 'Inicio', to: '/buy', isActive: true },
    { label: 'Tienda', to: '/products' },
    { label: 'Colecciones', to: '/products?category=paquetes' },
    { label: `Carrito (${cartCount})`, to: '/cart' },
    { label: 'Nosotros', to: '/about' },
    ...(isAdmin ? [{ label: 'Admin', to: '/admin' }] : []),
    {
      label: isLoggingOut ? 'Cerrando...' : 'Cerrar sesión',
      onClick: handleLogout,
      tone: 'danger' as const
    },
  ];

  const handleAddToCart = async (product: ProductCatalogItem) => {
    if (product.units <= 0) {
      setMsg(`${product.name} no tiene unidades disponibles.`);
      setMsgType('error');
      return;
    }

    try {
      const nextItems = await addProductToCart(product);
      setCartCount(getCartItemsCount(nextItems));
      setMsg(`${product.name} se agrego al carrito.`);
      setMsgType('success');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'No se pudo guardar el carrito.');
      setMsgType('error');
    }
  };

  return (
    <main className="buy-page">
      <div className="buy-promo-bar" aria-label="Promocion Wuepa">
        <Sparkles aria-hidden="true" />
        <strong>Accesorios que hablan por ti</strong>
        <Sparkles aria-hidden="true" />
      </div>

      <header className="buy-header">
        <div className="header-left">
          <Link to="/buy" className="buy-brand" aria-label="Ir al inicio de compras">
            <h1>Wuepa</h1>
            <p>Jewelry</p>
          </Link>
        </div>

        <MobileNavMenu title="Menu principal" items={mobileMenuItems} />

        <nav className="header-right" aria-label="Navegacion principal">
          <Link to="/buy" className="active">Inicio</Link>
          <Link to="/products">Tienda</Link>
          <Link to="/products?category=paquetes">Colecciones</Link>
          <Link to="/about">Nosotros</Link>
          {isAdmin && (
            <Link to="/admin">Admin</Link>
          )}
        </nav>

        <div className="header-center">
          <Search aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="search-bar"
          />
        </div>

        <div className="buy-header-actions">
          <Link to="/profile" className="buy-icon-button" aria-label={`Perfil de ${user?.name ?? 'usuario'}`}>
            <User aria-hidden="true" />
          </Link>
          <button type="button" className="buy-icon-button cart-link-inline" onClick={() => setIsCartPreviewOpen(true)} aria-label={`Carrito con ${cartCount} productos`}>
            <ShoppingCart aria-hidden="true" />
            <span className="cart-link-count">{cartCount}</span>
          </button>
          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="buy-icon-button logout-btn" aria-label={isLoggingOut ? 'Cerrando sesión' : 'Cerrar sesión'}>
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </header>
      <CartPreviewDrawer isOpen={isCartPreviewOpen} onClose={() => setIsCartPreviewOpen(false)} />

      {msg && (
        <div role="status" aria-live="polite" className={`auth-toast ${msgType}`}>
          {msg}
        </div>
      )}

      <section className="buy-content">
        <section className="buy-grid">
          <article className="hero-card">
            <div className="hero-card-media">
              <ImageWithFallback
                src={heroSlides[heroSlideIndex].image}
                alt={heroSlides[heroSlideIndex].alt}
                loading="eager"
                fetchPriority="high"
                className={`hero-slide-image ${heroSlideIndex === 1 ? 'hero-slide-image--second' : ''} ${heroSlideIndex === heroSlides.length - 1 ? 'hero-slide-image--last' : ''}`.trim()}
              />
              <div className="hero-slider-dots" role="tablist" aria-label="Seleccionar imagen de hero">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.label}
                    type="button"
                    className={`hero-slider-dot ${heroSlideIndex === index ? 'active' : ''}`}
                    aria-label={`Ver ${slide.label}`}
                    aria-selected={heroSlideIndex === index}
                    onClick={() => setHeroSlideIndex(index)}
                  />
                ))}
              </div>
            </div>
            <div className="hero-card-copy">
              <h2>Wuepa</h2>
              <p>Accesorios que hablan por ti</p>
              <Link to={heroSlides[heroSlideIndex].to} className="primary-button">
                Descubrir colecciones
                <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>
          </article>

          <section className="buy-categories-section" aria-label="Categorias de productos">
            <div className="buy-section-heading">
              <span>Compra por categoria</span>
              <h3>Elige tu brillo</h3>
            </div>

            <div className="wuepa-categories buy-categories">
              {featuredCategories.map((category) => (
                <Link key={category.label} to={category.to} className="category-card">
                  <ImageWithFallback
                    src={category.image}
                    alt={category.label}
                    className={category.imageClassName}
                    loading="eager"
                  />
                  <span className="backdrop" aria-hidden="true" />
                  <span className="content">
                    <h4>{category.label}</h4>
                    <small>Ver categoria</small>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <div className="products-toolbar buy-products-toolbar">
            <h3>Productos</h3>
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

          <p className="mobile-swipe-hint" aria-hidden="true">Desliza hacia arriba para ver más productos</p>
          <div className="product-list" aria-live="polite">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-card-media">
                  <ImageWithFallback src={product.image} alt={product.name} sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 25vw" />
                  <button type="button" className="product-favorite-btn" aria-label={`Guardar ${product.name}`}>
                    <Heart aria-hidden="true" />
                  </button>
                </div>
                <h4 className="product-card-title">{product.name}</h4>
                <p className="product-card-description buy-product-description">{product.code}</p>
                <p className="product-card-price">{formatCopCurrency(product.price)}</p>
                <div className="product-card-actions">
                  <button type="button" className="add-cart-btn" onClick={() => handleAddToCart(product)} disabled={product.units <= 0}>
                    {product.units > 0 ? 'Agregar al carrito' : 'Agotado'}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="buy-all-products">
            <Link to="/products" className="primary-button">
              Ver todos los productos
              <span aria-hidden="true">-&gt;</span>
            </Link>
          </div>
        </section>
      </section>

      <footer className="buy-footer">
        <div className="buy-footer-inner">
          <div className="buy-footer-brand">
            <h2>Wuepa</h2>
            <p>Accesorios que hablan por ti. Diseñados para resaltar tu esencia y acompañarte en cada momento.</p>
            <div className="buy-socials" aria-label="Redes sociales">
              <a href="#" aria-label="Instagram">ig</a>
              <a href="#" aria-label="TikTok">tk</a>
              <a href="#" aria-label="Facebook">fb</a>
              <a href="#" aria-label="Pinterest">pt</a>
            </div>
          </div>

          <div className="buy-footer-group">
            <h3>Compra</h3>
            <Link to="/products?category=collares">Collares</Link>
            <Link to="/products?category=aretes">Aretes</Link>
            <Link to="/products?category=pulseras">Pulseras</Link>
            <Link to="/products?category=anillos">Anillos</Link>
            <Link to="/products?category=paquetes">Set de accesorios</Link>
          </div>

          <div className="buy-footer-group">
            <h3>Nosotros</h3>
            <Link to="/about">Nuestra historia</Link>
            <Link to="/about">Materiales</Link>
            <Link to="/about">Cuidados</Link>
            <Link to="/about">FAQ</Link>
            <Link to="/about">Contacto</Link>
          </div>

          <div className="buy-footer-group">
            <h3>Soporte</h3>
            <Link to="/about">Envios y entregas</Link>
            <Link to="/about">Cambios y devoluciones</Link>
            <Link to="/about">Términos y condiciones</Link>
            <Link to="/about">Politica de privacidad</Link>
          </div>

          <form className="buy-newsletter" onSubmit={(event) => event.preventDefault()}>
            <h3>Suscribete</h3>
            <p>Recibe novedades, lanzamientos y promociones especiales.</p>
            <label>
              <span>Tu correo electronico</span>
              <input type="email" placeholder="Tu correo electronico" />
              <button type="submit" aria-label="Suscribirse">
                <Send aria-hidden="true" />
              </button>
            </label>
          </form>
        </div>
        <div className="buy-footer-bottom">
          <span>(c) 2026 Wuepa Jewelry. Todos los derechos reservados.</span>
          <span>Hecho con amor en Wuepa.</span>
        </div>
      </footer>

      <ScrollToTopButton />
      <MobileBottomNav active="home" cartCount={cartCount} variant="auth" />
    </main>
  );
}
