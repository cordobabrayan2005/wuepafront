import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileNavMenu from '../components/MobileNavMenu';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { formatCopCurrency } from '../utils/currency';
import { CartItem, clearCart, getCartItemsCount, getCartSubtotal, loadCartItems, removeCartItem, updateCartItemQuantity } from '../utils/cart';
import { useAuthStore } from '../stores/authStore';
import { WUEPA_WHATSAPP_PHONE, addCustomerOrder, createCustomerOrder } from '../utils/orders';

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>(() => loadCartItems());
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    function syncCart() {
      setItems(loadCartItems());
    }

    window.addEventListener('storage', syncCart);
    window.addEventListener('wuepa-cart-updated', syncCart as EventListener);
    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('wuepa-cart-updated', syncCart as EventListener);
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setIsConfirmingOrder(false);
    }
  }, [items.length]);

  useEffect(() => {
    if (!isConfirmingOrder) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsConfirmingOrder(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [isConfirmingOrder]);

  const itemCount = useMemo(() => getCartItemsCount(items), [items]);
  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const total = subtotal;
  const customerName = useMemo(() => (
    [user?.name, user?.lastname].map((value) => value?.trim()).filter(Boolean).join(' ') || 'Usuario'
  ), [user?.name, user?.lastname]);
  const orderSummaryMessage = useMemo(() => (
    `Hola Wuepa Accesorios, soy ${customerName} y quiero hacer este pedido:\n\n${items.map((item) => `${item.name}\nCodigo: ${item.code}\nCantidad: ${item.quantity}\nPrecio: ${formatCopCurrency(item.price)}`).join('\n\n')}\n\nTotal estimado: ${formatCopCurrency(total)}`
  ), [customerName, items, total]);
  const whatsappOrderUrl = items.length === 0 ? '' : `https://wa.me/${WUEPA_WHATSAPP_PHONE}?text=${encodeURIComponent(orderSummaryMessage)}`;
  const mobileMenuItems = [
    { label: 'Inicio', to: '/buy' },
    { label: 'Productos', to: '/products' },
    { label: 'Carrito', to: '/cart', isActive: true },
    { label: 'Nosotros', to: '/about' },
  ];

  function handleContinueOrder() {
    if (items.length === 0) {
      return;
    }

    addCustomerOrder(createCustomerOrder(items, user));
    clearCart();
    setItems([]);
    setIsConfirmingOrder(false);
  }

  return (
    <main className="cart-page">
      <header className="products-header cart-header">
        <div className="header-left">
          <h1>WUEPA</h1>
          <p>ACCESORIOS</p>
        </div>
        <MobileNavMenu title="Menú del carrito" items={mobileMenuItems} />
        <div className="cart-header-center">
          <p className="cart-kicker">Tu selección</p>
          <strong>{itemCount} producto{itemCount === 1 ? '' : 's'} en tu carrito</strong>
        </div>
        <nav className="header-right">
          <Link to="/buy">Inicio</Link>
          <Link to="/products">Productos</Link>
          <Link to="/cart" className="active">Carrito</Link>
          <Link to="/about">Nosotros</Link>
        </nav>
      </header>

      <section className="cart-hero">
        <div>
          <p className="cart-kicker">Compra segura</p>
          <h2>Revisa tus joyas antes de finalizar el pedido</h2>
          <p>
            Ajusta cantidades, revisa tu total estimado y luego continúa por WhatsApp para cerrar la compra.
          </p>
        </div>
        <div className="cart-hero-badge">
          <ShoppingBag size={28} />
          <span>{formatCopCurrency(total)}</span>
        </div>
      </section>

      <section className="cart-layout">
        <div className="cart-items-panel">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingBag size={34} />
              <h3>Tu carrito está vacío</h3>
              <p>Agrega productos desde el catálogo para verlos aquí y continuar con tu pedido.</p>
              <Link to="/products" className="primary-button">Explorar productos</Link>
            </div>
          ) : (
            <>
              <div className="cart-list-header">
                <h3>Artículos seleccionados</h3>
                <button type="button" className="cart-clear-button" onClick={() => {
                  clearCart();
                  setItems([]);
                  setIsConfirmingOrder(false);
                }}>
                  Vaciar carrito
                </button>
              </div>

              <div className="cart-item-list">
                {items.map((item) => (
                  <article key={item.id} className="cart-item-card">
                    <div className="cart-item-media">
                      <ImageWithFallback src={item.image} alt={item.name} sizes="(max-width: 720px) 100vw, 180px" />
                    </div>

                    <div className="cart-item-content">
                      <div className="cart-item-copy">
                        <p className="cart-item-code">{item.code}</p>
                        <h4>{item.name}</h4>
                        <span className="cart-item-stock">{item.units} disponibles</span>
                      </div>

                      <div className="cart-item-actions">
                        <p className="cart-item-price">{formatCopCurrency(item.price)}</p>
                        <div className="cart-quantity-control" aria-label={`Cantidad de ${item.name}`}>
                          <button
                            type="button"
                            aria-label={`Disminuir cantidad de ${item.name}`}
                            onClick={() => setItems(updateCartItemQuantity(item.id, item.quantity - 1))}
                            disabled={item.quantity === 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Aumentar cantidad de ${item.name}`}
                            onClick={() => setItems(updateCartItemQuantity(item.id, item.quantity + 1))}
                            disabled={item.quantity >= item.units}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button type="button" className="cart-remove-button" onClick={() => setItems(removeCartItem(item.id))}>
                          <Trash2 size={16} /> Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="cart-summary-panel">
          <div className="cart-summary-card">
            <p className="cart-kicker">Resumen</p>
            <h3>Total estimado</h3>
            <div className="cart-summary-row">
              <span>Productos</span>
              <strong>{itemCount}</strong>
            </div>
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{formatCopCurrency(subtotal)}</strong>
            </div>
            <div className="cart-summary-row total">
              <span>Total</span>
              <strong>{formatCopCurrency(total)}</strong>
            </div>
            <button
              type="button"
              className={`whatsapp-btn cart-checkout-button${items.length === 0 ? ' disabled' : ''}`}
              onClick={() => setIsConfirmingOrder(true)}
              disabled={items.length === 0}
              aria-disabled={items.length === 0}
            >
              Finalizar por WhatsApp
            </button>
            <Link to="/products" className="cart-continue-link">Seguir comprando</Link>
          </div>
        </aside>
      </section>
      {isConfirmingOrder && items.length > 0 ? (
        <div className="cart-order-modal-backdrop" role="presentation" onClick={() => setIsConfirmingOrder(false)}>
          <section
            className="cart-order-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-order-confirmation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cart-order-confirmation-header">
              <div>
                <p className="cart-kicker">Resumen del pedido</p>
                <h3 id="cart-order-confirmation-title">Confirma tu pedido</h3>
              </div>
              <button
                type="button"
                className="cart-order-close-button"
                aria-label="Cerrar resumen del pedido"
                onClick={() => setIsConfirmingOrder(false)}
              >
                <X size={18} />
              </button>
            </div>
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <div className="cart-order-item-media">
                    <ImageWithFallback src={item.image} alt={item.name} sizes="72px" />
                  </div>
                  <div className="cart-order-item-copy">
                    <span>{item.name}</span>
                  </div>
                  <div className="cart-order-item-meta">
                    <strong>{formatCopCurrency(item.price)}</strong>
                    <span>x{item.quantity}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-order-confirmation-total">
              <span>Total estimado</span>
              <strong>{formatCopCurrency(total)}</strong>
            </div>
            <div className="cart-order-confirmation-actions">
              <a
                className="whatsapp-btn cart-checkout-button"
                href={whatsappOrderUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleContinueOrder}
              >
                Seguir con el pedido
              </a>
              <button
                type="button"
                className="cart-cancel-order-button"
                onClick={() => setIsConfirmingOrder(false)}
              >
                Cancelar
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {/* Barra inferior autenticada visible solo en movil, con carrito como seccion activa. */}
      <MobileBottomNav active="cart" cartCount={itemCount} variant="auth" />
    </main>
  );
}
