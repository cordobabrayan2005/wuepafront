import { Home as HomeIcon, LogIn, Package, ShoppingCart, User, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Opciones que puede marcar como activa la barra inferior publica.
 * Se usan para resaltar la pagina actual sin depender de la URL interna.
 */
type MobileBottomNavItem = 'home' | 'products' | 'login' | 'signup' | 'cart' | 'profile';

type MobileBottomNavProps = {
  active?: MobileBottomNavItem;
  cartCount?: number;
  variant?: 'public' | 'auth';
};

/**
 * Barra de navegacion inferior para celulares.
 * Solo se muestra en Android/movil por la clase `md:hidden`. En modo publico
 * conecta inicio, catalogo, login y registro; en modo auth cambia a las rutas
 * disponibles despues de iniciar sesion: compra, productos, carrito y perfil.
 */
export default function MobileBottomNav({ active, cartCount = 0, variant = 'public' }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current;

      if (isScrollingDown && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = Math.max(currentScrollY, 0);
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Define las acciones publicas en un solo lugar para reutilizar la misma barra en varias paginas.
  const publicItems = [
    { key: 'home', label: 'Inicio', to: '/', icon: HomeIcon },
    { key: 'products', label: 'Productos', to: '/productssin', icon: Package },
    { key: 'login', label: 'Iniciar sesión', to: '/login', icon: LogIn },
    { key: 'signup', label: 'Crear cuenta', to: '/signup', icon: UserPlus, tone: 'accent' },
  ] as const;
  // Define las acciones para usuarios autenticados, incluyendo el contador visible del carrito.
  const authItems = [
    { key: 'home', label: 'Inicio', to: '/buy', icon: HomeIcon },
    { key: 'products', label: 'Productos', to: '/products', icon: Package },
    { key: 'cart', label: cartCount > 0 ? `Carrito ${cartCount}` : 'Carrito', to: '/cart', icon: ShoppingCart },
    { key: 'profile', label: 'Cuenta', to: '/profile', icon: User, tone: 'accent' },
  ] as const;
  const items = variant === 'auth' ? authItems : publicItems;

  return (
    <div className={`wuepa-mobile-bottom-nav md:hidden${isVisible ? '' : ' hidden'}`}>
      <div className="wuepa-mobile-bottom-inner">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          // Combina estado activo y tono principal sin repetir JSX por cada opcion.
          const className = [
            'wuepa-mobile-bottom-item',
            isActive ? 'active' : '',
            'tone' in item && item.tone === 'accent' ? 'accent' : '',
          ].filter(Boolean).join(' ');

          return (
            <button key={item.key} type="button" onClick={() => navigate(item.to)} className={className}>
              <Icon className="w-6 h-6" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
