import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notification, Badge, Button, List, Typography, Space, Tag, Avatar, Empty, Spin } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  MessageOutlined,
  NotificationOutlined,
  WarningOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { adminAPI } from '../../services/api';
import '../../styles/modern-notifications.css';

const { Text, Title } = Typography;

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from various sources
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const notificationsList = [];
      
      // Fetch recent announcements
      try {
        const announcementsResponse = await adminAPI.getAnnouncementsAdmin({ limit: 5 });
        const announcements = announcementsResponse.data.announcements || [];
        
        // Convert announcements to notifications
        announcements.forEach(announcement => {
          notificationsList.push({
            id: `announcement-${announcement._id}`,
            type: announcement.priority === 'high' ? 'warning' : 'info',
            title: 'New Announcement',
            message: announcement.title,
            content: announcement.content,
            timestamp: new Date(announcement.createdAt),
            read: false,
            category: 'announcement',
            icon: <NotificationOutlined />,
            data: announcement
          });
        });
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }

      // Fetch recent intercepted messages
      try {
        const messagesResponse = await adminAPI.getInterceptedConversations({ limit: 5 });
        const conversations = messagesResponse.data.conversations || [];
        
        // Convert conversations to notifications
        conversations.forEach(conversation => {
          const latestMessage = conversation.messages?.[conversation.messages.length - 1];
          if (latestMessage && !conversation.isRead) {
            notificationsList.push({
              id: `message-${conversation._id}`,
              type: 'info',
              title: 'New Message',
              message: `Message from ${conversation.senderEmail || 'Unknown'}`,
              content: latestMessage.content || conversation.subject,
              timestamp: new Date(conversation.createdAt),
              read: false,
              category: 'message',
              icon: <MessageOutlined />,
              data: conversation
            });
          }
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
      }

      // Fetch recent VA registrations
      try {
        const vasResponse = await adminAPI.getVAs({ limit: 5, sort: '-createdAt' });
        const recentVAs = vasResponse.data.vas || [];
        
        recentVAs.forEach(va => {
          if (!va.isApproved) {
            notificationsList.push({
              id: `va-${va._id}`,
              type: 'success',
              title: 'New VA Registration',
              message: `${va.name || va.email} has registered and needs approval`,
              timestamp: new Date(va.createdAt),
              read: false,
              category: 'registration',
              icon: <UserAddOutlined />,
              data: va
            });
          }
        });
      } catch (error) {
        console.error('Error fetching VAs:', error);
      }

      // Fetch recent Business registrations
      try {
        const businessesResponse = await adminAPI.getBusinesses({ limit: 5, sort: '-createdAt' });
        const recentBusinesses = businessesResponse.data.businesses || [];
        
        recentBusinesses.forEach(business => {
          if (!business.isApproved) {
            notificationsList.push({
              id: `business-${business._id}`,
              type: 'success',
              title: 'New Business Registration',
              message: `${business.businessName || business.email} has registered and needs approval`,
              timestamp: new Date(business.createdAt),
              read: false,
              category: 'registration',
              icon: <UserAddOutlined />,
              data: business
            });
          }
        });
      } catch (error) {
        console.error('Error fetching businesses:', error);
      }

      // Add system notifications
      const systemNotifications = [
        {
          id: 'system-1',
          type: 'info',
          title: 'System Status',
          message: 'All systems are operational',
          timestamp: new Date(),
          read: true,
          category: 'system',
          icon: <InfoCircleOutlined />,
        }
      ];

      // Combine and sort all notifications by timestamp
      const allNotifications = [...notificationsList, ...systemNotifications]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20); // Keep only 20 most recent

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Set some default notifications on error
      setNotifications([
        {
          id: 'error-1',
          type: 'error',
          title: 'Error Loading Notifications',
          message: 'Unable to fetch notifications. Please refresh to try again.',
          timestamp: new Date(),
          read: false,
          category: 'system',
          icon: <ExclamationCircleOutlined />,
        }
      ]);
      setUnreadCount(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const showNotification = (type, title, message, duration = 4.5) => {
    const config = {
      message: title,
      description: message,
      duration,
      placement: 'topRight',
    };

    switch (type) {
      case 'success':
        notification.success(config);
        break;
      case 'error':
        notification.error(config);
        break;
      case 'warning':
        notification.warning(config);
        break;
      case 'info':
      default:
        notification.info(config);
        break;
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    showNotification(
      newNotification.type,
      newNotification.title,
      newNotification.message
    );
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (id) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'orange';
      case 'info':
      default:
        return 'blue';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'announcement':
        return 'purple';
      case 'message':
        return 'blue';
      case 'registration':
        return 'green';
      case 'system':
        return 'gray';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const NotificationList = () => (
    <div className="modern-notification-list">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      ) : notifications.length === 0 ? (
        <Empty 
          description="No notifications" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              className={`modern-notification-item ${item.read ? 'read' : 'unread'}`}
              style={{ 
                borderLeft: !item.read ? '3px solid #1890ff' : 'none',
                backgroundColor: !item.read ? '#f0f5ff' : 'transparent',
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <List.Item.Meta
                avatar={
                  <div className="notification-avatar" style={{ fontSize: '20px' }}>
                    {item.icon || getNotificationIcon(item.type)}
                  </div>
                }
                title={
                  <div className="notification-title">
                    <Text strong={!item.read} style={{ fontSize: '14px' }}>
                      {item.title}
                    </Text>
                    <div className="notification-meta" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <Tag 
                        color={getNotificationColor(item.type)} 
                        size="small"
                      >
                        {item.type}
                      </Tag>
                      {item.category && (
                        <Tag 
                          color={getCategoryColor(item.category)} 
                          size="small"
                        >
                          {item.category}
                        </Tag>
                      )}
                      {!item.read && (
                        <div 
                          className="unread-indicator" 
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#1890ff',
                            animation: 'pulse 2s infinite'
                          }}
                        />
                      )}
                    </div>
                  </div>
                }
                description={
                  <div className="notification-content">
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {item.message}
                    </Text>
                    {item.content && (
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: '12px', 
                          display: 'block',
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}
                      >
                        {item.content.substring(0, 100)}...
                      </Text>
                    )}
                    <Text 
                      type="secondary" 
                      className="notification-timestamp"
                      style={{ 
                        fontSize: '11px', 
                        display: 'block',
                        marginTop: '8px'
                      }}
                    >
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </div>
                }
              />
              <div className="notification-actions" style={{ display: 'flex', gap: '4px' }}>
                {!item.read && (
                  <Button
                    type="text"
                    size="small"
                    onClick={() => markAsRead(item.id)}
                    style={{ fontSize: '12px' }}
                  >
                    Mark as read
                  </Button>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => removeNotification(item.id)}
                />
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    showNotification,
    NotificationList,
    refreshNotifications: fetchNotifications,
    loading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};