import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Search, ShoppingCart, Sparkles, User } from 'lucide-react';
import MobileNavMenu from './MobileNavMenu';
import { useAuthStore } from '../stores/authStore';
import { getCachedCartItems, getCartItemsCount, loadCartItems } from '../utils/cart';

type AuthenticatedTopBarProps = {
  active?: 'home' | 'products' | 'cart' | 'profile' | 'admin';
  cartCount?: number;
  searchQuery?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
};

export default function AuthenticatedTopBar({
  active = 'home',
  cartCount,
  searchQuery = '',
  searchPlaceholder = 'Buscar...',
  onSearchChange,
}: AuthenticatedTopBarProps) {
  const FLASH_STORAGE_KEY = 'wuepa-auth-flash';
  const [internalCartCount, setInternalCartCount] = useState(() => getCartItemsCount(getCachedCartItems()));
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.rol === 'admin';
  const displayCartCount = cartCount ?? internalCartCount;

  useEffect(() => {
    if (typeof cartCount === 'number') {
      return undefined;
    }

    function syncCartCount() {
      setInternalCartCount(getCartItemsCount(getCachedCartItems()));
    }

    loadCartItems().then((items) => setInternalCartCount(getCartItemsCount(items))).catch(() => setInternalCartCount(0));
    window.addEventListener('wuepa-cart-updated', syncCartCount as EventListener);

    return () => {
      window.removeEventListener('wuepa-cart-updated', syncCartCount as EventListener);
    };
  }, [cartCount]);

  function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    window.setTimeout(() => {
      sessionStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify({ type: 'info', text: 'Se cerro sesion correctamente.' }));
      logout();
      navigate('/login', { state: { flash: { type: 'info', text: 'Se cerro sesion correctamente.' } } });
    }, 450);
  }

  const mobileMenuItems = [
    { label: 'Inicio', to: '/buy', isActive: active === 'home' },
    { label: 'Tienda', to: '/products', isActive: active === 'products' },
    { label: `Carrito (${displayCartCount})`, to: '/cart', isActive: active === 'cart' },
    { label: 'Mi perfil', to: '/profile', isActive: active === 'profile' },
    { label: 'Nosotros', to: '/about' },
    ...(isAdmin ? [{ label: 'Admin', to: '/admin', isActive: active === 'admin' }] : []),
    { label: isLoggingOut ? 'Cerrando...' : 'Cerrar sesion', onClick: handleLogout, tone: 'danger' as const },
  ];

  return (
    <div className="authenticated-storefront buy-page">
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
          <Link to="/buy" className={active === 'home' ? 'active' : ''}>Inicio</Link>
          <Link to="/products" className={active === 'products' ? 'active' : ''}>Tienda</Link>
          <Link to="/products?category=paquetes">Colecciones</Link>
          <Link to="/about">Nosotros</Link>
          {isAdmin && (
            <Link to="/admin" className={active === 'admin' ? 'active' : ''}>Admin</Link>
          )}
        </nav>

        {onSearchChange ? (
          <div className="header-center">
            <Search aria-hidden="true" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="search-bar"
            />
          </div>
        ) : (
          <div className="header-center authenticated-header-spacer" aria-hidden="true" />
        )}

        <div className="buy-header-actions">
          <Link to="/profile" className="buy-icon-button" aria-label={`Perfil de ${user?.name ?? 'usuario'}`}>
            <User aria-hidden="true" />
          </Link>
          <Link to="/cart" className="buy-icon-button cart-link-inline" aria-label={`Carrito con ${displayCartCount} productos`}>
            <ShoppingCart aria-hidden="true" />
            <span className="cart-link-count">{displayCartCount}</span>
          </Link>
          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="buy-icon-button logout-btn" aria-label={isLoggingOut ? 'Cerrando sesion' : 'Cerrar sesion'}>
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </header>
    </div>
  );
}
