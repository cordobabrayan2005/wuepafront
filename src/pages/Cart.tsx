import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Minus, Plus, ShoppingBag, ShoppingCart, Sparkles, Trash2, X } from 'lucide-react';
import AuthenticatedTopBar from '../components/AuthenticatedTopBar';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileNavMenu from '../components/MobileNavMenu';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { formatCopCurrency } from '../utils/currency';
import { CartItem, clearCart, getCachedCartItems, getCartItemsCount, getCartSubtotal, loadCartItems, removeCartItem, updateCartItemQuantity } from '../utils/cart';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { WUEPA_WHATSAPP_PHONE, createBackendCustomerOrder } from '../utils/orders';

const INTERNATIONAL_PHONE_PATTERN = /^\+?[0-9\s()-]+$/;
const PURCHASE_TERMS_ACCEPTANCE_STORAGE_KEY = 'wuepa-purchase-terms-accepted';

const PURCHASE_TERMS = [
  'Broches: Si el broche del producto presenta algún inconveniente poco tiempo después de la compra por un defecto de fabricación, podrá solicitarse la revisión para evaluar el cambio.',
  'Separados: Los productos separados se conservarán en la tienda por un máximo de un (1) mes. Transcurrido ese tiempo, el apartado se cancelará sin devolución del dinero abonado.',
  'Cambios y devoluciones: No se realizan devoluciones de dinero. En caso de ser aprobado, el producto únicamente podrá cambiarse por otro artículo de igual o mayor valor, pagando la diferencia si aplica.',
  'Envíos: El costo del envío será asumido por el cliente, excepto cuando la tienda tenga una promoción o actividad especial que ofrezca este beneficio.',
  'Productos en promoción: Los artículos adquiridos en promoción, descuento o liquidación no tienen cambio.',
  'Plazo para cambios: Los cambios deberán solicitarse dentro de los tres (3) días calendario siguientes a la fecha de compra. Después de este plazo no se aceptarán cambios.',
];

function getPurchaseTermsAcceptanceKey(userId?: string) {
  return `${PURCHASE_TERMS_ACCEPTANCE_STORAGE_KEY}:${userId || 'guest'}`;
}

function hasAcceptedPurchaseTerms(userId?: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(getPurchaseTermsAcceptanceKey(userId)) === 'true';
}

