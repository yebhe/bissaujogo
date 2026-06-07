// src/store/authStore.js
import { create } from 'zustand';
import api from '../api/axiosConfig';

const authStore = create((set) => ({
  user    : null,
  access  : null,
  isAuth  : false,
  loading : false,
  error   : null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/login/', { username, password });
      localStorage.setItem('access',  data.access);
      localStorage.setItem('refresh', data.refresh);
      set({ access: data.access, isAuth: true, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.detail ?? 'Accès refusé', loading: false });
    }
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/me/');
      set({ user: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateMe: async (patch) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.patch('/me/', patch);
      set({ user: data, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Impossible de mettre à jour le profil.';
      set({ loading: false, error: msg });
      return null;
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, access: null, isAuth: false });
  },

  setAccess: (access) => set({ access, isAuth: true }),
}));

export default authStore;