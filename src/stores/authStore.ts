import { create } from 'zustand';

/**
 * Representa un objeto usuario para la gestión de estado local.
 */
interface User {
  id: string;
  email: string;
  name: string;
  lastname: string;
  age: number;
}

/**
 * Estado de autenticación simplificado para desarrollo local.
 */
interface AuthState {
  user: User | null;
  isAuthed: boolean;
  isLoading: boolean;
  error: string | null;
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

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      if (email && password) {
        const mockUser: User = {
          id: '1',
          email,
          name: 'Usuario',
          lastname: 'Demo',
          age: 25
        };
        set({ user: mockUser, isAuthed: true });
        localStorage.setItem('user', JSON.stringify(mockUser));
      }
    } catch (error) {
      set({ error: 'No se pudo iniciar sesión' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  socialLogin: async (provider: 'google' | 'facebook') => {
    set({ isLoading: true, error: null });
    try {
      const mockUser: User = {
        id: 'social-1',
        email: `${provider}@example.com`,
        name: provider === 'google' ? 'Usuario Google' : 'Usuario Facebook',
        lastname: 'Demo',
        age: 25
      };
      set({ user: mockUser, isAuthed: true });
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      set({ error: `Error en login social con ${provider}` });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, isAuthed: false });
    localStorage.removeItem('user');
  },

  checkAuth: () => {
    // Verifica si el usuario está almacenado en localStorage (para persistencia)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({ user, isAuthed: true });
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }
}));
