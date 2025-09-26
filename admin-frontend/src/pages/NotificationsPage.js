import React, { useState, useEffect, useCallback } from 'react';
import { Card, List, Badge, Button, Empty, Spin, Tabs, Select, DatePicker, Space, Typography, message, Popconfirm } from 'antd';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '../services/api';

dayjs.extend(relativeTime);
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    type: null,
    priority: null,
    dateRange: null,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        unreadOnly: activeTab === 'unread',
      };

      // Add filters if present
      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].toISOString();
        params.endDate = filters.dateRange[1].toISOString();
      }

      const response = await api.get('/admin/notifications', { params });

      if (response.data.success) {
        setNotifications(response.data.data || []);
        setPagination({
          ...pagination,
          total: response.data.pagination?.total || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      message.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, activeTab, filters]);

  useEffect(() => {
    fetchNotifications();
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
      message.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      message.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/admin/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      message.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      message.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/admin/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      message.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      message.error('Failed to delete notification');
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      await api.post('/admin/notifications/bulk-delete', {
        notificationIds: notifications.map(n => n.id)
      });
      setNotifications([]);
      message.success('All notifications deleted');
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      message.error('Failed to delete all notifications');
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type, priority) => {
    const iconClass = `h-5 w-5 ${priority === 'critical' ? 'animate-pulse' : ''}`;
    
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
      case 'error':
        return <XCircleIcon className={`${iconClass} text-red-600`} />;
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClass} text-amber-600`} />;
      case 'system':
        return <SparklesIcon className={`${iconClass} text-purple-600`} />;
      case 'info':
      default:
        return <InformationCircleIcon className={`${iconClass} text-blue-600`} />;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'default',
    };
    
    return (
      <Badge
        color={colors[priority] || 'default'}
        text={priority?.toUpperCase() || 'NORMAL'}
      />
    );
  };

  // Render notification item
  const renderNotificationItem = (notification) => {
    const isUnread = !notification.read;
    
    return (
      <List.Item
        key={notification.id}
        className={`notification-list-item ${isUnread ? 'unread' : ''}`}
        style={{
          background: isUnread ? '#f0f9ff' : 'white',
          borderLeft: isUnread ? '4px solid #3b82f6' : 'none',
          padding: '16px',
          marginBottom: '8px',
          borderRadius: '8px',
          transition: 'all 0.3s',
        }}
        actions={[
          !notification.read && (
            <Button
              type="link"
              icon={<CheckIcon className="h-4 w-4" />}
              onClick={() => markAsRead(notification.id)}
            >
              Mark as read
            </Button>
          ),
          <Popconfirm
            title="Delete this notification?"
            onConfirm={() => deleteNotification(notification.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<TrashIcon className="h-4 w-4" />}
            >
              Delete
            </Button>
          </Popconfirm>
        ].filter(Boolean)}
      >
        <List.Item.Meta
          avatar={
            <div className="notification-icon-container">
              {getNotificationIcon(notification.type, notification.priority)}
            </div>
          }
          title={
            <div className="flex items-center gap-2">
              <span className="font-semibold">{notification.title}</span>
              {getPriorityBadge(notification.priority)}
              {isUnread && (
                <Badge dot status="processing" />
              )}
            </div>
          }
          description={
            <div>
              <p className="text-gray-600 mb-2">{notification.message}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{dayjs(notification.timestamp || notification.createdAt).fromNow()}</span>
                <span>•</span>
                <span>{dayjs(notification.timestamp || notification.createdAt).format('MMM D, YYYY h:mm A')}</span>
              </div>
              {notification.data?.action && (
                <Button
                  type="primary"
                  size="small"
                  className="mt-2"
                  onClick={() => window.location.href = notification.data.action.url}
                >
                  {notification.data.action.label}
                </Button>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <div className="notifications-page">
      <div className="mb-6">
        <Title level={2} className="flex items-center gap-2">
          <BellIcon className="h-8 w-8 text-blue-600" />
          Notifications Center
        </Title>
        <Text type="secondary">
          Manage and review all your system notifications
        </Text>
      </div>

      <Card className="shadow-sm">
        {/* Action Bar */}
        <div className="mb-4 flex justify-between items-center">
          <Space>
            <Button
              icon={<ArrowPathIcon className="h-4 w-4" />}
              onClick={fetchNotifications}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              icon={<CheckIcon className="h-4 w-4" />}
              onClick={markAllAsRead}
              disabled={notifications.every(n => n.read)}
            >
              Mark all as read
            </Button>
            <Popconfirm
              title="Delete all notifications?"
              description="This action cannot be undone."
              onConfirm={deleteAllNotifications}
              okText="Yes, delete all"
              cancelText="Cancel"
            >
              <Button
                danger
                icon={<TrashIcon className="h-4 w-4" />}
                disabled={notifications.length === 0}
              >
                Delete all
              </Button>
            </Popconfirm>
          </Space>

          {/* Filters */}
          <Space>
            <Select
              placeholder="Filter by type"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setFilters({ ...filters, type: value })}
              options={[
                { value: 'info', label: 'Info' },
                { value: 'success', label: 'Success' },
                { value: 'warning', label: 'Warning' },
                { value: 'error', label: 'Error' },
                { value: 'system', label: 'System' },
              ]}
            />
            <Select
              placeholder="Filter by priority"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setFilters({ ...filters, priority: value })}
              options={[
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <RangePicker
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              format="YYYY-MM-DD"
            />
          </Space>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="notifications-tabs"
        >
          <TabPane
            tab={
              <span>
                All Notifications
                <Badge
                  count={notifications.length}
                  showZero
                  className="ml-2"
                  style={{ backgroundColor: '#52c41a' }}
                />
              </span>
            }
            key="all"
          />
          <TabPane
            tab={
              <span>
                Unread
                <Badge
                  count={notifications.filter(n => !n.read).length}
                  className="ml-2"
                />
              </span>
            }
            key="unread"
          />
        </Tabs>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <List
            dataSource={notifications}
            renderItem={renderNotificationItem}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => {
                setPagination({
                  ...pagination,
                  current: page,
                  pageSize,
                });
              },
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} notifications`,
            }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-gray-500">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications found'}
              </span>
            }
          />
        )}
      </Card>

      <style jsx>{`
        .notification-list-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .notification-icon-container {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 8px;
        }
        
        .notifications-tabs .ant-tabs-tab {
          font-weight: 500;
        }
        
        .notifications-tabs .ant-badge {
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;