import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, PackageCheck, ShoppingBag } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { api } from '../services/api';
import { formatCopCurrency } from '../utils/currency';
import { CustomerOrder, loadBackendCustomerOrders, loadCustomerOrders, markBackendCustomerOrderAsPaid } from '../utils/orders';
import { loadProductsCatalog, mapBackendProductToCatalogItem, ProductCatalogItem } from '../utils/productCatalog';

type OrdersToast = {
  text: string;
  type: 'success' | 'error' | 'info';
};

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>(() => loadCustomerOrders());
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<OrdersToast | null>(null);

  useEffect(() => {
    function syncOrders() {
      loadBackendCustomerOrders()
        .then(setOrders)
        .catch(() => setOrders(loadCustomerOrders()));
    }

    syncOrders();
    window.addEventListener('storage', syncOrders);
    window.addEventListener('wuepa-orders-updated', syncOrders as EventListener);
    return () => {
      window.removeEventListener('storage', syncOrders);
      window.removeEventListener('wuepa-orders-updated', syncOrders as EventListener);
    };
  }, []);

  useEffect(() => {
    api.getProducts()
      .then((backendProducts) => {
        const mappedProducts = backendProducts.map(mapBackendProductToCatalogItem);
        setProducts(mappedProducts.length > 0 ? mappedProducts : loadProductsCatalog());
      })
      .catch(() => {
        setProducts(loadProductsCatalog());
        setToast({ text: 'No se pudo cargar el inventario para actualizar cantidades.', type: 'error' });
      });
  }, []);

  const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'pending'), [orders]);
  const paidOrders = useMemo(() => orders.filter((order) => order.status === 'paid'), [orders]);

  async function handleAcceptPayment(order: CustomerOrder) {
    setActiveOrderId(order.id);
    setToast({ text: 'Actualizando pedido e inventario...', type: 'info' });

    try {
      await markBackendCustomerOrderAsPaid(order.id);
      const [backendOrders, backendProducts] = await Promise.all([
        loadBackendCustomerOrders(),
        api.getProducts(),
      ]);

      setOrders(backendOrders);
      setProducts(backendProducts.map(mapBackendProductToCatalogItem));
      setToast({ text: 'Pedido aceptado e inventario actualizado.', type: 'success' });
    } catch (error) {
      setToast({
        text: error instanceof Error ? error.message : 'No se pudo aceptar el pedido.',
        type: 'error',
      });
    } finally {
      setActiveOrderId(null);
    }
  }

  return (
    <main className="admin-page admin-orders-page">
      {toast && (
        <div role="status" aria-live="polite" className={`auth-toast ${toast.type}`}>
          {toast.text}
        </div>
      )}

      <div className="admin-shell">
        <header className="admin-hero">
          <div>
            <p className="admin-kicker">Panel interno</p>
            <h1>Pedidos</h1>
            <p className="admin-subtitle">
              Revisa pedidos enviados por WhatsApp y confirma el pago para descontar unidades del inventario.
            </p>
          </div>
          <div className="admin-hero-actions">
            <Link to="/admin" className="admin-secondary-link">Productos</Link>
            <Link to="/products" className="admin-secondary-link">Ver catalogo</Link>
          </div>
        </header>

        <section className="admin-summary-grid" aria-label="Resumen de pedidos">
          <article className="admin-summary-card">
            <span>Pendientes</span>
            <strong>{pendingOrders.length}</strong>
          </article>
          <article className="admin-summary-card">
            <span>Pagados</span>
            <strong>{paidOrders.length}</strong>
          </article>
          <article className="admin-summary-card">
            <span>Total pedidos</span>
            <strong>{orders.length}</strong>
          </article>
          <article className="admin-summary-card">
            <span>Inventario</span>
            <strong>{products.length}</strong>
          </article>
        </section>

        <section className="admin-orders-layout">
          <div className="admin-section-card">
            <div className="admin-section-heading">
              <p className="admin-kicker">Por pagar</p>
              <h2>Pedidos pendientes</h2>
            </div>
            <OrderList
              emptyText="No hay pedidos pendientes."
              orders={pendingOrders}
              activeOrderId={activeOrderId}
              onAcceptPayment={handleAcceptPayment}
            />
          </div>

          <div className="admin-section-card">
            <div className="admin-section-heading">
              <p className="admin-kicker">Historial</p>
              <h2>Pedidos pagados</h2>
            </div>
            <OrderList emptyText="Aun no hay pedidos pagados." orders={paidOrders} />
          </div>
        </section>
      </div>
    </main>
  );
}

type OrderListProps = {
  orders: CustomerOrder[];
  emptyText: string;
  activeOrderId?: string | null;
  onAcceptPayment?: (order: CustomerOrder) => void;
};

function OrderList({ orders, emptyText, activeOrderId, onAcceptPayment }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="admin-orders-empty">
        <ShoppingBag size={30} />
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-list">
      {orders.map((order) => (
        <article key={order.id} className="admin-order-card">
          <div className="admin-order-card-header">
            <div>
              <p className="admin-kicker">{order.status === 'paid' ? 'Pagado' : 'Pendiente'}</p>
              <h3>{order.customerName}</h3>
              <span>{formatOrderDate(order.createdAt)}</span>
            </div>
            <strong>{formatCopCurrency(order.total)}</strong>
          </div>

          <div className="admin-order-items">
            {order.items.map((item) => (
              <div key={`${order.id}-${item.id}`} className="admin-order-item">
                <div className="admin-order-item-media">
                  <ImageWithFallback src={item.image} alt={item.name} sizes="64px" />
                </div>
                <div>
                  <h4>{item.name}</h4>
                  <p>{item.code}</p>
                </div>
                <div className="admin-order-item-meta">
                  <strong>{formatCopCurrency(item.price)}</strong>
                  <span>x{item.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-order-footer">
            <span>{order.itemCount} producto{order.itemCount === 1 ? '' : 's'}</span>
            {order.status === 'paid' ? (
              <span className="admin-order-status paid"><CheckCircle2 size={16} /> Pagado</span>
            ) : (
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => onAcceptPayment?.(order)}
                disabled={activeOrderId === order.id}
              >
                <PackageCheck size={16} />
                {activeOrderId === order.id ? 'Actualizando...' : 'Aceptar pago'}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
