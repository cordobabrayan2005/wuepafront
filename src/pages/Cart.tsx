import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import MobileNavMenu from '../components/MobileNavMenu';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { formatCopCurrency } from '../utils/currency';
import { CartItem, clearCart, getCartItemsCount, getCartSubtotal, loadCartItems, removeCartItem, updateCartItemQuantity } from '../utils/cart';

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>(() => loadCartItems());

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

  const itemCount = useMemo(() => getCartItemsCount(items), [items]);
  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const total = subtotal;
  const mobileMenuItems = [
    { label: 'Inicio', to: '/buy' },
    { label: 'Productos', to: '/products' },
    { label: 'Carrito', to: '/cart', isActive: true },
    { label: 'Nosotros', to: '/about' },
  ];

  return (
    <main className="cart-page">
      <header className="products-header cart-header">
        <div className="header-left">
          <h1>WUEPA</h1>
          <p>ACCESORIOS</p>
        </div>
        <MobileNavMenu title="Menu del carrito" items={mobileMenuItems} />
        <div className="cart-header-center">
          <p className="cart-kicker">Tu seleccion</p>
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
            Ajusta cantidades, revisa tu total estimado y luego continua por WhatsApp para cerrar la compra.
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
              <h3>Tu carrito esta vacio</h3>
              <p>Agrega productos desde el catalogo para verlos aqui y continuar con tu pedido.</p>
              <Link to="/products" className="primary-button">Explorar productos</Link>
            </div>
          ) : (
            <>
              <div className="cart-list-header">
                <h3>Articulos seleccionados</h3>
                <button type="button" className="cart-clear-button" onClick={() => {
                  clearCart();
                  setItems([]);
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
                        <p>{item.description}</p>
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
            <a
              className={`whatsapp-btn cart-checkout-button${items.length === 0 ? ' disabled' : ''}`}
              href={items.length === 0 ? undefined : `https://wa.me/?text=${encodeURIComponent(`Hola, quiero finalizar mi pedido en Wuepa:\n${items.map((item) => `- ${item.name} x${item.quantity}`).join('\n')}\n\nTotal estimado: ${formatCopCurrency(total)}`)}`}
              target="_blank"
              rel="noreferrer"
              aria-disabled={items.length === 0}
            >
              Finalizar por WhatsApp
            </a>
            <Link to="/products" className="cart-continue-link">Seguir comprando</Link>
          </div>
        </aside>
      </section>
    </main>
  );
}