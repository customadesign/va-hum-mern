import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, ChatBubbleLeftIcon, UserPlusIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService';
import { useAuth } from '../contexts/HybridAuthContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'message':
      return <ChatBubbleLeftIcon className="h-6 w-6 text-blue-500" />;
    case 'referral':
      return <UserPlusIcon className="h-6 w-6 text-green-500" />;
    case 'profile_view':
      return <UserPlusIcon className="h-6 w-6 text-purple-500" />;
    default:
      return <BellIcon className="h-6 w-6 text-gray-500" />;
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [user, filter, page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        unreadOnly: filter === 'unread'
      };
      const response = await getNotifications(params);
      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.readAt) return;
    
    try {
      await markAsRead([notification._id]);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notification._id
            ? { ...n, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification);
    
    // Navigate based on notification type
    if (notification.type === 'message' && notification.conversation) {
      navigate(`/conversations/${notification.conversation._id}`);
    } else if (notification.type === 'profile_view' && notification.viewer) {
      navigate(`/vas/${notification.viewer._id}`);
    }
  };

  const formatNotificationDate = (dateString) => {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={classNames(
                      filter === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50',
                      'px-3 py-1 rounded-md text-sm font-medium border border-gray-300'
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={classNames(
                      filter === 'unread'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50',
                      'px-3 py-1 rounded-md text-sm font-medium border border-gray-300'
                    )}
                  >
                    Unread
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={classNames(
                    'px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150',
                    !notification.readAt && 'bg-blue-50 hover:bg-blue-100'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={classNames(
                        'text-sm',
                        !notification.readAt ? 'font-semibold text-gray-900' : 'text-gray-700'
                      )}>
                        {notification.messageText}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatNotificationDate(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      {!notification.readAt && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={classNames(
                    page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50',
                    'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium'
                  )}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={classNames(
                    page === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50',
                    'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium'
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}