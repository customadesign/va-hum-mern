import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { EyeIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import analyticsAPI from '../../services/analytics';
import ProfileViewsModal from './ProfileViewsModal';
import { Link } from 'react-router-dom';
import { useBranding } from '../../contexts/BrandingContext';

/**
 * Dashboard widget displaying profile views summary
 * Shows total views since registration with sparkline and trend indicator
 */
export default function ProfileViewsWidget({ user }) {
  const [showModal, setShowModal] = useState(false);
  const { branding } = useBranding();
  const brand = branding?.isESystemsMode ? 'esystems' : 'linkage';

  // Fetch profile views summary
  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['profile-views-summary', user?.id],
    queryFn: async () => {
      const response = await analyticsAPI.getProfileViewsSummary({ vaId: 'me', brand });
      return response.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 animate-pulse" style={{borderTopColor: '#3b82f6'}}>
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-lg p-3" style={{backgroundColor: '#eff6ff'}}>
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 px-5 py-3">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4" style={{borderTopColor: '#ef4444'}}>
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-lg p-3" style={{backgroundColor: '#fee2e2'}}>
              <EyeIcon className="h-6 w-6" style={{color: '#ef4444'}} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Profile Views</dt>
                <dd className="text-sm text-red-600">Failed to load</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-red-50 px-5 py-3">
          <div className="text-sm">
            <button
              onClick={() => refetch()}
              className="font-medium text-red-700 hover:text-red-900"
            >
              Try again →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!summary || summary.total === 0) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4" style={{borderTopColor: '#3b82f6'}}>
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-lg p-3" style={{backgroundColor: '#eff6ff'}}>
              <EyeIcon className="h-6 w-6" style={{color: '#3b82f6'}} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Profile Views</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">0</div>
                </dd>
                <dd className="text-xs text-gray-400 mt-1">No views yet</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 px-5 py-3">
          <div className="text-sm">
            <button
              onClick={() => setShowModal(true)}
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              View insights →
            </button>
          </div>
        </div>
        {showModal && (
          <ProfileViewsModal
            user={user}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    );
  }

  // Render trend indicator
  const renderTrendIndicator = () => {
    if (!summary.trend || summary.trend === 0) {
      return (
        <div className="flex items-center text-xs text-gray-500 ml-2">
          <div className="w-4 h-4 mr-1">—</div>
          <span>No change</span>
        </div>
      );
    }

    const isPositive = summary.trend > 0;
    return (
      <div className={`flex items-center text-xs ml-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
        ) : (
          <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
        )}
        <span>{Math.abs(summary.trend)}%</span>
      </div>
    );
  };

  // Generate sparkline SVG from last 30 days data
  const renderSparkline = () => {
    if (!summary.sparkline || summary.sparkline.length === 0) {
      return null;
    }

    const width = 80;
    const height = 24;
    const padding = 2;
    const max = Math.max(...summary.sparkline, 1);
    const points = summary.sparkline.map((value, index) => {
      const x = (index / (summary.sparkline.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((value / max) * (height - padding * 2));
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="mt-2">
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  // Format registration date
  const sinceDate = summary.registrationDate
    ? format(new Date(summary.registrationDate), 'MMM d, yyyy')
    : 'registration';

  return (
    <>
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4" style={{borderTopColor: '#3b82f6'}}>
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-lg p-3" style={{backgroundColor: '#eff6ff'}}>
              <EyeIcon className="h-6 w-6" style={{color: '#3b82f6'}} />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Profile Views</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {summary.total.toLocaleString()}
                  </div>
                  {renderTrendIndicator()}
                </dd>
                <dd className="text-xs text-gray-400 mt-1">
                  since {sinceDate}
                </dd>
              </dl>
              {renderSparkline()}
            </div>
          </div>
        </div>
        <div className="bg-blue-50 px-5 py-3">
          <div className="text-sm">
            {branding?.isESystemsMode ? (
              <button
                onClick={() => setShowModal(true)}
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                View insights →
              </button>
            ) : (
              <Link
                to="/analytics#profile-views"
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                View insights →
              </Link>
            )}
          </div>
        </div>
      </div>

      {showModal && branding?.isESystemsMode && (
        <ProfileViewsModal
          user={user}
          registrationDate={summary.registrationDate}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}