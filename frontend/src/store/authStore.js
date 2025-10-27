import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: (token, user, refreshToken) => {
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ token, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  updateToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
}));

export default useAuthStore;

