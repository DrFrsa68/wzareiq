import { create } from 'zustand';
import { Platform } from 'react-native';

const saveToStorage = async (key, value) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    }
  } catch {}
};

const getFromStorage = async (key) => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    }
  } catch { return null; }
};

const removeFromStorage = async (key) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    }
  } catch {}
};

const getStoredAuthWeb = () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const useAuthStore = create((set) => ({
  ...(Platform.OS === 'web' ? getStoredAuthWeb() : { token: null, user: null }),
  initialized: Platform.OS === 'web',

  initAuth: async () => {
    const token = await getFromStorage('token');
    const userStr = await getFromStorage('user');
    const user = userStr ? JSON.parse(userStr) : null;
    set({ token, user, initialized: true });
  },

  setAuth: async (user, token) => {
    await saveToStorage('token', token);
    await saveToStorage('user', JSON.stringify(user));
    set({ user, token });
  },

  logout: async () => {
    await removeFromStorage('token');
    await removeFromStorage('user');
    set({ user: null, token: null });
  }
}));