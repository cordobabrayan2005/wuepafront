import {
  EmailAuthProvider,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

console.log('🟢 [API] Firebase cargado sin Firestore (modo backend)');

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  lastname: string;
  rol: 'cliente' | 'admin';
  telefono?: string;
  direccion?: string;
  birthdate?: string;
  age?: number | null;
}

interface SignupPayload {
  name: string;
  lastname: string;
  age: number;
  email: string;
  password: string;
}

interface UpdateProfilePayload {
  name: string;
  lastname: string;
  telefono?: string;
  direccion?: string;
  birthdate?: string;
}

export interface ProductPayload {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  imagenUrl?: string;
  codigo?: string;
  stock?: number;
  estado?: string;
  origen?: string;
}

export interface Product extends ProductPayload {
  id: string;
}

export interface ProductCategoryRecord {
  id: string;
  nombre: string;
}

export type BackendOrderStatus = 'Pendiente' | 'Pagado' | 'Cancelado';

export interface BackendOrderItem {
  productId: string;
  codigo: string;
  nombre: string;
  imagenUrl: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface BackendOrderCustomerData {
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
}

export interface BackendOrder {
  id: string;
  clienteId: string;
  productos: BackendOrderItem[];
  total: number;
  estado: BackendOrderStatus;
  clienteData: BackendOrderCustomerData;
  fechaCreacion: string | { seconds?: number; _seconds?: number; nanoseconds?: number; _nanoseconds?: number };
  fechaActualizacion: string | { seconds?: number; _seconds?: number; nanoseconds?: number; _nanoseconds?: number };
}

export interface CreateOrderPayload {
  productos: Array<{ id: string; cantidad: number }>;
  clienteData: BackendOrderCustomerData;
}

export interface BackendCartItem {
  productId: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  imagenUrl: string;
  cantidad: number;
  precio: number;
  unidadesDisponibles: number;
}

interface InstagramSyncResponse {
  success: boolean;
  imported: number;
}

interface BackendUser {
  uid: string;
  correo: string;
  nombre: string;
  apellidos?: string;
  rol?: string;
  telefono?: string;
  direccion?: string;
  birthdate?: string | { seconds?: number; _seconds?: number };
  age?: number | null;
}

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  user?: T;
  order?: T;
  orders?: T;
}

const USERS_COLLECTION = 'usuarios';
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'https://wuepa-jewerly-backend.onrender.com').replace(/\/+$/, '');

function buildDisplayName(name: string, lastname: string) {
  return [name, lastname].map((value) => value.trim()).filter(Boolean).join(' ');
}

function splitDisplayName(displayName: string | null | undefined) {
  const fullName = (displayName ?? '').trim();

  if (!fullName) {
    return { name: 'Usuario', lastname: '' };
  }

  const [name, ...lastnameParts] = fullName.split(/\s+/);

  return {
    name,
    lastname: lastnameParts.join(' '),
  };
}

function normalizeBackendDate(value: BackendUser['birthdate']) {
  if (typeof value === 'string') {
    return value;
  }

  const seconds = value?.seconds ?? value?._seconds;
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : undefined;
}

function mapBackendUserToAuthUser(backendUser: BackendUser, profile?: Partial<AuthUser>): AuthUser {
  return {
    id: backendUser.uid,
    email: profile?.email ?? backendUser.correo ?? '',
    name: profile?.name ?? backendUser.nombre ?? '',
    lastname: profile?.lastname ?? backendUser.apellidos ?? '',
    telefono: profile?.telefono ?? backendUser.telefono ?? '',
    direccion: profile?.direccion ?? backendUser.direccion ?? '',
    birthdate: profile?.birthdate ?? normalizeBackendDate(backendUser.birthdate),
    age: typeof profile?.age === 'number' ? profile.age : backendUser.age ?? 0,
    rol: backendUser.rol === 'admin' ? 'admin' : 'cliente',
  };
}

async function parseBackendResponse<T>(response: Response): Promise<BackendResponse<T>> {
  const payload = (await response.json().catch(() => null)) as BackendResponse<T> | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? 'No se pudo completar la solicitud al backend.');
  }

  if (!payload) {
    throw new Error('El backend devolvió una respuesta vacía.');
  }

  return payload;
}

async function postToBackend<T>(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return parseBackendResponse<T>(response);
}

async function verifyBackendSession(token: string) {
  const payload = await postToBackend<BackendUser>('/api/auth/verify-token', { token });

  if (!payload.user) {
    throw new Error('El backend no devolvió información del usuario.');
  }

  return payload.user;
}

