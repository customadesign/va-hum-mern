import React from 'react';
import { useQuery } from 'react-query';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { adminAPI } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery(
    'admin-stats',
    adminAPI.getStats,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  );

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New VAs',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'New Businesses',
        data: [2, 3, 20, 5, 1, 4],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Registration Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="admin-loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-danger-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-danger-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-danger-800">
              Error loading dashboard data
            </h3>
            <div className="mt-2 text-sm text-danger-700">
              <p>Please try refreshing the page or contact support if the issue persists.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total VAs',
      value: stats?.data?.totalVAs || 0,
      change: '+12%',
      changeType: 'increase',
      icon: UsersIcon,
      color: 'primary',
    },
    {
      name: 'Active VAs',
      value: stats?.data?.activeVAs || 0,
      change: '+8%',
      changeType: 'increase',
      icon: UsersIcon,
      color: 'success',
    },
    {
      name: 'Total Businesses',
      value: stats?.data?.totalBusinesses || 0,
      change: '+23%',
      changeType: 'increase',
      icon: BuildingOfficeIcon,
      color: 'warning',
    },
    {
      name: 'Pending Approvals',
      value: stats?.data?.pendingApprovals || 0,
      change: '-5%',
      changeType: 'decrease',
      icon: ExclamationTriangleIcon,
      color: 'danger',
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-admin-900">Dashboard</h1>
        <p className="mt-1 text-sm text-admin-600">
          Welcome to the Linkage VA Hub admin panel. Here's what's happening on your platform.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="admin-stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-md bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="admin-stat-label truncate">{stat.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="admin-stat-number">{stat.value.toLocaleString()}</div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {stat.changeType === 'increase' ? (
                        <svg className="self-center flex-shrink-0 h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="self-center flex-shrink-0 h-5 w-5 text-danger-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="sr-only">{stat.changeType === 'increase' ? 'Increased' : 'Decreased'} by</span>
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-medium text-admin-900 mb-4">Registration Trends</h3>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent activity */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-medium text-admin-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {stats?.data?.recentActivity?.map((activity, activityIdx) => (
                <li key={activityIdx}>
                  <div className="relative pb-8">
                    {activityIdx !== stats.data.recentActivity.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-admin-200" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                          <UsersIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-admin-500">{activity.title}</p>
                          <p className="text-sm text-admin-900">{activity.description}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-admin-500">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )) || (
                <li className="text-center py-4 text-admin-500">
                  No recent activity
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
