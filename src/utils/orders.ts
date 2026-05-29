import type { AuthUser } from '../services/api';
import type { CartItem } from './cart';
import { getCartItemsCount, getCartSubtotal } from './cart';

export const WUEPA_WHATSAPP_PHONE = '573136704796';
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
