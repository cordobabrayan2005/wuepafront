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

const USERS_COLLECTION = 'users';

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
      default:
        break;
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Ocurrió un error inesperado.');
}

async function buildUserProfile(userId: string, emailFallback: string | null): Promise<AuthUser> {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));
  const data = snapshot.data();

  return {
    id: userId,
    email: data?.email ?? emailFallback ?? '',
    name: data?.name ?? '',
    lastname: data?.lastname ?? '',
    age: typeof data?.age === 'number' ? data.age : Number(data?.age ?? 0),
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
      const user = await buildUserProfile(credential.user.uid, credential.user.email);
      const token = await credential.user.getIdToken();

      return { user, token };
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
      return { user, token };
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
      return await buildUserProfile(currentUser.uid, currentUser.email);
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },

  forgot: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
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
      const existingProfile = await buildUserProfile(credential.user.uid, credential.user.email);
      const user: AuthUser = {
        id: credential.user.uid,
        email: credential.user.email ?? '',
        name: existingProfile.name || credential.user.displayName?.split(' ')[0] || 'Usuario',
        lastname: existingProfile.lastname || credential.user.displayName?.split(' ').slice(1).join(' ') || '',
        age: existingProfile.age || 0,
      };

      await persistUserProfile(user);
      const token = await credential.user.getIdToken();

      return { user, token };
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  },
};
