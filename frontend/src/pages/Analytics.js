import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/HybridAuthContext';
import { useQuery } from 'react-query';
import api from '../services/api';
import { 
  ChartBarIcon, 
  EyeIcon, 
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

export default function Analytics() {
  const { user, isVA } = useAuth();

  // Fetch analytics data
  const { data: dashboardAnalytics, isLoading: dashboardLoading } = useQuery({
    queryKey: ['analytics', 'dashboard', user?.id],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data.analytics;
    },
    enabled: !!user
  });

  const { data: profileViews, isLoading: profileLoading } = useQuery({
    queryKey: ['analytics', 'profile-views', user?.id],
    queryFn: async () => {
      const response = await api.get('/analytics/profile-views');
      return response.data.profileViews;
    },
    enabled: !!user && isVA
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['analytics', 'conversations', user?.id],
    queryFn: async () => {
      const response = await api.get('/analytics/conversations');
      return response.data.conversations;
    },
    enabled: !!user
  });

  if (dashboardLoading || (isVA && profileLoading) || conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Analytics - Linkage VA Hub</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Analytics Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track your {isVA ? 'profile performance and client interactions' : 'hiring activity and VA connections'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Views (VAs only) */}
          {isVA && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Profile Views</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardAnalytics?.profileViews || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active Conversations */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Conversations</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardAnalytics?.activeConversations || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Contacts Made / Earnings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {isVA ? (
                  <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
                ) : (
                  <UserGroupIcon className="h-8 w-8 text-purple-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {isVA ? 'Total Earnings' : 'VAs Contacted'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isVA 
                    ? `$${dashboardAnalytics?.totalEarnings || 0}` 
                    : (dashboardAnalytics?.contactsMade || 0)
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Employers Worked With / Active Projects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {isVA ? 'Employers Worked With' : 'Active Projects'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isVA 
                    ? (dashboardAnalytics?.employersWorkedWith || 0)
                    : (dashboardAnalytics?.activeProjects || 0)
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Average Rating / Response Time */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {isVA ? 'Average Rating' : 'Avg Response Time'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isVA 
                    ? `${dashboardAnalytics?.averageRating || '0.0'}/5.0`
                    : (dashboardAnalytics?.responseTime || '0 hours')
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Total Spent / Response Time */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {isVA ? 'Response Time' : 'Total Spent'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isVA 
                    ? (dashboardAnalytics?.responseTime || '0 hours')
                    : `$${dashboardAnalytics?.totalSpent || 0}`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Views Chart (VAs only) */}
          {isVA && profileViews && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Views (Last 7 Days)</h3>
              <div className="space-y-3">
                {profileViews.recentViews?.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{day.date}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((day.views / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {day.views}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">This week: {profileViews.thisWeek}</span>
                  <span className="text-gray-500">This month: {profileViews.thisMonth}</span>
                </div>
              </div>
            </div>
          )}

          {/* Conversation Activity */}
          {conversations && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Conversations</span>
                  <span className="text-sm font-medium text-gray-900">
                    {conversations.totalConversations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Unread Messages</span>
                  <span className="text-sm font-medium text-gray-900">
                    {conversations.unreadMessages}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Response Time</span>
                  <span className="text-sm font-medium text-gray-900">
                    {conversations.averageResponseTime}
                  </span>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Timeline</h4>
                <div className="space-y-2">
                  {conversations.recentActivity?.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-4">
                        <span className="text-gray-500">
                          {activity.conversations} conversations
                        </span>
                        <span className="text-gray-500">
                          {activity.messages} messages
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coming Soon */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">Advanced Analytics Coming Soon</h3>
              <p className="text-sm text-blue-700 mt-1">
                Detailed charts, performance insights, earnings tracking, and competitive analysis will be available soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}