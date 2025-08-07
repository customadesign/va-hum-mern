import api from './api';

const clerkAuthService = {
  // Complete user profile after Clerk signup
  completeProfile: async (profileData, token) => {
    const response = await api.post('/clerk/complete-profile', profileData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Sync user data from Clerk
  syncUser: async (clerkUserId, token) => {
    const response = await api.post('/clerk/sync-user', {
      clerkUserId
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get current user profile
  getMe: async (token) => {
    const response = await api.get('/clerk/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Update API service to use Clerk token
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }
};

export default clerkAuthService;