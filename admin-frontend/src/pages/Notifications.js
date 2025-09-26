import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BellIcon,
  EyeIcon,
  TrashIcon,
  CheckIcon,
  InboxArrowDownIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  FolderOpenIcon,
  CalendarIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  SparklesIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid, StarIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';
import moment from 'moment';

// Helper functions for notification formatting
const getNotificationTitle = (type) => {
  const titles = {
    'new_message': 'New Message',
    'new_conversation': 'New Conversation Started',
    'profile_view': 'Someone Viewed Your Profile',
    'profile_reminder': 'Complete Your Profile',
    'va_added': 'New VA Joined',
    'business_added': 'New Business Joined',
    'admin_notification': 'Admin Notification',
    'system_announcement': 'System Announcement',
    'referral_joined': 'Your Referral Joined',
    'celebration_package': 'Celebration Package Request',
    'hiring_invoice': 'Hiring Invoice Request'
  };
  return titles[type] || 'Notification';
};

const getCategoryFromType = (type) => {
  const categoryMap = {
    'new_message': 'messages',
    'new_conversation': 'messages',
    'profile_view': 'activity',
    'profile_reminder': 'system',
    'va_added': 'users',
    'business_added': 'users',
    'admin_notification': 'admin',
    'system_announcement': 'system',
    'referral_joined': 'users',
    'celebration_package': 'requests',
    'hiring_invoice': 'requests'
  };
  return categoryMap[type] || 'other';
};

const getNotificationIcon = (type, category) => {
  if (category === 'announcement') return <BellAlertIcon className="h-5 w-5" />;
  if (category === 'message') return <ChatBubbleLeftIcon className="h-5 w-5" />;
  if (category === 'registration') return <UserPlusIcon className="h-5 w-5" />;
  
  switch (type) {
    case 'success': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
    case 'error': return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
    default: return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
  }
};

const getNotificationColor = (type) => {
  const colorMap = {
    'new_message': 'blue',
    'new_conversation': 'blue',
    'profile_view': 'purple',
    'profile_reminder': 'amber',
    'va_added': 'green',
    'business_added': 'green',
    'admin_notification': 'red',
    'system_announcement': 'indigo',
    'referral_joined': 'cyan',
    'celebration_package': 'green',
    'hiring_invoice': 'amber'
  };
  return colorMap[type] || 'gray';
};

