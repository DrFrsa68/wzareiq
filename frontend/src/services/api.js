import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://modest-trust-production-c992.up.railway.app/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const subjectsAPI = {
  getAll: () => api.get('/subjects'),
};

export const examsAPI = {
  getYears: (subject_id, exam_type) => api.get(`/exams/years?subject_id=${subject_id}&exam_type=${exam_type}`),
  getRounds: (subject_id, exam_type, year) => api.get(`/exams/rounds?subject_id=${subject_id}&exam_type=${exam_type}&year=${year}`),
  search: (params) => api.get('/exams/search', { params }),
  getQuestions: (exam_id) => api.get(`/exams/${exam_id}/questions`),
};

export const sessionsAPI = {
  start: (exam_id) => api.post('/sessions/start', { exam_id }),
  saveAnswer: (session_id, data) => api.post(`/sessions/${session_id}/answer`, data),
  submit: (session_id) => api.post(`/sessions/${session_id}/submit`),
  getHistory: () => api.get('/sessions/history'),
  getSession: (session_id) => api.get(`/sessions/${session_id}`),
};

export default api;

// إضافة دوال الحذف والعرض للإدارة
export const adminExamsAPI = {
  getAll: () => api.get('/admin/exams'),
  delete: (id) => api.delete(`/admin/exams/${id}`),
  getExam: (id) => api.get(`/exams/${id}`),
};
