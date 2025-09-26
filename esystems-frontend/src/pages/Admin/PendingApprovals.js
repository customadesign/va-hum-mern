import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useBranding } from '../../contexts/BrandingContext';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  BuildingOfficeIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const approvalTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'va', label: 'VAs Only' },
  { value: 'business', label: 'Businesses Only' }
];

export default function PendingApprovals() {
  const { branding } = useBranding();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch pending VAs and Businesses
  const { data: pendingData, isLoading, error } = useQuery(
    ['pendingApprovals', { search, type, page }],
    async () => {
      const limit = 20;
      const skip = (page - 1) * limit;
      
      let vasPromise = Promise.resolve({ data: { data: [], pagination: { total: 0 } } });
      let businessesPromise = Promise.resolve({ data: { data: [], pagination: { total: 0 } } });

      if (type === 'all' || type === 'va') {
        const vaParams = new URLSearchParams({
          status: 'pending',
          page: '1',
          limit: type === 'va' ? limit.toString() : '100'
        });
        if (search) vaParams.append('search', search);
        vasPromise = api.get(`/admin/vas?${vaParams}`);
      }

      if (type === 'all' || type === 'business') {
        const businessParams = new URLSearchParams({
          status: 'pending',
          page: '1',
          limit: type === 'business' ? limit.toString() : '100'
        });
        if (search) businessParams.append('search', search);
        businessesPromise = api.get(`/admin/businesses?${businessParams}`);
      }

      const [vasResponse, businessesResponse] = await Promise.all([vasPromise, businessesPromise]);
      
      const vas = vasResponse.data.data.map(va => ({ ...va, type: 'va' }));
      const businesses = businessesResponse.data.data.map(business => ({ ...business, type: 'business' }));
      
      let allItems = [...vas, ...businesses];
      
      // Sort by creation date (newest first)
      allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Apply pagination for combined results
      const total = allItems.length;
      const startIndex = skip;
      const endIndex = startIndex + limit;
      const paginatedItems = allItems.slice(startIndex, endIndex);
      
      return {
        data: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    },
    {
      keepPreviousData: true
    }
  );

  // Approve/Reject mutations
  const updateStatusMutation = useMutation(
    async ({ id, itemType, status }) => {
      const endpoint = itemType === 'va' ? `/admin/vas/${id}` : `/admin/businesses/${id}`;
      const response = await api.put(endpoint, { status });
      return response.data;
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries('pendingApprovals');
        queryClient.invalidateQueries('adminStats');
        const action = variables.status === 'approved' ? 'approved' : 'rejected';
        const itemType = variables.itemType === 'va' ? 'VA' : 'Business';
        toast.success(`${itemType} ${action} successfully`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update status');
      }
    }
  );

  const handleApprove = (item) => {
    updateStatusMutation.mutate({
      id: item._id,
      itemType: item.type,
      status: 'approved'
    });
  };

  const handleReject = (item) => {
    if (window.confirm(`Are you sure you want to reject this ${item.type}?`)) {
      updateStatusMutation.mutate({
        id: item._id,
        itemType: item.type,
        status: 'rejected'
      });
    }
  };

  const handleBulkAction = (action) => {
    if (selectedItems.length === 0) {
      toast.warning('Please select items first');
      return;
    }

    const confirmMessage = action === 'approved' 
      ? `Are you sure you want to approve ${selectedItems.length} items?`
      : `Are you sure you want to reject ${selectedItems.length} items?`;

    if (window.confirm(confirmMessage)) {
      selectedItems.forEach(item => {
        updateStatusMutation.mutate({
          id: item._id,
          itemType: item.type,
          status: action
        });
      });
      setSelectedItems([]);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(pendingData?.data || []);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (item, checked) => {
    if (checked) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter(selected => selected._id !== item._id));
    }
  };

  const getItemName = (item) => {
    return item.type === 'va' ? item.name : item.company;
  };

  const getItemContact = (item) => {
    return item.type === 'va' ? item.user?.email : item.contactName;
  };

  const getItemDetails = (item) => {
    if (item.type === 'va') {
      return {
        subtitle: item.location,
        description: item.bio,
        extra: item.skills?.slice(0, 3).join(', ')
      };
    } else {
      return {
        subtitle: item.industry,
        description: item.bio,
        extra: item.companySize
      };
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading pending approvals</h3>
          <p className="mt-1 text-sm text-gray-700">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pending Approvals - {branding.name}</title>
      </Helmet>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Pending Approvals
              </h2>
              <p className="mt-1 text-sm text-gray-700">
                Review and approve VA and business registrations
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
                Filters
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search pending approvals..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              
              {showFilters && (
                <div className="flex gap-4">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {approvalTypes.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('approved')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Approve All
                  </button>
                  <button
                    onClick={() => handleBulkAction('rejected')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    Reject All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Items List */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-700">Loading pending approvals...</p>
              </div>
            ) : pendingData?.data?.length === 0 ? (
              <div className="p-6 text-center">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-700" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                <p className="mt-1 text-sm text-gray-700">
                  {search || type !== 'all' ? 'Try adjusting your search or filters.' : 'All registrations have been reviewed.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                <li className="px-6 py-3 bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === pendingData?.data?.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Select All</span>
                  </div>
                </li>
                {pendingData?.data?.map((item) => {
                  const details = getItemDetails(item);
                  const isSelected = selectedItems.some(selected => selected._id === item._id);
                  
                  return (
                    <li key={`${item.type}-${item._id}`} className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(item, e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        
                        <div className="flex-shrink-0">
                          {item.type === 'va' ? (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UsersIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {getItemName(item)}
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {item.type === 'va' ? 'VA' : 'Business'}
                                </span>
                              </p>
                              <p className="text-sm text-gray-700 truncate">{details.subtitle}</p>
                              <p className="text-sm text-gray-700 truncate">{getItemContact(item)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-700">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                              <Link
                                to={item.type === 'va' ? `/vas/${item._id}` : '#'}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleApprove(item)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-green-700 bg-green-100 hover:bg-green-200"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(item)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Reject
                              </button>
                            </div>
                          </div>
                          {details.description && (
                            <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                              {details.description}
                            </p>
                          )}
                          {details.extra && (
                            <p className="mt-1 text-xs text-gray-700">
                              {item.type === 'va' ? 'Skills: ' : 'Size: '}{details.extra}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {pendingData?.pagination && pendingData.pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pendingData.pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(page - 1) * pendingData.pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(page * pendingData.pagination.limit, pendingData.pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pendingData.pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pendingData.pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === pendingData.pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}