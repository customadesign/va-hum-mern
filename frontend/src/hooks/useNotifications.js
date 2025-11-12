import { useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Don't set to 0 on error, keep previous value
      // setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Only fetch if we have a user
    if (user) {
      fetchUnreadCount();

      // Poll for new notifications every 30 seconds ONLY when user is authenticated
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      // No user, clear unread count and stop polling
      setUnreadCount(0);
    }
  }, [fetchUnreadCount, user]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount
  };
};