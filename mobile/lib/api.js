import axios from 'axios';

const API_URL = 'https://wzareiq-production.up.railway.app/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = global.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
