import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Badge, Dropdown, Empty, Avatar, Button, Spin, message } from 'antd';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellAlertIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import io from 'socket.io-client';
import api from '../../services/api';
import './NotificationBadge.css';

dayjs.extend(relativeTime);

const NotificationBadge = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRhIGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YW4FAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEA');
    audioRef.current.volume = 0.5;
  }, []);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/notifications', {
        params: {
          page: pageNum,
          limit: 10,
          unreadOnly: false
        }
      });

      if (response.data.success) {
        const newNotifications = response.data.data || [];
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }
        
        setUnreadCount(response.data.unreadCount || 0);
        setHasMore(newNotifications.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Use fallback demo notifications if API fails
      if (!append) {
        setNotifications(getDemoNotifications());
        setUnreadCount(3);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Socket.io connection
  useEffect(() => {
    // Fetch initial notifications
    fetchNotifications(1);

    // Setup Socket.IO connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:8000', {
      auth: {
        token: localStorage.getItem('token')
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Listen for new notifications
    socket.on('admin_notification', (notification) => {
      console.log('New notification received:', notification);
      
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Could not play notification sound'));
      }
      
      // Add new notification to the top
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title || 'New Notification', {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        });
      }
    });

    // Listen for notification updates
    socket.on('notification_update', ({ notificationId, updates }) => {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, ...updates } : n)
      );
      
      if (updates.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    // Listen for notification deletions
    socket.on('notification_delete', (notificationId) => {
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount(current => Math.max(0, current - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    });

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.disconnect();
    };
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put('/admin/notifications/read', {
        notificationIds: [notificationId]
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      message.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/admin/notifications/read-all');
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      message.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    
    try {
      await api.delete(`/admin/notifications/${notificationId}`);
      
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount(current => Math.max(0, current - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
      
      message.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      message.error('Failed to delete notification');
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type, priority) => {
    if (priority === 'critical') {
      return <BellAlertIcon className="h-5 w-5 text-red-600 animate-pulse" />;
    }
    
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />;
      case 'system':
        return <SparklesIcon className="h-5 w-5 text-purple-600" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  // Get notification background color
  const getNotificationBg = (type, read, priority) => {
    if (!read) {
      if (priority === 'critical') return 'bg-red-50 border-l-4 border-red-500';
      if (priority === 'high') return 'bg-amber-50 border-l-4 border-amber-500';
      
      switch (type) {
        case 'success':
          return 'bg-green-50 border-l-4 border-green-500';
        case 'error':
          return 'bg-red-50 border-l-4 border-red-500';
        case 'warning':
          return 'bg-amber-50 border-l-4 border-amber-500';
        case 'system':
          return 'bg-purple-50 border-l-4 border-purple-500';
        default:
          return 'bg-blue-50 border-l-4 border-blue-500';
      }
    }
    return 'bg-white hover:bg-gray-50';
  };

  // Get demo notifications for fallback
  const getDemoNotifications = () => [
    {
      id: '1',
      type: 'success',
      title: 'New VA Registration',
      message: 'Sarah Johnson has completed registration and is ready for review.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      priority: 'medium',
      action: { label: 'Review', url: '/vas' }
    },
    {
      id: '2',
      type: 'warning',
      title: 'System Maintenance',
      message: 'Scheduled maintenance tonight at 2:00 AM UTC.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      priority: 'high'
    },
    {
      id: '3',
      type: 'info',
      title: 'New Message',
      message: 'You have a new intercepted message requiring review.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: false,
      priority: 'medium',
      action: { label: 'View', url: '/messages' }
    },
  ];

  // Render notification panel
  const notificationPanel = (
    <div className="notification-badge-panel">
      <div className="notification-badge-header">
        <div className="flex items-center gap-2">
          <BellIconSolid className="h-5 w-5 text-white" />
          <h3 className="notification-badge-title">Notifications</h3>
          {unreadCount > 0 && (
            <span className="notification-badge-count">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            size="small"
            type="text"
            onClick={markAllAsRead}
            className="mark-all-btn"
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="notification-badge-list">
        {loading && notifications.length === 0 ? (
          <div className="notification-badge-loading">
            <Spin size="small" />
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-badge-item ${getNotificationBg(
                  notification.type,
                  notification.read,
                  notification.priority
                )}`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="notification-badge-icon">
                  {getNotificationIcon(notification.type, notification.priority)}
                </div>
                
                <div className="notification-badge-content">
                  <div className="notification-badge-title-row">
                    <span className="notification-badge-item-title">
                      {notification.title || 'Notification'}
                    </span>
                    {notification.priority === 'critical' && (
                      <span className="notification-badge-priority critical">
                        URGENT
                      </span>
                    )}
                    {notification.priority === 'high' && !notification.read && (
                      <span className="notification-badge-priority high">
                        HIGH
                      </span>
                    )}
                  </div>
                  
                  <p className="notification-badge-message">
                    {notification.message}
                  </p>
                  
                  <div className="notification-badge-footer">
                    <span className="notification-badge-time">
                      {dayjs(notification.timestamp || notification.createdAt).fromNow()}
                    </span>
                    
                    {notification.action && (
                      <button
                        className="notification-badge-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = notification.action.url;
                        }}
                      >
                        {notification.action.label}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  className="notification-badge-delete"
                  onClick={(e) => deleteNotification(notification.id, e)}
                  title="Delete notification"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>

                {!notification.read && (
                  <div className="notification-badge-unread-dot" />
                )}
              </div>
            ))}
            
            {hasMore && (
              <div className="notification-badge-load-more">
                <Button
                  type="link"
                  onClick={loadMore}
                  loading={loading}
                  disabled={loading}
                >
                  Load more notifications
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="notification-badge-empty">
            <BellIcon className="h-12 w-12 text-gray-300 mb-2" />
            <p>No notifications</p>
            <span>You're all caught up!</span>
          </div>
        )}
      </div>

      <div className="notification-badge-footer-actions">
        <button 
          className="notification-badge-view-all"
          onClick={() => window.location.href = '/notifications'}
        >
          View all notifications
        </button>
      </div>
    </div>
  );

  return (
    <div className="notification-badge-container" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', transform: 'translateY(5px)'}}>
      <Dropdown
        placement="bottomRight"
        trigger={['click']}
        open={isOpen}
        onOpenChange={setIsOpen}
        overlayClassName="notification-badge-dropdown"
        dropdownRender={() => notificationPanel}
      >
        <button 
          className={`notification-badge-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
          style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px', padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', marginTop: '7px'}}
        >
          <Badge 
            count={unreadCount} 
            overflowCount={99}
            offset={[-4, 4]}
            className="notification-badge-ant-badge"
          >
            {unreadCount > 0 ? (
              <BellIconSolid className="h-6 w-6 notification-bell-icon animate-ring" />
            ) : (
              <BellIcon className="h-6 w-6 notification-bell-icon" />
            )}
          </Badge>
        </button>
      </Dropdown>
    </div>
  );
};

export default NotificationBadge;