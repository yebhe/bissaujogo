import { create } from 'zustand';
import api from '../api/axiosConfig';

const useReservationStore = create((set) => ({
  terrains: [],
  terrainId: null,
  creneaux:  [],
  loading:   false,
  error:     null,
  success:   false,
  reservationId: null,
  reservationRef: null,
  paiementInit: null,

  resetForm: () => set({ terrains: [], terrainId: null, creneaux: [], loading: false, error: null, success: false, reservationId: null, reservationRef: null, paiementInit: null }),

  fetchTerrains: async () => {
    set({ loading: true, error: null, terrains: [] });
    try {
      const { data } = await api.get('/terrains/');
      set({ terrains: data, loading: false });
    } catch {
      set({ error: 'Impossible de charger les terrains.', loading: false });
    }
  },

  fetchCreneaux: async (date, terrainId) => {
    set({ loading: true, error: null, creneaux: [] });
    try {
      const { data } = await api.get('/creneaux/', { params: { date, terrain_id: terrainId } });
      set({ creneaux: data, loading: false });
    } catch {
      set({ error: 'Impossible de charger les créneaux.', loading: false });
    }
  },

  soumettre: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/reservations/', payload);
      set({ loading: false, success: true, reservationId: data.id, reservationRef: data.code_reference ?? null });
      return data;
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Une erreur est survenue. Veuillez réessayer.';
      set({ loading: false, error: msg });
      return null;
    }
  },
}));

export default useReservationStore;