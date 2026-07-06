import axios from 'axios';
import { ROUTES } from './constants/routes';
import { STORAGE_KEYS } from './constants/index';

export const API_URL = 'https://api1.strideutmat.com';

const PUBLIC_API_PREFIXES = [
  '/api/university/login',
  '/api/university/check-superadmin',
  '/api/university/superusers',
  '/api/university/create-superuser',
  '/api/university/comunicados',
  '/api/university/check-logo',
  '/uploads/',
];

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isPublic = PUBLIC_API_PREFIXES.some(prefix => url.includes(prefix));
      if (!isPublic) {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        window.location.href = ROUTES.LOGIN;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
