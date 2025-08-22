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
  BuildingOfficeIcon,
  StarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';

const BusinessManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBusinesses, setSelectedBusinesses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);

  const queryClient = useQueryClient();

  // Debounce search term (reduced to 200ms for more responsive search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch businesses with filters
  const { data: businessesData, isLoading, error } = useQuery(
    ['businesses', { search: debouncedSearchTerm, status: statusFilter, page: currentPage }],
    async () => {
      const response = await adminAPI.getBusinesses({
        search: debouncedSearchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: 20
      });
      console.log('Businesses API response:', response);
      return response.data; // Extract the data from axios response
    },
    {
      keepPreviousData: true,
      onError: (error) => {
        console.error('Error fetching businesses:', error);
        toast.error('Failed to load businesses');
      }
    }
  );

  // Update business status mutation
  const updateStatusMutation = useMutation(
    ({ id, status }) => adminAPI.updateBusinessStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('businesses');
        toast.success('Business status updated successfully');
      },
      onError: (error) => {
        toast.error('Failed to update business status');
      },
    }
  );

  // Delete business mutation
  const deleteBusinessMutation = useMutation(
    (id) => adminAPI.deleteBusiness(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('businesses');
        toast.success('Business deleted successfully');
      },
      onError: (error) => {
        toast.error('Failed to delete business');
      },
    }
  );

  // Update business profile mutation
  const updateBusinessMutation = useMutation(
    ({ id, data }) => adminAPI.updateBusiness(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('businesses');
        toast.success('Business profile updated successfully');
        setShowEditModal(false);
        setEditingBusiness(null);
      },
      onError: (error) => {
        toast.error('Failed to update business profile');
      },
    }
  );

  const handleStatusUpdate = (businessId, newStatus) => {
    updateStatusMutation.mutate({ id: businessId, status: newStatus });
  };

  const handleDelete = (businessId) => {
    if (window.confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      deleteBusinessMutation.mutate(businessId);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedBusinesses.length === 0) {
      toast.warning('Please select businesses to perform bulk action');
      return;
    }

    if (window.confirm(`Are you sure you want to ${action} ${selectedBusinesses.length} businesses?`)) {
      selectedBusinesses.forEach(businessId => {
        if (action === 'approve') {
          updateStatusMutation.mutate({ id: businessId, status: 'approved' });
        } else if (action === 'suspend') {
          updateStatusMutation.mutate({ id: businessId, status: 'suspended' });
        } else if (action === 'delete') {
          deleteBusinessMutation.mutate(businessId);
        }
      });
      setSelectedBusinesses([]);
    }
  };

  const handleEdit = (business) => {
    setEditingBusiness({ ...business });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingBusiness) return;

    const updateData = {
      company: editingBusiness.company,
      contactName: editingBusiness.contactName,
      contactEmail: editingBusiness.contactEmail,
      phone: editingBusiness.phone,
      website: editingBusiness.website,
      industry: editingBusiness.industry,
      companySize: editingBusiness.companySize,
      location: editingBusiness.location,
      description: editingBusiness.description,
      foundedYear: editingBusiness.foundedYear ? parseInt(editingBusiness.foundedYear) : undefined,
      linkedinProfile: editingBusiness.linkedinProfile,
      hiringRequirements: editingBusiness.hiringRequirements,
      budgetRange: editingBusiness.budgetRange
    };

    updateBusinessMutation.mutate({ id: editingBusiness._id, data: updateData });
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

  const getCompanySizeBadge = (size) => {
    const sizeConfig = {
      'startup': { class: 'admin-badge-info', text: 'Startup (1-10)' },
      'small': { class: 'admin-badge-info', text: 'Small (11-50)' },
      'medium': { class: 'admin-badge-warning', text: 'Medium (51-200)' },
      'large': { class: 'admin-badge-success', text: 'Large (201-1000)' },
      'enterprise': { class: 'admin-badge-success', text: 'Enterprise (1000+)' },
    };

    const config = sizeConfig[size] || { class: 'admin-badge-gray', text: size || 'Not specified' };
    return <span className={config.class}>{config.text}</span>;
  };

  // Handle the API response structure
  const businesses = Array.isArray(businessesData?.data) ? businessesData.data : [];
  const pagination = businessesData?.pagination || { pages: 1, total: 0, limit: 20 };
  
  console.log('Businesses data:', businesses);
  console.log('Pagination data:', pagination);

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
            <h1 className="text-2xl font-bold text-admin-900">Business Management</h1>
            <p className="mt-1 text-sm text-admin-600">
              Manage businesses from both Linkage VA Hub and E-Systems platforms
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-admin-400" />
              </div>
              <input
                type="text"
                className="admin-input pl-10"
                placeholder="Search by company name, email, phone, industry, location..."
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
                  Company Size
                </label>
                <select className="admin-select">
                  <option value="">All Sizes</option>
                  <option value="startup">Startup (1-10)</option>
                  <option value="small">Small (11-50)</option>
                  <option value="medium">Medium (51-200)</option>
                  <option value="large">Large (201-1000)</option>
                  <option value="enterprise">Enterprise (1000+)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-1">
                  Industry
                </label>
                <select className="admin-select">
                  <option value="">All Industries</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-1">
                  Platform Source
                </label>
                <select className="admin-select">
                  <option value="">All Platforms</option>
                  <option value="linkage">Linkage VA Hub</option>
                  <option value="esystems">E-Systems</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedBusinesses.length > 0 && (
        <div className="admin-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-admin-600">
              {selectedBusinesses.length} businesses selected
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

      {/* Businesses table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead className="admin-table-header">
              <tr>
                <th className="admin-table-header-cell">
                  <input
                    type="checkbox"
                    className="rounded border-admin-300"
                    checked={selectedBusinesses.length === businesses.length && businesses.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBusinesses(businesses.map(business => business._id));
                      } else {
                        setSelectedBusinesses([]);
                      }
                    }}
                  />
                </th>
                <th className="admin-table-header-cell">Company</th>
                <th className="admin-table-header-cell">Industry</th>
                <th className="admin-table-header-cell">Size</th>
                <th className="admin-table-header-cell">Location</th>
                <th className="admin-table-header-cell">Platform</th>
                <th className="admin-table-header-cell">Status</th>
                <th className="admin-table-header-cell">Joined</th>
                <th className="admin-table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {businesses.map((business) => (
                <tr key={business._id} className="hover:bg-admin-50">
                  <td className="admin-table-cell">
                    <input
                      type="checkbox"
                      className="rounded border-admin-300"
                      checked={selectedBusinesses.includes(business._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBusinesses([...selectedBusinesses, business._id]);
                        } else {
                          setSelectedBusinesses(selectedBusinesses.filter(id => id !== business._id));
                        }
                      }}
                    />
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {business.logo ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={business.logo}
                            alt={business.company}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-admin-200 flex items-center justify-center">
                            <BuildingOfficeIcon className="h-6 w-6 text-admin-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-admin-900">
                          {business.company}
                        </div>
                        <div className="text-sm text-admin-500">
                          {business.contactEmail || business.email}
                        </div>
                        {business.website && (
                          <div className="text-sm text-primary-600">
                            <a href={business.website} target="_blank" rel="noopener noreferrer">
                              {business.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center text-sm text-admin-900">
                      <BriefcaseIcon className="h-4 w-4 text-admin-400 mr-1" />
                      {business.industry || 'Not specified'}
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    {getCompanySizeBadge(business.companySize)}
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center text-sm text-admin-900">
                      <MapPinIcon className="h-4 w-4 text-admin-400 mr-1" />
                      {business.location || 'Not specified'}
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <span className={`admin-badge ${business.platform === 'esystems' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                      {business.platform === 'esystems' ? 'E-Systems' : 'Linkage VA Hub'}
                    </span>
                  </td>
                  <td className="admin-table-cell">
                    {getStatusBadge(business.status)}
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center text-sm text-admin-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {new Date(business.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBusiness(business);
                          setShowModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(business)}
                        className="text-warning-600 hover:text-warning-900"
                        title="Edit Profile"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(business._id, business.status === 'approved' ? 'suspended' : 'approved')}
                        className={business.status === 'approved' ? 'text-danger-600 hover:text-danger-900' : 'text-success-600 hover:text-success-900'}
                        title={business.status === 'approved' ? 'Suspend' : 'Approve'}
                      >
                        {business.status === 'approved' ? <XMarkIcon className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(business._id)}
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

      {/* Business Details Modal */}
      {showModal && selectedBusiness && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-admin-900">Business Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-admin-400 hover:text-admin-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                {selectedBusiness.logo ? (
                  <img
                    className="h-16 w-16 rounded-lg object-cover"
                    src={selectedBusiness.logo}
                    alt={selectedBusiness.company}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-admin-200 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-8 w-8 text-admin-500" />
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-semibold text-admin-900">{selectedBusiness.company}</h4>
                  <p className="text-admin-600">{selectedBusiness.contactEmail || selectedBusiness.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(selectedBusiness.status)}
                    <span className={`admin-badge ${selectedBusiness.platform === 'esystems' ? 'admin-badge-warning' : 'admin-badge-info'}`}>
                      {selectedBusiness.platform === 'esystems' ? 'E-Systems' : 'Linkage VA Hub'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-admin-700">Industry</label>
                    <p className="text-sm text-admin-900">{selectedBusiness.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-admin-700">Company Size</label>
                    {getCompanySizeBadge(selectedBusiness.companySize)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-admin-700">Founded</label>
                    <p className="text-sm text-admin-900">{selectedBusiness.foundedYear || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-admin-700">Location</label>
                    <p className="text-sm text-admin-900">{selectedBusiness.location || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-admin-700">Website</label>
                    {selectedBusiness.website ? (
                      <a 
                        href={selectedBusiness.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        {selectedBusiness.website}
                      </a>
                    ) : (
                      <p className="text-sm text-admin-900">Not provided</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-admin-700">LinkedIn</label>
                    {selectedBusiness.linkedinProfile ? (
                      <a 
                        href={selectedBusiness.linkedinProfile} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        View LinkedIn Profile
                      </a>
                    ) : (
                      <p className="text-sm text-admin-900">Not provided</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-admin-700">Phone</label>
                    <p className="text-sm text-admin-900">{selectedBusiness.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-admin-700">Joined</label>
                    <p className="text-sm text-admin-900">{new Date(selectedBusiness.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700">Company Description</label>
                <p className="text-sm text-admin-900 mt-1">{selectedBusiness.description || 'No description provided'}</p>
              </div>

              {selectedBusiness.hiringRequirements && (
                <div>
                  <label className="block text-sm font-medium text-admin-700">Hiring Requirements</label>
                  <p className="text-sm text-admin-900 mt-1">{selectedBusiness.hiringRequirements}</p>
                </div>
              )}

              {selectedBusiness.budgetRange && (
                <div>
                  <label className="block text-sm font-medium text-admin-700">Budget Range</label>
                  <p className="text-sm text-admin-900 mt-1">{selectedBusiness.budgetRange}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-admin-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="admin-button-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedBusiness._id, selectedBusiness.status === 'approved' ? 'suspended' : 'approved');
                    setShowModal(false);
                  }}
                  className={selectedBusiness.status === 'approved' ? 'admin-button-danger' : 'admin-button-success'}
                >
                  {selectedBusiness.status === 'approved' ? 'Suspend' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Edit Modal */}
      {showEditModal && editingBusiness && (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal-content max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-admin-900">Edit Business Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-admin-400 hover:text-admin-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingBusiness.company || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingBusiness.contactName || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, contactName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={editingBusiness.contactEmail || editingBusiness.email || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">Phone</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingBusiness.phone || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">Website</label>
                  <input
                    type="url"
                    className="admin-input"
                    value={editingBusiness.website || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, website: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">LinkedIn Profile</label>
                  <input
                    type="url"
                    className="admin-input"
                    value={editingBusiness.linkedinProfile || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, linkedinProfile: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">Industry</label>
                  <select
                    className="admin-select"
                    value={editingBusiness.industry || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, industry: e.target.value })}
                  >
                    <option value="">Select Industry</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="consulting">Consulting</option>
                    <option value="marketing">Marketing</option>
                    <option value="real-estate">Real Estate</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">Company Size</label>
                  <select
                    className="admin-select"
                    value={editingBusiness.companySize || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, companySize: e.target.value })}
                  >
                    <option value="">Select Size</option>
                    <option value="startup">Startup (1-10)</option>
                    <option value="small">Small (11-50)</option>
                    <option value="medium">Medium (51-200)</option>
                    <option value="large">Large (201-1000)</option>
                    <option value="enterprise">Enterprise (1000+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">Founded Year</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editingBusiness.foundedYear || ''}
                    onChange={(e) => setEditingBusiness({ ...editingBusiness, foundedYear: e.target.value })}
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-1">Location</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingBusiness.location || ''}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, location: e.target.value })}
                  placeholder="City, State, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-1">Company Description</label>
                <textarea
                  className="admin-input"
                  rows={3}
                  value={editingBusiness.description || ''}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-1">Hiring Requirements</label>
                <textarea
                  className="admin-input"
                  rows={2}
                  value={editingBusiness.hiringRequirements || ''}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, hiringRequirements: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-1">Budget Range</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingBusiness.budgetRange || ''}
                  onChange={(e) => setEditingBusiness({ ...editingBusiness, budgetRange: e.target.value })}
                  placeholder="e.g., $5,000 - $10,000 per month"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-admin-200 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="admin-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateBusinessMutation.isLoading}
                className="admin-button-primary"
              >
                {updateBusinessMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessManagement;
