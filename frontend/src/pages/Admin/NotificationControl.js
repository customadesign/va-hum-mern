import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../services/api';
import {
  BellIcon,
  UsersIcon,
  ClockIcon,
  ChartBarIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function NotificationControl() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('send');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'system_announcement',
    priority: 'medium',
    targetGroup: 'all',
    sendEmailNotification: false,
    filters: {}
  });

  // Fetch notification templates
  const { data: templates } = useQuery(
    'notificationTemplates',
    async () => {
      const response = await api.get('/admin/notifications/templates');
      return response.data.templates;
    }
  );

  // Fetch notification statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'notificationStats',
    async () => {
      const response = await api.get('/admin/notifications/stats');
      return response.data.stats;
    }
  );

  // Send broadcast notification
  const sendBroadcastMutation = useMutation(
    async (data) => {
      const response = await api.post('/admin/notifications/send-broadcast', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notificationStats');
        setNotificationForm({
          title: '',
          message: '',
          type: 'system_announcement',
          priority: 'medium',
          targetGroup: 'all',
          sendEmailNotification: false,
          filters: {}
        });
        alert('Notification sent successfully!');
      },
      onError: (error) => {
        alert('Failed to send notification: ' + error.response?.data?.error);
      }
    }
  );

  // Delete old notifications
  const deleteNotificationsMutation = useMutation(
    async (criteria) => {
      const response = await api.delete('/admin/notifications', { data: criteria });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notificationStats');
        alert('Notifications deleted successfully!');
      }
    }
  );

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setNotificationForm({
      ...notificationForm,
      title: template.title,
      message: template.message,
      type: template.type,
      priority: template.priority
    });
  };

  const handleSendNotification = () => {
    if (!notificationForm.title || !notificationForm.message) {
      alert('Please provide both title and message');
      return;
    }

    sendBroadcastMutation.mutate(notificationForm);
  };

  const handleDeleteOldNotifications = () => {
    if (window.confirm('Delete all notifications older than 30 days?')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      deleteNotificationsMutation.mutate({ olderThan: thirtyDaysAgo.toISOString() });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Control Center</h1>
        <p className="mt-2 text-gray-600">Manage and send system-wide notifications</p>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BellIcon className="h-10 w-10 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Read Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.readRate}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-10 w-10 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-10 w-10 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.recentNotifications?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Send Notification Tab */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Send New Notification</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Notification title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Notification message"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="system_announcement">System Announcement</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="feature_update">Feature Update</option>
                  <option value="security_alert">Security Alert</option>
                  <option value="policy_update">Policy Update</option>
                  <option value="marketing">Marketing</option>
                  <option value="survey">Survey</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={notificationForm.priority}
                  onChange={(e) => setNotificationForm({ ...notificationForm, priority: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Target Group</label>
                <select
                  value={notificationForm.targetGroup}
                  onChange={(e) => setNotificationForm({ ...notificationForm, targetGroup: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="vas">VAs Only</option>
                  <option value="businesses">Businesses Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="sendEmail"
                type="checkbox"
                checked={notificationForm.sendEmailNotification}
                onChange={(e) => setNotificationForm({ ...notificationForm, sendEmailNotification: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-900">
                Also send email notification
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setNotificationForm({
                  title: '',
                  message: '',
                  type: 'system_announcement',
                  priority: 'medium',
                  targetGroup: 'all',
                  sendEmailNotification: false,
                  filters: {}
                })}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sendBroadcastMutation.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {sendBroadcastMutation.isLoading ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notification Templates</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {templates?.map((template) => (
              <div key={template.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getPriorityColor(template.priority)
                      }`}>
                        {template.priority}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">{template.type}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      <strong>Title:</strong> {template.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      <strong>Message:</strong> {template.message}
                    </p>
                    {template.variables && template.variables.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        Variables: {template.variables.join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleTemplateSelect(template)}
                    className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && stats && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Notifications</h3>
              <button
                onClick={handleDeleteOldNotifications}
                className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Clean Old
              </button>
            </div>

            <div className="space-y-3">
              {stats.recentNotifications?.map((notification) => (
                <div key={notification._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          getPriorityColor(notification.priority)
                        }`}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-gray-500">{notification.type}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          notification.status === 'read' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {notification.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics by Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">By Type</h3>
              <div className="space-y-2">
                {Object.entries(stats.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-sm text-gray-600">{type}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">By Priority</h3>
              <div className="space-y-2">
                {Object.entries(stats.byPriority || {}).map(([priority, count]) => (
                  <div key={priority} className="flex justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      getPriorityColor(priority)
                    }`}>
                      {priority}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}