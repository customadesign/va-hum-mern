import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useBranding } from '../../contexts/BrandingContext';
import {
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { branding } = useBranding();
  const isESystems = branding.id === 'esystems';

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery(
    'adminStats',
    async () => {
      const response = await api.get('/admin/stats');
      return response.data.data;
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total VAs',
      stat: stats?.totalVAs || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      link: '/admin/vas'
    },
    {
      name: 'Active VAs',
      stat: stats?.activeVAs || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      link: '/admin/vas?status=active'
    },
    {
      name: 'Total Businesses',
      stat: stats?.totalBusinesses || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
      link: '/admin/businesses'
    },
    {
      name: 'Pending Approvals',
      stat: stats?.pendingApprovals || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      link: '/admin/approvals'
    },
    {
      name: 'Total Revenue',
      stat: `$${stats?.totalRevenue || 0}`,
      icon: CurrencyDollarIcon,
      color: 'bg-indigo-500',
      link: '/admin/revenue'
    },
    {
      name: 'Active Contracts',
      stat: stats?.activeContracts || 0,
      icon: UserGroupIcon,
      color: 'bg-pink-500',
      link: '/admin/contracts'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - {branding.name}</title>
      </Helmet>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isESystems ? 'E-Systems Management' : 'Linkage VA Hub'} Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage the entire ecosystem from one place
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Stats Grid */}
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {statCards.map((item) => (
                <Link
                  key={item.name}
                  to={item.link}
                  className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <dt>
                    <div className={`absolute rounded-md p-3 ${item.color}`}>
                      <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
                  </dt>
                  <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                  </dd>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/admin/vas"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Manage VAs</p>
                  <p className="text-sm text-gray-500">View and manage all VAs</p>
                </div>
              </Link>

              <Link
                to="/admin/businesses"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Manage Businesses</p>
                  <p className="text-sm text-gray-500">View all registered businesses</p>
                </div>
              </Link>

              <Link
                to="/admin/approvals"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Pending Approvals</p>
                  <p className="text-sm text-gray-500">Review VA applications</p>
                </div>
              </Link>

              <Link
                to="/admin/settings"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">System Settings</p>
                  <p className="text-sm text-gray-500">Configure platform settings</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            <div className="mt-4 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {stats?.recentActivity?.map((activity, idx) => (
                      <li key={idx} className="py-5">
                        <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                          <h3 className="text-sm font-semibold text-gray-800">
                            {activity.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {activity.description}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </li>
                    )) || (
                      <li className="py-5 text-center text-gray-500">
                        No recent activity
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}