import api from './api';

const savedVAsService = {
  // Save a VA
  saveVA: async (vaId, context = 'va_profile') => {
    try {
      const response = await api.post('/saved-vas', {
        vaId,
        context
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Unsave a VA
  unsaveVA: async (vaId, context = 'va_profile') => {
    try {
      await api.delete(`/saved-vas/${vaId}`, {
        data: { context }
      });
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get saved VAs list
  getSavedVAs: async (params = {}) => {
    try {
      const response = await api.get('/saved-vas', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check if a VA is saved
  checkIfSaved: async (vaId) => {
    try {
      const response = await api.get(`/saved-vas/exists/${vaId}`);
      return response.data?.data?.saved || false;
    } catch (error) {
      // If error, assume not saved
      return false;
    }
  },

  // Get saved count for badge
  getSavedCount: async () => {
    try {
      const response = await api.get('/saved-vas/count');
      return response.data?.data || { count: 0, displayCount: '0' };
    } catch (error) {
      return { count: 0, displayCount: '0' };
    }
  }
};

export default savedVAsService;