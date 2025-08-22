import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  StarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';

const VAManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVAs, setSelectedVAs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVA, setSelectedVA] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const queryClient = useQueryClient();

  // Debounce search term (reduced to 200ms for more responsive search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch VAs with filters
  const { data: vasData, isLoading, error } = useQuery(
    ['vas', { search: debouncedSearchTerm, status: statusFilter, page: currentPage }],
    async () => {
      const response = await adminAPI.getVAs({
        search: debouncedSearchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: 20
      });
      // Handle axios response structure
      return response?.data || response;
    },
    {
      keepPreviousData: true,
      onError: (error) => {
        console.error('Error fetching VAs:', error);
        toast.error('Failed to load Virtual Assistants');
      }
    }
  );

  // Update VA status mutation
  const updateStatusMutation = useMutation(
    ({ id, status }) => adminAPI.updateVAStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vas');
        toast.success('VA status updated successfully');
      },
      onError: (error) => {
        toast.error('Failed to update VA status');
      },
    }
  );

  // Delete VA mutation
  const deleteVAMutation = useMutation(
    (id) => adminAPI.deleteVA(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vas');
        toast.success('VA deleted successfully');
      },
      onError: (error) => {
        toast.error('Failed to delete VA');
      },
    }
  );

  const handleStatusUpdate = (vaId, newStatus) => {
    updateStatusMutation.mutate({ id: vaId, status: newStatus });
  };

  const handleDelete = (vaId) => {
    if (window.confirm('Are you sure you want to delete this VA? This action cannot be undone.')) {
      deleteVAMutation.mutate(vaId);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedVAs.length === 0) {
      toast.warning('Please select VAs to perform bulk action');
      return;
    }

    if (window.confirm(`Are you sure you want to ${action} ${selectedVAs.length} VAs?`)) {
      selectedVAs.forEach(vaId => {
        if (action === 'approve') {
          updateStatusMutation.mutate({ id: vaId, status: 'approved' });
        } else if (action === 'suspend') {
          updateStatusMutation.mutate({ id: vaId, status: 'suspended' });
        } else if (action === 'delete') {
          deleteVAMutation.mutate(vaId);
        }
      });
      setSelectedVAs([]);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'admin-badge-warning', text: 'Pending' },
      approved: { class: 'admin-badge-success', text: 'Approved' },
      suspended: { class: 'admin-badge-danger', text: 'Suspended' },
      rejected: { class: 'admin-badge-danger', text: 'Rejected' },
    };

    const config = statusConfig[status] || { class: 'admin-badge-gray', text: status };
    return <span className={config.class}>{config.text}</span>;
  };

  // Handle different response structures
  const vas = Array.isArray(vasData?.data) 
    ? vasData.data 
    : Array.isArray(vasData) 
      ? vasData 
      : [];
  const pagination = vasData?.pagination || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="admin-loading"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-admin-900">Virtual Assistants</h1>
            <p className="mt-1 text-sm text-admin-600">
              Manage and moderate virtual assistant profiles
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="admin-button-secondary"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="admin-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative mt-0.5">
              <div className="absolute top-0 left-0 pl-3 flex items-center pointer-events-none" style={{ marginTop: '2px', height: '100%' }}>
                <MagnifyingGlassIcon className="h-5 w-5 text-admin-400" />
              </div>
              <input
                type="text"
                className="admin-input pl-10"
                placeholder="Search by name, email, phone, skills, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-admin-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-1">
                  Experience Level
                </label>
                <select className="admin-select">
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-1">
                  Hourly Rate
                </label>
                <select className="admin-select">
                  <option value="">All Rates</option>
                  <option value="0-10">$0 - $10</option>
                  <option value="10-20">$10 - $20</option>
                  <option value="20-50">$20 - $50</option>
                  <option value="50+">$50+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-1">
                  Location
                </label>
                <select className="admin-select">
                  <option value="">All Locations</option>
                  <option value="philippines">Philippines</option>
                  <option value="india">India</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedVAs.length > 0 && (
        <div className="admin-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-admin-600">
              {selectedVAs.length} VAs selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="admin-button-success"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="admin-button-danger"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="admin-button-danger"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VAs table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead className="admin-table-header">
              <tr>
                <th className="admin-table-header-cell">
                  <input
                    type="checkbox"
                    className="rounded border-admin-300"
                    checked={selectedVAs.length === vas.length && vas.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVAs(vas.map(va => va._id));
                      } else {
                        setSelectedVAs([]);
                      }
                    }}
                  />
                </th>
                <th className="admin-table-header-cell">VA Profile</th>
                <th className="admin-table-header-cell">Skills</th>
                <th className="admin-table-header-cell">Location</th>
                <th className="admin-table-header-cell">Rate</th>
                <th className="admin-table-header-cell">Status</th>
                <th className="admin-table-header-cell">Joined</th>
                <th className="admin-table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {vas.map((va) => (
                <tr key={va._id} className="hover:bg-admin-50">
                  <td className="admin-table-cell">
                    <input
                      type="checkbox"
                      className="rounded border-admin-300"
                      checked={selectedVAs.includes(va._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVAs([...selectedVAs, va._id]);
                        } else {
                          setSelectedVAs(selectedVAs.filter(id => id !== va._id));
                        }
                      }}
                    />
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {va.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={va.avatar}
                            alt={va.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-admin-200 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-admin-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-admin-900">
                          {va.name}
                        </div>
                        <div className="text-sm text-admin-500">
                          {va.email}
                        </div>
                        {va.rating && (
                          <div className="flex items-center mt-1">
                            <StarIcon className="h-4 w-4 text-warning-400 fill-current" />
                            <span className="text-sm text-admin-600 ml-1">
                              {va.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex flex-wrap gap-1">
                      {va.skills?.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="admin-badge-info text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {va.skills?.length > 3 && (
                        <span className="text-xs text-admin-500">
                          +{va.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center text-sm text-admin-900">
                      <MapPinIcon className="h-4 w-4 text-admin-400 mr-1" />
                      {va.location ?
                        (typeof va.location === 'string' ? va.location :
                         `${va.location.city || ''}${va.location.city && va.location.state ? ', ' : ''}${va.location.state || ''}${(va.location.city || va.location.state) && va.location.country ? ', ' : ''}${va.location.country || ''}`.trim() || 'Not specified'
                        ) : 'Not specified'}
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center text-sm text-admin-900">
                      <CurrencyDollarIcon className="h-4 w-4 text-admin-400 mr-1" />
                      {va.hourlyRate ? `$${va.hourlyRate}/hr` : 'Not set'}
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    {getStatusBadge(va.status)}
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center text-sm text-admin-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {new Date(va.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedVA(va);
                          setShowModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(va._id, va.status === 'approved' ? 'suspended' : 'approved')}
                        className={va.status === 'approved' ? 'text-danger-600 hover:text-danger-900' : 'text-success-600 hover:text-success-900'}
                        title={va.status === 'approved' ? 'Suspend' : 'Approve'}
                      >
                        {va.status === 'approved' ? <XMarkIcon className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(va._id)}
                        className="text-danger-600 hover:text-danger-900"
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
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-admin-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="admin-button-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="admin-button-secondary"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-admin-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="admin-button-secondary rounded-l-md"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                    className="admin-button-secondary rounded-r-md"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VA Details Modal */}
      {showModal && selectedVA && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-admin-900">VA Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-admin-400 hover:text-admin-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {selectedVA.avatar ? (
                  <img
                    className="h-16 w-16 rounded-full object-cover"
                    src={selectedVA.avatar}
                    alt={selectedVA.name}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-admin-200 flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-admin-500" />
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-semibold text-admin-900">{selectedVA.name}</h4>
                  <p className="text-admin-600">{selectedVA.email}</p>
                  {getStatusBadge(selectedVA.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-700">Location</label>
                  <p className="text-sm text-admin-900">
                    {selectedVA.location ?
                      (typeof selectedVA.location === 'string' ? selectedVA.location :
                       `${selectedVA.location.city || ''}${selectedVA.location.city && selectedVA.location.state ? ', ' : ''}${selectedVA.location.state || ''}${(selectedVA.location.city || selectedVA.location.state) && selectedVA.location.country ? ', ' : ''}${selectedVA.location.country || ''}`.trim() || 'Not specified'
                      ) : 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700">Hourly Rate</label>
                  <p className="text-sm text-admin-900">{selectedVA.hourlyRate ? `$${selectedVA.hourlyRate}/hr` : 'Not set'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {selectedVA.skills?.map((skill, index) => (
                    <span key={index} className="admin-badge-info">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700">Bio</label>
                <p className="text-sm text-admin-900 mt-1">{selectedVA.bio || 'No bio provided'}</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-admin-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="admin-button-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedVA._id, selectedVA.status === 'approved' ? 'suspended' : 'approved');
                    setShowModal(false);
                  }}
                  className={selectedVA.status === 'approved' ? 'admin-button-danger' : 'admin-button-success'}
                >
                  {selectedVA.status === 'approved' ? 'Suspend' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VAManagement;
