import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../services/api';
import {
  FlagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function ModerationDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');

  // Fetch moderation queue
  const { data: queue, isLoading: queueLoading } = useQuery(
    ['moderationQueue', filterType, filterStatus],
    async () => {
      const response = await api.get('/admin/moderation/queue', {
        params: { type: filterType, status: filterStatus }
      });
      return response.data.data;
    }
  );

  // Fetch moderation statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'moderationStats',
    async () => {
      const response = await api.get('/admin/moderation/stats');
      return response.data.data;
    }
  );

  // Review content mutation
  const reviewMutation = useMutation(
    async ({ contentType, contentId, action, notes }) => {
      const response = await api.post(
        `/admin/moderation/review/${contentType}/${contentId}`,
        { action, notes }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('moderationQueue');
        queryClient.invalidateQueries('moderationStats');
        setSelectedItems([]);
      }
    }
  );

  // Bulk moderation mutation
  const bulkModerationMutation = useMutation(
    async ({ items, action, notes }) => {
      const response = await api.post('/admin/moderation/bulk', {
        items,
        action,
        notes
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('moderationQueue');
        queryClient.invalidateQueries('moderationStats');
        setSelectedItems([]);
      }
    }
  );

  const handleReview = (item, action, notes = '') => {
    reviewMutation.mutate({
      contentType: item.type,
      contentId: item.item._id,
      action,
      notes
    });
  };

  const handleBulkAction = (action) => {
    if (selectedItems.length === 0) return;

    const items = selectedItems.map(item => ({
      type: item.type,
      id: item.item._id
    }));

    bulkModerationMutation.mutate({
      items,
      action,
      notes: `Bulk ${action} action`
    });
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.item._id === item.item._id);
      if (exists) {
        return prev.filter(i => i.item._id !== item.item._id);
      }
      return [...prev, item];
    });
  };

  const getContentPreview = (item) => {
    switch (item.type) {
      case 'message':
        return item.item.content?.substring(0, 150) + '...';
      case 'profile':
        return `${item.item.name} - ${item.item.bio?.substring(0, 100)}...`;
      case 'file':
        return `${item.item.originalName} (${item.item.mimetype})`;
      default:
        return 'Unknown content';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'message':
        return DocumentTextIcon;
      case 'profile':
        return UserGroupIcon;
      case 'file':
        return PhotoIcon;
      default:
        return FlagIcon;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Moderation Dashboard</h1>
        <p className="mt-2 text-gray-600">Review and moderate flagged content</p>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FlagIcon className="h-10 w-10 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Flags</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overview?.totalFlags || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-10 w-10 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overview?.pendingReview || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overview?.approvedContent || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircleIcon className="h-10 w-10 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Removed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overview?.removedContent || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'queue'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Moderation Queue
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Statistics
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'queue' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="messages">Messages</option>
                  <option value="profiles">Profiles</option>
                  <option value="files">Files</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              {selectedItems.length > 0 && (
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Approve Selected ({selectedItems.length})
                  </button>
                  <button
                    onClick={() => handleBulkAction('remove')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Remove Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Queue List */}
          {queueLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {queue?.items?.map((item) => {
                  const Icon = getTypeIcon(item.type);
                  const isSelected = selectedItems.find(i => i.item._id === item.item._id);

                  return (
                    <li key={item.item._id} className="hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => toggleItemSelection(item)}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Icon className="h-5 w-5 text-gray-400 mr-2" />
                                <p className="text-sm font-medium text-gray-900">
                                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </p>
                                {item.flags && item.flags[0] && (
                                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                    getSeverityColor(item.flags[0].severity)
                                  }`}>
                                    {item.flags[0].reason}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {new Date(item.flaggedAt).toLocaleString()}
                              </p>
                            </div>

                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                {getContentPreview(item)}
                              </p>
                            </div>

                            {item.flags && item.flags[0]?.details && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                  Details: {item.flags[0].details}
                                </p>
                              </div>
                            )}

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleReview(item, 'approve')}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(item, 'remove')}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                Remove
                              </button>
                              <button
                                onClick={() => handleReview(item, 'warn')}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                              >
                                Warn User
                              </button>
                              <button
                                onClick={() => handleReview(item, 'suspend')}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                              >
                                Suspend User
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {(!queue?.items || queue.items.length === 0) && (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No items in moderation queue</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div>
          {/* Top Violations */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Violation Types</h3>
            <div className="space-y-3">
              {stats.topViolations?.map((violation) => (
                <div key={violation._id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{violation._id}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${(violation.count / stats.overview.totalFlags) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {violation.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Times */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Response Times</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Average Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.responseTime?.average || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Median Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.responseTime?.median || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-sm text-gray-500">Warnings Issued</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.overview?.warningsIssued || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <XCircleIcon className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-gray-500">Account Suspensions</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.overview?.suspensions || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <ChartBarIcon className="h-8 w-8 text-indigo-500 mb-2" />
              <p className="text-sm text-gray-500">Review Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.overview?.totalFlags > 0
                  ? Math.round(((stats.overview.approvedContent + stats.overview.removedContent) / stats.overview.totalFlags) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}