import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useBranding } from '../../contexts/BrandingContext';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  EyeIcon,
  GlobeAltIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' }
];

const statusColors = {
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800'
};

export default function BusinessManagement() {
  const { branding } = useBranding();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedBusinesses, setSelectedBusinesses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch Businesses
  const { data: businessesData, isLoading, error } = useQuery(
    ['adminBusinesses', { search, status, page }],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      
      const response = await api.get(`/admin/businesses?${params}`);
      return response.data;
    },
    {
      keepPreviousData: true
    }
  );

  // Update Business mutation
  const updateBusinessMutation = useMutation(
    async ({ id, data }) => {
      const response = await api.put(`/admin/businesses/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminBusinesses');
        toast.success('Business updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update business');
      }
    }
  );

  // Delete Business mutation
  const deleteBusinessMutation = useMutation(
    async (id) => {
      const response = await api.delete(`/admin/businesses/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminBusinesses');
        toast.success('Business deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete business');
      }
    }
  );

  // Impersonate Business mutation
  const impersonateBusinessMutation = useMutation(
    async (userId) => {
      const response = await api.post('/admin/impersonate', { userId });
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Store the new token
        localStorage.setItem('token', data.data.token);
        // Update the API default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.token}`;
        toast.success(data.data.message);
        // Redirect to business dashboard
        window.location.href = '/dashboard';
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to impersonate business');
      }
    }
  );

  const handleStatusChange = (businessId, newStatus) => {
    updateBusinessMutation.mutate({
      id: businessId,
      data: { status: newStatus }
    });
  };

  const handleDelete = (businessId) => {
    if (window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      deleteBusinessMutation.mutate(businessId);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedBusinesses.length === 0) {
      toast.warning('Please select businesses first');
      return;
    }

    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedBusinesses.length} businesses? This action cannot be undone.`)) {
        selectedBusinesses.forEach(id => deleteBusinessMutation.mutate(id));
        setSelectedBusinesses([]);
      }
    } else {
      selectedBusinesses.forEach(id => {
        updateBusinessMutation.mutate({
          id,
          data: { status: action }
        });
      });
      setSelectedBusinesses([]);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedBusinesses(businessesData?.data?.map(business => business._id) || []);
    } else {
      setSelectedBusinesses([]);
    }
  };

  const handleSelectBusiness = (businessId, checked) => {
    if (checked) {
      setSelectedBusinesses([...selectedBusinesses, businessId]);
    } else {
      setSelectedBusinesses(selectedBusinesses.filter(id => id !== businessId));
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading businesses</h3>
          <p className="mt-1 text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Business Management - {branding.name}</title>
      </Helmet>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Back button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
          
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Business Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage all businesses registered on the platform
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
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search businesses by company name, contact, or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              
              {showFilters && (
                <div className="flex gap-4">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {statusOptions.map(option => (
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
          {selectedBusinesses.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedBusinesses.length} business{selectedBusinesses.length !== 1 ? 'es' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('approved')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkAction('rejected')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Business Table */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading businesses...</p>
              </div>
            ) : businessesData?.data?.length === 0 ? (
              <div className="p-6 text-center">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No businesses found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search || status !== 'all' ? 'Try adjusting your search or filters.' : 'No businesses have been registered yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedBusinesses.length === businessesData?.data?.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {businessesData?.data?.map((business) => (
                      <tr key={business._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedBusinesses.includes(business._id)}
                            onChange={(e) => handleSelectBusiness(business._id, e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {business.logo ? (
                                <img className="h-10 w-10 rounded-lg object-cover" src={business.logo} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gray-300 flex items-center justify-center">
                                  <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{business.company}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                {business.website && (
                                  <a
                                    href={business.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                  >
                                    <GlobeAltIcon className="h-3 w-3 mr-1" />
                                    Website
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{business.contactName}</div>
                          <div className="text-sm text-gray-500">{business.user?.email}</div>
                          <div className="text-sm text-gray-500">{business.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{business.industry}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={business.status || 'approved'}
                            onChange={(e) => handleStatusChange(business._id, e.target.value)}
                            className={`inline-flex px-2 pr-6 py-1 text-xs font-semibold rounded-full border-0 ${statusColors[business.status] || statusColors.approved}`}
                          >
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {business.companySize}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(business.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => window.open(business.website, '_blank')}
                              disabled={!business.website}
                              className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => impersonateBusinessMutation.mutate(business.user._id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Login as Business"
                            >
                              <ArrowRightOnRectangleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(business._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {businessesData?.pagination && businessesData.pagination.pages > 1 && (
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
                  disabled={page === businessesData.pagination.pages}
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
                      {(page - 1) * businessesData.pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(page * businessesData.pagination.limit, businessesData.pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{businessesData.pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: businessesData.pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === businessesData.pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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