async function registerBackendUser(token: string, userData: SignupPayload) {
  const payload = await postToBackend<BackendUser>('/api/auth/register', {
    token,
    nombre: buildDisplayName(userData.name, userData.lastname) || userData.name,
    telefono: '',
    direccion: '',
  });

  if (!payload.user) {
    throw new Error('El backend no confirmó el registro del usuario.');
  }

  return payload.user;
}

async function verifyOrRegisterBackendUser(token: string, userData: SignupPayload) {
  try {
    return await verifyBackendSession(token);
  } catch {
    return registerBackendUser(token, userData);
  }
}


function normalizeFirebaseError(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) {
    const code = String((error as { code?: string }).code);

    switch (code) {
      case 'auth/email-already-in-use':
        return new Error('Ese correo ya está registrado.');
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return new Error('Correo o contraseña inválidos.');
      case 'auth/invalid-email':
        return new Error('Debes ingresar un correo válido.');
      case 'auth/popup-closed-by-user':
        return new Error('Se cerró la ventana de inicio de sesión.');
      case 'auth/unauthorized-domain':
        return new Error('Este inicio de sesión no está disponible en este momento.');
      case 'auth/requires-recent-login':
        return new Error('Vuelve a iniciar sesión para completar esta acción.');
      case 'auth/weak-password':
        return new Error('La contraseña no cumple con los requisitos de seguridad.');
      case 'auth/missing-password':
        return new Error('Debes ingresar una contraseña válida.');
      case 'auth/invalid-action-code':
        return new Error('El enlace de recuperación es inválido o ya expiró.');
      case 'auth/too-many-requests':
        return new Error('Demasiados intentos. Espera unos minutos y vuelve a intentarlo.');
      default:
        break;
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Ocurrió un error inesperado.');
}

async function buildUserProfile(
  userId: string,
  emailFallback: string | null,
  backendUser?: BackendUser,
): Promise<AuthUser> {

  console.log('🧠 [PROFILE] Construyendo perfil...');
  console.log('🧠 [PROFILE] UID:', userId);

  if (backendUser) {
    console.log('🟢 [PROFILE] Usando datos del backend');

    return mapBackendUserToAuthUser(backendUser, {
      email: emailFallback ?? backendUser.correo ?? '',
    });
  }

  console.log('🟡 [PROFILE] Sin backend, usando fallback');

  return {
    id: userId,
    email: emailFallback ?? '',
    name: '',
    lastname: '',
    age: 0,
    rol: 'cliente'
  };
}

async function getFirebaseToken() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('No hay una sesión activa.');
  }

  return currentUser.getIdToken();
}

async function requestBackend<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false
): Promise<T> {
  let token: string | null = null;

  try {
    token = withAuth ? await getFirebaseToken() : null;
  } catch {
    throw new Error('Tu sesion vencio. Inicia sesion de nuevo para continuar.');
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('No pudimos conectar con Wuepa. Revisa tu internet e intenta nuevamente.');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Tu sesion vencio. Inicia sesion de nuevo para continuar.');
    }

    if (response.status === 403) {
      throw new Error('No tienes permisos para realizar esta accion.');
    }

    if (response.status === 404) {
      throw new Error('No encontramos el servicio necesario para guardar el pedido. Intenta mas tarde.');
    }

    if (response.status >= 500) {
      throw new Error('Wuepa esta teniendo problemas para guardar el pedido. Intenta nuevamente en unos minutos.');
    }

    throw new Error(payload?.message ?? 'No pudimos completar la solicitud. Revisa los datos e intenta nuevamente.');
  }

  return payload;
}

