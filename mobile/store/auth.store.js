import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    global.token = token;
    set({ user, token });
  },
  logout: () => {
    global.token = null;
    set({ user: null, token: null });
  }
}));
