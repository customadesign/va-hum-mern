import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.admin) {
      if (socket) {
        console.log('[SocketContext] Disconnecting socket - user not authenticated or not admin');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    console.log('[SocketContext] Initializing Socket.io connection to:', socketUrl);

    const newSocket = io(`${socketUrl}/engagements`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('[SocketContext] Connected to /engagements namespace');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[SocketContext] Disconnected from /engagements namespace:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[SocketContext] Connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('[SocketContext] Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
      toast.success('Reconnected to real-time updates');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('[SocketContext] Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[SocketContext] Failed to reconnect after maximum attempts');
      toast.error('Failed to connect to real-time updates', {
        autoClose: false,
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('[SocketContext] Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleEngagementUpdate = (data) => {
      console.log('[SocketContext] Received engagement update:', data);

      queryClient.invalidateQueries({ queryKey: ['admin-engagements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });

      if (data.businessId) {
        queryClient.invalidateQueries({
          queryKey: ['admin-engagements', { businessId: data.businessId }]
        });
      }

      toast.info('Engagement data updated', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: true,
      });
    };

    const handleEngagementCreated = (data) => {
      console.log('[SocketContext] Engagement created:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-engagements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });

      toast.success('New engagement created', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    };

    const handleEngagementDeleted = (data) => {
      console.log('[SocketContext] Engagement deleted:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-engagements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });

      toast.info('Engagement removed', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    };

    const handleEngagementStatusChanged = (data) => {
      console.log('[SocketContext] Engagement status changed:', data);
      queryClient.invalidateQueries({ queryKey: ['admin-engagements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    };

    socket.on('engagement:updated', handleEngagementUpdate);
    socket.on('engagement:created', handleEngagementCreated);
    socket.on('engagement:deleted', handleEngagementDeleted);
    socket.on('engagement:status:changed', handleEngagementStatusChanged);

    return () => {
      socket.off('engagement:updated', handleEngagementUpdate);
      socket.off('engagement:created', handleEngagementCreated);
      socket.off('engagement:deleted', handleEngagementDeleted);
      socket.off('engagement:status:changed', handleEngagementStatusChanged);
    };
  }, [socket, isConnected, queryClient]);

  const joinBusinessRoom = (businessId) => {
    if (socket && isConnected) {
      console.log('[SocketContext] Joining business room:', businessId);
      socket.emit('join-business', businessId);
    }
  };

  const leaveBusinessRoom = (businessId) => {
    if (socket && isConnected) {
      console.log('[SocketContext] Leaving business room:', businessId);
      socket.emit('leave-business', businessId);
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    joinBusinessRoom,
    leaveBusinessRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;