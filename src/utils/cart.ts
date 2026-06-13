import { api, BackendCartItem } from '../services/api';
import { ProductCatalogItem, normalizeProductCode } from './productCatalog';

export interface CartItem extends ProductCatalogItem {
  quantity: number;
}

let cartItems: CartItem[] = [];
let cartLoaded = false;
let cartLoadPromise: Promise<CartItem[]> | null = null;
let cartCacheVersion = 0;

function removeLegacyCartStorage() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('wuepa-cart-items');
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

function updateCartCache(items: BackendCartItem[]) {
  cartItems = items.map(mapBackendCartItem);
  cartLoaded = true;
  notifyCartUpdated();
  return cartItems;
}

async function saveCurrentCart(items: CartItem[]) {
  const response = await api.saveCart(items.map((item) => ({
    productId: item.id,
    cantidad: item.quantity,
  })));

  return updateCartCache(response.productos);
}

export function getCachedCartItems() {
  return cartItems;
}

export async function loadCartItems() {
  removeLegacyCartStorage();

  if (cartLoaded) {
    return cartItems;
  }

  if (!cartLoadPromise) {
    const requestedVersion = cartCacheVersion;
    cartLoadPromise = api.getCart()
      .then((response) => (
        requestedVersion === cartCacheVersion
          ? updateCartCache(response.productos)
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
  const response = await api.clearCart();
  return updateCartCache(response.productos);
}

export function resetCartCache() {
  cartCacheVersion += 1;
  cartItems = [];
  cartLoaded = false;
  cartLoadPromise = null;
  removeLegacyCartStorage();
  notifyCartUpdated();
}

export function getCartItemsCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}
