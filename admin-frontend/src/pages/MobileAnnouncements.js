import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MegaphoneIcon,
  ClockIcon,
  UsersIcon,
  UserIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/quill-custom.css';
import { adminAPI } from '../services/api';

const AnnouncementManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State management
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [selectedStats, setSelectedStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAnnouncements, setSelectedAnnouncements] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'all',
    priority: 'normal',
    expiresAt: '',
    isActive: true,
  });

  // Quill editor configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'blockquote', 'code-block',
    'list', 'bullet',
    'color', 'link'
  ];

  // Fetch announcements
  const { data: announcementsData, isLoading, error, refetch } = useQuery({
    queryKey: ['announcements', statusFilter, audienceFilter, currentPage],
    queryFn: async () => {
      const response = await adminAPI.getAnnouncementsAdmin({ 
        filter: statusFilter, // FIXED: Changed from 'status' to 'filter'
        targetAudience: audienceFilter === 'all' ? undefined : audienceFilter, // FIXED: Changed from 'audience' to 'targetAudience'
        page: currentPage,
        limit: 20
      });
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch stats for selected announcement
  const { data: announcementStats } = useQuery({
    queryKey: ['announcement-stats', selectedStats],
    queryFn: async () => {
      const response = await adminAPI.getAnnouncementStats(selectedStats);
      return response.data;
    },
    enabled: !!selectedStats,
    refetchInterval: 10000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success('Announcement created successfully');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create announcement');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success('Announcement updated successfully');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update announcement');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success('Announcement deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete announcement');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => adminAPI.updateAnnouncement(id, { isArchived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success('Announcement archived successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to archive announcement');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id) => adminAPI.updateAnnouncement(id, { isActive: true, isArchived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success('Announcement reactivated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reactivate announcement');
    },
  });

  const expireMutation = useMutation({
    mutationFn: (id) => adminAPI.updateAnnouncement(id, { expiresAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success('Announcement expired successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to expire announcement');
    },
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(t('announcements.validation.fillRequiredFields'));
      return;
    }

    const dataToSubmit = {
      ...formData,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    };

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement._id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  // Handle edit
  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : '',
      isActive: announcement.isActive,
    });
    setIsModalVisible(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalVisible(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      targetAudience: 'all',
      priority: 'normal',
      expiresAt: '',
      isActive: true,
    });
  };

  // Show stats
  const showStats = (announcement) => {
    setSelectedStats(announcement._id);
    setIsStatsModalVisible(true);
  };

  // Handle delete
  const handleDelete = (announcementId) => {
    if (window.confirm(t('announcements.confirmDelete'))) {
      deleteMutation.mutate(announcementId);
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    if (selectedAnnouncements.length === 0) {
      toast.warning(t('announcements.selectAnnouncementsForBulkAction'));
      return;
    }

    if (window.confirm(t('announcements.confirmBulkAction', { action: t(`announcements.actions.${action}`), count: selectedAnnouncements.length }))) {
      selectedAnnouncements.forEach(announcementId => {
        if (action === 'delete') {
          deleteMutation.mutate(announcementId);
        } else if (action === 'activate') {
          updateMutation.mutate({ id: announcementId, data: { isActive: true, isArchived: false } });
        } else if (action === 'deactivate') {
          updateMutation.mutate({ id: announcementId, data: { isActive: false } });
        } else if (action === 'archive') {
          archiveMutation.mutate(announcementId);
        } else if (action === 'expire') {
          expireMutation.mutate(announcementId);
        }
      });
      setSelectedAnnouncements([]);
    }
  };

  // Handle individual actions
  const handleArchive = (announcementId) => {
    if (window.confirm(t('announcements.confirmArchive'))) {
      archiveMutation.mutate(announcementId);
    }
  };

  const handleReactivate = (announcementId) => {
    if (window.confirm(t('announcements.confirmReactivate'))) {
      reactivateMutation.mutate(announcementId);
    }
  };

  const handleExpire = (announcementId) => {
    if (window.confirm(t('announcements.confirmExpire'))) {
      expireMutation.mutate(announcementId);
    }
  };

  // Strip HTML for preview
  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      urgent: { class: 'admin-badge-danger', text: t('announcements.priority.urgent') },
      high: { class: 'admin-badge-warning', text: t('announcements.priority.high') },
      normal: { class: 'admin-badge-info', text: t('announcements.priority.normal') },
      low: { class: 'admin-badge-success', text: t('announcements.priority.low') },
    };

    const config = priorityConfig[priority] || { class: 'admin-badge-gray', text: priority };
    return <span className={config.class}>{config.text}</span>;
  };

  // Get audience icon
  const getAudienceIcon = (audience) => {
    switch (audience) {
      case 'va': return <UserIcon className="h-4 w-4" />;
      case 'business': return <BuildingOfficeIcon className="h-4 w-4" />;
      default: return <UsersIcon className="h-4 w-4" />;
    }
  };

  // Get audience display text
  const getAudienceText = (audience) => {
    switch (audience) {
      case 'va': return t('announcements.audience.virtualAssistants');
      case 'business': return t('announcements.audience.businesses');
      default: return t('announcements.audience.allUsers');
    }
  };

  // Handle the API response structure
  const announcements = Array.isArray(announcementsData?.data) ? announcementsData.data : [];
  const pagination = announcementsData?.pagination || { pages: 1, total: 0, limit: 20 };

  // Check if announcement is expired
  const isExpired = (expiresAt) => {
    return expiresAt && new Date(expiresAt) < new Date();
  };

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
        <div className="text-red-600 mb-4">{t('announcements.failedToLoad')}</div>
        <div className="text-sm text-gray-600 mb-4">{error.message}</div>
        <button 
          onClick={() => refetch()}
          className="admin-button-primary"
        >
          {t('common.retry')}
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
            <h1 className="text-2xl font-bold text-admin-900">{t('announcements.title')}</h1>
            <p className="mt-1 text-sm text-admin-600">
              {t('announcements.description')}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="admin-button-secondary"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              {t('common.filters')}
            </button>
            <button
              onClick={() => setIsModalVisible(true)}
              className="admin-button-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('announcements.createAnnouncement')}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="admin-stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MegaphoneIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="admin-stat-label">{t('common.total')}</dt>
                <dd className="admin-stat-number">{announcements.length}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="admin-stat-label">{t('common.active')}</dt>
                <dd className="admin-stat-number">{announcements.filter(a => a.isActive).length}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="admin-stat-label">{t('announcements.stats.highPriority')}</dt>
                <dd className="admin-stat-number">{announcements.filter(a => a.priority === 'urgent' || a.priority === 'high').length}</dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="admin-stat-label">{t('announcements.stats.expired')}</dt>
                <dd className="admin-stat-number">{announcements.filter(a => isExpired(a.expiresAt)).length}</dd>
              </dl>
            </div>
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
                placeholder={t('announcements.searchPlaceholder')}
                value=""
                onChange={() => {}}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="active">{t('announcements.filters.activeOnly')}</option>
              <option value="expired">{t('announcements.filters.expiredOnly')}</option>
              <option value="archived">{t('announcements.filters.archivedOnly')}</option>
              <option value="all">{t('announcements.filters.allStatus')}</option>
            </select>
          </div>
          <div className="sm:w-48">
            <select
              className="admin-select"
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
            >
              <option value="all">{t('announcements.filters.allAudiences')}</option>
              <option value="va">{t('announcements.audience.virtualAssistants')}</option>
              <option value="business">{t('announcements.audience.businesses')}</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('announcements.filters.priorityLevel')}
                </label>
                <select className="admin-select">
                  <option value="">{t('announcements.filters.allPriorities')}</option>
                  <option value="urgent">{t('announcements.priority.urgent')}</option>
                  <option value="high">{t('announcements.priority.high')}</option>
                  <option value="normal">{t('announcements.priority.normal')}</option>
                  <option value="low">{t('announcements.priority.low')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('announcements.filters.createdDate')}
                </label>
                <select className="admin-select">
                  <option value="">{t('announcements.filters.allDates')}</option>
                  <option value="today">{t('common.today')}</option>
                  <option value="week">{t('common.thisWeek')}</option>
                  <option value="month">{t('common.thisMonth')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('announcements.filters.expiration')}
                </label>
                <select className="admin-select">
                  <option value="">{t('announcements.filters.all')}</option>
                  <option value="expired">{t('announcements.filters.expired')}</option>
                  <option value="expiring">{t('announcements.filters.expiringSoon')}</option>
                  <option value="no-expiry">{t('announcements.filters.noExpiry')}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedAnnouncements.length > 0 && (
        <div className="admin-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-admin-600">
              {t('announcements.selectedCount', { count: selectedAnnouncements.length })}
            </span>
            <div className="flex space-x-2 flex-wrap">
              <button
                onClick={() => handleBulkAction('activate')}
                className="admin-button-success"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                {t('announcements.actions.activate')}
              </button>
              <button
                onClick={() => handleBulkAction('expire')}
                className="admin-button-warning"
              >
                <ClockIcon className="h-4 w-4 mr-1" />
                {t('announcements.actions.expire')}
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="admin-button-secondary"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                {t('announcements.actions.archive')}
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="admin-button-danger"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead className="admin-table-header">
              <tr>
                <th className="admin-table-header-cell">
                  <input
                    type="checkbox"
                    className="rounded border-admin-300"
                    checked={selectedAnnouncements.length === announcements.length && announcements.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAnnouncements(announcements.map(announcement => announcement._id));
                      } else {
                        setSelectedAnnouncements([]);
                      }
                    }}
                  />
                </th>
                <th className="admin-table-header-cell">{t('announcements.table.announcement')}</th>
                <th className="admin-table-header-cell">{t('announcements.table.audience')}</th>
                <th className="admin-table-header-cell">{t('announcements.table.priority')}</th>
                <th className="admin-table-header-cell">{t('announcements.table.status')}</th>
                <th className="admin-table-header-cell">{t('announcements.table.stats')}</th>
                <th className="admin-table-header-cell">{t('announcements.table.created')}</th>
                <th className="admin-table-header-cell">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {announcements.map((announcement) => (
                <tr key={announcement._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                  <td className="admin-table-cell">
                    <input
                      type="checkbox"
                      className="rounded border-admin-300"
                      checked={selectedAnnouncements.includes(announcement._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAnnouncements([...selectedAnnouncements, announcement._id]);
                        } else {
                          setSelectedAnnouncements(selectedAnnouncements.filter(id => id !== announcement._id));
                        }
                      }}
                    />
                  </td>
                  <td className="admin-table-cell">
                    <div className="max-w-md">
                      <div className="text-sm font-medium text-admin-900 mb-1">
                        {announcement.title}
                      </div>
                      <div className="text-sm text-admin-500 line-clamp-2">
                        {stripHtml(announcement.content)}
                      </div>
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center text-sm">
                      {getAudienceIcon(announcement.targetAudience)}
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {getAudienceText(announcement.targetAudience)}
                      </span>
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    {getPriorityBadge(announcement.priority)}
                  </td>
                  <td className="admin-table-cell">
                    {announcement.isArchived ? (
                      <span className="admin-badge-gray">{t('announcements.status.archived')}</span>
                    ) : isExpired(announcement.expiresAt) ? (
                      <span className="admin-badge-danger">{t('announcements.status.expired')}</span>
                    ) : announcement.isActive ? (
                      <span className="admin-badge-success">{t('announcements.status.active')}</span>
                    ) : (
                      <span className="admin-badge-warning">{t('announcements.status.inactive')}</span>
                    )}
                  </td>
                  <td className="admin-table-cell">
                    <button
                      onClick={() => showStats(announcement)}
                      className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <ChartBarIcon className="h-4 w-4 mr-1" />
                      {t('announcements.readsCount', { count: announcement.readBy?.length || 0 })}
                    </button>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="font-medium">
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="admin-table-cell">
                    <div className="flex items-center justify-end space-x-1">
                      {/* View Stats - Info */}
                      <button
                        onClick={() => showStats(announcement)}
                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 group"
                        title={t('announcements.actions.viewStats')}
                      >
                        <ChartBarIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>
                      
                      {/* Edit - Warning */}
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all duration-200 group"
                        title={t('announcements.editAnnouncement')}
                      >
                        <PencilIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Conditional Status Actions */}
                      {isExpired(announcement.expiresAt) ? (
                        // Reactivate for expired announcements
                        <button
                          onClick={() => handleReactivate(announcement._id)}
                          className="p-2 rounded-lg text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-200 group"
                          title={t('announcements.actions.reactivate')}
                        >
                          <CheckIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                      ) : announcement.isActive ? (
                        // Expire for active announcements
                        <button
                          onClick={() => handleExpire(announcement._id)}
                          className="p-2 rounded-lg text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-all duration-200 group"
                          title={t('announcements.actions.expireNow')}
                        >
                          <ClockIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                      ) : (
                        // Activate for inactive announcements
                        <button
                          onClick={() => handleReactivate(announcement._id)}
                          className="p-2 rounded-lg text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-all duration-200 group"
                          title={t('announcements.actions.activate')}
                        >
                          <CheckIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                      )}

                      {/* Archive - Secondary */}
                      {!announcement.isArchived && (
                        <button
                          onClick={() => handleArchive(announcement._id)}
                          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-all duration-200 group"
                          title={t('announcements.actions.archive')}
                        >
                          <XMarkIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                      
                      {/* Delete - Danger */}
                      <button
                        onClick={() => handleDelete(announcement._id)}
                        className="p-2 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200 group"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="admin-button-secondary"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="admin-button-secondary"
              >
                {t('common.next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('tables.showingXofY', {
                    start: (currentPage - 1) * pagination.limit + 1,
                    end: Math.min(currentPage * pagination.limit, pagination.total),
                    total: pagination.total
                  })}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-l-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {t('common.previous')}
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-r-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 -ml-px"
                  >
                    {t('common.next')}
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalVisible && (
        <div className="admin-modal-overlay" onClick={() => closeModal()}>
          <div className="admin-modal-content max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-admin-900">
                {editingAnnouncement ? t('announcements.editAnnouncement') : t('announcements.createNewAnnouncement')}
              </h3>
              <button
                onClick={() => closeModal()}
                className="text-admin-400 hover:text-admin-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  {t('announcements.form.title')} *
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('announcements.form.titlePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  {t('announcements.form.content')} *
                </label>
                <div className="quill-editor-container">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    modules={modules}
                    formats={formats}
                    placeholder={t('announcements.form.contentPlaceholder')}
                    style={{ minHeight: '250px', marginBottom: '50px' }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {t('announcements.form.editorHelp')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">
                    {t('announcements.form.targetAudience')} *
                  </label>
                  <select
                    className="admin-select"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    required
                  >
                    <option value="all">{t('announcements.audience.allUsers')}</option>
                    <option value="va">{t('announcements.audience.virtualAssistants')}</option>
                    <option value="business">{t('announcements.audience.businesses')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">
                    {t('announcements.form.priority')} *
                  </label>
                  <select
                    className="admin-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    required
                  >
                    <option value="low">{t('announcements.priority.low')}</option>
                    <option value="normal">{t('announcements.priority.normal')}</option>
                    <option value="high">{t('announcements.priority.high')}</option>
                    <option value="urgent">{t('announcements.priority.urgent')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-1">
                    {t('announcements.form.expirationDate')}
                  </label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  {t('announcements.form.activeDescription')}
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-admin-200">
                <button
                  type="button"
                  onClick={() => closeModal()}
                  className="admin-button-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="admin-button-primary"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      {editingAnnouncement ? t('announcements.updating') : t('announcements.creating')}
                    </>
                  ) : (
                    <>
                      {editingAnnouncement ? t('announcements.updateAnnouncement') : t('announcements.createAnnouncement')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {isStatsModalVisible && selectedStats && (
        <div className="admin-modal-overlay" onClick={() => setIsStatsModalVisible(false)}>
          <div className="admin-modal-content max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-admin-900">{t('announcements.stats.title')}</h3>
              <button
                onClick={() => setIsStatsModalVisible(false)}
                className="text-admin-400 hover:text-admin-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {announcementStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="admin-stat-card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <EyeIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="admin-stat-label">{t('announcements.stats.totalViews')}</dt>
                          <dd className="admin-stat-number">{announcementStats.totalViews || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="admin-stat-label">{t('announcements.stats.readRate')}</dt>
                          <dd className="admin-stat-number">{announcementStats.readRate || 0}%</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="admin-stat-card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UsersIcon className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="admin-stat-label">{t('announcements.stats.targetUsers')}</dt>
                          <dd className="admin-stat-number">{announcementStats.totalTargetUsers || 0}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-admin-200">
                  <button
                    onClick={() => setIsStatsModalVisible(false)}
                    className="admin-button-secondary"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManagement;