// src/api/axios.js
import axios from 'axios';

// ─── helpers ────────────────────────────────────────────────
const getToken  = (key) => localStorage.getItem(key);
const getCsrf   = () =>
  document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];

// ─── instance ───────────────────────────────────────────────
const axiosConfig = axios.create({
  baseURL      : import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  headers      : { 'Content-Type': 'application/json' },
});

// ─── request ────────────────────────────────────────────────
axiosConfig.interceptors.request.use(
  (config) => {
    const access = getToken('access');
    const csrf   = getCsrf();

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    if (access) config.headers.Authorization  = `Bearer ${access}`;
    if (csrf)   config.headers['X-CSRFToken'] = csrf;

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── response ───────────────────────────────────────────────
axiosConfig.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? '/api'}/refresh/`,
          { refresh: getToken('refresh') },
          { withCredentials: true }
        );
        localStorage.setItem('access', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return axiosConfig(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosConfig;