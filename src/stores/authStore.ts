import { create } from 'zustand';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { api, type AuthUser } from '../services/api';

/**
 * Representa un objeto usuario para la gestión de estado local.
 */
type User = AuthUser;

/**
 * Estado de autenticación simplificado para desarrollo local.
 */
interface AuthState {
  user: User | null;
  isAuthed: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'facebook') => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthed: false,
  isLoading: false,
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
      set({ user, isAuthed: true, error: null });
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudo iniciar sesión' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  socialLogin: async (provider: 'google' | 'facebook') => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await api.socialLogin('', provider);
      set({ user, isAuthed: true, error: null });
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : `Error en login social con ${provider}` });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    void signOut(auth);
    set({ user: null, isAuthed: false, error: null });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  checkAuth: () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      set({ user: null, isAuthed: false });
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return;
    }

    void api.me()
      .then((user) => {
        set({ user, isAuthed: true, error: null });
        localStorage.setItem('user', JSON.stringify(user));
      })
      .catch(() => {
        set({ user: null, isAuthed: false, error: 'No se pudo validar la sesión' });
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      });
  }
}));

onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    useAuthStore.setState({ user: null, isAuthed: false, isLoading: false, error: null });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return;
  }

  try {
    const user = await api.me();
    const token = await firebaseUser.getIdToken();
    useAuthStore.setState({ user, isAuthed: true, isLoading: false, error: null });
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  } catch (error) {
    useAuthStore.setState({
      user: null,
      isAuthed: false,
      isLoading: false,
      error: error instanceof Error ? error.message : 'No se pudo sincronizar la sesión',
    });
  }
});
