import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import {
  UsersIcon,
  BuildingOfficeIcon,
  MegaphoneIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ChartBarIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';
import ActivityDetailsModal from '../components/dashboard/ActivityDetailsModal';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('30');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socket, setSocket] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [realtimeActivities, setRealtimeActivities] = useState([]);
  const [activityModal, setActivityModal] = useState({
    isOpen: false,
    type: null,
    title: ''
  });
  const { t } = useTranslation();
  
  // Pagination states for each section
  const [paginationStates, setPaginationStates] = useState({
    vaStatus: { page: 1, itemsPerPage: 8 },
    vaLocations: { page: 1, itemsPerPage: 8 },
    vaSkills: { page: 1, itemsPerPage: 8 },
    businessIndustries: { page: 1, itemsPerPage: 8 },
    businessSize: { page: 1, itemsPerPage: 8 },
    recentActivity: { page: 1, itemsPerPage: 10 }
  });

  const updatePagination = (section, newState) => {
    setPaginationStates(prev => ({
      ...prev,
      [section]: { ...prev[section], ...newState }
    }));
  };

  const handleActivityCardClick = (type, title) => {
    setActivityModal({
      isOpen: true,
      type,
      title
    });
  };

  const closeActivityModal = () => {
    setActivityModal({
      isOpen: false,
      type: null,
      title: ''
    });
  };
  
  // Setup Socket.io connection for real-time updates
  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:8000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Join admin notification room
    socketInstance.emit('join-admin-room', localStorage.getItem('userId'));

    // Listen for dashboard updates
    socketInstance.on('dashboard_update', (data) => {
      console.log('Dashboard update received:', data);
      
      // Show notification based on update type
      if (data.type === 'new_va') {
        toast.info(`New VA registered: ${data.data.name}`, {
          position: 'bottom-right',
          autoClose: 5000,
        });
      } else if (data.type === 'new_business') {
        toast.info(`New Business registered: ${data.data.company}`, {
          position: 'bottom-right',
          autoClose: 5000,
        });
      }
      
      // Refetch stats and analytics
      queryClient.invalidateQueries(['admin-stats']);
      queryClient.invalidateQueries(['analytics']);
      
      // Update last update timestamp
      setLastUpdate(new Date());
    });

    // Listen for specific VA registration events
    socketInstance.on('new_va_registered', (data) => {
      console.log('New VA registered:', data);
      // Add to realtime activities
      const newActivity = {
        id: `va-${data.vaId}-${Date.now()}`,
        type: 'registration',
        description: `New VA registered: ${data.name}`,
        timestamp: new Date().toLocaleTimeString(),
        createdAt: new Date()
      };
      setRealtimeActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep only last 10
      
      // Invalidate queries to fetch fresh data
      queryClient.invalidateQueries(['admin-stats']);
      queryClient.invalidateQueries(['analytics']);
    });

    // Listen for specific Business registration events
    socketInstance.on('new_business_registered', (data) => {
      console.log('New Business registered:', data);
      // Add to realtime activities
      const newActivity = {
        id: `biz-${data.businessId}-${Date.now()}`,
        type: 'registration',
        description: `New Business registered: ${data.company}`,
        timestamp: new Date().toLocaleTimeString(),
        createdAt: new Date()
      };
      setRealtimeActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep only last 10
      
      // Invalidate queries to fetch fresh data
      queryClient.invalidateQueries(['admin-stats']);
      queryClient.invalidateQueries(['analytics']);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.emit('leave-admin-room', localStorage.getItem('userId'));
      socketInstance.disconnect();
    };
  }, [queryClient]);
  
  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        const response = await adminAPI.getStats();
        console.log('Stats response:', response);
        return response.data || response;
      } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
      }
    },
    refetchInterval: 60000,
    retry: 2,
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAnalytics({ timeRange });
        console.log('Analytics response:', response);
        return response.data || response;
      } catch (error) {
        console.error('Error fetching analytics:', error);
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });

  const stats = statsData || {};
  const analytics = analyticsData?.data || {};
  const { overview = {}, growth = [], vaAnalytics = {}, businessAnalytics = {} } = analytics;

  // Calculate growth percentages
  const calculateGrowthPercentage = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Get yesterday's data for comparison
  const yesterdayData = growth[growth.length - 2] || {};
  const todayData = growth[growth.length - 1] || {};

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate queries first to ensure fresh data
      await queryClient.invalidateQueries(['admin-stats']);
      await queryClient.invalidateQueries(['analytics']);
      
      // Then refetch
      await Promise.all([refetchStats(), refetchAnalytics()]);
      
      toast.success('Dashboard data refreshed successfully', {
        position: 'top-right',
        autoClose: 3000,
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue', onClick, tooltip }) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} dark:admin-stat-card`}
      onClick={onClick}
      title={tooltip}
      style={{ 
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : undefined,
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : undefined
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value?.toLocaleString() || 0}</p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {trend === 'up' && <ArrowUpIcon className="h-4 w-4 mr-1" />}
              {trend === 'down' && <ArrowDownIcon className="h-4 w-4 mr-1" />}
              <span>{trendValue || 0}% from yesterday</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : color === 'green' ? 'bg-green-100 dark:bg-green-900/30' : color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
          <Icon className={`h-8 w-8 ${color === 'blue' ? 'text-blue-600 dark:text-blue-400' : color === 'green' ? 'text-green-600 dark:text-green-400' : color === 'purple' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, description, children, className = "" }) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 ${className}`}
      style={{ 
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : undefined,
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : undefined
      }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );

  const SimpleBarChart = ({ data, color = 'blue' }) => {
    if (!data || data.length === 0) {
      return <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data available</p>;
    }

    return (
      <div className="space-y-3">
        {data.slice(0, 8).map((item, index) => {
          const maxValue = Math.max(...data.map(d => d.count || 0), 1);
          const percentage = ((item.count || 0) / maxValue) * 100;
          
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate" style={{ color: 'rgb(var(--text-secondary))' }}>
                {item._id || item.name || 'Unknown'}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`${color === 'blue' ? 'bg-blue-500 dark:bg-blue-400' : color === 'green' ? 'bg-green-500 dark:bg-green-400' : color === 'indigo' ? 'bg-indigo-500 dark:bg-indigo-400' : color === 'purple' ? 'bg-purple-500 dark:bg-purple-400' : color === 'orange' ? 'bg-orange-500 dark:bg-orange-400' : 'bg-gray-500 dark:bg-gray-400'} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-sm font-medium text-gray-900 dark:text-gray-100" style={{ color: 'rgb(var(--text-primary))' }}>
                {item.count || 0}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const PaginatedBarChart = ({ data, color = 'blue', section }) => {
    if (!data || data.length === 0) {
      return <p className="text-gray-500 dark:text-gray-400 text-center py-4" style={{ color: 'rgb(var(--text-secondary))' }}>No data available</p>;
    }

    const { page, itemsPerPage } = paginationStates[section];
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    const maxValue = Math.max(...data.map(d => d.count || 0), 1);

    return (
      <div>
        <div className="space-y-3 mb-4">
          {paginatedData.map((item, index) => {
            const percentage = ((item.count || 0) / maxValue) * 100;
            
            return (
              <div key={startIndex + index} className="flex items-center space-x-3">
                <div className="w-32 text-sm text-gray-600 dark:text-gray-400" style={{ color: 'rgb(var(--text-secondary))' }} title={item._id || item.name || 'Unknown'}>
                  <span className="truncate block">
                    {item._id || item.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`${color === 'blue' ? 'bg-blue-500 dark:bg-blue-400' : color === 'green' ? 'bg-green-500 dark:bg-green-400' : color === 'indigo' ? 'bg-indigo-500 dark:bg-indigo-400' : color === 'purple' ? 'bg-purple-500 dark:bg-purple-400' : color === 'orange' ? 'bg-orange-500 dark:bg-orange-400' : 'bg-gray-500 dark:bg-gray-400'} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-gray-900 dark:text-gray-100" style={{ color: 'rgb(var(--text-primary))' }}>
                  {item.count || 0}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400" style={{ color: 'rgb(var(--text-secondary))' }}>
              Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updatePagination(section, { page: page - 1 })}
                disabled={page === 1}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => updatePagination(section, { page: pageNum })}
                      className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                        page === pageNum
                          ? 'bg-blue-600 dark:bg-blue-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => updatePagination(section, { page: page + 1 })}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const GrowthChart = ({ data }) => {
    if (!data || data.length === 0) {
      return <p className="text-gray-500 text-center py-4">No growth data available</p>;
    }

    const totalUsers = data.reduce((sum, day) => sum + (day.users || 0), 0);
    const totalVAs = data.reduce((sum, day) => sum + (day.vas || 0), 0);
    const totalBusinesses = data.reduce((sum, day) => sum + (day.businesses || 0), 0);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{totalVAs}</div>
            <div className="text-sm text-gray-600">Total VAs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{totalBusinesses}</div>
            <div className="text-sm text-gray-600">Total Businesses</div>
          </div>
        </div>
        
        <div className="h-64 flex items-end space-x-1">
          {data.slice(-14).map((day, index) => {
            const maxValue = Math.max(...data.map(d => (d.users || 0) + (d.vas || 0) + (d.businesses || 0)), 1);
            const totalHeight = (((day.users || 0) + (day.vas || 0) + (day.businesses || 0)) / maxValue) * 200;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 via-green-500 to-purple-500 rounded-t"
                  style={{ height: `${totalHeight}px` }}
                  title={`${day.date}: ${(day.users || 0) + (day.vas || 0) + (day.businesses || 0)} registrations`}
                />
                <div className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
                  {day.date ? new Date(day.date).getDate() : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isLoading = statsLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ color: 'rgb(var(--text-primary))' }}>{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400" style={{ color: 'rgb(var(--text-secondary))' }}>
            {t('dashboard.welcome')}
          </p>
          {lastUpdate && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" style={{ color: 'rgb(var(--text-tertiary))' }}>
              Last updated: {lastUpdate.toLocaleTimeString()} • Real-time updates enabled
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white dark:bg-gray-800 dark:text-gray-100 bg-no-repeat bg-right-2 bg-center transition-colors duration-200"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundSize: '20px',
              backgroundPosition: 'right 8px center',
              paddingRight: '36px',
              backgroundColor: 'rgb(var(--bg-primary))',
              borderColor: 'rgb(var(--border-primary))',
              color: 'rgb(var(--text-primary))'
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
            style={{
              backgroundColor: 'rgb(var(--bg-primary))',
              borderColor: 'rgb(var(--border-primary))',
              color: 'rgb(var(--text-primary))'
            }}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 transition-transform duration-500 group-hover:rotate-180 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : t('common.refresh')}
          </button>
          <button
            onClick={() => navigate('/announcements')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('dashboard.createAnnouncement')}
          </button>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MegaphoneIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">{t('dashboard.announcements')}</h3>
          </div>
          <button
            onClick={() => navigate('/announcements')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200"
          >
            {t('dashboard.viewAll')}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.announcements?.active || 0}</span>
            <span className="ml-2 text-sm text-blue-700 dark:text-blue-300">{t('dashboard.activeAnnouncements')}</span>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.announcements?.unreadVAs || 0}</span>
            <span className="ml-2 text-sm text-yellow-700 dark:text-yellow-300">{t('dashboard.unreadVAs')}</span>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.announcements?.unreadBusinesses || 0}</span>
            <span className="ml-2 text-sm text-green-700 dark:text-green-300">{t('dashboard.unreadBusinesses')}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title={t('dashboard.totalVAs')}
          value={stats.vas?.total || overview.totalVAs || 0}
          icon={UsersIcon}
          trend={overview.newVAsToday > (yesterdayData.vas || 0) ? 'up' : yesterdayData.vas > overview.newVAsToday ? 'down' : null}
          trendValue={calculateGrowthPercentage(overview.newVAsToday, yesterdayData.vas)}
          color="blue"
          onClick={() => navigate('/va-management')}
        />
        <StatCard
          title={t('dashboard.activeVAs')}
          value={stats.vas?.active || overview.activeVAs || 0}
          icon={StarIcon}
          trend={stats.vas?.growthPercentage > 0 ? 'up' : stats.vas?.growthPercentage < 0 ? 'down' : null}
          trendValue={Math.abs(stats.vas?.growthPercentage || 0)}
          color="green"
          tooltip="VAs who have logged in within the last 30 days"
        />
        <StatCard
          title={t('dashboard.totalBusinesses')}
          value={stats.businesses?.total || overview.totalBusinesses || 0}
          icon={BuildingOfficeIcon}
          trend={overview.newBusinessesToday > (yesterdayData.businesses || 0) ? 'up' : yesterdayData.businesses > overview.newBusinessesToday ? 'down' : null}
          trendValue={calculateGrowthPercentage(overview.newBusinessesToday, yesterdayData.businesses)}
          color="purple"
          onClick={() => navigate('/business-management')}
        />
      </div>

      {/* Registration Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title={t('dashboard.registrationTrends')}
          description="Daily registration trends for users, VAs, and businesses">
          <GrowthChart data={growth} />
        </ChartCard>

        <ChartCard 
          title={t('dashboard.recentActivity')}
          description="Latest platform activities updated in real-time with manual refresh">
          {(() => {
            // Combine realtime activities with stored activities
            const combinedActivities = [
              ...realtimeActivities,
              ...(stats.recentActivity || []).map((activity, idx) => ({
                ...activity,
                id: `stored-${idx}`,
                type: 'registration',
                description: activity.title || activity.description,
                timestamp: activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString() : 'Earlier'
              }))
            ];
            
            // Remove duplicates
            const uniqueActivities = combinedActivities
              .filter((activity, index, self) =>
                index === self.findIndex(a => a.description === activity.description)
              );
            
            if (uniqueActivities.length === 0) {
              return <p className="text-gray-500 dark:text-gray-400 text-center py-8" style={{ color: 'rgb(var(--text-secondary))' }}>No recent activity</p>;
            }

            const { page, itemsPerPage } = paginationStates.recentActivity;
            const totalPages = Math.ceil(uniqueActivities.length / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedActivities = uniqueActivities.slice(startIndex, endIndex);
            
            return (
              <div>
                <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                  {paginatedActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 animate-pulse ${
                          activity.type === 'registration' ? 'bg-green-500 dark:bg-green-400' : 
                          activity.type === 'approval' ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-500 dark:bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100" style={{ color: 'rgb(var(--text-primary))' }}>{activity.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400" style={{ color: 'rgb(var(--text-tertiary))' }}>{activity.timestamp}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(activity.link)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors duration-200"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-500">
                      Showing {startIndex + 1}-{Math.min(endIndex, uniqueActivities.length)} of {uniqueActivities.length}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updatePagination('recentActivity', { page: page - 1 })}
                        disabled={page === 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      
                      <div className="flex space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          if (pageNum < 1 || pageNum > totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => updatePagination('recentActivity', { page: pageNum })}
                              className={`px-3 py-1 text-sm rounded ${
                                page === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => updatePagination('recentActivity', { page: page + 1 })}
                        disabled={page === totalPages}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </ChartCard>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title={t('dashboard.vaStatusDistribution')}
          description="Real-time breakdown of VA account statuses (active, inactive, pending)">
          <PaginatedBarChart 
            data={vaAnalytics.statusDistribution || []} 
            color="green"
            section="vaStatus"
          />
        </ChartCard>

        <ChartCard 
          title={t('dashboard.topVALocations')}
          description="Geographic distribution of VAs showing top 10 locations">
          <PaginatedBarChart 
            data={vaAnalytics.locationDistribution || []} 
            color="blue"
            section="vaLocations"
          />
        </ChartCard>
      </div>

      {/* Skills and Industries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title={t('dashboard.mostInDemandSkills')}
          description="Top 15 skills across all VA profiles based on frequency">
          <PaginatedBarChart 
            data={vaAnalytics.skillsDistribution || []} 
            color="indigo"
            section="vaSkills"
          />
        </ChartCard>

        <ChartCard 
          title={t('dashboard.businessIndustries')}
          description="Distribution of registered businesses by industry sector">
          <PaginatedBarChart 
            data={businessAnalytics.industryDistribution || []} 
            color="purple"
            section="businessIndustries"
          />
        </ChartCard>
      </div>

      {/* Profile Completion & Business Size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title={t('dashboard.profileCompletionRates')}
          description="Average completion percentage based on filled profile fields">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>VA Profiles</span>
                <span>{vaAnalytics.profileCompletion?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${vaAnalytics.profileCompletion || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Business Profiles</span>
                <span>{businessAnalytics.profileCompletion?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${businessAnalytics.profileCompletion || 0}%` }}
                />
              </div>
            </div>
          </div>
        </ChartCard>

        <ChartCard 
          title={t('dashboard.businessSizeDistribution')}
          description="Breakdown of businesses by company size (employees)">
          <PaginatedBarChart 
            data={businessAnalytics.sizeDistribution || []} 
            color="orange"
            section="businessSize"
          />
        </ChartCard>
      </div>

      {/* Platform Activity Summary */}
      <ChartCard 
        title={t('dashboard.platformActivitySummary')}
        description="Today's registrations and 30-day active user metrics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div 
            className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group border border-transparent dark:border-blue-800/30"
            onClick={() => handleActivityCardClick('newUsersToday', 'New Users Today')}
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              {overview.newUsersToday || 0}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-300">New Users Today</div>
            <div className="text-xs text-blue-500 dark:text-blue-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          </div>
          <div 
            className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group border border-transparent dark:border-green-800/30"
            onClick={() => handleActivityCardClick('newVAsToday', 'New VAs Today')}
          >
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 group-hover:scale-105 transition-transform">
              {overview.newVAsToday || 0}
            </div>
            <div className="text-sm text-green-600 dark:text-green-300">New VAs Today</div>
            <div className="text-xs text-green-500 dark:text-green-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          </div>
          <div 
            className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group border border-transparent dark:border-purple-800/30"
            onClick={() => handleActivityCardClick('newBusinessesToday', 'New Businesses Today')}
          >
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              {overview.newBusinessesToday || 0}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-300">New Businesses Today</div>
            <div className="text-xs text-purple-500 dark:text-purple-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          </div>
          <div 
            className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group border border-transparent dark:border-orange-800/30"
            onClick={() => handleActivityCardClick('activeUsers30Days', 'Active Users (Last 30 Days)')}
          >
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform">
              {overview.activeUsersLast30Days || 0}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-300">Active Users (30d)</div>
            <div className="text-xs text-orange-500 dark:text-orange-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to view details
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        isOpen={activityModal.isOpen}
        onClose={closeActivityModal}
        type={activityModal.type}
        title={activityModal.title}
      />
    </div>
  );
};

export default Dashboard;