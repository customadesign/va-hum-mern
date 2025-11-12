import api from './api';

export const shortUrlService = {
  // Create a short URL for a VA profile
  createShortUrl: async (vaId) => {
    const response = await api.post(`/shorturls/vas/${vaId}`);
    return response.data;
  },

  // Get all short URLs for the current user
  getUserShortUrls: async () => {
    const response = await api.get('/shorturls/user/all');
    return response.data;
  },

  // Get short URL info and analytics
  getShortUrlInfo: async (shortCode) => {
    const response = await api.get(`/shorturls/info/${shortCode}`);
    return response.data;
  },

  // Deactivate a short URL
  deactivateShortUrl: async (shortCode) => {
    const response = await api.patch(`/shorturls/${shortCode}/deactivate`);
    return response.data;
  },

  // Reactivate a short URL
  reactivateShortUrl: async (shortCode) => {
    const response = await api.patch(`/shorturls/${shortCode}/reactivate`);
    return response.data;
  },

  // Copy URL to clipboard
  copyToClipboard: async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      return { success: true };
    } catch (error) {
      throw new Error('Failed to copy to clipboard');
    }
  },

  // Share URL using Web Share API or fallback
  shareUrl: async (url, title, text) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return { success: true, method: 'native' };
      } catch (error) {
        if (error.name !== 'AbortError') {
          throw error;
        }
      }
    }
    
    // Fallback to clipboard
    await shortUrlService.copyToClipboard(url);
    return { success: true, method: 'clipboard' };
  }
}; 