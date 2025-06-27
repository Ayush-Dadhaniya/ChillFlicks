import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

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
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// Rooms API
export const roomsAPI = {
  create: (roomData) => api.post('/rooms/create', roomData),
  join: (roomCode) => api.post('/rooms/join', { roomCode }),
  get: (roomCode) => api.get(`/rooms/get?roomCode=${roomCode}`),
  update: (roomData) => api.put('/rooms/update', roomData),
};

// Messages API
export const messagesAPI = {
  send: (messageData) => api.post('/messages/send', messageData),
  get: (roomId) => api.get(`/messages/get?roomId=${roomId}`),
};

// Profile API
export const profileAPI = {
  get: () => api.get('/profile'),
};

export default api; 