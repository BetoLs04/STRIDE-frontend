import axios from 'axios';
import { ROUTES } from './constants/routes';
import { STORAGE_KEYS } from './constants/index';

export const API_URL = 'https://api1.strideutmat.com';

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
    if (error.response?.status === 401 && !error.config?.url?.includes(ROUTES.LOGIN)) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      window.location.href = ROUTES.LOGIN;
    }
    return Promise.reject(error);
  }
);

export default api;
