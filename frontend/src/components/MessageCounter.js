import React, { useEffect, useState } from 'react';
import { useMessageCounts } from '../hooks/useMessageCounts';
import { 
  InboxIcon, 
  ArchiveBoxIcon, 
  EnvelopeIcon 
} from '@heroicons/react/24/outline';
import { EnvelopeOpenIcon } from '@heroicons/react/24/solid';

/**
 * MessageCounter component that displays real-time counts for inbox and archived messages
 * Features:
 * - Real-time updates with polling
 * - Visual distinction between inbox and archived
 * - Animated count changes
 * - Responsive design
 * - Loading and error states
 */
const MessageCounter = ({ 
  showLabels = true, 
  showTotal = true, 
  compact = false,
  className = '',
  onCountChange 
}) => {
  const { 
    inboxCount, 
    archivedCount, 
    totalUnread, 
    isLoading, 
    error,
    lastUpdated 
  } = useMessageCounts();
  
  const [prevInboxCount, setPrevInboxCount] = useState(inboxCount);
  const [prevArchivedCount, setPrevArchivedCount] = useState(archivedCount);
  const [prevTotalUnread, setPrevTotalUnread] = useState(totalUnread);
  const [inboxAnimating, setInboxAnimating] = useState(false);
  const [archivedAnimating, setArchivedAnimating] = useState(false);
  const [unreadAnimating, setUnreadAnimating] = useState(false);

  // Trigger animations when counts change
  useEffect(() => {
    if (inboxCount > prevInboxCount) {
      setInboxAnimating(true);
      setTimeout(() => setInboxAnimating(false), 600);
    }
    setPrevInboxCount(inboxCount);
  }, [inboxCount, prevInboxCount]);

  useEffect(() => {
    if (archivedCount > prevArchivedCount) {
      setArchivedAnimating(true);
      setTimeout(() => setArchivedAnimating(false), 600);
    }
    setPrevArchivedCount(archivedCount);
  }, [archivedCount, prevArchivedCount]);

  useEffect(() => {
    if (totalUnread > prevTotalUnread) {
      setUnreadAnimating(true);
      setTimeout(() => setUnreadAnimating(false), 600);
    }
    setPrevTotalUnread(totalUnread);
  }, [totalUnread, prevTotalUnread]);

  // Notify parent of count changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange({
        inbox: inboxCount,
        archived: archivedCount,
        unread: totalUnread
      });
    }
  }, [inboxCount, archivedCount, totalUnread, onCountChange]);

  // Format count display
  const formatCount = (count) => {
    return count > 99 ? '99+' : count;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="animate-pulse flex space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          {showTotal && <div className="h-8 w-8 bg-gray-200 rounded-full"></div>}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`}>
        <EnvelopeIcon className="h-5 w-5" />
        <span className="text-sm">Error loading messages</span>
      </div>
    );
  }

  // Compact mode - just show counts with icons
  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="relative">
          <InboxIcon className="h-5 w-5 text-blue-600" />
          {inboxCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {formatCount(inboxCount)}
            </span>
          )}
        </div>
        <div className="relative">
          <ArchiveBoxIcon className="h-5 w-5 text-gray-600" />
          {archivedCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {formatCount(archivedCount)}
            </span>
          )}
        </div>
        {showTotal && totalUnread > 0 && (
          <div className="relative">
            <EnvelopeOpenIcon className="h-5 w-5 text-red-600" />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
              {formatCount(totalUnread)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Full mode with labels and animations
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 ${className}`}>
      {/* Inbox Counter */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <InboxIcon className="h-6 w-6 text-blue-600" />
          {inboxCount > 0 && (
            <span 
              className={`absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold transform transition-all duration-300 ${
                inboxAnimating ? 'scale-125' : 'scale-100'
              }`}
              style={{
                animation: inboxAnimating ? 'countPop 0.6s ease-out' : 'none'
              }}
            >
              {formatCount(inboxCount)}
            </span>
          )}
        </div>
        {showLabels && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Inbox</span>
            <span className="text-xs text-gray-500">{inboxCount} conversation{inboxCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Archived Counter */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <ArchiveBoxIcon className="h-6 w-6 text-gray-600" />
          {archivedCount > 0 && (
            <span 
              className={`absolute -top-2 -right-2 bg-gray-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold transform transition-all duration-300 ${
                archivedAnimating ? 'scale-125' : 'scale-100'
              }`}
              style={{
                animation: archivedAnimating ? 'countPop 0.6s ease-out' : 'none'
              }}
            >
              {formatCount(archivedCount)}
            </span>
          )}
        </div>
        {showLabels && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">Archived</span>
            <span className="text-xs text-gray-500">{archivedCount} conversation{archivedCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Total Unread Counter */}
      {showTotal && (
        <div className="flex items-center space-x-2">
          <div className="relative">
            <EnvelopeOpenIcon className="h-6 w-6 text-red-600" />
            {totalUnread > 0 && (
              <span 
                className={`absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold transform transition-all duration-300 ${
                  unreadAnimating ? 'scale-125' : 'scale-100'
                }`}
                style={{
                  animation: unreadAnimating ? 'countPop 0.6s ease-out' : 'none'
                }}
              >
                {formatCount(totalUnread)}
              </span>
            )}
          </div>
          {showLabels && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">Unread</span>
              <span className="text-xs text-gray-500">{totalUnread} message{totalUnread !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Last updated indicator */}
      {lastUpdated && (
        <div className="hidden sm:block text-xs text-gray-400">
          Updated {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}

      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes countPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default MessageCounter;