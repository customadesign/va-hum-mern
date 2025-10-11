import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useVAEngagements } from '../../hooks/useVAEngagements';
import analyticsAPI from '../../services/analytics';

/**
 * Status configuration for styling and display
 */
const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon
  },
  considering: {
    label: 'Considering',
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: ClockIcon
  },
  past: {
    label: 'Past',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: ArchiveBoxIcon
  },
  paused: {
    label: 'Paused',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: ExclamationTriangleIcon
  }
};

/**
 * Filter tabs configuration
 */
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'considering', label: 'Considering' },
  { key: 'past', label: 'Past' }
];

/**
 * Individual engagement list item component
 */
function EngagementItem({ engagement, onViewDetails, onMessage }) {
  const { va, contract, status, lastActivityAt } = engagement;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.considering;
  
  // Generate avatar initials
  const getInitials = (name) => {
    if (!name) return 'VA';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format contract dates
  const formatContractDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors" data-testid="engagement-item">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {va?.avatarUrl ? (
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={va.avatarUrl}
              alt={va.fullName}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium ${va?.avatarUrl ? 'hidden' : 'flex'}`}
            data-testid="avatar-initials"
          >
            {getInitials(va?.fullName)}
          </div>
        </div>

        {/* VA Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Link
              to={`/vas/${va?.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
              title={va?.fullName}
            >
              {va?.fullName || 'Unknown VA'}
            </Link>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
          </div>
          
          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
            <span title={va?.title}>{va?.title || 'Virtual Assistant'}</span>
            <span>•</span>
            <span>{formatContractDate(contract?.startDate)}</span>
            {contract?.endDate && (
              <>
                <span>→</span>
                <span>{formatContractDate(contract.endDate)}</span>
              </>
            )}
          </div>

          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
            <span>{contract?.hoursPerWeek || 0}h/week</span>
            {contract?.rate && (
              <>
                <span>•</span>
                <span>${contract.rate}/hr</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={() => onViewDetails(engagement)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          View details
        </button>
        
        {onMessage && (
          <button
            onClick={() => onMessage(engagement)}
            className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Message
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for engagement items
 */
function EngagementSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 animate-pulse">
      <div className="flex items-center space-x-3 flex-1">
        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-48 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="flex space-x-2">
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
        <div className="h-8 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

/**
 * Main VAs Hired Widget Component
 * Displays engagement summary and recent engagements for eSystems clients
 */
export default function VAsHiredWidget({ user }) {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const {
    summary,
    list,
    isLoading,
    error,
    refetch
  } = useVAEngagements({
    status: activeFilter,
    limit: 5
  });

  // Analytics tracking
  useEffect(() => {
    // Track widget impression
    const trackImpression = async () => {
      try {
        await analyticsAPI.trackEvent?.({
          event: 'esystems_vas_hired_widget_impression',
          properties: {
            userId: user?._id,
            timestamp: new Date().toISOString(),
            filter: activeFilter
          }
        });
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    };

    if (!isLoading && !error) {
      trackImpression();
    }
  }, [user?._id, activeFilter, isLoading, error]);

  // Track filter changes
  const handleFilterChange = async (newFilter) => {
    setActiveFilter(newFilter);
    
    try {
      await analyticsAPI.trackEvent?.({
        event: 'esystems_vas_hired_filter_change',
        properties: {
          userId: user?._id,
          fromFilter: activeFilter,
          toFilter: newFilter,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  // Track view all clicks
  const handleViewAllClick = async () => {
    try {
      await analyticsAPI.trackEvent?.({
        event: 'esystems_vas_hired_view_all_click',
        properties: {
          userId: user?._id,
          currentFilter: activeFilter,
          totalCount: summary.data?.total || 0,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  // Handle view details action
  const handleViewDetails = async (engagement) => {
    try {
      await analyticsAPI.trackEvent?.({
        event: 'esystems_engagement_details_click',
        properties: {
          userId: user?._id,
          engagementId: engagement.id,
          vaId: engagement.va.id,
          status: engagement.status,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    // Navigate to engagement details page or open modal
    window.location.href = `/engagements/${engagement.id}`;
  };

  // Handle message action (if messaging is available)
  const handleMessage = async (engagement) => {
    try {
      await analyticsAPI.trackEvent?.({
        event: 'esystems_engagement_message_click',
        properties: {
          userId: user?._id,
          engagementId: engagement.id,
          vaId: engagement.va.id,
          status: engagement.status,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    // Navigate to conversation with the VA
    window.location.href = `/conversations?va=${engagement.va.id}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4" style={{borderTopColor: '#3b82f6'}} data-testid="loading-skeleton">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg p-3" style={{backgroundColor: '#eff6ff'}}>
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="ml-5">
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>

          {/* Summary skeleton */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-6 bg-gray-200 rounded w-8 mx-auto mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Filter tabs skeleton */}
          <div className="flex space-x-1 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            ))}
          </div>

          {/* List skeleton */}
          <div className="space-y-1">
            {[...Array(3)].map((_, i) => (
              <EngagementSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4" style={{borderTopColor: '#ef4444'}}>
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-lg p-3" style={{backgroundColor: '#fee2e2'}}>
              <UserGroupIcon className="h-6 w-6" style={{color: '#ef4444'}} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">VAs Hired</dt>
                <dd className="text-sm text-red-600">Failed to load</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-red-50 px-5 py-3">
          <div className="text-sm">
            <button
              onClick={() => refetch()}
              className="font-medium text-red-700 hover:text-red-900 transition-colors"
            >
              Try again →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get summary data with defaults
  const summaryData = summary.data || { total: 0, active: 0, considering: 0, past: 0 };
  const engagements = list.data?.engagements || [];

  // Empty state
  if (summaryData.total === 0) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4" style={{borderTopColor: '#3b82f6'}}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-lg p-3" style={{backgroundColor: '#eff6ff'}}>
                <UserGroupIcon className="h-6 w-6" style={{color: '#3b82f6'}} />
              </div>
              <div className="ml-5">
                <h3 className="text-lg font-medium text-gray-900">VAs Hired</h3>
              </div>
            </div>
          </div>

          <div className="text-center py-8">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No VAs hired yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start building your team by browsing our talented VAs
            </p>
            <div className="mt-4 flex justify-center space-x-3">
              <Link
                to="/candidates"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Browse Candidates
              </Link>
              <Link
                to="/post-role"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Post a Role
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border-t-4" style={{borderTopColor: '#3b82f6'}}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-lg p-3" style={{backgroundColor: '#eff6ff'}}>
              <UserGroupIcon className="h-6 w-6" style={{color: '#3b82f6'}} />
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">VAs Hired</h3>
            </div>
          </div>
          <Link
            to="/engagements"
            onClick={handleViewAllClick}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            View all →
          </Link>
        </div>

        {/* Summary counts */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">{summaryData.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">{summaryData.active}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">{summaryData.considering}</div>
            <div className="text-xs text-gray-500">Considering</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-600">{summaryData.past}</div>
            <div className="text-xs text-gray-500">Past</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  activeFilter === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && summaryData[tab.key] > 0 && (
                  <span className="ml-1 text-gray-400">({summaryData[tab.key]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Engagements list */}
        <div className="space-y-1">
          {list.isLoading ? (
            // Loading skeletons
            [...Array(3)].map((_, i) => <EngagementSkeleton key={i} />)
          ) : engagements.length === 0 ? (
            // Empty state for filtered results
            <div className="text-center py-6">
              <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                No {activeFilter === 'all' ? '' : activeFilter} engagements found
              </p>
            </div>
          ) : (
            // Engagement items
            engagements.map((engagement) => (
              <EngagementItem
                key={engagement.id}
                engagement={engagement}
                onViewDetails={handleViewDetails}
                onMessage={handleMessage}
              />
            ))
          )}
        </div>

        {/* Show more link if there are more items */}
        {engagements.length > 0 && list.data?.pagination?.hasNextPage && (
          <div className="mt-4 text-center">
            <Link
              to={`/engagements${activeFilter !== 'all' ? `?status=${activeFilter}` : ''}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              View all {activeFilter === 'all' ? '' : activeFilter} engagements →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
