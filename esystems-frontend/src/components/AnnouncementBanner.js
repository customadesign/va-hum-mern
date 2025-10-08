import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { XMarkIcon, SpeakerWaveIcon, ExclamationTriangleIcon, InformationCircleIcon, BellIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import SafeHtml from './SafeHtml';

const AnnouncementBanner = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(new Set());

  // Fetch announcements for current user
  const { data: announcements, isLoading } = useQuery(
    ['announcements', user?.id],
    async () => {
      const response = await api.get('/announcements');
      return response.data?.announcements || [];
    },
    {
      enabled: !!user,
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Mark announcement as read mutation
  const markAsReadMutation = useMutation(
    async (id) => {
      await api.post(`/announcements/${id}/read`);
    },
    {
      onSuccess: (_, id) => {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries(['announcements']);
        queryClient.invalidateQueries(['announcements-unread-count']);
      }
    }
  );

  // Handle announcement dismissal
  const handleDismiss = (announcement) => {
    // Add to dismissed set
    setDismissedAnnouncements(prev => new Set([...prev, announcement._id]));
    
    // Mark as read if it's unread
    if (!announcement.isRead) {
      markAsReadMutation.mutate(announcement._id);
    }
  };

  // Get priority-based styles
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-red-100',
          border: 'border-red-300',
          icon: ExclamationTriangleIcon,
          iconColor: 'text-red-600',
          textColor: 'text-red-900',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-800',
        };
      case 'high':
        return {
          bg: 'bg-gradient-to-r from-orange-50 to-amber-50',
          border: 'border-orange-300',
          icon: SpeakerWaveIcon,
          iconColor: 'text-orange-600',
          textColor: 'text-orange-900',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-800',
        };
      case 'normal':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          border: 'border-blue-300',
          icon: InformationCircleIcon,
          iconColor: 'text-blue-600',
          textColor: 'text-blue-900',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-800',
        };
      case 'low':
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
          border: 'border-gray-300',
          icon: BellIcon,
          iconColor: 'text-gray-700',
          textColor: 'text-gray-900',
          badgeBg: 'bg-gray-100',
          badgeText: 'text-gray-800',
        };
    }
  };

  // Filter out dismissed announcements and get the highest priority one
  const visibleAnnouncements = announcements?.filter(
    ann => !dismissedAnnouncements.has(ann._id)
  ) || [];

  // Sort by priority and get the most important one
  const currentAnnouncement = visibleAnnouncements.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  })[0];

  if (!currentAnnouncement || isLoading) {
    return null;
  }

  const styles = getPriorityStyles(currentAnnouncement.priority);
  const Icon = styles.icon;

  return (
    <div 
      className={`${styles.bg} ${styles.border} border-b shadow-sm transition-all duration-500 ease-in-out transform`}
      style={{
        animation: 'slideDown 0.5s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 md:py-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <Icon className={`h-6 w-6 ${styles.iconColor} mt-0.5`} />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header with badges */}
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`text-sm font-semibold ${styles.textColor}`}>
                      {currentAnnouncement.title}
                    </h3>
                    {!currentAnnouncement.isRead && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-400 to-cyan-400 text-white shadow-sm">
                        <SparklesIcon className="w-3 h-3 mr-0.5" />
                        New
                      </span>
                    )}
                    {currentAnnouncement.priority === 'urgent' && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles.badgeBg} ${styles.badgeText}`}>
                        Urgent
                      </span>
                    )}
                  </div>
                  
                  {/* Message content with HTML support */}
                  <SafeHtml
                    className={`text-sm ${styles.textColor} opacity-90 leading-relaxed`}
                    html={currentAnnouncement.content}
                  />
                  
                  {/* Additional announcements indicator */}
                  {visibleAnnouncements.length > 1 && (
                    <div className="mt-2 text-xs text-gray-700">
                      +{visibleAnnouncements.length - 1} more announcement{visibleAnnouncements.length - 1 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                {/* Dismiss button */}
                <button
                  onClick={() => handleDismiss(currentAnnouncement)}
                  className={`flex-shrink-0 ml-4 inline-flex items-center justify-center p-1 rounded-md ${styles.textColor} hover:bg-white hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white transition-colors duration-200`}
                  aria-label="Dismiss announcement"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;