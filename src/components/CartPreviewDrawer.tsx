import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { formatCopCurrency } from '../utils/currency';
import { CartItem, getCachedCartItems, getCartItemsCount, getCartSubtotal, loadCartItems } from '../utils/cart';

type CartPreviewDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

/** Vista rápida del pedido sin abandonar la página actual. */
export default function CartPreviewDrawer({ isOpen, onClose }: CartPreviewDrawerProps) {
  const [items, setItems] = useState<CartItem[]>(() => getCachedCartItems());
  const itemCount = useMemo(() => getCartItemsCount(items), [items]);
  const total = useMemo(() => getCartSubtotal(items), [items]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function syncCart() {
      setItems(getCachedCartItems());
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    loadCartItems().then(setItems).catch(() => setItems([]));
    window.addEventListener('wuepa-cart-updated', syncCart as EventListener);
    window.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('cart-preview-open');

    return () => {
      window.removeEventListener('wuepa-cart-updated', syncCart as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('cart-preview-open');
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="cart-preview-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="cart-preview-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cart-preview-header">
          <div>
            <p>Vista previa del pedido</p>
            <h2 id="cart-preview-title">Tu carrito</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar vista previa del carrito">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="cart-preview-content">
          {items.length === 0 ? (
            <div className="cart-preview-empty">
              <ShoppingBag aria-hidden="true" />
              <h3>Aún no tienes productos</h3>
              <p>Agrega tus accesorios favoritos para ver el resumen aquí.</p>
            </div>
          ) : (
            <ul className="cart-preview-list">
              {items.map((item) => (
                <li key={item.id}>
                  <ImageWithFallback src={item.image} alt={item.name} sizes="72px" />
                  <div>
                    <h3>{item.name}</h3>
                    <span>{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</span>
                  </div>
                  <strong>{formatCopCurrency(item.price * item.quantity)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="cart-preview-footer">
          <div>
            <span>{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>
            <strong>{formatCopCurrency(total)}</strong>
          </div>
          <Link to="/cart" onClick={onClose} className="cart-preview-open-cart">
            Ver carrito completo
          </Link>
        </footer>
      </aside>
    </div>
  );
}
