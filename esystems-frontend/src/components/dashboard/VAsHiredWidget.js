import React from 'react';
import { Link } from 'react-router-dom';
import { useEngagementSummary } from '../../hooks/useEngagements';

/**
 * VAs Hired Dashboard Widget
 * Displays summary of hired VAs with active/inactive breakdown
 * Replaces the "Profile Views" card on the business dashboard
 */
const VAsHiredWidget = () => {
  const { data: summaryData, isLoading, isError } = useEngagementSummary();

  const summary = summaryData?.data?.data || {
    total: 0,
    active: 0,
    inactive: 0,
    totalSpent: 0,
    currency: 'USD',
  };

  // Skeleton loader for loading state
  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-blue-500 animate-pulse">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3 w-12 h-12"></div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 px-5 py-3">
          <div className="h-4 bg-blue-100 rounded w-32"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-red-500">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-700 truncate">VAs Hired</dt>
                <dd className="text-sm text-red-600">Failed to load</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-red-50 px-5 py-3">
          <div className="text-sm">
            <button
              onClick={() => window.location.reload()}
              className="font-medium text-red-700 hover:text-red-900"
            >
              Retry →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no VAs hired yet
  if (summary.total === 0) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg border-t-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-700 truncate">VAs Hired</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-blue-900">0</div>
                </dd>
                <dd className="text-xs text-gray-600 mt-1">No VAs hired yet</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 px-5 py-3">
          <div className="text-sm">
            <Link to="/vas" className="font-medium text-blue-700 hover:text-blue-900">
              Browse VAs →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Normal state - showing VA counts
  return (
    <Link
      to="/engagements"
      className="block bg-white overflow-hidden shadow rounded-lg border-t-4 border-blue-500 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-700 truncate">VAs Hired</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-blue-900">
                  {summary.total}
                </div>
              </dd>
              <dd className="mt-1 flex items-center text-sm">
                <span className="flex items-center text-green-600 font-medium">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                  {summary.active} Active
                </span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="flex items-center text-gray-600">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                  {summary.inactive} Inactive
                </span>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 px-5 py-3 hover:bg-blue-100 transition-colors duration-150">
        <div className="text-sm flex items-center justify-between">
          <span className="font-medium text-blue-700">View all engagements</span>
          <svg className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default VAsHiredWidget;