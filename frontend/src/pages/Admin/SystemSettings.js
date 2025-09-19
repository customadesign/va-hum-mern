import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useBranding } from '../../contexts/BrandingContext';
import {
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ServerIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const configCategories = {
  general: { label: 'General Settings', icon: ServerIcon },
  email: { label: 'Email Configuration', icon: EnvelopeIcon },
  security: { label: 'Security Settings', icon: ShieldCheckIcon },
  features: { label: 'Feature Toggles', icon: SparklesIcon },
  limits: { label: 'System Limits', icon: AdjustmentsHorizontalIcon }
};

export default function SystemSettings() {
  const { branding } = useBranding();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch system configuration
  const { data: configData, isLoading, error } = useQuery(
    'systemConfig',
    async () => {
      const response = await api.get('/admin/config');
      console.log('Config API Response:', response.data);
      return response.data.data;
    },
    {
      onError: (error) => {
        console.error('Error fetching config:', error);
        toast.error('Failed to load system settings');
      },
      retry: 1,
      refetchOnWindowFocus: false
    }
  );

  // Update configuration mutation
  const updateConfigMutation = useMutation(
    async (configs) => {
      const response = await api.put('/admin/config', { configs });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('systemConfig');
        setUnsavedChanges({});
        setHasChanges(false);
        toast.success('Configuration updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update configuration');
      }
    }
  );

  const handleConfigChange = (key, value) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (Object.keys(unsavedChanges).length === 0) {
      toast.info('No changes to save');
      return;
    }
    updateConfigMutation.mutate(unsavedChanges);
  };

  const handleReset = () => {
    setUnsavedChanges({});
    setHasChanges(false);
    toast.info('Changes reset');
  };

  const getCurrentValue = (key) => {
    return unsavedChanges.hasOwnProperty(key) 
      ? unsavedChanges[key] 
      : configData?.[key]?.value;
  };

  const getConfigsByCategory = (category) => {
    if (!configData) return [];
    
    return Object.entries(configData).filter(([key, config]) => 
      config.category === category
    );
  };

  const renderConfigField = (key, config) => {
    const currentValue = getCurrentValue(key);
    
    switch (config.valueType) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={key}
              checked={currentValue || false}
              onChange={(e) => handleConfigChange(key, e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor={key} className="ml-2 block text-sm text-gray-900">
              {config.description}
            </label>
          </div>
        );
      
      case 'number':
        return (
          <div>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {config.description}
            </label>
            <input
              type="number"
              id={key}
              value={currentValue || ''}
              onChange={(e) => handleConfigChange(key, parseInt(e.target.value) || 0)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        );
      
      case 'email':
        return (
          <div>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {config.description}
            </label>
            <input
              type="email"
              id={key}
              value={currentValue || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        );
      
      case 'url':
        return (
          <div>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {config.description}
            </label>
            <input
              type="url"
              id={key}
              value={currentValue || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {config.description}
            </label>
            <textarea
              id={key}
              rows={3}
              value={currentValue || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        );
      
      case 'text':
      case 'string':
      default:
        return (
          <div>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {config.description}
            </label>
            <input
              type="text"
              id={key}
              value={currentValue || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        );
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading system settings</h3>
          <p className="mt-1 text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>System Settings - {branding.name}</title>
      </Helmet>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Back button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
          
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                System Settings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Configure platform-wide settings and preferences
              </p>
            </div>
            {hasChanges && (
              <div className="mt-4 flex gap-2 md:mt-0 md:ml-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateConfigMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {updateConfigMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Unsaved Changes Warning */}
          {hasChanges && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    You have unsaved changes
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Don't forget to save your changes before leaving this page.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 lg:grid lg:grid-cols-12 lg:gap-x-5">
            {/* Sidebar */}
            <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
              <nav className="space-y-1">
                {Object.entries(configCategories).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`${
                        activeCategory === key
                          ? 'bg-gray-50 text-indigo-700 hover:text-indigo-700 hover:bg-gray-50'
                          : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                      } group rounded-md px-3 py-2 flex items-center text-sm font-medium w-full text-left`}
                    >
                      <Icon
                        className={`${
                          activeCategory === key ? 'text-indigo-500' : 'text-gray-400'
                        } flex-shrink-0 -ml-1 mr-3 h-6 w-6`}
                      />
                      <span className="truncate">{config.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main content */}
            <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
              {isLoading ? (
                <div className="bg-white shadow sm:rounded-lg p-6">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading settings...</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                      {configCategories[activeCategory]?.label || configCategories[activeCategory]}
                    </h3>
                    
                    <div className="space-y-6">
                      {!configData ? (
                        <div className="text-center py-6">
                          <CogIcon className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading settings...</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Fetching configuration from server...
                          </p>
                        </div>
                      ) : getConfigsByCategory(activeCategory).length === 0 ? (
                        <div className="text-center py-6">
                          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No settings available</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            No configurable settings found for this category.
                          </p>
                        </div>
                      ) : (
                        getConfigsByCategory(activeCategory).map(([key, config]) => (
                          <div key={key} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                            <div className="mb-1">
                              <span className="text-xs text-gray-500 font-mono">{key}</span>
                            </div>
                            {renderConfigField(key, config)}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration Info */}
              {configData && Object.keys(configData).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        System Configuration
                      </h3>
                      <p className="mt-1 text-sm text-blue-700">
                        {Object.keys(configData).length} settings loaded. 
                        Modify these settings to customize the platform behavior. 
                        Changes will take effect immediately after saving.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}