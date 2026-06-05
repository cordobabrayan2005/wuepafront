import { api, type AuthUser, type BackendOrder, type BackendOrderCustomerData } from '../services/api';
import type { CartItem } from './cart';
import { getCartItemsCount, getCartSubtotal } from './cart';

export const WUEPA_WHATSAPP_PHONE = '573177816764';
export const ORDERS_STORAGE_KEY = 'wuepa-customer-orders';

export type CustomerOrderStatus = 'pending' | 'paid';

export interface CustomerOrderItem {
  id: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CustomerOrder {
  id: string;
  createdAt: string;
  paidAt?: string;
  customerName: string;
  customerEmail: string;
  status: CustomerOrderStatus;
  items: CustomerOrderItem[];
  itemCount: number;
  total: number;
}

function isCustomerOrder(value: unknown): value is CustomerOrder {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const order = value as Partial<CustomerOrder>;

  return typeof order.id === 'string'
    && typeof order.createdAt === 'string'
    && typeof order.customerName === 'string'
    && typeof order.customerEmail === 'string'
    && (order.status === 'pending' || order.status === 'paid')
    && Array.isArray(order.items)
    && typeof order.itemCount === 'number'
    && typeof order.total === 'number';
}

function getCustomerName(user: AuthUser | null) {
  return [user?.name, user?.lastname]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ') || 'Usuario';
}

function getOrderDate(value: BackendOrder['fechaCreacion']) {
  if (typeof value === 'string') {
    return value;
  }

  const seconds = value.seconds ?? value._seconds;
  const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;

  if (typeof seconds === 'number') {
    return new Date((seconds * 1000) + Math.floor(nanoseconds / 1000000)).toISOString();
  }

  return new Date().toISOString();
}

function getCustomerData(user: AuthUser | null): BackendOrderCustomerData {
  return {
    nombre: getCustomerName(user),
    correo: user?.email ?? '',
    telefono: '',
    direccion: '',
  };
}

export function mapBackendOrderToCustomerOrder(order: BackendOrder): CustomerOrder {
  return {
    id: order.id,
    createdAt: getOrderDate(order.fechaCreacion),
    customerName: order.clienteData?.nombre || 'Usuario',
    customerEmail: order.clienteData?.correo || '',
    status: order.estado === 'Pagado' ? 'paid' : 'pending',
    items: (order.productos || []).map((item) => ({
      id: item.productId,
      code: item.codigo,
      name: item.nombre,
      price: item.precioUnitario,
      quantity: item.cantidad,
      image: item.imagenUrl,
    })),
    itemCount: (order.productos || []).reduce((total, item) => total + item.cantidad, 0),
    total: order.total,
  };
}

export function loadCustomerOrders() {
  if (typeof window === 'undefined') {
    return [] as CustomerOrder[];
  }

  const storedValue = window.localStorage.getItem(ORDERS_STORAGE_KEY);

  if (!storedValue) {
    return [] as CustomerOrder[];
  }

  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isCustomerOrder) : [];
  } catch {
    return [] as CustomerOrder[];
  }
}

export function saveCustomerOrders(orders: CustomerOrder[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent('wuepa-orders-updated'));
}

export function createCustomerOrder(items: CartItem[], user: AuthUser | null): CustomerOrder {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    customerName: getCustomerName(user),
    customerEmail: user?.email ?? '',
    status: 'pending',
    items: items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
    itemCount: getCartItemsCount(items),
    total: getCartSubtotal(items),
  };
}

export async function createBackendCustomerOrder(items: CartItem[], user: AuthUser | null) {
  const response = await api.createOrder({
    productos: items.map((item) => ({
      id: item.id,
      cantidad: item.quantity,
    })),
    clienteData: getCustomerData(user),
  });

  return mapBackendOrderToCustomerOrder(response.order);
}

export function addCustomerOrder(order: CustomerOrder) {
  const nextOrders = [order, ...loadCustomerOrders()];
  saveCustomerOrders(nextOrders);
  return nextOrders;
}

export function markCustomerOrderAsPaid(orderId: string) {
  const nextOrders = loadCustomerOrders().map((order) => (
    order.id === orderId
      ? { ...order, status: 'paid' as const, paidAt: new Date().toISOString() }
      : order
  ));

  saveCustomerOrders(nextOrders);
  return nextOrders;
}

export async function loadBackendCustomerOrders() {
  const response = await api.getAdminOrders();
  const backendOrders = response.orders.map(mapBackendOrderToCustomerOrder);

  saveCustomerOrders(backendOrders);
  return backendOrders;
}

export async function markBackendCustomerOrderAsPaid(orderId: string) {
  const response = await api.updateOrderStatus(orderId, 'Pagado');
  return mapBackendOrderToCustomerOrder(response.order);
}
