import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import api, { announcementAPI } from '../services/api';
import { Helmet } from 'react-helmet-async';
import { useBranding } from '../contexts/BrandingContext';
import { 
  BellIcon, 
  ExclamationTriangleIcon, 
  SpeakerWaveIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  FunnelIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import SafeHtml from '../components/SafeHtml';

const Announcements = () => {
  const { user } = useAuth();
  const { branding } = useBranding();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all, unread, urgent, high, normal, low
  const [expandedAnnouncements, setExpandedAnnouncements] = useState(new Set());

  // Fetch announcements
  const { data: announcements = [], isLoading, refetch } = useQuery(
    ['announcements', user?.id, filter],
    async () => {
      const response = await announcementAPI.getAnnouncements();
      let allAnnouncements = response.data?.announcements || [];
      
      // Apply client-side filter
      if (filter === 'unread') {
        allAnnouncements = allAnnouncements.filter(ann => !ann.isRead);
      } else if (filter !== 'all') {
        allAnnouncements = allAnnouncements.filter(ann => ann.priority === filter);
      }
      
      return allAnnouncements;
    },
    {
      enabled: !!user,
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    async (id) => {
      await announcementAPI.markAnnouncementAsRead(id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['announcements']);
        queryClient.invalidateQueries(['announcements-unread-count']);
      }
    }
  );

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    async () => {
      const unreadAnnouncements = announcements.filter(ann => !ann.isRead);
      await Promise.all(
        unreadAnnouncements.map(ann => announcementAPI.markAnnouncementAsRead(ann._id))
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['announcements']);
        queryClient.invalidateQueries(['announcements-unread-count']);
      }
    }
  );

  // Toggle expanded state
  const toggleExpanded = (id) => {
    setExpandedAnnouncements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        // Mark as read when expanding
        const announcement = announcements.find(ann => ann._id === id);
        if (announcement && !announcement.isRead) {
          markAsReadMutation.mutate(id);
        }
      }
      return newSet;
    });
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return ExclamationTriangleIcon;
      case 'high':
        return SpeakerWaveIcon;
      case 'normal':
        return InformationCircleIcon;
      case 'low':
      default:
        return BellIcon;
    }
  };

  // Get priority styles
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-800',
        };
      case 'high':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          text: 'text-orange-900',
          badge: 'bg-orange-100 text-orange-800',
        };
      case 'normal':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800',
        };
      case 'low':
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600',
          text: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const unreadCount = announcements.filter(ann => !ann.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Announcements - {branding?.name || 'Platform'}</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="mt-2 text-sm text-gray-600">
              Stay updated with the latest platform news and updates
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                Mark all as read
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {unreadCount > 0 && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center">
              <SparklesIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-indigo-900">
                You have {unreadCount} unread announcement{unreadCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {['all', 'unread', 'urgent', 'high', 'normal', 'low'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                    filter === filterOption
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  {filterOption === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-white text-indigo-600">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'unread' 
                  ? 'You\'re all caught up! No unread announcements.'
                  : 'No announcements to display at this time.'}
              </p>
            </div>
          ) : (
            announcements.map((announcement) => {
              const Icon = getPriorityIcon(announcement.priority);
              const styles = getPriorityStyles(announcement.priority);
              const isExpanded = expandedAnnouncements.has(announcement._id);
              
              return (
                <div
                  key={announcement._id}
                  className={`${styles.bg} ${styles.border} border rounded-lg transition-all duration-200 hover:shadow-md`}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpanded(announcement._id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${styles.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className={`text-base font-semibold ${styles.text}`}>
                              {announcement.title}
                            </h3>
                            {!announcement.isRead && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-400 to-cyan-400 text-white">
                                New
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                              {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                            </span>
                            {announcement.category && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {announcement.category}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        
                        {/* Content preview or full content */}
                        <SafeHtml
                          className={`mt-2 text-sm ${styles.text} opacity-90`}
                          html={
                            isExpanded
                              ? announcement.content
                              : (announcement.content.length > 150
                                  ? announcement.content.substring(0, 150) + '...'
                                  : announcement.content)
                          }
                        />
                        
                        {/* Expand/Collapse indicator */}
                        {announcement.content.length > 150 && (
                          <button className={`mt-2 text-xs font-medium ${styles.icon} hover:underline`}>
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                        
                        {/* Tags */}
                        {announcement.tags && announcement.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {announcement.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Expiry indicator */}
                        {announcement.expiresAt && (
                          <div className="mt-2 text-xs text-gray-500">
                            Expires: {format(new Date(announcement.expiresAt), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default Announcements;