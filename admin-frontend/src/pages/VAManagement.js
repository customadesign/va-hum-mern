import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  ClockIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';
import VAEditModal from '../components/VAEditModal';

const VAManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVAs, setSelectedVAs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVA, setSelectedVA] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVAId, setEditingVAId] = useState(null);
  // Initialize from cached settings to apply on first render (no reload needed)
  const getInitialPageSize = () => {
    try {
      const cached = sessionStorage.getItem('admin_settings_cache');
      if (cached) {
        const { data } = JSON.parse(cached);
        const d = data?.settings?.performance?.pagination?.defaultLimit;
        if (d) return Number(d);
      }
      const last = localStorage.getItem('defaultPageSize');
      if (last) return Number(last);
    } catch {}
    return 25;
  };
  const [maxVAsPerPage, setMaxVAsPerPage] = useState(getInitialPageSize());

  const queryClient = useQueryClient();
  const highlightId = searchParams.get('highlight');
  const searchParam = searchParams.get('search');
  const { t } = useTranslation();

  // Listen for settings changes across tabs/components
  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      if (e.key === 'settingsUpdated') {
        console.log('Settings updated, refreshing VAs and settings...');
        // Invalidate both settings and VAs queries to refetch with new limits
        queryClient.invalidateQueries(['settings']);
        queryClient.invalidateQueries(['vas']);
      }
    };

    // Listen for storage events (cross-tab communication)
    window.addEventListener('storage', handleSettingsUpdate);
    
    // Also listen for custom events (same-tab communication)
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [queryClient]);

  // Auto-populate search when we have search parameter
  useEffect(() => {
    if (searchParam && !searchTerm) {
      console.log('🎯 Search parameter detected:', searchParam);
      setSearchTerm(searchParam);
      setDebouncedSearchTerm(searchParam);
      setStatusFilter('all');
      setCurrentPage(1);
      // Clear the search param from URL after setting
      navigate('/vas', { replace: true });
    }
  }, [searchParam, searchTerm, navigate]);

  // Debounce search term (800ms to allow comfortable typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 800);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch max VAs per page setting
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getConfig();
        return response.data;
      } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
      }
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the settings
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  // Update maxVAsPerPage when settings are loaded
  useEffect(() => {
    if (settingsData?.performance?.pagination?.defaultLimit) {
      const newMaxVAs = Number(settingsData.performance.pagination.defaultLimit);
      console.log('Updating maxVAsPerPage from settings:', newMaxVAs);
      setMaxVAsPerPage(newMaxVAs);
      // Invalidate the VAs query to refetch with new limit
      queryClient.invalidateQueries(['vas']);
      // Mirror latest for fast-start in new tabs
      localStorage.setItem('defaultPageSize', String(newMaxVAs));
    }
  }, [settingsData, queryClient]);
  // Fetch VAs with filters
  const { data: vasData, isLoading, error, refetch } = useQuery({
    queryKey: ['vas', { search: debouncedSearchTerm, status: statusFilter, page: currentPage, limit: maxVAsPerPage }],
    queryFn: async () => {
      try {
        const response = await adminAPI.getVAs({
          search: debouncedSearchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          page: currentPage,
          limit: maxVAsPerPage
        });
        console.log('VAs API response:', response);
        // Return the full response for proper data access
        return response.data;
      } catch (error) {
        console.error('Error in VAs queryFn:', error);
        throw error;
      }
    },
    keepPreviousData: true,
    retry: 1,
    onError: (error) => {
      console.error('Error fetching VAs:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load Virtual Assistants');
      }
    }
  });

  // Update VA status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminAPI.updateVAStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['vas']);
      toast.success('VA status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update VA status');
    },
  });

  // Delete VA mutation
  const deleteVAMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteVA(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['vas']);
      toast.success('VA deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete VA');
    },
  });

  // Removed old update mutation - now handled by VAEditModal component

  // Handle highlighted VA from query params - improved timing
  useEffect(() => {
    console.log('🎯 VAManagement: highlightId:', highlightId);
    console.log('📋 VAManagement: vasData loaded:', !!vasData?.data);
    console.log('🔍 VAs count:', vasData?.data?.length);
    
    if (highlightId && vasData?.data && !isLoading) {
      console.log('🔍 Looking for VA with ID:', highlightId);
      console.log('📋 Available VAs:', vasData.data.map(va => ({ id: va._id, name: va.name })));
      
      const vaToHighlight = vasData.data.find(va => va._id === highlightId);
      console.log('✅ Found VA to highlight:', vaToHighlight);
      
      if (vaToHighlight) {
        console.log('🚀 Opening modal for VA:', vaToHighlight.name);
        setSelectedVA(vaToHighlight);
        setShowModal(true);
        // Clear the highlight param after showing modal
        setTimeout(() => {
          navigate('/vas', { replace: true });
        }, 100);
      } else {
        console.log('⚠️ VA not found in current results. Available VAs:');
        vasData.data.forEach(va => console.log(`  - ${va.name} (${va._id})`));
      }
    }
  }, [highlightId, vasData, isLoading, navigate]);

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

  const handleEdit = (va) => {
    setEditingVAId(va._id);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries(['vas']);
    setShowEditModal(false);
    setEditingVAId(null);
  };

  const handleImpersonate = async (va) => {
    try {
      // Check if VA exists
      if (!va) {
        toast.error('VA data not available');
        return;
      }

      // Get the user ID associated with this VA
      let userId = null;
      if (va.user) {
        // User could be an object with _id or just a string ID
        userId = typeof va.user === 'object' ? va.user._id : va.user;
      }
      
      if (!userId) {
        toast.error('Cannot impersonate: VA has no associated user account');
        return;
      }

      const response = await adminAPI.impersonateUser(userId);
      if (response.data.success) {
        // Store the impersonation token
        const impersonationToken = response.data.data.token;
        
        // Store the token in localStorage for the main app to pick up
        localStorage.setItem('token', impersonationToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        // Navigate to the main Linkage VA Hub app with the impersonation token
        const linkageUrl = process.env.REACT_APP_MAIN_APP_URL || 'http://localhost:3000';
        window.location.href = `${linkageUrl}/conversations`;
        
        toast.success(`Impersonating ${va.name || 'VA'}`);
      }
    } catch (error) {
      console.error('Impersonation error:', error);
      toast.error(error.response?.data?.error || 'Failed to impersonate user');
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

  // Handle the API response structure properly
  const vas = Array.isArray(vasData?.data) ? vasData.data : [];
  const pagination = vasData?.pagination || { pages: 1, total: 0, limit: maxVAsPerPage };
  
  console.log('VAs data:', vas);
  console.log('Pagination data:', pagination);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="admin-loading"></div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load Virtual Assistants</div>
        <div className="text-sm text-gray-600 mb-4">{error.message}</div>
        <button 
          onClick={() => refetch()}
          className="admin-button-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-admin-900">{t('vas-management')}</h1>
            <p className="mt-1 text-sm text-admin-600">
              {t('manage-and-moderate')}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="admin-button-secondary"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              {t('filters')}
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
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder={t('search-placeholder')}
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
              <option value="all">{t('all-status')}</option>
              <option value="approved">{t('approved')}</option>
              <option value="suspended">{t('suspended')}</option>
              <option value="rejected">{t('rejected')}</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('experience-level')}
                </label>
                <select className="admin-select">
                  <option value="">{t('all-levels')}</option>
                  <option value="entry">{t('entry-level')}</option>
                  <option value="intermediate">{t('intermediate')}</option>
                  <option value="expert">{t('expert')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('hourly-rate')}
                </label>
                <select className="admin-select">
                  <option value="">{t('all-rates')}</option>
                  <option value="0-10">${t('0-10')}</option>
                  <option value="10-20">${t('10-20')}</option>
                  <option value="20-50">${t('20-50')}</option>
                  <option value="50+">${t('50-plus')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('location')}
                </label>
                <select className="admin-select">
                  <option value="">{t('all-locations')}</option>
                  <option value="philippines">{t('philippines')}</option>
                  <option value="india">{t('india')}</option>
                  <option value="other">{t('other')}</option>
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
              {selectedVAs.length} {t('vas-selected')}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="admin-button-success"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                {t('approve')}
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="admin-button-danger"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                {t('suspend')}
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="admin-button-danger"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VAs table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-[#1e3a8a] dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-400 uppercase tracking-wider">
                  <input
                    data-test="table-select-all"
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-400 uppercase tracking-wider">{t('va-profile')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-400 uppercase tracking-wider">{t('skills')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-400 uppercase tracking-wider">{t('location')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-400 uppercase tracking-wider">{t('rate')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-400 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white dark:text-gray-400 uppercase tracking-wider">{t('joined')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white dark:text-gray-400 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {vas.map((va) => (
                <tr key={va._id} data-test="table-row" className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      data-test="table-row-select"
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {va.avatar ? (
                          <img
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                            src={va.avatar}
                            alt={va.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700">
                            <UserIcon className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {va.name}
                        </div>
                        <div className="text-sm text-white dark:text-gray-400 truncate">
                          {va.email}
                        </div>
                        {va.rating && (
                          <div className="flex items-center mt-1">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 dark:text-gray-300 ml-1 font-medium">
                              {va.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {va.skills?.slice(0, 2).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {va.skills?.length > 2 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                          +{va.skills.length - 2} more
                        </span>
                      )}
                      {(!va.skills || va.skills.length === 0) && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">{t('no-skills')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {va.location ?
                          (typeof va.location === 'string' ? va.location :
                           `${va.location.city || ''}${va.location.city && va.location.state ? ', ' : ''}${va.location.state || ''}${(va.location.city || va.location.state) && va.location.country ? ', ' : ''}${va.location.country || ''}`.trim() ||
                           <span className="text-gray-400 dark:text-gray-500 italic">{t('not-specified')}</span>
                          ) : <span className="text-gray-400 dark:text-gray-500 italic">{t('not-specified')}</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm">
                      <CurrencyDollarIcon className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                      {va.hourlyRate ? (
                        <span className="font-semibold text-green-700 dark:text-green-300">
                          ${va.hourlyRate}/hr
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">{t('not-set')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(va.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-white dark:text-gray-400">
                      <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="font-medium">
                        {new Date(va.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {/* View Details - Primary */}
                      <button
                        onClick={() => {
                          setSelectedVA(va);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 group"
                        title={t('view-details')}
                      >
                        <EyeIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      
                      {/* Edit Profile - Warning */}
                      <button
                        onClick={() => handleEdit(va)}
                        className="p-2 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all duration-200 group"
                        title={t('edit-profile')}
                      >
                        <PencilIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      
                      {/* Status Toggle - Success/Danger */}
                      <button
                        onClick={() => handleStatusUpdate(va._id, va.status === 'approved' ? 'suspended' : 'approved')}
                        className={va.status === 'approved'
                          ? 'p-2 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200 group'
                          : 'p-2 rounded-lg text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-200 group'
                        }
                        title={va.status === 'approved' ? t('suspend') : t('approve')}
                      >
                        {va.status === 'approved'
                          ? <XMarkIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          : <CheckIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        }
                      </button>
                      
                      {/* Delete - Danger */}
                      <button
                        onClick={() => handleDelete(va._id)}
                        className="p-2 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200 group"
                        title={t('delete')}
                      >
                        <TrashIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      
                      {/* Impersonate - Special */}
                      <button
                        onClick={() => handleImpersonate(va)}
                        className={va.user
                          ? "p-2 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-200 group"
                          : "p-2 rounded-lg text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50"
                        }
                        title={va.user ? t('impersonate-va') : t('no-user-account')}
                        disabled={!va.user}
                      >
                        <ArrowRightOnRectangleIcon className={va.user ? "h-4 w-4 group-hover:scale-110 transition-transform" : "h-4 w-4"} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {vas.length > 0 && (
          <div data-test="pagination" className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="admin-button-secondary"
              >
                {t('previous')}
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="admin-button-secondary"
              >
                {t('next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('showing')}{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {(currentPage - 1) * pagination.limit + 1}
                  </span>{' '}
                  {t('to')}{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>{' '}
                  {t('of')}{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {pagination.total}
                  </span>{' '}
                  {t('results')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span data-test="page-size">{pagination.limit}</span> per page
                </p>
              </div>
              {pagination.pages > 1 && (
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-l-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {t('previous')}
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                      disabled={currentPage === pagination.pages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-r-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 -ml-px"
                    >
                      {t('next')}
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* VA Details Modal */}
      {showModal && selectedVA && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-admin-900">{t('va-details')}</h3>
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
                  <label className="block text-sm font-medium text-admin-700">{t('location')}</label>
                  <p className="text-sm text-admin-900">
                    {selectedVA.location ?
                      (typeof selectedVA.location === 'string' ? selectedVA.location :
                       `${selectedVA.location.city || ''}${selectedVA.location.city && selectedVA.location.state ? ', ' : ''}${selectedVA.location.state || ''}${(selectedVA.location.city || selectedVA.location.state) && selectedVA.location.country ? ', ' : ''}${selectedVA.location.country || ''}`.trim() || t('not-specified')
                      ) : t('not-specified')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700">{t('hourly-rate')}</label>
                  <p className="text-sm text-admin-900">{selectedVA.hourlyRate ? `$${selectedVA.hourlyRate}/hr` : t('not-set')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">{t('skills')}</label>
                <div className="flex flex-wrap gap-2">
                  {selectedVA.skills?.map((skill, index) => (
                    <span key={index} className="admin-badge-info">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700">{t('bio')}</label>
                <p className="text-sm text-admin-900 mt-1">{selectedVA.bio || t('no-bio')}</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-admin-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="admin-button-secondary"
                >
                  {t('close')}
                </button>
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedVA._id, selectedVA.status === 'approved' ? 'suspended' : 'approved');
                    setShowModal(false);
                  }}
                  className={selectedVA.status === 'approved' ? 'admin-button-danger' : 'admin-button-success'}
                >
                  {selectedVA.status === 'approved' ? t('suspend') : t('approve')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive VA Edit Modal */}
      <VAEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingVAId(null);
        }}
        vaId={editingVAId}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default VAManagement;
