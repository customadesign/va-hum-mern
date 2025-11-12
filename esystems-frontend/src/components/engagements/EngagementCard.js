import React from 'react';
import { Link } from 'react-router-dom';
import BillingSummary from './BillingSummary';

/**
 * Status Badge Component
 */
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-500',
      label: 'Active',
    },
    considering: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      dot: 'bg-blue-500',
      label: 'Considering',
    },
    paused: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-500',
      label: 'Paused',
    },
    past: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      dot: 'bg-gray-500',
      label: 'Past',
    },
  };

  const config = statusConfig[status] || statusConfig.past;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-2 h-2 ${config.dot} rounded-full mr-1.5`}></span>
      {config.label}
    </span>
  );
};

/**
 * Engagement Card Component
 * Displays individual VA engagement information
 */
const EngagementCard = ({ engagement }) => {
  const { va, status, contract, totalBilled, lastActivityAt } = engagement;

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency helper
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  // Get avatar fallback (first letter of name)
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-200">
      <div className="p-6">
        {/* Header with Avatar and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            {va?.avatar ? (
              <img
                src={va.avatar}
                alt={va.name}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-100"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-blue-100">
                <span className="text-white text-lg font-semibold">
                  {getInitials(va?.name)}
                </span>
              </div>
            )}

            {/* VA Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {va?.name || 'Unknown VA'}
              </h3>
              <p className="text-sm text-gray-600 truncate">{va?.email || ''}</p>
            </div>
          </div>

          {/* Status Badge */}
          <StatusBadge status={status} />
        </div>

        {/* Contract Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-700">
            <svg
              className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium mr-1">Started:</span>
            {formatDate(contract?.startDate)}
          </div>

          {contract?.hoursPerWeek && (
            <div className="flex items-center text-sm text-gray-700">
              <svg
                className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium mr-1">Hours:</span>
              {contract.hoursPerWeek} hrs/week
            </div>
          )}

          {contract?.rate && (
            <div className="flex items-center text-sm text-gray-700">
              <svg
                className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium mr-1">Rate:</span>
              {formatCurrency(contract.rate, contract.currency || 'USD')}/hr
            </div>
          )}
        </div>

        {/* Billing Summary */}
        {totalBilled !== undefined && totalBilled > 0 && (
          <div className="mb-4">
            <BillingSummary engagementId={engagement._id || engagement.id} compactView={true} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/vas/${va?.id || va?._id}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
          >
            <svg
              className="h-4 w-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            View Profile
          </Link>
          <Link
            to={`/conversations?va=${va?.id || va?._id}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
          >
            <svg
              className="h-4 w-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Message
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EngagementCard;