const getCategoryBadgeStyle = (category) => {
  const styles = {
    announcement: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white',
    message: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    registration: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    system: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
    admin: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    requests: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    activity: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
    users: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white',
    other: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
  };
  return styles[category] || styles.other;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [archivedNotifications, setArchivedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedArchivedKeys, setSelectedArchivedKeys] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [archivePage, setArchivePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    type: 'all',
    dateRange: null,
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslation();

  const queryClient = useQueryClient();

  // Fetch notifications from various sources (optimized for performance)
  const fetchNotifications = useCallback(async () => {
    // Show immediate loading feedback but load cached data first
    if (initialLoad) {
      setLoading(true);
      
      // Load cached notifications from localStorage for immediate display
      const cachedNotifications = localStorage.getItem('cachedNotifications');
      if (cachedNotifications) {
        try {
          const parsed = JSON.parse(cachedNotifications);
          const cacheAge = Date.now() - parsed.timestamp;
          // Use cache if less than 2 minutes old
          if (cacheAge < 2 * 60 * 1000) {
            setNotifications(parsed.notifications);
            setStats(parsed.stats);
            setLoading(false);
            setInitialLoad(false);
            // Continue with fresh data fetch in background
          }
        } catch (e) {
          console.log('Cache parse error:', e);
        }
      }
    } else {
      setLoading(true);
    }
    
    try {
      const notificationsList = [];
      
      // Use Promise.allSettled to parallelize API calls for better performance
      const [
        announcementsResult,
        messagesResult,
        vasResult,
        businessesResult
      ] = await Promise.allSettled([
        adminAPI.getAnnouncementsAdmin({ limit: 20 }), // Reduced from 100 to 20
        adminAPI.getInterceptedConversations({ limit: 20 }), // Reduced from 100 to 20
        adminAPI.getVAs({ limit: 10, sort: '-createdAt' }), // Reduced from 50 to 10
        adminAPI.getBusinesses({ limit: 10, sort: '-createdAt' }) // Reduced from 50 to 10
      ]);

      // Process announcements
      if (announcementsResult.status === 'fulfilled') {
        const announcements = announcementsResult.value?.data?.announcements || [];
        announcements.forEach(announcement => {
          notificationsList.push({
            id: `announcement-${announcement._id}`,
            type: announcement.priority === 'high' ? 'warning' : 'info',
            title: announcement.title,
            message: announcement.content,
            timestamp: new Date(announcement.createdAt),
            status: 'unread',
            category: 'announcement',
            source: 'Announcements',
            data: announcement,
            priority: announcement.priority || 'medium'
          });
        });
      } else {
        console.error('Error fetching announcements:', announcementsResult.reason);
      }

      // Process intercepted messages
      if (messagesResult.status === 'fulfilled') {
        const conversations = messagesResult.value?.data?.conversations || [];
        conversations.forEach(conversation => {
          const latestMessage = conversation.messages?.[conversation.messages.length - 1];
          notificationsList.push({
            id: `message-${conversation._id}`,
            type: 'info',
            title: `Message from ${conversation.senderEmail || 'Unknown'}`,
            message: latestMessage?.content || conversation.subject || 'New message',
            timestamp: new Date(conversation.createdAt),
            status: conversation.isRead ? 'read' : 'unread',
            category: 'message',
            source: 'Messages',
            data: conversation
          });
        });
      } else {
        console.error('Error fetching messages:', messagesResult.reason);
      }

      // Process VA registrations
      if (vasResult.status === 'fulfilled') {
        const recentVAs = vasResult.value?.data?.vas || [];
        recentVAs.forEach(va => {
          if (!va.isApproved) {
            notificationsList.push({
              id: `va-${va._id}`,
              type: 'success',
              title: 'New VA Registration',
              message: `${va.name || va.email} has registered and needs approval`,
              timestamp: new Date(va.createdAt),
              status: 'unread',
              category: 'registration',
              source: 'VA Registrations',
              data: va
            });
          }
        });
      } else {
        console.error('Error fetching VAs:', vasResult.reason);
      }

      // Process Business registrations
      if (businessesResult.status === 'fulfilled') {
        const recentBusinesses = businessesResult.value?.data?.businesses || [];
        recentBusinesses.forEach(business => {
          if (!business.isApproved) {
            notificationsList.push({
              id: `business-${business._id}`,
              type: 'success',
              title: 'New Business Registration',
              message: `${business.businessName || business.email} has registered and needs approval`,
              timestamp: new Date(business.createdAt),
              status: 'unread',
              category: 'registration',
              source: 'Business Registrations',
              data: business
            });
          }
        });
      } else {
        console.error('Error fetching businesses:', businessesResult.reason);
      }

      // Add system notifications
      const systemNotifications = [
        {
          id: 'system-welcome',
          type: 'info',
          title: 'Welcome to Notifications',
          message: 'This is your centralized notification center. You can manage all platform notifications here.',
          timestamp: new Date(),
          status: 'read',
          category: 'system',
          source: 'System',
          priority: 'low'
        }
      ];

      // Combine and sort all notifications
      const allNotifications = [...notificationsList, ...systemNotifications]
        .sort((a, b) => b.timestamp - a.timestamp);

      // Load saved notification states from localStorage
      const savedStates = JSON.parse(localStorage.getItem('notificationStates') || '{}');
      const finalNotifications = allNotifications.map(notif => ({
        ...notif,
        status: savedStates[notif.id]?.status || notif.status,
        archived: savedStates[notif.id]?.archived || false
      }));

      setNotifications(finalNotifications);
      
      // Calculate stats
      const unreadCount = finalNotifications.filter(n => n.status === 'unread' && !n.archived).length;
      const readCount = finalNotifications.filter(n => n.status === 'read' && !n.archived).length;
      const archivedCount = finalNotifications.filter(n => n.archived).length;
      
      const newStats = {
        total: finalNotifications.length,
        unread: unreadCount,
        read: readCount,
        archived: archivedCount
      };
      
      setStats(newStats);
      
      // Cache the results for faster future loads
      localStorage.setItem('cachedNotifications', JSON.stringify({
        notifications: finalNotifications,
        stats: newStats,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [initialLoad]);

  // Fetch archived notifications
  const fetchArchivedNotifications = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const response = await adminAPI.getArchivedNotifications({
        page: archivePage,
        limit: pageSize
      });
      
      if (response.data) {
        // Convert backend notification format to frontend format
        const formattedNotifications = response.data.map(notif => ({
          id: notif._id || notif.id,
          title: notif.title || notif.params?.title || getNotificationTitle(notif.type),
          message: notif.params?.message || notif.message || '',
          type: notif.type,
          category: getCategoryFromType(notif.type),
          timestamp: notif.createdAt,
          archivedAt: notif.archivedAt,
          status: notif.readAt ? 'read' : 'unread',
          archived: true,
          source: notif.params?.source || 'System',
          readAt: notif.readAt,
          params: notif.params || {}
        }));
        
        setArchivedNotifications(formattedNotifications);
        setStats(prev => ({
          ...prev,
          archived: response.pagination?.total || formattedNotifications.length || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching archived notifications:', error);
      // Fallback to localStorage for archived notifications
      const savedStates = JSON.parse(localStorage.getItem('notificationStates') || '{}');
      const archived = Object.entries(savedStates)
        .filter(([_, state]) => state.archived)
        .map(([id, state]) => ({
          id,
          title: state.title || 'Archived Notification',
          message: state.message || 'This notification has been archived',
          type: state.type || 'info',
          category: state.category || getCategoryFromType(state.type) || 'other',
          timestamp: state.timestamp || state.archivedAt,
          archivedAt: state.archivedAt || new Date().toISOString(),
          status: state.status || 'read',
          archived: true,
          source: state.source || 'System',
          priority: state.priority || 'medium',
          data: state.data || {}
        }));
      setArchivedNotifications(archived);
    } finally {
      setArchiveLoading(false);
    }
  }, [archivePage, pageSize]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (activeTab === 'archive') {
      fetchArchivedNotifications();
    }
  }, [activeTab, fetchArchivedNotifications]);

  // Save notification state to localStorage
  const saveNotificationState = (notifId, updates, fullNotification = null) => {
    const savedStates = JSON.parse(localStorage.getItem('notificationStates') || '{}');
    savedStates[notifId] = { ...savedStates[notifId], ...updates };
    
    // If archiving, save the full notification data
    if (updates.archived && fullNotification) {
      savedStates[notifId] = {
        ...savedStates[notifId],
        title: fullNotification.title,
        message: fullNotification.message,
        type: fullNotification.type,
        category: fullNotification.category,
        source: fullNotification.source,
        timestamp: fullNotification.timestamp,
        priority: fullNotification.priority,
        data: fullNotification.data
      };
    }
    
    localStorage.setItem('notificationStates', JSON.stringify(savedStates));
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => {
        if (notif.id === notificationId) {
          const updated = { ...notif, status: 'read' };
          saveNotificationState(notificationId, { status: 'read' });
          return updated;
        }
        return notif;
      })
    );
    toast.success('Marked as read');
    fetchNotifications(); // Refresh stats
  };

  // Mark multiple as read
  const markSelectedAsRead = () => {
    selectedRowKeys.forEach(key => {
      saveNotificationState(key, { status: 'read' });
    });
    setNotifications(prev => 
      prev.map(notif => 
        selectedRowKeys.includes(notif.id) 
          ? { ...notif, status: 'read' }
          : notif
      )
    );
    setSelectedRowKeys([]);
    toast.success(`Marked ${selectedRowKeys.length} notifications as read`);
    fetchNotifications(); // Refresh stats
  };

  // Archive notification
  const archiveNotification = async (notificationId) => {
    const notificationToArchive = notifications.find(n => n.id === notificationId);
    
    try {
      await adminAPI.archiveNotification(notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      saveNotificationState(notificationId, { archived: true, status: 'read', archivedAt: new Date().toISOString() }, notificationToArchive);
      toast.success('Notification archived');
      fetchNotifications();
      if (activeTab === 'archive') {
        fetchArchivedNotifications();
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
      // Fallback to local storage
      setNotifications(prev =>
        prev.map(notif => {
          if (notif.id === notificationId) {
            const updated = { ...notif, archived: true, status: 'read' };
            saveNotificationState(notificationId, { archived: true, status: 'read', archivedAt: new Date().toISOString() }, notif);
            return updated;
          }
          return notif;
        })
      );
      toast.success('Notification archived');
      fetchNotifications();
    }
  };

  // Unarchive notification
  const unarchiveNotification = async (notificationId) => {
    try {
      await adminAPI.unarchiveNotification(notificationId);
      
      setArchivedNotifications(prev => prev.filter(n => n.id !== notificationId));
      const savedStates = JSON.parse(localStorage.getItem('notificationStates') || '{}');
      if (savedStates[notificationId]) {
        delete savedStates[notificationId].archived;
        delete savedStates[notificationId].archivedAt;
        localStorage.setItem('notificationStates', JSON.stringify(savedStates));
      }
      toast.success('Notification unarchived');
      fetchNotifications();
      fetchArchivedNotifications();
    } catch (error) {
      console.error('Error unarchiving notification:', error);
      // Fallback to local storage
      const savedStates = JSON.parse(localStorage.getItem('notificationStates') || '{}');
      if (savedStates[notificationId]) {
        delete savedStates[notificationId].archived;
        delete savedStates[notificationId].archivedAt;
        localStorage.setItem('notificationStates', JSON.stringify(savedStates));
      }
      setArchivedNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification unarchived');
      fetchNotifications();
    }
  };

  // Archive multiple
  const archiveSelected = async () => {
    const notificationsToArchive = notifications.filter(n => selectedRowKeys.includes(n.id));
    
    try {
      await adminAPI.archiveMultipleNotifications({ ids: selectedRowKeys });
      
      setNotifications(prev => prev.filter(n => !selectedRowKeys.includes(n.id)));
      notificationsToArchive.forEach(notif => {
        saveNotificationState(notif.id, { archived: true, status: 'read', archivedAt: new Date().toISOString() }, notif);
      });
      toast.success(`Archived ${selectedRowKeys.length} notifications`);
      setSelectedRowKeys([]);
      fetchNotifications();
      if (activeTab === 'archive') {
        fetchArchivedNotifications();
      }
    } catch (error) {
      console.error('Error archiving multiple notifications:', error);
      // Fallback to local storage
      notificationsToArchive.forEach(notif => {
        saveNotificationState(notif.id, { archived: true, status: 'read', archivedAt: new Date().toISOString() }, notif);
      });
      setNotifications(prev =>
        prev.map(notif =>
          selectedRowKeys.includes(notif.id)
            ? { ...notif, archived: true, status: 'read' }
            : notif
        )
      );
      setSelectedRowKeys([]);
      toast.success(`Archived ${selectedRowKeys.length} notifications`);
      fetchNotifications();
    }
  };

  // Delete notification (permanent)
  const deleteNotification = (notificationId) => {
    if (window.confirm('Are you sure you want to permanently delete this notification?')) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const savedStates = JSON.parse(localStorage.getItem('notificationStates') || '{}');
      delete savedStates[notificationId];
      localStorage.setItem('notificationStates', JSON.stringify(savedStates));
      toast.success('Notification deleted');
      fetchNotifications(); // Refresh stats
    }
  };

  // View notification details
  const viewDetails = (notification) => {
    setSelectedNotification(notification);
    setDetailModalVisible(true);
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }
  };

  // Get filtered notifications
  const getFilteredNotifications = () => {
    let filtered = activeTab === 'active' 
      ? [...notifications].filter(n => !n.archived)
      : [...archivedNotifications];

    // Status filter (only for active tab)
    if (activeTab === 'active') {
      if (filters.status === 'unread') {
        filtered = filtered.filter(n => n.status === 'unread');
      } else if (filters.status === 'read') {
        filtered = filtered.filter(n => n.status === 'read');
      }
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(n => n.category === filters.category);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(searchLower) ||
        n.message?.toLowerCase().includes(searchLower) ||
        n.source?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (filters.sortBy === 'date') {
      const dateField = activeTab === 'archive' && filtered[0]?.archivedAt ? 'archivedAt' : 'timestamp';
      filtered.sort((a, b) => {
        const dateA = new Date(a[dateField]);
        const dateB = new Date(b[dateField]);
        return filters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading && initialLoad) {
    return (
      <div className="p-6">
        {/* Skeleton Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-lg animate-pulse">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-80"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-20 bg-white/20 rounded-lg"></div>
              <div className="h-10 w-24 bg-white/20 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Skeleton Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
                <div className="h-14 w-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header with Gradient Background */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BellIconSolid className="h-8 w-8 animate-pulse" />
              {t('notifications.center')}
            </h1>
            <p className="mt-2 text-blue-100">
              {t('notifications.manageDescription')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
              {t('common.filters')}
            </button>
            <button
              onClick={() => {
                fetchNotifications();
                if (activeTab === 'archive') {
                  fetchArchivedNotifications();
                }
              }}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
              disabled={loading || archiveLoading}
            >
              <ArrowPathIcon className={`h-5 w-5 ${(loading || archiveLoading) ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Active Card */}
        <div 
          onClick={() => setActiveTab('active')}
          className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 transition-all duration-300 cursor-pointer hover:scale-105 ${
            activeTab === 'active' ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('common.totalActive')}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {notifications.filter(n => !n.archived).length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <BellIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Unread Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('common.unread')}</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                {stats.unread}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
              <EnvelopeIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Read Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('common.read')}</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {stats.read}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Archived Card */}
        <div 
          onClick={() => setActiveTab('archive')}
          className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 transition-all duration-300 cursor-pointer hover:scale-105 ${
            activeTab === 'archive' ? 'border-purple-500 shadow-purple-500/20' : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('common.archived')}</p>
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-300 mt-2">
                {stats.archived}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg">
              <ArchiveBoxIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <BellIcon className="h-5 w-5" />
            {t('notifications.active')}
            {notifications.filter(n => !n.archived && n.status === 'unread').length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded-full">
                {notifications.filter(n => !n.archived && n.status === 'unread').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'archive'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ArchiveBoxIcon className="h-5 w-5" />
            {t('notifications.archive')}
            {stats.archived > 0 && activeTab !== 'archive' && (
              <span className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded-full">
                {stats.archived}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            {activeTab === 'active' && (
              <div>
                <select
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">{t('common.allStatus')}</option>
                  <option value="unread">{t('common.unread')}</option>
                  <option value="read">{t('common.read')}</option>
                </select>
              </div>
            )}

            {/* Category Filter */}
            <div>
              <select
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="all">{t('common.allCategories')}</option>
                <option value="announcement">{t('common.announcements')}</option>
                <option value="message">{t('common.messages')}</option>
                <option value="registration">{t('common.registrations')}</option>
                <option value="system">{t('common.system')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedRowKeys.length > 0 && activeTab === 'active' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedRowKeys.length} {t('notification')} {selectedRowKeys.length > 1 ? t('s') : ''} {t('selected')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={markSelectedAsRead}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              {t('common.markAsRead')}
            </button>
            <button
              onClick={archiveSelected}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 flex items-center gap-2"
            >
              <InboxArrowDownIcon className="h-4 w-4" />
              {t('common.archive')}
            </button>
            <button
              onClick={() => setSelectedRowKeys([])}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
            >
              {t('common.clearSelection')}
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {paginatedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            {activeTab === 'archive' ? (
              <>
                <ArchiveBoxIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{t('common.noArchivedNotifications')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {t('common.archivedNotificationsDescription')}
                </p>
              </>
            ) : (
              <>
                <BellIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{t('common.noActiveNotifications')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {t('common.activeNotificationsDescription')}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                  notification.status === 'unread' && activeTab === 'active'
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Checkbox */}
                    {activeTab === 'active' && (
                      <input
                        type="checkbox"
                        className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        checked={selectedRowKeys.includes(notification.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRowKeys([...selectedRowKeys, notification.id]);
                          } else {
                            setSelectedRowKeys(selectedRowKeys.filter(id => id !== notification.id));
                          }
                        }}
                      />
                    )}

                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg ${
                        notification.status === 'unread' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {getNotificationIcon(notification.type, notification.category)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className={`text-base font-semibold ${
                          notification.status === 'unread' 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeStyle(notification.category)}`}>
                          {notification.category}
                        </span>
                        {notification.priority === 'high' && (
                          <StarIcon className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {moment(notification.timestamp).fromNow()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {t('common.from')} {notification.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => viewDetails(notification)}
                      className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200"
                      title={t('common.viewDetails')}
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {activeTab === 'active' ? (
                      <>
                        {notification.status === 'unread' && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200"
                            title={t('common.markAsRead')}
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => archiveNotification(notification.id)}
                          className="p-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200"
                          title={t('common.archive')}
                        >
                          <InboxArrowDownIcon className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => unarchiveNotification(notification.id)}
                        className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-200"
                        title={t('common.unarchive')}
                      >
                        <FolderOpenIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                      title={t('common.delete')}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredNotifications.length > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {t('common.showing')} {((currentPage - 1) * pageSize) + 1} {t('common.to')} {Math.min(currentPage * pageSize, filteredNotifications.length)} {t('common.of')} {filteredNotifications.length} {t('common.notifications')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage * pageSize >= filteredNotifications.length}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModalVisible && selectedNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getNotificationIcon(selectedNotification.type, selectedNotification.category)}
                  <h2 className="text-xl font-bold">{t('common.notificationDetails')}</h2>
                </div>
                <button
                  onClick={() => setDetailModalVisible(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedNotification.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryBadgeStyle(selectedNotification.category)}`}>
                      {selectedNotification.category}
                    </span>
                    {selectedNotification.status === 'unread' ? (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                        {t('common.unread')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        {t('common.read')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('common.message')}</p>
                  <p className="text-gray-900 dark:text-white">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('common.source')}</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {selectedNotification.source}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('common.time')}</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {moment(selectedNotification.timestamp).format('MMM DD, YYYY h:mm A')}
                    </p>
                  </div>
                </div>

                {selectedNotification.data && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('common.additionalDetails')}</p>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedNotification.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex justify-end gap-3">
                {selectedNotification.status === 'unread' && activeTab === 'active' && (
                  <button
                    onClick={() => {
                      markAsRead(selectedNotification.id);
                      setDetailModalVisible(false);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 flex items-center gap-2"
                  >
                    <CheckIcon className="h-4 w-4" />
                    {t('common.markAsRead')}
                  </button>
                )}
                {activeTab === 'active' ? (
                  <button
                    onClick={() => {
                      archiveNotification(selectedNotification.id);
                      setDetailModalVisible(false);
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all duration-200 flex items-center gap-2"
                  >
                    <InboxArrowDownIcon className="h-4 w-4" />
                    {t('common.archive')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      unarchiveNotification(selectedNotification.id);
                      setDetailModalVisible(false);
                    }}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all duration-200 flex items-center gap-2"
                  >
                    <FolderOpenIcon className="h-4 w-4" />
                    {t('common.unarchive')}
                  </button>
                )}
                <button
                  onClick={() => setDetailModalVisible(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;