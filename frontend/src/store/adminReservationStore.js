import { create } from 'zustand';
import api from '../api/axiosConfig';

const adminReservationStore = create((set, get) => ({
  reservations: [],
  selected: null,
  terrains: [],
  creneaux: [],

  pagination: {
    page: 1,
    page_size: 7,
    count: 0,
  },
  search: '',

  loading: false,
  error: null,

  filters: {
    date: '',
    statut: '',
  },

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setSearch: (value) => set({ search: value ?? '' }),
  setPage: (page) => set((s) => ({ pagination: { ...s.pagination, page } })),
  clearError: () => set({ error: null }),

  fetchTerrains: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/terrains/');
      set({ terrains: data, loading: false });
    } catch {
      set({ loading: false, error: 'Impossible de charger les terrains.' });
    }
  },

  fetchCreneaux: async (date, terrainId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/creneaux/', { params: { date, terrain_id: terrainId } });
      set({ creneaux: data, loading: false });
    } catch {
      set({ loading: false, error: 'Impossible de charger les créneaux.' });
    }
  },

  fetchReservations: async (options = {}) => {
    const { date, statut } = get().filters;
    const { page, page_size } = get().pagination;
    const requestedPage = options.page ?? page;
    const search = (get().search || '').trim();
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/admin/reservations/', {
        params: {
          date: date || undefined,
          statut: statut || undefined,
          search: search || undefined,
          page: requestedPage,
          page_size,
        }
      });
      set({
        reservations: data.results ?? [],
        pagination: {
          page: data.page ?? requestedPage,
          page_size: data.page_size ?? page_size,
          count: data.count ?? 0,
        },
        loading: false,
      });
    } catch {
      set({ loading: false, error: 'Impossible de charger les réservations.' });
    }
  },

  fetchReservation: async (id, params) => {
    set({ loading: true, error: null, selected: null });
    try {
      const { data } = await api.get(`/admin/reservations/${id}/`, { params: params || undefined });
      set({ selected: data, loading: false });
      return data;
    } catch {
      set({ loading: false, error: 'Impossible de charger la réservation.' });
      return null;
    }
  },

  updateReservation: async (id, patch) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.patch(`/admin/reservations/${id}/`, patch);
      set({ selected: data, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Impossible de mettre à jour.';
      set({ loading: false, error: msg });
      return null;
    }
  },

  encaisser: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post(`/admin/reservations/${id}/paiement/`, payload);
      set({ selected: data, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Impossible d\'encaisser.';
      set({ loading: false, error: msg });
      return null;
    }
  },

  marquerNonPaye: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post(`/admin/reservations/${id}/paiement/non-paye/`);
      set({ selected: data, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Impossible de marquer non payé.';
      set({ loading: false, error: msg });
      return null;
    }
  },

  createPaiementManuel: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/admin/reservations/paiement-manuel/', payload);
      set({ loading: false });
      await get().fetchReservations();
      return data;
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Impossible d’ajouter le paiement manuel.';
      set({ loading: false, error: msg });
      return null;
    }
  },
}));

export default adminReservationStore;