function savePurchaseTermsAcceptance(userId?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getPurchaseTermsAcceptanceKey(userId), 'true');
}
const ADDRESS_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s#.,°/-]+$/;

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>(() => getCachedCartItems());
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [isEditingCheckoutData, setIsEditingCheckoutData] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [hasAcceptedTermsBefore, setHasAcceptedTermsBefore] = useState(() => hasAcceptedPurchaseTerms());
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    telefono: '',
    direccion: '',
  });
  const [checkoutFieldErrors, setCheckoutFieldErrors] = useState({
    telefono: '',
    direccion: '',
  });
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = user?.rol === 'admin';
  const hasSavedCheckoutData = Boolean(user?.telefono?.trim() && user?.direccion?.trim());
  const shouldShowPurchaseTerms = !hasAcceptedTermsBefore;

  useEffect(() => {
    function syncCart() {
      setItems(getCachedCartItems());
    }

    loadCartItems().then(setItems).catch((error) => {
      setOrderError(error instanceof Error ? error.message : 'No se pudo cargar el carrito.');
    });
    window.addEventListener('wuepa-cart-updated', syncCart as EventListener);
    return () => {
      window.removeEventListener('wuepa-cart-updated', syncCart as EventListener);
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setIsConfirmingOrder(false);
    }
  }, [items.length]);

  useEffect(() => {
    setHasAcceptedTermsBefore(hasAcceptedPurchaseTerms(user?.id));
    setHasAcceptedTerms(false);
  }, [user?.id]);

  useEffect(() => {
    if (!isConfirmingOrder) {
      return;
    }

    const savedCheckoutData = {
      telefono: user?.telefono?.trim() ?? '',
      direccion: user?.direccion?.trim() ?? '',
    };
    setCheckoutData(savedCheckoutData);
    setIsEditingCheckoutData(!savedCheckoutData.telefono || !savedCheckoutData.direccion);
    setHasAcceptedTerms(false);
    setCheckoutFieldErrors({ telefono: '', direccion: '' });
    setOrderError('');

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
  }, [isConfirmingOrder, user?.direccion, user?.telefono]);

  const itemCount = useMemo(() => getCartItemsCount(items), [items]);
  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const total = subtotal;
  const customerName = useMemo(() => (
    [user?.name, user?.lastname].map((value) => value?.trim()).filter(Boolean).join(' ') || 'Usuario'
  ), [user?.name, user?.lastname]);
  const orderSummaryMessage = useMemo(() => (
    `Hola Wuepa Accesorios, soy ${customerName} y quiero hacer este pedido:\n\nTelefono: ${checkoutData.telefono}\nDireccion: ${checkoutData.direccion}\n\n${items.map((item) => `${item.name}\nCodigo: ${item.code}\nCantidad: ${item.quantity}\nPrecio: ${formatCopCurrency(item.price)}`).join('\n\n')}\n\nTotal sin envío: ${formatCopCurrency(total)}`
  ), [checkoutData.direccion, checkoutData.telefono, customerName, items, total]);
  const whatsappOrderUrl = items.length === 0 ? '' : `https://wa.me/${WUEPA_WHATSAPP_PHONE}?text=${encodeURIComponent(orderSummaryMessage)}`;
  const mobileMenuItems = [
    { label: 'Inicio', to: '/buy' },
    { label: 'Productos', to: '/products' },
    { label: 'Carrito', to: '/cart', isActive: true },
    { label: 'Nosotros', to: '/about' },
    { label: 'Mi perfil', to: '/profile' },
    ...(isAdmin ? [{ label: 'Admin', to: '/admin' }] : []),
    { label: 'Cerrar sesión', onClick: handleLogout, tone: 'danger' as const },
  ];

  function handleLogout() {
    logout();
    navigate('/login', { state: { flash: { type: 'info', text: 'Se cerró sesión correctamente.' } } });
  }

  function getCheckoutErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const normalizedMessage = message.toLowerCase();

    if (!checkoutData.telefono.trim() || !checkoutData.direccion.trim()) {
      return 'Escribe tu telefono y direccion para poder continuar con el pedido.';
    }

    if (normalizedMessage.includes('telefono') || normalizedMessage.includes('direccion') || normalizedMessage.includes('datos del cliente')) {
      return 'Revisa tu telefono y direccion. Necesitamos esos datos completos para coordinar la entrega.';
    }

    if (normalizedMessage.includes('sesion')) {
      return 'Tu sesión venció. Inicia sesión de nuevo y vuelve a finalizar el pedido.';
    }

    if (normalizedMessage.includes('suficientes unidades') || normalizedMessage.includes('stock')) {
      return 'Uno de los productos ya no tiene unidades suficientes. Revisa las cantidades del carrito.';
    }

    if (normalizedMessage.includes('producto no encontrado')) {
      return 'Uno de los productos ya no esta disponible. Quitalo del carrito e intenta de nuevo.';
    }

    if (normalizedMessage.includes('servicio necesario') || normalizedMessage.includes('guardar el pedido')) {
      return 'No pudimos guardar tu pedido en este momento. Intenta de nuevo en unos minutos.';
    }

    if (normalizedMessage.includes('conectar')) {
      return 'No pudimos conectar con Wuepa. Revisa tu internet e intenta nuevamente.';
    }

    return message || 'No pudimos guardar tu pedido. Intenta nuevamente en unos minutos.';
  }

  function validateCheckoutData() {
    const phone = checkoutData.telefono.trim();
    const address = checkoutData.direccion.trim();
    const nextErrors = {
      telefono: '',
      direccion: '',
    };

    if (!phone) {
      nextErrors.telefono = 'Ingresa tu numero de celular.';
    } else if (!INTERNATIONAL_PHONE_PATTERN.test(phone)) {
      nextErrors.telefono = 'Usa solo numeros, espacios, parentesis, guiones y un + inicial.';
    } else if (phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) {
      nextErrors.telefono = 'El telefono debe contener entre 7 y 15 numeros.';
    }

    if (!address) {
      nextErrors.direccion = 'Ingresa la direccion de entrega.';
    } else if (address.length < 8) {
      nextErrors.direccion = 'La direccion debe tener minimo 8 caracteres.';
    } else if (address.length > 120) {
      nextErrors.direccion = 'La direccion no puede superar los 120 caracteres.';
    } else if (!ADDRESS_PATTERN.test(address) || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(address)) {
      nextErrors.direccion = 'Escribe una direccion valida usando letras, numeros y signos como #, - o /.';
    }

    setCheckoutFieldErrors(nextErrors);
    return !nextErrors.telefono && !nextErrors.direccion;
  }

  function handlePhoneChange(value: string) {
    const sanitizedPhone = value
      .replace(/[^\d+\s()-]/g, '')
      .replace(/(?!^)\+/g, '')
      .slice(0, 25);
    const phoneDigits = sanitizedPhone.replace(/\D/g, '');
    setCheckoutData((current) => ({ ...current, telefono: sanitizedPhone }));
    setCheckoutFieldErrors((current) => ({
      ...current,
      telefono: phoneDigits && (phoneDigits.length < 7 || phoneDigits.length > 15)
        ? 'El telefono debe contener entre 7 y 15 numeros.'
        : '',
    }));
  }

  function handleAddressChange(value: string) {
    const address = value.slice(0, 120);
    setCheckoutData((current) => ({ ...current, direccion: address }));
    setCheckoutFieldErrors((current) => ({
      ...current,
      direccion: address && (
        !ADDRESS_PATTERN.test(address)
        || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(address)
        || address.trim().length < 8
      )
        ? 'Escribe una direccion valida de minimo 8 caracteres.'
        : '',
    }));
  }

  function handleContinueOrder(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (items.length === 0 || (isEditingCheckoutData && !validateCheckoutData())) {
      return;
    }

    if (shouldShowPurchaseTerms && !hasAcceptedTerms) {
      setOrderError('Acepta los términos y condiciones de compra para continuar con tu primer pedido.');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError('');

    const normalizedCheckoutData = {
      telefono: checkoutData.telefono.trim(),
      direccion: checkoutData.direccion.trim(),
    };
    const saveCheckoutData = isEditingCheckoutData
      ? api.updateProfile({
        name: user?.name ?? '',
        lastname: user?.lastname ?? '',
        birthdate: user?.birthdate,
        ...normalizedCheckoutData,
      })
      : Promise.resolve(user);

    saveCheckoutData
      .then((updatedUser) => {
        if (updatedUser) {
          setUser(updatedUser);
        }
        return createBackendCustomerOrder(items, updatedUser ?? user, normalizedCheckoutData);
      })
      .then(() => {
        if (shouldShowPurchaseTerms) {
          savePurchaseTermsAcceptance(user?.id);
          setHasAcceptedTermsBefore(true);
        }
      })
      .then(() => clearCart())
      .then((nextItems) => {
        setItems(nextItems);
        setIsConfirmingOrder(false);
        window.location.assign(whatsappOrderUrl);
      })
      .catch((error) => {
        setOrderError(getCheckoutErrorMessage(error));
      })
      .finally(() => {
        setIsSubmittingOrder(false);
      });
  }

  return (
    <main className="cart-page">
      <AuthenticatedTopBar active="cart" cartCount={itemCount} />
      <header className="products-header cart-header">
        <div className="header-left">
          <h1>Wuepa</h1>
          <p>JEWELRY</p>
        </div>
        <MobileNavMenu title="Menú del carrito" items={mobileMenuItems} />
        <nav className="header-right">
          <Link to="/buy">Inicio</Link>
          <span aria-hidden="true">|</span>
          <Link to="/products">Productos</Link>
          <span aria-hidden="true">|</span>
          <Link to="/cart" className="active">Carrito</Link>
          <span aria-hidden="true">|</span>
          <Link to="/about">Nosotros</Link>
          <span aria-hidden="true">|</span>
          <Link to="/profile">Mi perfil</Link>
          {isAdmin ? (
            <>
              <span aria-hidden="true">|</span>
              <Link to="/admin">Admin</Link>
            </>
          ) : null}
          <button type="button" className="cart-nav-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </nav>
      </header>

      <section className="cart-hero">
        <div>
          <p className="cart-kicker">Compra segura</p>
          <h2>Revisa tus joyas antes de finalizar el pedido</h2>
          <p>
            Ajusta cantidades, revisa tu total sin envío y luego continúa por WhatsApp para cerrar la compra.
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
              <div className="cart-empty-icon">
                <ShoppingBag size={34} />
              </div>
              <h3>Tu carrito está vacío</h3>
              <p>Agrega productos desde el catálogo para verlos aquí y continuar con tu pedido.</p>
              <Link to="/products" className="primary-button">
                <Sparkles size={17} />
                Explorar productos
              </Link>
            </div>
          ) : (
            <>
              <div className="cart-list-header">
                <h3>Artículos seleccionados</h3>
                <button type="button" className="cart-clear-button" onClick={() => {
                  clearCart()
                    .then(setItems)
                    .then(() => setIsConfirmingOrder(false))
                    .catch((error) => setOrderError(error instanceof Error ? error.message : 'No se pudo vaciar el carrito.'));
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
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1).then(setItems).catch((error) => setOrderError(error instanceof Error ? error.message : 'No se pudo actualizar el carrito.'))}
                            disabled={item.quantity === 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Aumentar cantidad de ${item.name}`}
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1).then(setItems).catch((error) => setOrderError(error instanceof Error ? error.message : 'No se pudo actualizar el carrito.'))}
                            disabled={item.quantity >= item.units}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button type="button" className="cart-remove-button" onClick={() => removeCartItem(item.id).then(setItems).catch((error) => setOrderError(error instanceof Error ? error.message : 'No se pudo eliminar el producto.'))}>
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
            <h3>Total sin envío</h3>
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
              <MessageCircle size={18} />
              Finalizar por WhatsApp
            </button>
            <Link to="/products" className="cart-continue-link">
              <ShoppingCart size={18} />
              Seguir comprando
            </Link>
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
            <form className="cart-customer-form" onSubmit={handleContinueOrder}>
              {isEditingCheckoutData ? (
                <div className="cart-customer-fields">
                <label>
                  <span>Telefono</span>
                  <input
                    type="tel"
                    value={checkoutData.telefono}
                    onChange={(event) => handlePhoneChange(event.target.value)}
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="\+?[0-9\s()\-]{7,25}"
                    maxLength={25}
                    placeholder="Ej. +57 317 781 6764"
                    aria-invalid={Boolean(checkoutFieldErrors.telefono)}
                    required
                    disabled={isSubmittingOrder}
                  />
                  <small>Incluye el prefijo del pais. Debe contener entre 7 y 15 numeros.</small>
                  {checkoutFieldErrors.telefono ? (
                    <small className="cart-field-error" role="alert">{checkoutFieldErrors.telefono}</small>
                  ) : null}
                </label>
                <label>
                  <span>Direccion</span>
                  <input
                    type="text"
                    value={checkoutData.direccion}
                    onChange={(event) => handleAddressChange(event.target.value)}
                    autoComplete="street-address"
                    minLength={8}
                    maxLength={120}
                    placeholder="Ej. Calle 10 # 20-30"
                    aria-invalid={Boolean(checkoutFieldErrors.direccion)}
                    required
                    disabled={isSubmittingOrder}
                  />
                  <small>Entre 8 y 120 caracteres. Puedes usar #, -, /, punto o coma.</small>
                  {checkoutFieldErrors.direccion ? (
                    <small className="cart-field-error" role="alert">{checkoutFieldErrors.direccion}</small>
                  ) : null}
                </label>
                </div>
              ) : (
                <div className="cart-customer-data-summary">
                  <div>
                    <span>Telefono</span>
                    <strong>{checkoutData.telefono}</strong>
                  </div>
                  <div>
                    <span>Direccion de entrega</span>
                    <strong>{checkoutData.direccion}</strong>
                  </div>
                  <p>¿Deseas editar esta información antes de continuar?</p>
                  <button
                    type="button"
                    className="cart-edit-customer-data-button"
                    onClick={() => setIsEditingCheckoutData(true)}
                    disabled={isSubmittingOrder}
                  >
                    Editar información
                  </button>
                </div>
              )}
              <div className="cart-order-confirmation-total">
                <span>Total sin envío</span>
                <strong>{formatCopCurrency(total)}</strong>
              </div>
              {shouldShowPurchaseTerms ? (
                <section className="cart-purchase-terms" aria-labelledby="cart-purchase-terms-title">
                  <p className="cart-kicker">Primera compra</p>
                  <h4 id="cart-purchase-terms-title">Términos y Condiciones de Compra</h4>
                  <ol>
                    {PURCHASE_TERMS.map((term) => (
                      <li key={term}>{term}</li>
                    ))}
                  </ol>
                  <label className="cart-purchase-terms-acceptance">
                    <input
                      type="checkbox"
                      checked={hasAcceptedTerms}
                      onChange={(event) => {
                        setHasAcceptedTerms(event.target.checked);
                        if (event.target.checked) {
                          setOrderError('');
                        }
                      }}
                      disabled={isSubmittingOrder}
                      required
                    />
                    <span>He leído y acepto los términos y condiciones de compra.</span>
                  </label>
                </section>
              ) : null}
              {orderError ? (
                <p className="cart-order-error" role="alert">{orderError}</p>
              ) : null}
              <div className="cart-order-confirmation-actions">
                <button
                  type="submit"
                  className="whatsapp-btn cart-checkout-button"
                  disabled={isSubmittingOrder || (shouldShowPurchaseTerms && !hasAcceptedTerms)}
                >
                  {isSubmittingOrder
                    ? 'Guardando pedido...'
                    : hasSavedCheckoutData && !isEditingCheckoutData
                      ? 'Usar estos datos y continuar'
                      : 'Guardar datos y continuar'}
                </button>
                <button
                  type="button"
                  className="cart-cancel-order-button"
                  onClick={() => setIsConfirmingOrder(false)}
                  disabled={isSubmittingOrder}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {/* Barra inferior autenticada visible solo en movil, con carrito como seccion activa. */}
      <MobileBottomNav active="cart" cartCount={itemCount} variant="auth" />
    </main>
  );
}
