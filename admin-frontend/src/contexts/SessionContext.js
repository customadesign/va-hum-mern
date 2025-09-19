import React, { createContext, useContext, useState, useEffect } from 'react';
import Modal from '../components/ui/Modal';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Session timeout duration (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  // Check for session expiry
  useEffect(() => {
    const checkSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        setSessionExpired(true);
        setShowExpiredModal(true);
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastActivity]);

  // Update last activity on user interaction
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('Connection restored', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showNotification('You are offline. Some features may not work.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSessionExpiredOk = () => {
    window.location.href = '/login';
  };

  const handleSessionExpiredCancel = () => {
    setShowExpiredModal(false);
    setSessionExpired(false);
  };

  const refreshSession = () => {
    setLastActivity(Date.now());
    setSessionExpired(false);
  };

  const extendSession = () => {
    setLastActivity(Date.now());
    showNotification('Session extended', 'success');
  };

  const value = {
    sessionExpired,
    isOnline,
    lastActivity,
    refreshSession,
    extendSession,
    setLastActivity,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
      
      {/* Session Expired Modal */}
      <Modal
        open={showExpiredModal}
        onOk={handleSessionExpiredOk}
        onCancel={handleSessionExpiredCancel}
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
            <span>Session Expired</span>
          </div>
        }
        okText="Login"
        cancelText="Cancel"
      >
        <p className="text-gray-600 dark:text-gray-400">
          Your session has expired due to inactivity. Please log in again.
        </p>
      </Modal>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'warning' ? 'bg-yellow-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </SessionContext.Provider>
  );
};