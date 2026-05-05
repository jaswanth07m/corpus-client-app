import axios from 'axios';
import { BACKEND_URL } from '@/lib/constants';

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
