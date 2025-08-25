import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email, password, referralCode) => {
    const response = await api.post('/auth/register', { 
      email, 
      password, 
      referralCode 
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (updates) => {
    const response = await api.put('/users/profile', updates);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/users/account');
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.post(`/auth/verify-email/${token}`);
    return response.data;
  },

  resendVerificationEmail: async () => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  confirmEmail: async (token) => {
    // Legacy support - redirect to new verify endpoint
    const response = await api.post(`/auth/verify-email/${token}`);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await api.put(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  completeProfile: async (role, referralCode) => {
    const response = await api.post('/auth/complete-profile', { role, referralCode });
    return response.data;
  },

  // Admin specific methods
  adminLogin: async (email, password) => {
    const response = await api.post('/auth/admin/login', { email, password });
    return response.data;
  },

  adminLogout: async () => {
    const response = await api.post('/auth/admin/logout');
    return response.data;
  },

  getAdminMe: async () => {
    const response = await api.get('/auth/admin/me');
    return response.data;
  },
};

export default authService;