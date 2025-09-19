import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useBranding } from '../../contexts/BrandingContext';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  XCircleIcon,
  EyeIcon,
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

export default function VAManagement() {
  const { branding } = useBranding();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedVAs, setSelectedVAs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch VAs
  const { data: vasData, isLoading, error } = useQuery(
    ['adminVAs', { search, status, page }],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      
      const response = await api.get(`/admin/vas?${params}`);
      return response.data;
    },
    {
      keepPreviousData: true
    }
  );

  // Update VA mutation
  const updateVAMutation = useMutation(
    async ({ id, data }) => {
      const response = await api.put(`/admin/vas/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminVAs');
        toast.success('VA updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update VA');
      }
    }
  );

  // Delete VA mutation
  const deleteVAMutation = useMutation(
    async (id) => {
      const response = await api.delete(`/admin/vas/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminVAs');
        toast.success('VA deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete VA');
      }
    }
  );

  // Impersonate VA mutation
  const impersonateVAMutation = useMutation(
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
        // Redirect to VA dashboard
        window.location.href = '/dashboard';
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to impersonate VA');
      }
    }
  );

  const handleStatusChange = (vaId, newStatus) => {
    updateVAMutation.mutate({
      id: vaId,
      data: { status: newStatus }
    });
  };

  const handleDelete = (vaId) => {
    if (window.confirm('Are you sure you want to delete this VA? This action cannot be undone.')) {
      deleteVAMutation.mutate(vaId);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedVAs.length === 0) {
      toast.warning('Please select VAs first');
      return;
    }

    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedVAs.length} VAs? This action cannot be undone.`)) {
        selectedVAs.forEach(id => deleteVAMutation.mutate(id));
        setSelectedVAs([]);
      }
    } else {
      selectedVAs.forEach(id => {
        updateVAMutation.mutate({
          id,
          data: { status: action }
        });
      });
      setSelectedVAs([]);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedVAs(vasData?.data?.map(va => va._id) || []);
    } else {
      setSelectedVAs([]);
    }
  };

  const handleSelectVA = (vaId, checked) => {
    if (checked) {
      setSelectedVAs([...selectedVAs, vaId]);
    } else {
      setSelectedVAs(selectedVAs.filter(id => id !== vaId));
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading VAs</h3>
          <p className="mt-1 text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>VA Management - {branding.name}</title>
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
                VA Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage all Virtual Assistants on the platform
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
                    placeholder="Search VAs by name, email, or bio..."
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
          {selectedVAs.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedVAs.length} VA{selectedVAs.length !== 1 ? 's' : ''} selected
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

          {/* VA Table */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading VAs...</p>
              </div>
            ) : vasData?.data?.length === 0 ? (
              <div className="p-6 text-center">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No VAs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search || status !== 'all' ? 'Try adjusting your search or filters.' : 'No VAs have been registered yet.'}
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
                          checked={selectedVAs.length === vasData?.data?.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        VA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Skills
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
                    {vasData?.data?.map((va) => (
                      <tr key={va._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedVAs.includes(va._id)}
                            onChange={(e) => handleSelectVA(va._id, e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {va.avatar ? (
                                <img className="h-10 w-10 rounded-full" src={va.avatar} alt="" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <UsersIcon className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{va.name}</div>
                              <div className="text-sm text-gray-500">{va.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{va.user?.email}</div>
                          <div className="text-sm text-gray-500">{va.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={va.status || 'approved'}
                            onChange={(e) => handleStatusChange(va._id, e.target.value)}
                            className={`inline-flex px-2 pr-6 py-1 text-xs font-semibold rounded-full border-0 ${statusColors[va.status] || statusColors.approved}`}
                          >
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {va.skills?.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))}
                            {va.skills?.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{va.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(va.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/vas/${va._id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => impersonateVAMutation.mutate(va.user._id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Login as VA"
                            >
                              <ArrowRightOnRectangleIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(va._id)}
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
          {vasData?.pagination && vasData.pagination.pages > 1 && (
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
                  disabled={page === vasData.pagination.pages}
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
                      {(page - 1) * vasData.pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(page * vasData.pagination.limit, vasData.pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{vasData.pagination.total}</span> results
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
                    {Array.from({ length: vasData.pagination.pages }, (_, i) => i + 1).map((pageNum) => (
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
                      disabled={page === vasData.pagination.pages}
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