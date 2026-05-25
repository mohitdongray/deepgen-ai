/**
 * API Service Configuration
 * 
 * Centralized Axios instance with:
 * - Base URL from environment variables
 * - Request/response interceptors for auth and error handling
 * - NEVER calls external AI APIs directly
 * 
 * Security: All AI-related requests go through our Node.js gateway
 */

import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.VITE_BACKEND_URL ||
  process.env.REACT_APP_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handles common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      alert('Rate limit exceeded. Please wait before generating another video.');
    } else if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
