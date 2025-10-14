import axios from 'axios';

// Robust API base URL inference for multi-deploy (Render) with safe fallbacks
function inferApiBase() {
  try {
    if (typeof window !== 'undefined') {
      const { hostname, protocol } = window.location;

      // 1) Explicit domain mappings take precedence over env to avoid misconfigured REACT_APP_API_URL
      if (hostname.includes('esystems-management-hub.onrender.com')) {
        return 'https://esystems-backend.onrender.com/api';
      }
      if (hostname.includes('linkage-va-hub.onrender.com')) {
        return 'https://linkage-va-hub-api.onrender.com/api';
      }

      // 2) Same-origin reverse proxy (e.g., Nginx -> /api)
      if (protocol === 'https:' || protocol === 'http:') {
        return '/api';
      }
    }

    // 3) Server-side or unknown host: use env var then local fallback
    if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) {
      return process.env.REACT_APP_API_URL.trim();
    }
    return process.env.SERVER_API_URL || 'http://localhost:5001/api';
  } catch {
    return process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  }
}

const API_URL = inferApiBase();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Identify this FE to the backend for accurate platform detection
    'x-frontend-platform': 'esystems'
  },
  withCredentials: true, // Always send cookies with requests
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-Token',
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

// Announcement-specific endpoints
export const announcementAPI = {
  // Get announcements for current user based on their role
  getAnnouncements: () => api.get('/announcements'),
  
  // Mark a specific announcement as read
  markAnnouncementAsRead: (id) => api.post(`/announcements/${id}/read`),
  
  // Get count of unread announcements
  getUnreadCount: () => api.get('/announcements/unread-count'),
};

export default api;
