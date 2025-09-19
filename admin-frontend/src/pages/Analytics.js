import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { adminAPI } from '../services/api';

// Force rebuild - comprehensive analytics dashboard

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30');
  
  // Fetch analytics data
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAnalytics({ timeRange });
        console.log('Analytics API response:', response);
        return response.data;
      } catch (error) {
        console.error('Error in Analytics queryFn:', error);
        throw error;
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 1,
    onError: (error) => {
      console.error('Error fetching analytics:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load analytics data');
      }
    }
  });

  const analytics = analyticsData?.data || {};
  const { overview = {}, growth = [], vaAnalytics = {}, businessAnalytics = {} } = analytics;

  // Calculate growth percentages
  const calculateGrowthPercentage = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Get yesterday's data for comparison
  const yesterdayData = growth[growth.length - 2] || {};
  const todayData = growth[growth.length - 1] || {};

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => (
    <div className="admin-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-admin-600">{title}</p>
          <p className="text-3xl font-bold text-admin-900">{value?.toLocaleString() || 0}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-admin-500'
            }`}>
              {trend === 'up' && <ArrowUpIcon className="h-4 w-4 mr-1" />}
              {trend === 'down' && <ArrowDownIcon className="h-4 w-4 mr-1" />}
              <span>{trendValue}% from yesterday</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-8 w-8 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, children, className = "" }) => (
    <div className={`admin-card p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-admin-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  const SimpleBarChart = ({ data, dataKey, color = 'primary' }) => (
    <div className="space-y-3">
      {data.slice(0, 8).map((item, index) => {
        const maxValue = Math.max(...data.map(d => d.count));
        const percentage = (item.count / maxValue) * 100;
        
        return (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-24 text-sm text-admin-600 truncate">
              {item._id || 'Unknown'}
            </div>
            <div className="flex-1 bg-admin-200 rounded-full h-2">
              <div 
                className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="w-12 text-sm font-medium text-admin-900">
              {item.count}
            </div>
          </div>
        );
      })}
    </div>
  );

  const GrowthChart = ({ data }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {data.reduce((sum, day) => sum + day.users, 0)}
          </div>
          <div className="text-sm text-admin-600">Total Users</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">
            {data.reduce((sum, day) => sum + day.vas, 0)}
          </div>
          <div className="text-sm text-admin-600">Total VAs</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">
            {data.reduce((sum, day) => sum + day.businesses, 0)}
          </div>
          <div className="text-sm text-admin-600">Total Businesses</div>
        </div>
      </div>
      
      <div className="h-64 flex items-end space-x-1">
        {data.slice(-14).map((day, index) => {
          const maxValue = Math.max(...data.map(d => d.users + d.vas + d.businesses));
          const totalHeight = ((day.users + day.vas + day.businesses) / maxValue) * 200;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 via-green-500 to-purple-500 rounded-t"
                style={{ height: `${totalHeight}px` }}
                title={`${day.date}: ${day.users + day.vas + day.businesses} registrations`}
              />
              <div className="text-xs text-admin-500 mt-1 transform rotate-45 origin-left">
                {new Date(day.date).getDate()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

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
        <div className="text-red-600 mb-4">Failed to load analytics data</div>
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-admin-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-admin-600">
            Platform insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="admin-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={() => refetch()}
            className="admin-button-secondary"
          >
            <ArrowUpIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={overview.totalUsers}
          icon={UsersIcon}
          trend={overview.newUsersToday > (yesterdayData.users || 0) ? 'up' : 'down'}
          trendValue={calculateGrowthPercentage(overview.newUsersToday, yesterdayData.users)}
          color="blue"
        />
        <StatCard
          title="Virtual Assistants"
          value={overview.totalVAs}
          icon={StarIcon}
          trend={overview.newVAsToday > (yesterdayData.vas || 0) ? 'up' : 'down'}
          trendValue={calculateGrowthPercentage(overview.newVAsToday, yesterdayData.vas)}
          color="green"
        />
        <StatCard
          title="Businesses"
          value={overview.totalBusinesses}
          icon={BuildingOfficeIcon}
          trend={overview.newBusinessesToday > (yesterdayData.businesses || 0) ? 'up' : 'down'}
          trendValue={calculateGrowthPercentage(overview.newBusinessesToday, yesterdayData.businesses)}
          color="purple"
        />
        <StatCard
          title="Active Users (7d)"
          value={overview.activeUsersLast7Days}
          icon={ArrowTrendingUpIcon}
          color="orange"
        />
      </div>

      {/* Growth Trends */}
      <ChartCard title="Registration Trends" className="lg:col-span-2">
        <GrowthChart data={growth} />
      </ChartCard>

      {/* VA Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="VA Status Distribution">
          <SimpleBarChart 
            data={vaAnalytics.statusDistribution || []} 
            dataKey="count"
            color="green"
          />
        </ChartCard>

        <ChartCard title="Top VA Locations">
          <SimpleBarChart 
            data={vaAnalytics.locationDistribution || []} 
            dataKey="count"
            color="blue"
          />
        </ChartCard>
      </div>

      {/* Skills and Industries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Most In-Demand Skills">
          <SimpleBarChart 
            data={vaAnalytics.skillsDistribution || []} 
            dataKey="count"
            color="indigo"
          />
        </ChartCard>

        <ChartCard title="Business Industries">
          <SimpleBarChart 
            data={businessAnalytics.industryDistribution || []} 
            dataKey="count"
            color="purple"
          />
        </ChartCard>
      </div>

      {/* Profile Completion & Business Size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Profile Completion Rates">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>VA Profiles</span>
                <span>{vaAnalytics.profileCompletion?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-admin-200 rounded-full h-2">
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
              <div className="w-full bg-admin-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${businessAnalytics.profileCompletion || 0}%` }}
                />
              </div>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Business Size Distribution">
          <SimpleBarChart 
            data={businessAnalytics.sizeDistribution || []} 
            dataKey="count"
            color="orange"
          />
        </ChartCard>
      </div>

      {/* Activity Summary */}
      <ChartCard title="Platform Activity Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{overview.newUsersToday || 0}</div>
            <div className="text-sm text-blue-600">New Users Today</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{overview.newVAsToday || 0}</div>
            <div className="text-sm text-green-600">New VAs Today</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{overview.newBusinessesToday || 0}</div>
            <div className="text-sm text-purple-600">New Businesses Today</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{overview.activeUsersLast30Days || 0}</div>
            <div className="text-sm text-orange-600">Active Users (30d)</div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
};

export default Analytics;
