import axios from 'axios';

// Use the current domain if VITE_API_URL is not set
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback to current domain + /api
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
};

// Rooms API - Updated to use consolidated endpoint
export const roomsAPI = {
  create: (roomData) => api.post('/rooms', { ...roomData, action: 'create' }),
  join: (roomCode) => api.post('/rooms', { roomCode, action: 'join' }),
  get: (roomCode) => api.get(`/rooms?roomCode=${roomCode}`),
  update: (roomData) => api.put('/rooms', roomData),
};

// Messages API - Updated to use consolidated endpoint
export const messagesAPI = {
  send: (messageData) => api.post('/messages', messageData),
  get: (roomId) => api.get(`/messages?roomId=${roomId}`),
};

// Profile API - Updated to use consolidated endpoint
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (profileData) => api.put('/profile', profileData),
};

// Pusher API
export const pusherAPI = {
  auth: (authData) => api.post('/pusher/auth', authData),
};

export default api; 