export const api = {
  login: async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      const backendUser = await verifyBackendSession(token);
      const user = await buildUserProfile(credential.user.uid, credential.user.email);
      const mergedUser = mapBackendUserToAuthUser(backendUser, user);

      return { user: mergedUser, token };
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  register: async (userData: SignupPayload) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user: AuthUser = {
        id: credential.user.uid,
        email: credential.user.email ?? userData.email,
        name: userData.name,
        lastname: userData.lastname,
        rol: 'cliente',
        age: userData.age,
      };

      const token = await credential.user.getIdToken();

      const backendUser = await verifyOrRegisterBackendUser(token, userData);

      return { user: mapBackendUserToAuthUser(backendUser, user), token };
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  signup: async (userData: SignupPayload) => api.register(userData),

  me: async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay una sesión activa.');
    }

    try {
      const token = await currentUser.getIdToken();
      const backendUser = await verifyBackendSession(token);
      return await buildUserProfile(currentUser.uid, currentUser.email, backendUser);
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  updateProfile: async (profileData: UpdateProfilePayload) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('No hay una sesión activa.');
    }

    try {
      const currentProfile = await api.me();

      await requestBackend<{ success: boolean; user: BackendUser }>(
        '/api/users/me',
        {
          method: 'PUT',
          body: JSON.stringify({
            nombre: profileData.name.trim(),
            apellidos: profileData.lastname.trim(),
            telefono: profileData.telefono?.trim() ?? currentProfile.telefono ?? '',
            direccion: profileData.direccion?.trim() ?? currentProfile.direccion ?? '',
            birthdate: profileData.birthdate ?? currentProfile.birthdate,
          }),
        },
        true
      );

      return api.me();
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  forgot: async (email: string) => {
    try {
      await postToBackend('/api/auth/forgot-password', { email });
      return { message: 'Enlace de recuperación enviado.' };
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  reset: async (token: string, password: string) => {
    try {
      await confirmPasswordReset(auth, token, password);
      return { message: 'Contraseña actualizada.' };
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new Error('Todos los campos son obligatorios.');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden.');
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error('No hay una sesión activa.');
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      return { message: 'Contraseña cambiada correctamente.' };
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  socialLogin: async (_idToken: string, provider: string) => {
    if (provider !== 'google') {
      throw new Error('Ese proveedor aún no está configurado.');
    }

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const googleProfile = splitDisplayName(credential.user.displayName);
      const user: AuthUser = {
        id: credential.user.uid,
        email: credential.user.email ?? '',
        name: googleProfile.name,
        lastname: googleProfile.lastname,
        rol: 'cliente',
        age: 0,
      };

      console.log('🟡 [PROFILE] Persistencia omitida (ahora maneja backend)');
      const token = await credential.user.getIdToken();
      const backendUser = await verifyOrRegisterBackendUser(token, {
        name: user.name,
        lastname: user.lastname,
        age: user.age ?? 0,
        email: user.email,
        password: '',
      });

      return { user: mapBackendUserToAuthUser(backendUser, user), token };
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  getProducts: async (): Promise<Product[]> => {
    return requestBackend<Product[]>('/api/products', {
      method: 'GET',
    });
  },

  createProduct: async (productData: ProductPayload) => {
    return requestBackend<{ success: boolean; id: string }>(
      '/api/products',
      {
        method: 'POST',
        body: JSON.stringify(productData),
      },
      true
    );
  },

  updateProduct: async (id: string, productData: Partial<ProductPayload>) => {
    return requestBackend<{ success: boolean; message: string }>(
      `/api/products/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(productData),
      },
      true
    );
  },

  deleteProduct: async (id: string) => {
    return requestBackend<{ success: boolean; message: string }>(
      `/api/products/${id}`,
      {
        method: 'DELETE',
      },
      true
    );
  },

  getCategories: async (): Promise<ProductCategoryRecord[]> => {
    return requestBackend<ProductCategoryRecord[]>('/api/categories', {
      method: 'GET',
    });
  },

  createCategory: async (nombre: string) => {
    return requestBackend<{ success: boolean; category: ProductCategoryRecord }>(
      '/api/categories',
      {
        method: 'POST',
        body: JSON.stringify({ nombre }),
      },
      true
    );
  },

  deleteCategory: async (id: string) => {
    return requestBackend<{ success: boolean; message: string }>(
      `/api/categories/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      true
    );
  },

  createOrder: async (orderData: CreateOrderPayload) => {
    return requestBackend<{ success: boolean; order: BackendOrder }>(
      '/api/orders',
      {
        method: 'POST',
        body: JSON.stringify(orderData),
      },
      true
    );
  },

  getCart: async () => {
    return requestBackend<{ success: boolean; productos: BackendCartItem[] }>(
      '/api/cart',
      { method: 'GET' },
      true
    );
  },

  saveCart: async (productos: Array<{ productId: string; cantidad: number }>) => {
    return requestBackend<{ success: boolean; productos: BackendCartItem[] }>(
      '/api/cart',
      {
        method: 'PUT',
        body: JSON.stringify({ productos }),
      },
      true
    );
  },

  clearCart: async () => {
    return requestBackend<{ success: boolean; productos: BackendCartItem[] }>(
      '/api/cart',
      { method: 'DELETE' },
      true
    );
  },

  getAdminOrders: async () => {
    return requestBackend<{ success: boolean; orders: BackendOrder[] }>(
      '/api/orders',
      {
        method: 'GET',
      },
      true
    );
  },

  updateOrderStatus: async (id: string, estado: BackendOrderStatus) => {
    return requestBackend<{ success: boolean; order: BackendOrder }>(
      `/api/orders/${id}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      },
      true
    );
  },

  syncInstagramProducts: async () => {
    return requestBackend<InstagramSyncResponse>(
      '/api/instagram/sync',
      {
        method: 'POST',
      },
      true
    );
  },

};
