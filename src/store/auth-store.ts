import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const REDIRECT_PATH = '/dashboard';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  fetchUser: async () => {
    try {
      set({ isLoading: true });

      const res = await fetch('/api/proxy/api/auth/me', {
        credentials: 'include',
      });

      if (!res.ok) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const data = await res.json();
      const user = data.user || data;
      set({ 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'member'
        }, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch('/api/proxy/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
