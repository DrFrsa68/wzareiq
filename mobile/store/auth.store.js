import { create } from 'zustand';

const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const useAuthStore = create((set) => ({
  ...getStoredAuth(),
  setAuth: (user, token) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch {}
    set({ user, token });
  },
  logout: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    set({ user: null, token: null });
  }
}));
