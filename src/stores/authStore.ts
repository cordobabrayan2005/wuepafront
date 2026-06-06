import { onAuthStateChanged, signOut } from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../config/firebase';
import { api, type AuthUser } from '../services/api';
import { resetCartCache } from '../utils/cart';

type User = AuthUser;

interface AuthState {
  user: User | null;
  isAuthed: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'facebook') => Promise<void>;
  logout: () => void;
}

function getStoredUser(firebaseUid?: string): User | null {
  try {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) as Partial<User> : null;

    if (!parsedUser || typeof parsedUser.id !== 'string') {
      return null;
    }

    if (firebaseUid && parsedUser.id !== firebaseUid) {
      return null;
    }

    return parsedUser as User;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthed: false,
  isLoading: true,
  error: null,

  setUser: (user) => {
    set({ user, isAuthed: Boolean(user), error: null });

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      return;
    }

    localStorage.removeItem('user');
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { user, token } = await api.login(email, password);

      set({
        user,
        isAuthed: true,
        error: null,
      });

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo iniciar sesion',
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  socialLogin: async (provider: 'google' | 'facebook') => {
    set({ isLoading: true, error: null });

    try {
      const { user, token } = await api.socialLogin('', provider);

      set({
        user,
        isAuthed: true,
        error: null,
      });

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : `Error en login social con ${provider}`,
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    void signOut(auth);
    resetCartCache();

    set({
      user: null,
      isAuthed: false,
      error: null,
    });

    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
}));

// Firebase emits once after restoring persisted authentication. Protected routes
// stay in loading state until that first result arrives, preserving the current URL.
onAuthStateChanged(auth, async (firebaseUser) => {
  useAuthStore.setState({ isLoading: true });

  if (!firebaseUser) {
    useAuthStore.setState({
      user: null,
      isAuthed: false,
      isLoading: false,
      error: null,
    });

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return;
  }

  try {
    const user = await api.me();
    const token = await firebaseUser.getIdToken();

    useAuthStore.setState({
      user,
      isAuthed: true,
      isLoading: false,
      error: null,
    });

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  } catch (error) {
    const storedUser = getStoredUser(firebaseUser.uid);

    if (storedUser) {
      useAuthStore.setState({
        user: storedUser,
        isAuthed: true,
        isLoading: false,
        error: null,
      });
      return;
    }

    useAuthStore.setState({
      user: null,
      isAuthed: false,
      isLoading: false,
      error: error instanceof Error ? error.message : 'No se pudo sincronizar la sesion',
    });
  }
});
