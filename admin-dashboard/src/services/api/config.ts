import axios from 'axios';

export const API_BASE = 'http://localhost:4000/api';

// Get auth token from localStorage
export const getAuthToken = () => localStorage.getItem('adminToken');

// Configure axios defaults
axios.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { axios };
