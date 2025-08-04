import { useState, useCallback } from 'react';
import api from '../services/api';

export const useVideoSDK = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);

  // Create a new meeting
  const createMeeting = useCallback(async (meetingData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/videosdk/meeting', meetingData);
      
      if (response.data.success) {
        setActiveMeeting(response.data);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to create meeting');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create meeting';
      setError(errorMessage);
      console.error('Error creating meeting:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get meeting details
  const getMeeting = useCallback(async (roomId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/videosdk/meeting/${roomId}`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch meeting details');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch meeting details';
      setError(errorMessage);
      console.error('Error fetching meeting:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // List meetings
  const listMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/videosdk/meetings');
      
      if (response.data.success) {
        return response.data.meetings;
      } else {
        throw new Error(response.data.error || 'Failed to fetch meetings');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch meetings';
      setError(errorMessage);
      console.error('Error listing meetings:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate token for existing meeting
  const generateToken = useCallback(async (roomId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/videosdk/token', {
        roomId
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to generate token');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate token';
      setError(errorMessage);
      console.error('Error generating token:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate API credentials
  const validateApiKey = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/videosdk/validate');
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to validate API credentials');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to validate API credentials';
      setError(errorMessage);
      console.error('Error validating API credentials:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create and prepare meeting for immediate joining
  const createAndJoinMeeting = useCallback(async (trainingData) => {
    try {
      const meetingData = {
        topic: trainingData.title || 'Live VA Training Session'
      };

      const result = await createMeeting(meetingData);
      
      // Return configuration for VideoSDKMeeting component
      return {
        meetingInfo: result.meeting,
        meetingConfig: {
          roomId: result.meeting.roomId,
          token: result.token,
          participantName: trainingData.userName || trainingData.participantName || 'Participant'
        }
      };
    } catch (err) {
      console.error('Error creating and joining meeting:', err);
      throw err;
    }
  }, [createMeeting]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear active meeting
  const clearActiveMeeting = useCallback(() => {
    setActiveMeeting(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    activeMeeting,
    
    // Actions
    createMeeting,
    getMeeting,
    listMeetings,
    generateToken,
    validateApiKey,
    createAndJoinMeeting,
    clearError,
    clearActiveMeeting
  };
};

// Keep backward compatibility alias
export const useZoom = useVideoSDK;