import { ProductCatalogItem } from './productCatalog';

export const CART_STORAGE_KEY = 'wuepa-cart-items';

export interface CartItem extends ProductCatalogItem {
  quantity: number;
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<CartItem>;
  return typeof candidate.id === 'number'
    && typeof candidate.code === 'string'
    && typeof candidate.category === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.description === 'string'
    && typeof candidate.units === 'number'
    && typeof candidate.price === 'number'
    && typeof candidate.image === 'string'
    && typeof candidate.quantity === 'number';
}

export function loadCartItems() {
  if (typeof window === 'undefined') {
    return [] as CartItem[];
  }

  const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!storedValue) {
    return [] as CartItem[];
  }

  try {
    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return [] as CartItem[];
    }

    return parsedValue.filter(isCartItem).map((item) => ({
      ...item,
      quantity: Math.max(1, Math.min(item.quantity, item.units)),
    }));
  } catch {
    return [] as CartItem[];
  }
}

export function saveCartItems(items: CartItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('wuepa-cart-updated'));
}

export function addProductToCart(product: ProductCatalogItem) {
  const currentItems = loadCartItems();
  const existingItem = currentItems.find((item) => item.id === product.id);

  if (existingItem) {
    const nextItems = currentItems.map((item) => (
      item.id === product.id
        ? { ...item, quantity: Math.min(item.quantity + 1, item.units) }
        : item
    ));
    saveCartItems(nextItems);
    return nextItems;
  }

  const nextItems = [...currentItems, { ...product, quantity: 1 }];
  saveCartItems(nextItems);
  return nextItems;
}

export function updateCartItemQuantity(productId: number, quantity: number) {
  const nextItems = loadCartItems()
    .map((item) => (
      item.id === productId
        ? { ...item, quantity: Math.max(1, Math.min(quantity, item.units)) }
        : item
    ))
    .filter((item) => item.quantity > 0);

  saveCartItems(nextItems);
  return nextItems;
}

export function removeCartItem(productId: number) {
  const nextItems = loadCartItems().filter((item) => item.id !== productId);
  saveCartItems(nextItems);
  return nextItems;
}

export function clearCart() {
  saveCartItems([]);
}

export function getCartItemsCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}