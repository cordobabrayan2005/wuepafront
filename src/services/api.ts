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
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  lastname: string;
  age: number;
}

interface SignupPayload {
  name: string;
  lastname: string;
  age: number;
  email: string;
  password: string;
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

async function getFirestoreProfile(userId: string) {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
  const data = snapshot.data();

  if (!data) {
    return null;
  }

  return {
    id: userId,
    email: data.email ?? '',
    name: data.name ?? '',
    lastname: data.lastname ?? '',
    age: typeof data.age === 'number' ? data.age : Number(data.age ?? 0),
  } satisfies AuthUser;
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
  const profile = await getFirestoreProfile(userId);

  if (backendUser) {
    return mapBackendUserToAuthUser(backendUser, {
      ...profile,
      email: profile?.email ?? emailFallback ?? backendUser.correo ?? '',
    });
  }

  return {
    id: userId,
    email: profile?.email ?? emailFallback ?? '',
    name: profile?.name ?? '',
    lastname: profile?.lastname ?? '',
    age: typeof profile?.age === 'number' ? profile.age : Number(profile?.age ?? 0),
  };
}

async function persistUserProfile(user: AuthUser) {
  await setDoc(
    doc(db, USERS_COLLECTION, user.id),
    {
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      age: user.age,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
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
        age: userData.age,
      };

      await setDoc(doc(db, USERS_COLLECTION, user.id), {
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        age: user.age,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

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
      const existingProfile = await getFirestoreProfile(credential.user.uid);
      const user: AuthUser = {
        id: credential.user.uid,
        email: credential.user.email ?? '',
        name: existingProfile?.name || googleProfile.name,
        lastname: existingProfile?.lastname || googleProfile.lastname,
        age: existingProfile?.age || 0,
      };

      await persistUserProfile(user);
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
};
