import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global token getter function (set by auth context)
let getAuthToken = null;

// Set token getter function (called by auth context)
export const setTokenGetter = (tokenGetter) => {
  getAuthToken = tokenGetter;
};

// Request interceptor to add auth token (Clerk primary, JWT fallback)
api.interceptors.request.use(
  async (config) => {
    try {
      // Try to get Clerk token first
      if (getAuthToken) {
        const clerkToken = await getAuthToken();
        if (clerkToken) {
          config.headers.Authorization = `Bearer ${clerkToken}`;
          return config;
        }
      }
      
      // Fallback to legacy JWT token
      const legacyToken = localStorage.getItem('token');
      if (legacyToken) {
        config.headers.Authorization = `Bearer ${legacyToken}`;
      }
    } catch (error) {
      console.warn('Error getting auth token:', error);
      
      // Fallback to legacy JWT token
      const legacyToken = localStorage.getItem('token');
      if (legacyToken) {
        config.headers.Authorization = `Bearer ${legacyToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clean up tokens and redirect
      localStorage.removeItem('token');
      
      // Check if we're using Clerk (modern) or legacy auth
      const isClerkAuth = !!getAuthToken;
      if (isClerkAuth) {
        // Redirect to Clerk sign-in
        window.location.href = '/sign-in';
      } else {
        // Redirect to legacy login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;