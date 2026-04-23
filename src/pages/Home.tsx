/**
 * Componente Home
 *
 * PÃ¡gina principal de JoyerÃa Wuepa. Muestra el hero, categorÃas, productos destacados,
 * nuevos productos, navegaciÃ³n y footer. Incluye barra de navegaciÃ³n que se oculta al hacer scroll.
 *
 * Estructura:
 * - Navbar: Barra superior con marca y acciones de usuario.
 * - Hero: Mensaje principal y acciones destacadas.
 * - CategorÃas: Acceso rÃ¡pido a tipos de productos.
 * - CTA: Llamado a la acciÃ³n para crear cuenta.
 * - Footer: InformaciÃ³n y enlaces rÃ¡pidos.
 * - NavegaciÃ³n inferior mÃ³vil.
 *
 * @returns {JSX.Element} PÃ¡gina principal de la tienda.
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Heart, User, Home as HomeIcon, Package } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import MobileNavMenu from '../components/MobileNavMenu';
import { formatCopCurrency } from '../utils/currency';
import { loadProductsCatalog, ProductCatalogItem } from '../utils/productCatalog';

/**
 * Componente funcional principal para la pÃ¡gina de inicio.
 */
export default function Home() {
  // Hook de navegaciÃ³n
  const navigate = useNavigate();
  // Estado para mostrar/ocultar la barra de navegaciÃ³n
  const [showNavbar, setShowNavbar] = useState(true);
  const [products, setProducts] = useState<ProductCatalogItem[]>(() => loadProductsCatalog());
  // Referencia para el Ãºltimo scroll vertical
  const lastScrollY = useRef(0);

  // Efecto para cambiar el tÃtulo y manejar la visibilidad de la navbar al hacer scroll
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
    function syncProducts() {
      setProducts(loadProductsCatalog());
    }

    window.addEventListener('storage', syncProducts);
    return () => window.removeEventListener('storage', syncProducts);
  }, []);

  const featuredProducts = products.slice(0, 8);
  const categoryLabels = {
    collares: 'Collares',
    aretes: 'Aretes',
    pulseras: 'Pulseras',
  } as const;
  const mobileMenuItems = [
    { label: 'Inicio', to: '/' },
    { label: 'Catalogo', to: '/productssin' },
    { label: 'Sobre nosotros', to: '/about' },
    { label: 'Iniciar sesion', to: '/login', tone: 'default' as const },
    { label: 'Registrarse', to: '/signup', tone: 'accent' as const },
  ];

  // Renderizado principal de la pÃ¡gina de inicio
  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className={`wuepa-nav${showNavbar ? '' : ' hidden'}`}>
        <div className="wuepa-nav-inner">
          <div className="wuepa-brand">
            <div>
              <h1>WUEPA</h1>
              <p>ACCESORIOS</p>
            </div>
          </div>
          <MobileNavMenu title="WUEPA" items={mobileMenuItems} />
          <div className="wuepa-actions">
            <button onClick={() => navigate('/login')} className="btn-secondary">Iniciar Sesión</button>
            <button onClick={() => navigate('/signup')} className="btn-primary">Registrarse</button>
          </div>
        </div>
      </nav>
      <div className="spacer"></div>

      <div className="wuepa-container">
        <section className="wuepa-hero">
          <h2 className="wuepa-hero-title">BRILLA CON</h2>
          <h2 className="wuepa-hero-subtitle">ELEGANCIA</h2>
          <p className="wuepa-hero-text">Descubre la colección más exclusiva de joyas y accesorios diseñados para realzar tu belleza única</p>
          <div className="wuepa-hero-actions">
            <button onClick={() => navigate('/products')} className="btn-primary">Comenzar Ahora →</button>
            <button onClick={() => navigate('/productssin')} className="btn-secondary">Explorar Catálogo</button>
          </div>
        </section>

        <section className="wuepa-categories">
          <div className="category-card" onClick={() => navigate('/productssin?category=collares')} style={{ cursor: 'pointer' }}>
            <ImageWithFallback src="/Collareswue.png" alt="Collares" className="w-full h-full object-cover" loading="eager" fetchPriority="high" />
            <div className="backdrop"></div>
            <div className="content">
              <h3>Collares</h3>
              <p>Elegancia atemporal</p>
            </div>
          </div>
          <div className="category-card" onClick={() => navigate('/productssin?category=aretes')} style={{ cursor: 'pointer' }}>
            <ImageWithFallback src="/AretesWue.png" alt="Aretes" className="w-full h-full object-cover" loading="eager" />
            <div className="backdrop"></div>
            <div className="content">
              <h3>Aretes</h3>
              <p>Brillo perfecto</p>
            </div>
          </div>
          <div className="category-card" onClick={() => navigate('/productssin?category=pulseras')} style={{ cursor: 'pointer' }}>
            <ImageWithFallback src="/Pulseraswue.png" alt="Pulseras" className="w-full h-full object-cover" loading="eager" />
            <div className="backdrop"></div>
            <div className="content">
              <h3>Pulseras</h3>
              <p>Estilo Ãºnico</p>
            </div>
          </div>
        </section>

        <section className="products-grid" style={{ margin: '2rem 0' }}>
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
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-amber-50/95 to-stone-100/95 backdrop-blur-md border-t border-amber-200/50 md:hidden">
        <div className="flex items-center justify-around py-4">
          <button onClick={() => navigate('/buy')} className="flex flex-col items-center gap-1 text-amber-600">
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Inicio</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-stone-500">
            <Package className="w-6 h-6" />
            <span className="text-xs">Productos</span>
          </button>
          <button 
            onClick={() => navigate('/favorites')}
            className="flex flex-col items-center gap-1 text-stone-500"
          >
            <Heart className="w-6 h-6" />
            <span className="text-xs">Favoritos</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-stone-500">
            <User className="w-6 h-6" />
            <span className="text-xs">Cuenta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
