import { api, BackendCartItem } from '../services/api';
import { auth } from '../config/firebase';
import { ProductCatalogItem, normalizeProductCode } from './productCatalog';

export interface CartItem extends ProductCatalogItem {
  quantity: number;
}

let cartItems: CartItem[] = [];
let cartLoaded = false;
let cartLoadPromise: Promise<CartItem[]> | null = null;
let cartCacheVersion = 0;
let cartScope: 'guest' | 'account' | null = null;

const GUEST_CART_STORAGE_KEY = 'wuepa-guest-cart-items';

function removeLegacyCartStorage() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('wuepa-cart-items');
  }
}

function getCartScope() {
  return auth.currentUser ? 'account' as const : 'guest' as const;
}

function getStoredGuestCartItems(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedItems = JSON.parse(window.localStorage.getItem(GUEST_CART_STORAGE_KEY) ?? '[]') as unknown;

    if (!Array.isArray(storedItems)) {
      return [];
    }

    return storedItems.filter((item): item is CartItem => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const candidate = item as Partial<CartItem>;
      return typeof candidate.id === 'string'
        && typeof candidate.name === 'string'
        && typeof candidate.price === 'number'
        && typeof candidate.units === 'number'
        && typeof candidate.quantity === 'number';
    }).map((item) => ({
      ...item,
      quantity: Math.max(1, Math.min(Math.floor(item.quantity), item.units)),
      code: normalizeProductCode(item),
    }));
  } catch {
    return [];
  }
}

function saveGuestCartItems(items: CartItem[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
  }
}

function notifyCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wuepa-cart-updated'));
  }
}

function mapBackendCartItem(item: BackendCartItem): CartItem {
  const mappedItem: CartItem = {
    id: item.productId,
    code: item.codigo,
    category: item.categoria,
    name: item.nombre,
    description: item.descripcion,
    units: item.unidadesDisponibles,
    price: item.precio,
    image: item.imagenUrl,
    quantity: item.cantidad,
  };

  return {
    ...mappedItem,
    code: normalizeProductCode(mappedItem),
  };
}

function updateCartCache(items: CartItem[], scope = getCartScope()) {
  cartItems = items;
  cartLoaded = true;
  cartScope = scope;

  if (scope === 'guest') {
    saveGuestCartItems(items);
  }

  notifyCartUpdated();
  return cartItems;
}

async function saveCurrentCart(items: CartItem[]) {
  const scope = getCartScope();

  if (scope === 'guest') {
    return updateCartCache(items, scope);
  }

  const response = await api.saveCart(items.map((item) => ({
    productId: item.id,
    cantidad: item.quantity,
  })));

  return updateCartCache(response.productos.map(mapBackendCartItem), scope);
}

export function getCachedCartItems() {
  return cartItems;
}

export async function loadCartItems() {
  removeLegacyCartStorage();
  const scope = getCartScope();

  if (cartScope !== scope) {
    cartItems = [];
    cartLoaded = false;
    cartLoadPromise = null;
    cartScope = scope;
  }

  if (cartLoaded) {
    return cartItems;
  }

  if (!cartLoadPromise) {
    const requestedVersion = cartCacheVersion;
    cartLoadPromise = (scope === 'guest'
      ? Promise.resolve(getStoredGuestCartItems())
      : api.getCart().then((response) => response.productos.map(mapBackendCartItem)))
      .then((items) => (
        requestedVersion === cartCacheVersion
          ? updateCartCache(items, scope)
          : cartItems
      ))
      .finally(() => {
        cartLoadPromise = null;
      });
  }

  return cartLoadPromise;
}

export async function addProductToCart(product: ProductCatalogItem) {
  await loadCartItems();

  if (product.units <= 0) {
    throw new Error(`${product.name} ya no tiene unidades disponibles.`);
  }

  const existingItem = cartItems.find((item) => item.id === product.id);

  if (existingItem && existingItem.quantity >= Math.min(existingItem.units, product.units)) {
    throw new Error(`Ya agregaste todas las unidades disponibles de ${product.name}.`);
  }

  const previousQuantity = existingItem?.quantity ?? 0;
  const nextItems = existingItem
    ? cartItems.map((item) => (
      item.id === product.id
        ? { ...item, units: product.units, quantity: Math.min(item.quantity + 1, product.units) }
        : item
    ))
    : [...cartItems, { ...product, quantity: 1 }];

  const savedItems = await saveCurrentCart(nextItems);
  const savedItem = savedItems.find((item) => item.id === product.id);

  if (!savedItem || savedItem.quantity <= previousQuantity) {
    throw new Error(`${product.name} ya no tiene unidades suficientes. Actualiza el catalogo e intenta nuevamente.`);
  }

  return savedItems;
}

export async function updateCartItemQuantity(productId: string, quantity: number) {
  await loadCartItems();

  const nextItems = cartItems.map((item) => (
    item.id === productId
      ? { ...item, quantity: Math.max(1, Math.min(quantity, item.units)) }
      : item
  ));

  return saveCurrentCart(nextItems);
}

export async function removeCartItem(productId: string) {
  await loadCartItems();
  return saveCurrentCart(cartItems.filter((item) => item.id !== productId));
}

export async function clearCart() {
  await loadCartItems();

  if (getCartScope() === 'guest') {
    return updateCartCache([], 'guest');
  }

  const response = await api.clearCart();
  return updateCartCache(response.productos.map(mapBackendCartItem), 'account');
}

export function resetCartCache() {
  cartCacheVersion += 1;
  cartItems = [];
  cartLoaded = false;
  cartLoadPromise = null;
  cartScope = null;
  removeLegacyCartStorage();
  notifyCartUpdated();
}

/**
 * Conserva en la cuenta los productos que una persona añadió antes de iniciar
 * sesión. Si no hay sesión o carrito de invitado, no realiza cambios.
 */
export async function mergeGuestCartIntoAccountCart() {
  const guestItems = getStoredGuestCartItems();

  if (!auth.currentUser || guestItems.length === 0) {
    resetCartCache();
    return [];
  }

  const response = await api.getCart();
  const accountItems = response.productos.map(mapBackendCartItem);
  const mergedItems = new Map(accountItems.map((item) => [item.id, item]));

  guestItems.forEach((guestItem) => {
    const accountItem = mergedItems.get(guestItem.id);

    if (!accountItem) {
      mergedItems.set(guestItem.id, guestItem);
      return;
    }

    mergedItems.set(guestItem.id, {
      ...accountItem,
      quantity: Math.min(accountItem.quantity + guestItem.quantity, accountItem.units),
    });
  });

  const savedItems = await api.saveCart(Array.from(mergedItems.values()).map((item) => ({
    productId: item.id,
    cantidad: item.quantity,
  })));

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  }

  return updateCartCache(savedItems.productos.map(mapBackendCartItem), 'account');
}

export function getCartItemsCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}
