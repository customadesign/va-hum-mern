import { useState, useCallback } from 'react';
import api from '../services/api';

export const useZoom = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeWebinar, setActiveWebinar] = useState(null);

  // Create a new webinar
  const createWebinar = useCallback(async (webinarData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/zoom/webinar', webinarData);
      
      if (response.data.success) {
        setActiveWebinar(response.data);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to create webinar');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create webinar';
      setError(errorMessage);
      console.error('Error creating webinar:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get webinar details
  const getWebinar = useCallback(async (webinarId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/zoom/webinar/${webinarId}`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch webinar details');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch webinar details';
      setError(errorMessage);
      console.error('Error fetching webinar:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // List webinars
  const listWebinars = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/zoom/webinars');
      
      if (response.data.success) {
        return response.data.webinars;
      } else {
        throw new Error(response.data.error || 'Failed to fetch webinars');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch webinars';
      setError(errorMessage);
      console.error('Error listing webinars:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate signature for existing meeting
  const generateSignature = useCallback(async (meetingNumber, role = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/zoom/signature', {
        meetingNumber,
        role
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to generate signature');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate signature';
      setError(errorMessage);
      console.error('Error generating signature:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update webinar
  const updateWebinar = useCallback(async (webinarId, updateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.patch(`/zoom/webinar/${webinarId}`, updateData);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to update webinar');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update webinar';
      setError(errorMessage);
      console.error('Error updating webinar:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete webinar
  const deleteWebinar = useCallback(async (webinarId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/zoom/webinar/${webinarId}`);
      
      if (response.data.success) {
        if (activeWebinar?.webinar?.id === webinarId) {
          setActiveWebinar(null);
        }
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to delete webinar');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete webinar';
      setError(errorMessage);
      console.error('Error deleting webinar:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [activeWebinar]);

  // Create and prepare webinar for immediate joining
  const createAndJoinWebinar = useCallback(async (trainingData) => {
    try {
      const webinarData = {
        topic: trainingData.title || 'Live VA Training Session',
        start_time: new Date().toISOString(), // Start immediately
        duration: trainingData.duration || 60,
        agenda: trainingData.description || 'Interactive training session for Virtual Assistants',
        password: Math.random().toString(36).substring(2, 8) // Generate random password
      };

      const result = await createWebinar(webinarData);
      
      // Return configuration for ZoomWebinar component
      return {
        webinarInfo: result.webinar,
        zoomConfig: {
          sdkKey: result.sdk.sdkKey,
          signature: result.sdk.signature,
          meetingNumber: result.sdk.meetingNumber,
          password: result.sdk.password,
          userName: trainingData.userName || 'Participant',
          userEmail: trainingData.userEmail || ''
        }
      };
    } catch (err) {
      console.error('Error creating and joining webinar:', err);
      throw err;
    }
  }, [createWebinar]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear active webinar
  const clearActiveWebinar = useCallback(() => {
    setActiveWebinar(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    activeWebinar,
    
    // Actions
    createWebinar,
    getWebinar,
    listWebinars,
    generateSignature,
    updateWebinar,
    deleteWebinar,
    createAndJoinWebinar,
    clearError,
    clearActiveWebinar
  };
};