/**
 * Componente Home
 *
 * Página principal de Joyería Wuepa. Muestra el hero, categorías, productos destacados,
 * nuevos productos, navegación y footer. Incluye barra de navegación que se oculta al hacer scroll.
 *
 * Estructura:
 * - Navbar: Barra superior con marca y acciones de usuario.
 * - Hero: Mensaje principal y acciones destacadas.
 * - Categorías: Acceso rápido a tipos de productos.
 * - CTA: Llamado a la acción para crear cuenta.
 * - Footer: Información y enlaces rápidos.
 * - Navegación fácil.
 *
 * @returns {JSX.Element} Página principal de la tienda.
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileNavMenu from '../components/MobileNavMenu';
import { formatCopCurrency } from '../utils/currency';
import { loadProductsCatalog, loadProductsCatalogFromBackend, ProductCatalogItem, ProductSortOrder, sortProductsCatalog } from '../utils/productCatalog';

/**
 * Componente funcional principal para la página de inicio.
 */
export default function Home() {
  // Hook de navegación
  const navigate = useNavigate();
  // Estado para mostrar/ocultar la barra de navegación
  const [showNavbar, setShowNavbar] = useState(true);
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  const [sortOrder, setSortOrder] = useState<ProductSortOrder>('recent');
  // Referencia para el último scroll vertical
  const lastScrollY = useRef(0);

  // Efecto para cambiar el título y manejar la visibilidad de la navbar al hacer scroll
  useEffect(() => {
    document.title = 'wuepa';

    const handleScroll = () => {
      if (window.scrollY > lastScrollY.current && window.scrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const featuredProducts = useMemo(
    () => sortProductsCatalog(products, sortOrder).slice(0, 8),
    [products, sortOrder]
  );
  const mobileMenuItems = [
    { label: 'Crear cuenta', to: '/signup', tone: 'accent' as const },
    { label: 'Iniciar sesion', to: '/login', tone: 'default' as const },
    { label: 'Productos', to: '/productssin' },
  ];

  // Renderizado principal de la página de inicio
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className={`wuepa-nav${showNavbar ? '' : ' hidden'}`}>
        <div className="wuepa-nav-inner">
          <button type="button" className="wuepa-brand" onClick={() => navigate('/')} aria-label="Ir al inicio">
            <div>
              <h1>WUEPA</h1>
              <p>ACCESORIOS</p>
            </div>
          </button>
          <MobileNavMenu title="WUEPA" items={mobileMenuItems} />
          <div className="wuepa-actions">
            <button onClick={() => navigate('/signup')} className="btn-primary">Crear cuenta</button>
            <button onClick={() => navigate('/login')} className="btn-secondary">Iniciar sesión</button>
            <button onClick={() => navigate('/productssin')} className="wuepa-catalog-btn">
              <ShoppingBag aria-hidden="true" />
              Productos
            </button>
          </div>
        </div>
      </nav>
      <div className="spacer"></div>

      <div className="wuepa-container">
        <section className="wuepa-launch-banner" aria-label="Lanzamiento Wuepa">
          <span>Brillo hecho a mano para todos tus looks</span>
          <strong>Lanzamiento de pagina web</strong>
          <button type="button" onClick={() => navigate('/productssin')}>Ver productos</button>
        </section>

        <section className="wuepa-hero wuepa-campaign-hero">
          <div className="wuepa-campaign-side wuepa-campaign-left">
            <ImageWithFallback
              src="/WuepaCrear.png"
              alt="Accesorios Wuepa"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          <div className="wuepa-campaign-copy">
            <ImageWithFallback src="/W.png" alt="Wuepa accesorios" className="wuepa-campaign-logo" />
            <p>Nueva experiencia online</p>
            <h2>
              Lanzamiento
              <span>de pagina web</span>
            </h2>
            <small>Collares, pulseras, aretes, anillos y paquetes con el detalle dorado que identifica a Wuepa.</small>
            <button type="button" onClick={() => navigate('/productssin')}>
              Explorar coleccion
            </button>
          </div>

          <div className="wuepa-campaign-side wuepa-campaign-right">
            <ImageWithFallback
              src="/wuepaini.png"
              alt="Coleccion Wuepa"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </section>

        <section className="wuepa-quick-showcase" aria-label="Categorias destacadas">
          <button type="button" onClick={() => navigate('/productssin?category=collares')} className="wuepa-quick-card">
            <ImageWithFallback src="/Collareswue.png" alt="" className="wuepa-quick-image-collares" />
            <span>Collares</span>
            <small>Ver mas →</small>
          </button>
          <button type="button" onClick={() => navigate('/productssin?category=pulseras')} className="wuepa-quick-card">
            <ImageWithFallback src="/Pulseraswue.png" alt="" />
            <span>Pulseras</span>
            <small>Ver mas →</small>
          </button>
          <button type="button" onClick={() => navigate('/productssin?category=aretes')} className="wuepa-quick-card">
            <ImageWithFallback src="/AretesWue.png" alt="" />
            <span>Aretes</span>
            <small>Ver mas →</small>
          </button>
          <button type="button" onClick={() => navigate('/productssin?category=anillos')} className="wuepa-quick-card wuepa-quick-card-anillos">
            <ImageWithFallback src="/Anilloswue.png" alt="" className="wuepa-quick-image-anillos" />
            <span>Anillos</span>
            <small>Ver mas →</small>
          </button>
          <button type="button" onClick={() => navigate('/productssin?category=paquetes')} className="wuepa-quick-card wuepa-quick-card-paquetes">
            <ImageWithFallback src="/CatPaquetes.png" alt="" className="wuepa-quick-image-paquetes" />
            <span>Paquetes</span>
            <small>Ver mas →</small>
          </button>
        </section>

        <div className="products-toolbar home-products-toolbar">
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

        <section className="products-grid home-featured-products">
          {featuredProducts.map((product) => (
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
                INICIAR SESIÓN
              </button>
            </article>
          ))}
        </section>

        <section className="wuepa-cta">
          <h3>¿Lista para brillar?</h3>
          <p>Únete a nuestra comunidad y descubre las últimas tendencias en accesorios.</p>
          <button onClick={() => navigate('/signup')} className="btn-cta">Crear Cuenta Gratis</button>
        </section>
      </div>

      {/* Footer */}
      <footer className="wuepa-footer">
        <div className="wuepa-footer-inner">
          <div className="wuepa-footer-brand">
            <h2>WUEPA</h2>
            <p>Accesorios que realzan tu belleza</p>
          </div>

          <div className="wuepa-footer-group">
            <h3>Tienda</h3>
            <ul>
              <li><a href="#">Collares</a></li>
              <li><a href="#">Aretes</a></li>
              <li><a href="#">Pulseras</a></li>
              <li><a href="#">Anillos</a></li>
              <li><a href="#">Paquetes</a></li>
            </ul>
          </div>

          <div className="wuepa-footer-group">
            <h3>InformaciÃ³n</h3>
            <ul>
              <li><a href="#">Sobre Nosotros</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          <div className="wuepa-footer-group">
            <h3>Legal</h3>
            <ul>
              <li><a href="#">TÃ©rminos</a></li>
              <li><a href="#">Privacidad</a></li>
              <li><a href="#">Devoluciones</a></li>
            </ul>
          </div>
        </div>

        <div className="wuepa-footer-bottom">
          Â© 2026 wuepa. Todos los derechos reservados.
        </div>
      </footer>

      {/* Bottom Navigation */}
      <MobileBottomNav active="home" />
    </div>
  );
}
