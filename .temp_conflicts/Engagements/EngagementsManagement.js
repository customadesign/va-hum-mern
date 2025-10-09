import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowPathIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import AdminFooter from '../../components/common/AdminFooter';

const EngagementsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('');
  const [vaFilter, setVAFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'create'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [hoursFilter, setHoursFilter] = useState({ min: '', max: '' });
  const [rateFilter, setRateFilter] = useState({ min: '', max: '' });
  const [lastActivityFilter, setLastActivityFilter] = useState('');
  const [sortBy, setSortBy] = useState([{ field: 'createdAt', direction: 'desc' }]);

  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch engagements
  const { data: engagementsData, isLoading, error } = useQuery({
    queryKey: ['admin-engagements', {
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      businessId: businessFilter || undefined,
      vaId: vaFilter || undefined,
      startDate: dateFilter.startDate || undefined,
      endDate: dateFilter.endDate || undefined,
      minHours: hoursFilter.min || undefined,
      maxHours: hoursFilter.max || undefined,
      minRate: rateFilter.min || undefined,
      maxRate: rateFilter.max || undefined,
      lastActivityDate: lastActivityFilter || undefined,
      sortBy: sortBy.map(s => `${s.field}:${s.direction}`).join(','),
    }],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey;
      const response = await adminAPI.get('/admin/engagements', { params });
      return response.data;
    },
  });

  // Fetch analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['admin-engagement-analytics'],
    queryFn: async () => {
      const response = await adminAPI.get('/admin/engagements/analytics');
      return response.data;
    },
    enabled: showAnalytics,
  });

  // Create engagement mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await adminAPI.post('/admin/engagements', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Engagement created successfully');
      queryClient.invalidateQueries(['admin-engagements']);
      setShowModal(false);
      setSelectedEngagement(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create engagement');
    },
  });

  // Update engagement mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await adminAPI.put(`/admin/engagements/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Engagement updated successfully');
      queryClient.invalidateQueries(['admin-engagements']);
      setShowModal(false);
      setSelectedEngagement(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update engagement');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await adminAPI.patch(`/admin/engagements/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries(['admin-engagements']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Delete engagement mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await adminAPI.delete(`/admin/engagements/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Engagement deleted successfully');
      queryClient.invalidateQueries(['admin-engagements']);
      setShowDeleteModal(false);
      setSelectedEngagement(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete engagement');
    },
  });

  const handleCreate = useCallback(() => {
    setSelectedEngagement(null);
    setModalMode('create');
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((engagement) => {
    setSelectedEngagement(engagement);
    setModalMode('edit');
    setShowModal(true);
  }, []);

  const handleView = useCallback((engagement) => {
    setSelectedEngagement(engagement);
    setModalMode('view');
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((engagement) => {
    setSelectedEngagement(engagement);
    setShowDeleteModal(true);
  }, []);

  const handleStatusChange = useCallback((engagement, newStatus) => {
    updateStatusMutation.mutate({ id: engagement._id, status: newStatus });
  }, [updateStatusMutation]);

  const exportCSV = useCallback(() => {
    const data = engagementsData?.engagements || [];
    const csvContent = [
      ['Business', 'VA', 'Status', 'Start Date', 'Hours/Week', 'Rate', 'Currency'],
      ...data.map(e => [
        e.business?.name || 'N/A',
        e.va?.name || 'N/A',
        e.status,
        e.contract?.startDate ? new Date(e.contract.startDate).toLocaleDateString() : 'N/A',
        e.contract?.hoursPerWeek || 'N/A',
        e.contract?.rate || 'N/A',
        e.contract?.currency || 'USD',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engagements_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Engagements exported to CSV');
  }, [engagementsData]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('all');
    setBusinessFilter('');
    setVAFilter('');
    setDateFilter({ startDate: '', endDate: '' });
    setHoursFilter({ min: '', max: '' });
    setRateFilter({ min: '', max: '' });
    setLastActivityFilter('');
    setSortBy([{ field: 'createdAt', direction: 'desc' }]);
    setCurrentPage(1);
  }, []);

  const engagements = useMemo(() => engagementsData?.engagements || [], [engagementsData]);
  const totalPages = useMemo(() => Math.ceil((engagementsData?.total || 0) / itemsPerPage), [engagementsData, itemsPerPage]);
  const hasActiveFilters = useMemo(() => {
    return searchTerm || statusFilter !== 'all' || dateFilter.startDate || dateFilter.endDate ||
      hoursFilter.min || hoursFilter.max || rateFilter.min || rateFilter.max || lastActivityFilter;
  }, [searchTerm, statusFilter, dateFilter, hoursFilter, rateFilter, lastActivityFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Engagement Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage all business-VA engagements across the platform
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                {showAnalytics ? 'Hide' : 'Show'} Analytics
              </button>
              <button
                onClick={exportCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Export CSV
              </button>
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Engagement
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && analyticsData && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total Engagements</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{analyticsData.totalEngagements}</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-6">
              <div className="text-sm font-medium text-green-600">Active</div>
              <div className="mt-2 text-3xl font-bold text-green-900">{analyticsData.activeEngagements}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-6">
              <div className="text-sm font-medium text-yellow-600">Considering</div>
              <div className="mt-2 text-3xl font-bold text-yellow-900">{analyticsData.consideringEngagements}</div>
            </div>
            <div className="bg-gray-50 rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Past</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{analyticsData.pastEngagements}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search businesses or VAs..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="considering">Considering</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="past">Past</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4 mr-1.5" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-1.5" />
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Advanced Filters Section */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Hours Per Week Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Week Range</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={hoursFilter.min}
                        onChange={(e) => setHoursFilter({ ...hoursFilter, min: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={hoursFilter.max}
                        onChange={(e) => setHoursFilter({ ...hoursFilter, max: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Rate Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate Range ($/hr)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={rateFilter.min}
                        onChange={(e) => setRateFilter({ ...rateFilter, min: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={rateFilter.max}
                        onChange={(e) => setRateFilter({ ...rateFilter, max: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Last Activity Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Activity After</label>
                    <input
                      type="date"
                      value={lastActivityFilter}
                      onChange={(e) => setLastActivityFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Sorting Options */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By (Multi-level)</label>
                  <div className="space-y-2">
                    {sortBy.map((sort, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                        <select
                          value={sort.field}
                          onChange={(e) => {
                            const newSortBy = [...sortBy];
                            newSortBy[index].field = e.target.value;
                            setSortBy(newSortBy);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="createdAt">Created Date</option>
                          <option value="status">Status</option>
                          <option value="business.name">Business Name</option>
                          <option value="va.name">VA Name</option>
                          <option value="contract.startDate">Start Date</option>
                          <option value="contract.hoursPerWeek">Hours/Week</option>
                          <option value="contract.rate">Rate</option>
                          <option value="lastActivityAt">Last Activity</option>
                        </select>
                        <select
                          value={sort.direction}
                          onChange={(e) => {
                            const newSortBy = [...sortBy];
                            newSortBy[index].direction = e.target.value;
                            setSortBy(newSortBy);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                        {index > 0 && (
                          <button
                            onClick={() => {
                              const newSortBy = sortBy.filter((_, i) => i !== index);
                              setSortBy(newSortBy);
                            }}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {sortBy.length < 3 && (
                      <button
                        onClick={() => setSortBy([...sortBy, { field: 'createdAt', direction: 'desc' }])}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PlusIcon className="h-4 w-4 mr-1.5" />
                        Add Sort Level
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Engagements Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading engagements...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">Error loading engagements</p>
              <button
                onClick={() => queryClient.invalidateQueries(['admin-engagements'])}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Retry
              </button>
            </div>
          ) : engagements.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No engagements found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        VA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contract
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {engagements.map((engagement) => (
                      <tr key={engagement._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {engagement.business?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {engagement.business?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {engagement.va?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {engagement.va?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={engagement.status}
                            onChange={(e) => handleStatusChange(engagement, e.target.value)}
                            className={`text-xs font-semibold rounded-full px-3 py-1 ${
                              engagement.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : engagement.status === 'considering'
                                ? 'bg-blue-100 text-blue-800'
                                : engagement.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <option value="considering">Considering</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="past">Past</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {engagement.contract?.startDate && (
                            <div>
                              {new Date(engagement.contract.startDate).toLocaleDateString()}
                            </div>
                          )}
                          {engagement.contract?.hoursPerWeek && (
                            <div>{engagement.contract.hoursPerWeek} hrs/wk</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {engagement.lastActivityAt
                            ? new Date(engagement.lastActivityAt).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleView(engagement)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(engagement)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(engagement)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, engagementsData?.total || 0)} of{' '}
                      {engagementsData?.total || 0} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <EngagementModal
          engagement={selectedEngagement}
          mode={modalMode}
          onClose={() => {
            setShowModal(false);
            setSelectedEngagement(null);
          }}
          onSubmit={(data) => {
            if (modalMode === 'create') {
              createMutation.mutate(data);
            } else if (modalMode === 'edit') {
              updateMutation.mutate({ id: selectedEngagement._id, data });
            }
          }}
        />
      )}

      {showDeleteModal && selectedEngagement && (
        <DeleteConfirmModal
          engagement={selectedEngagement}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedEngagement(null);
          }}
          onConfirm={() => deleteMutation.mutate(selectedEngagement._id)}
          isDeleting={deleteMutation.isLoading}
        />
      )}

      <AdminFooter />
    </div>
  );
};

// Engagement Modal Component
const EngagementModal = ({ engagement, mode, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    clientId: engagement?.business?._id || '',
    vaId: engagement?.va?._id || '',
    status: engagement?.status || 'considering',
    contract: {
      startDate: engagement?.contract?.startDate?.split('T')[0] || '',
      endDate: engagement?.contract?.endDate?.split('T')[0] || '',
      hoursPerWeek: engagement?.contract?.hoursPerWeek || '',
      rate: engagement?.contract?.rate || '',
      currency: engagement?.contract?.currency || 'USD',
    },
    notes: engagement?.notes || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
        <div
          className="relative bg-white rounded-lg max-w-2xl w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium mb-4">
            {mode === 'create' ? 'Create Engagement' : mode === 'edit' ? 'Edit Engagement' : 'View Engagement'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="considering">Considering</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="past">Past</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.contract.currency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract: { ...formData.contract, currency: e.target.value },
                      })
                    }
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="USD">USD</option>
                    <option value="PHP">PHP</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.contract.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract: { ...formData.contract, startDate: e.target.value },
                      })
                    }
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.contract.endDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract: { ...formData.contract, endDate: e.target.value },
                      })
                    }
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours/Week</label>
                  <input
                    type="number"
                    value={formData.contract.hoursPerWeek}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract: { ...formData.contract, hoursPerWeek: e.target.value },
                      })
                    }
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate/Hour</label>
                  <input
                    type="number"
                    value={formData.contract.rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract: { ...formData.contract, rate: e.target.value },
                      })
                    }
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isReadOnly}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
              {!isReadOnly && (
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {mode === 'create' ? 'Create' : 'Save Changes'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ engagement, onClose, onConfirm, isDeleting }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>
        <div
          className="relative bg-white rounded-lg max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <XCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-center mb-2">Delete Engagement</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Are you sure you want to delete the engagement between{' '}
            <strong>{engagement.business?.name}</strong> and <strong>{engagement.va?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementsManagement;