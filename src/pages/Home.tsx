import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, Heart, User, Home as HomeIcon, Package, Star, Plus } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

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

  const featuredProducts = [
    {
      id: 1,
      name: 'Collar Corazón',
      price: 25.00,
      image: '/W.png'
    },
    {
      id: 2,
      name: 'Aretes Perla',
      price: 18.00,
      image: '/W.png'
    },
    {
      id: 3,
      name: 'Pulsera Clásica',
      price: 20.00,
      image: '/W.png'
    },
    {
      id: 4,
      name: 'Collar Minimal',
      price: 22.00,
      image: '/W.png'
    }
  ];

  const newProducts = [
    {
      id: 1,
      name: 'Aretes Flor',
      price: 16.00,
      image: '/W.png'
    },
    {
      id: 2,
      name: 'Pulsera Doble',
      price: 24.00,
      image: '/W.png'
    }
  ];

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className={`wuepa-nav ${showNavbar ? '' : 'hidden'}`}>
        <div className="wuepa-nav-inner">
          <div className="wuepa-brand">
            <div>
              <h1>WUEPA</h1>
              <p>ACCESORIOS</p>
            </div>
          </div>
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
            <button onClick={() => navigate('/products')} className="btn-secondary">Explorar Colección</button>
          </div>
        </section>

        <section className="wuepa-categories">
          <div className="category-card">
            <ImageWithFallback src="/W.png" alt="Collares" className="w-full h-full object-cover" />
            <div className="backdrop"></div>
            <div className="content">
              <h3>Collares</h3>
              <p>Elegancia atemporal</p>
            </div>
          </div>
          <div className="category-card">
            <ImageWithFallback src="/W.png" alt="Aretes" className="w-full h-full object-cover" />
            <div className="backdrop"></div>
            <div className="content">
              <h3>Aretes</h3>
              <p>Brillo perfecto</p>
            </div>
          </div>
          <div className="category-card">
            <ImageWithFallback src="/W.png" alt="Pulseras" className="w-full h-full object-cover" />
            <div className="backdrop"></div>
            <div className="content">
              <h3>Pulseras</h3>
              <p>Estilo único</p>
            </div>
          </div>
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
            <h3>Información</h3>
            <ul>
              <li><a href="#">Sobre Nosotros</a></li>
              <li><a href="#">Contacto</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          <div className="wuepa-footer-group">
            <h3>Legal</h3>
            <ul>
              <li><a href="#">Términos</a></li>
              <li><a href="#">Privacidad</a></li>
              <li><a href="#">Devoluciones</a></li>
            </ul>
          </div>
        </div>

        <div className="wuepa-footer-bottom">
          © 2026 wuepa. Todos los derechos reservados.
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
