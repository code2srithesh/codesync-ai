import { create } from 'zustand';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('codesync_jwt'),
  user: localStorage.getItem('codesync_user') 
    ? JSON.parse(localStorage.getItem('codesync_user')!) 
    : null,
  isAuthenticated: !!localStorage.getItem('codesync_jwt'),
  isLoading: false,

  login: (token, user) => {
    localStorage.setItem('codesync_jwt', token);
    localStorage.setItem('codesync_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('codesync_jwt');
    localStorage.removeItem('codesync_user');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
