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
  age: number;
  rol: 'cliente' | 'admin';
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
  age: number;
}

export interface ProductPayload {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  imagenUrl?: string;
  codigo?: string;
  stock?: number;
}

export interface Product extends ProductPayload {
  id: string;
}

interface BackendUser {
  uid: string;
  correo: string;
  nombre: string;
  rol?: string;
  telefono?: string;
  direccion?: string;
}

interface BackendResponse<T> {
  success: boolean;
  message?: string;
  user?: T;
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

function mapBackendUserToAuthUser(backendUser: BackendUser, profile?: Partial<AuthUser>): AuthUser {
  return {
    id: backendUser.uid,
    email: profile?.email ?? backendUser.correo ?? '',
    name: profile?.name ?? backendUser.nombre ?? '',
    lastname: profile?.lastname ?? '',
    age: typeof profile?.age === 'number' ? profile.age : 0,
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
  const token = withAuth ? await getFirebaseToken() : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Error en la solicitud al backend.');
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

    const normalizedUser: AuthUser = {
      id: currentUser.uid,
      email: currentUser.email ?? '',
      name: profileData.name.trim(),
      lastname: profileData.lastname.trim(),
      rol: 'cliente',
      age: Number.isFinite(profileData.age) ? Math.max(0, profileData.age) : 0,
    };

    try {
      return normalizedUser;
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
        age: user.age,
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

};
