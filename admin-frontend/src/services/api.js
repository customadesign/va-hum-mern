import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true // Enable cookies for CORS requests
});

// Request interceptor to add auth token from cookies
api.interceptors.request.use(
  (config) => {
    // Get token from cookies instead of localStorage
    const token = getCookie('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        // Clear auth cookies instead of localStorage
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Admin API endpoints
export const adminAPI = {
  // Dashboard & Stats
  getStats: () => api.get('/admin/stats'),
  getDashboard: () => api.get('/admin/dashboard'),

  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  suspendUser: (userId, suspended) => api.put(`/admin/users/${userId}/suspend`, { suspended }),
  updateUserRole: (userId, admin) => api.put(`/admin/users/${userId}/admin`, { admin }),

  // VA Management (Admin endpoints)
  getVAs: (params) => api.get('/admin/vas', { params }),
  getVAById: (id) => api.get(`/admin/vas/${id}`),
  updateVAStatus: (id, status) => api.put(`/admin/vas/${id}`, { status }),
  deleteVA: (id) => api.delete(`/admin/vas/${id}`),

  // Business Management (Admin endpoints)
  getBusinesses: (params) => api.get('/admin/businesses', { params }),
  getBusinessById: (id) => api.get(`/admin/businesses/${id}`),
  updateBusinessStatus: (id, status) => api.put(`/admin/businesses/${id}`, { status }),
  deleteBusiness: (id) => api.delete(`/admin/businesses/${id}`),

  // Analytics
  getAnalytics: (params) => api.get('/admin/analytics', { params }),

  // Configuration
  getConfig: () => api.get('/admin/config'),
  updateConfig: (configs) => api.put('/admin/config', { configs }),

  // Moderation
  getModerationQueue: (params) => api.get('/admin/moderation/queue', { params }),
  flagContent: (contentType, contentId, data) => 
    api.post(`/admin/moderation/flag/${contentType}/${contentId}`, data),
  reviewContent: (contentType, contentId, data) => 
    api.post(`/admin/moderation/review/${contentType}/${contentId}`, data),
  bulkModeration: (data) => api.post('/admin/moderation/bulk', data),
  getModerationStats: (params) => api.get('/admin/moderation/stats', { params }),

  // Notifications
  getNotifications: (params) => api.get('/admin/notifications', { params }),
  createNotification: (data) => api.post('/admin/notifications', data),
  updateNotification: (id, data) => api.put(`/admin/notifications/${id}`, data),
  deleteNotification: (id) => api.delete(`/admin/notifications/${id}`),
  broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data),
};

// VA API endpoints
export const vaAPI = {
  getAll: (params) => api.get('/vas', { params }),
  getById: (id) => api.get(`/vas/${id}`),
  create: (data) => api.post('/vas', data),
  update: (id, data) => api.put(`/vas/${id}`, data),
  delete: (id) => api.delete(`/vas/${id}`),
  uploadAvatar: (id, formData) => api.post(`/vas/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Business API endpoints
export const businessAPI = {
  getAll: (params) => api.get('/businesses', { params }),
  getById: (id) => api.get(`/businesses/${id}`),
  create: (data) => api.post('/businesses', data),
  update: (id, data) => api.put(`/businesses/${id}`, data),
  delete: (id) => api.delete(`/businesses/${id}`),
  uploadLogo: (id, formData) => api.post(`/businesses/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// User API endpoints
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Utility functions
export const uploadFile = async (file, endpoint) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    toast.error('Failed to download file');
    throw error;
  }
};

export default api;
