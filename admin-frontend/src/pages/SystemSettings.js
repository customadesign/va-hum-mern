import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeftIcon,
  CogIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  ServerIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  MegaphoneIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
  BoltIcon,
  PencilSquareIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const SystemSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [modifiedFields, setModifiedFields] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(false);

  // Category configurations with icons and descriptions
  const categories = {
    general: {
      name: 'General Settings',
      icon: CogIcon,
      description: 'Basic site configuration and information',
      color: 'blue'
    },
    email: {
      name: 'Email Configuration',
      icon: EnvelopeIcon,
      description: 'SMTP and email delivery settings',
      color: 'green'
    },
    security: {
      name: 'Security Settings',
      icon: ShieldCheckIcon,
      description: 'Authentication and security policies',
      color: 'red'
    },
    features: {
      name: 'Feature Toggles',
      icon: SparklesIcon,
      description: 'Enable or disable platform features',
      color: 'purple'
    },
    limits: {
      name: 'System Limits',
      icon: AdjustmentsHorizontalIcon,
      description: 'Configure system constraints and limits',
      color: 'yellow'
    }
  };

  // Field configurations with help text and validation
  const fieldConfigs = {
    // General Settings
    site_name: {
      label: 'Site Name',
      type: 'text',
      icon: DocumentTextIcon,
      help: 'The name of your platform displayed throughout the site',
      required: true
    },
    site_url: {
      label: 'Site URL',
      type: 'url',
      icon: ServerIcon,
      help: 'The main URL where your platform is hosted',
      required: true,
      pattern: '^https?://.+'
    },
    admin_email: {
      label: 'Admin Email',
      type: 'email',
      icon: EnvelopeIcon,
      help: 'Primary administrator email for system notifications',
      required: true
    },
    support_email: {
      label: 'Support Email',
      type: 'email',
      icon: ChatBubbleLeftRightIcon,
      help: 'Email address for user support inquiries',
      required: true
    },
    timezone: {
      label: 'Timezone',
      type: 'select',
      icon: ClockIcon,
      help: 'Default timezone for the platform',
      options: [
        { value: 'UTC', label: 'UTC' },
        { value: 'America/New_York', label: 'Eastern Time' },
        { value: 'America/Chicago', label: 'Central Time' },
        { value: 'America/Denver', label: 'Mountain Time' },
        { value: 'America/Los_Angeles', label: 'Pacific Time' },
        { value: 'Europe/London', label: 'London' },
        { value: 'Europe/Paris', label: 'Paris' },
        { value: 'Asia/Tokyo', label: 'Tokyo' },
        { value: 'Australia/Sydney', label: 'Sydney' }
      ]
    },
    maintenance_mode: {
      label: 'Maintenance Mode',
      type: 'toggle',
      icon: AdjustmentsHorizontalIcon,
      help: 'Enable maintenance mode to prevent user access during updates'
    },
    maintenance_message: {
      label: 'Maintenance Message',
      type: 'textarea',
      icon: MegaphoneIcon,
      help: 'Message displayed to users when maintenance mode is active',
      dependsOn: 'maintenance_mode'
    },

    // Email Configuration
    smtp_host: {
      label: 'SMTP Host',
      type: 'text',
      icon: ServerIcon,
      help: 'SMTP server hostname (e.g., smtp.gmail.com)',
      required: true
    },
    smtp_port: {
      label: 'SMTP Port',
      type: 'number',
      icon: BoltIcon,
      help: 'SMTP server port (typically 587 for TLS, 465 for SSL)',
      min: 1,
      max: 65535,
      required: true
    },
    smtp_user: {
      label: 'SMTP Username',
      type: 'text',
      icon: UserGroupIcon,
      help: 'Username for SMTP authentication',
      required: true
    },
    smtp_secure: {
      label: 'Use SSL/TLS',
      type: 'toggle',
      icon: ShieldCheckIcon,
      help: 'Enable secure connection for email delivery'
    },
    email_from: {
      label: 'From Email',
      type: 'email',
      icon: EnvelopeIcon,
      help: 'Default sender email address',
      required: true
    },
    email_from_name: {
      label: 'From Name',
      type: 'text',
      icon: PencilSquareIcon,
      help: 'Default sender name for emails',
      required: true
    },

    // Security Settings
    password_min_length: {
      label: 'Minimum Password Length',
      type: 'number',
      icon: ShieldCheckIcon,
      help: 'Minimum number of characters required for passwords',
      min: 6,
      max: 32,
      default: 8
    },
    session_timeout: {
      label: 'Session Timeout (minutes)',
      type: 'number',
      icon: ClockIcon,
      help: 'Automatically log out users after this period of inactivity',
      min: 5,
      max: 1440,
      default: 60
    },
    max_login_attempts: {
      label: 'Max Login Attempts',
      type: 'number',
      icon: ExclamationCircleIcon,
      help: 'Number of failed login attempts before account lockout',
      min: 3,
      max: 10,
      default: 5
    },
    account_lock_duration: {
      label: 'Account Lock Duration (minutes)',
      type: 'number',
      icon: ClockIcon,
      help: 'How long to lock an account after max login attempts',
      min: 5,
      max: 60,
      default: 15
    },
    enable_2fa: {
      label: 'Enable Two-Factor Authentication',
      type: 'toggle',
      icon: ShieldCheckIcon,
      help: 'Allow users to enable 2FA for their accounts'
    },
    require_email_verification: {
      label: 'Require Email Verification',
      type: 'toggle',
      icon: EnvelopeIcon,
      help: 'Users must verify their email before accessing the platform'
    },

    // Feature Toggles
    registration_enabled: {
      label: 'Registration Enabled',
      type: 'toggle',
      icon: UserGroupIcon,
      help: 'Allow new users to register on the platform'
    },
    va_approval_required: {
      label: 'VA Approval Required',
      type: 'toggle',
      icon: CheckCircleIcon,
      help: 'Virtual assistants require admin approval before activation'
    },
    business_approval_required: {
      label: 'Business Approval Required',
      type: 'toggle',
      icon: CheckCircleIcon,
      help: 'Business accounts require admin approval before activation'
    },
    messaging_enabled: {
      label: 'Messaging Enabled',
      type: 'toggle',
      icon: ChatBubbleLeftRightIcon,
      help: 'Enable direct messaging between users'
    },
    video_calls_enabled: {
      label: 'Video Calls Enabled',
      type: 'toggle',
      icon: VideoCameraIcon,
      help: 'Enable video calling functionality'
    },
    file_sharing_enabled: {
      label: 'File Sharing Enabled',
      type: 'toggle',
      icon: CloudArrowUpIcon,
      help: 'Allow users to share files through the platform'
    },
    courses_enabled: {
      label: 'Courses Enabled',
      type: 'toggle',
      icon: AcademicCapIcon,
      help: 'Enable the learning management system features'
    },
    announcements_enabled: {
      label: 'Announcements Enabled',
      type: 'toggle',
      icon: MegaphoneIcon,
      help: 'Enable platform-wide announcements'
    },

    // System Limits
    max_vas_per_page: {
      label: 'VAs Per Page',
      type: 'number',
      icon: UserGroupIcon,
      help: 'Number of virtual assistants displayed per page',
      min: 10,
      max: 100,
      default: 20
    },
    max_businesses_per_page: {
      label: 'Businesses Per Page',
      type: 'number',
      icon: UserGroupIcon,
      help: 'Number of businesses displayed per page',
      min: 10,
      max: 100,
      default: 20
    },
    max_file_size: {
      label: 'Max File Size (MB)',
      type: 'number',
      icon: CloudArrowUpIcon,
      help: 'Maximum allowed file upload size in megabytes',
      min: 1,
      max: 100,
      default: 10
    },
    max_profile_images: {
      label: 'Max Profile Images',
      type: 'number',
      icon: DocumentTextIcon,
      help: 'Maximum number of profile images per user',
      min: 1,
      max: 20,
      default: 5
    },
    max_portfolio_items: {
      label: 'Max Portfolio Items',
      type: 'number',
      icon: DocumentTextIcon,
      help: 'Maximum number of portfolio items per VA',
      min: 1,
      max: 50,
      default: 10
    },
    rate_limit_window: {
      label: 'Rate Limit Window (seconds)',
      type: 'number',
      icon: ClockIcon,
      help: 'Time window for rate limiting',
      min: 1,
      max: 3600,
      default: 60
    },
    rate_limit_max_requests: {
      label: 'Max Requests',
      type: 'number',
      icon: BoltIcon,
      help: 'Maximum requests allowed within rate limit window',
      min: 10,
      max: 1000,
      default: 100
    },
    max_message_length: {
      label: 'Max Message Length',
      type: 'number',
      icon: ChatBubbleLeftRightIcon,
      help: 'Maximum characters allowed in a message',
      min: 100,
      max: 10000,
      default: 1000
    },
    max_bio_length: {
      label: 'Max Bio Length',
      type: 'number',
      icon: DocumentTextIcon,
      help: 'Maximum characters allowed in user bio',
      min: 100,
      max: 5000,
      default: 500
    },
    invitation_expiry_days: {
      label: 'Invitation Expiry (days)',
      type: 'number',
      icon: CalendarDaysIcon,
      help: 'Days before an invitation expires',
      min: 1,
      max: 30,
      default: 7
    }
  };

  // Helper function to get cookie value
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Fetch settings from backend
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const token = getCookie('authToken');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_URL}/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || {});
        setOriginalSettings(data.settings || {});
      } else {
        console.error('Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrors({});
      
      // Validate all fields
      const validationErrors = validateAllFields();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setSaving(false);
        return;
      }

      const token = getCookie('authToken');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
        setOriginalSettings(data.settings || settings);
        setModifiedFields(new Set());
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        console.error('Failed to save settings:', errorData);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  // Reset individual field to default
  const handleResetField = (field) => {
    const config = fieldConfigs[field];
    if (config && config.default !== undefined) {
      handleFieldChange(field, config.default);
    } else if (originalSettings[field] !== undefined) {
      handleFieldChange(field, originalSettings[field]);
    }
  };

  // Handle field change
  const handleFieldChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Track modified fields
    if (value !== originalSettings[field]) {
      setModifiedFields(prev => new Set(prev).add(field));
    } else {
      setModifiedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
    
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Validate field
  const validateField = (field, value) => {
    const config = fieldConfigs[field];
    if (!config) return null;

    if (config.required && !value) {
      return `${config.label} is required`;
    }

    if (config.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (config.type === 'url' && value) {
      try {
        new URL(value);
      } catch {
        return 'Please enter a valid URL';
      }
    }

    if (config.type === 'number' && value !== undefined && value !== '') {
      const num = Number(value);
      if (isNaN(num)) {
        return 'Please enter a valid number';
      }
      if (config.min !== undefined && num < config.min) {
        return `Minimum value is ${config.min}`;
      }
      if (config.max !== undefined && num > config.max) {
        return `Maximum value is ${config.max}`;
      }
    }

    return null;
  };

  // Validate all fields
  const validateAllFields = () => {
    const validationErrors = {};
    Object.keys(fieldConfigs).forEach(field => {
      const error = validateField(field, settings[field]);
      if (error) {
        validationErrors[field] = error;
      }
    });
    return validationErrors;
  };

  // Filter settings based on search query
  const getFilteredSettings = () => {
    if (!searchQuery) return null;
    
    const query = searchQuery.toLowerCase();
    const filtered = {};
    
    Object.entries(fieldConfigs).forEach(([field, config]) => {
      if (
        field.toLowerCase().includes(query) ||
        config.label.toLowerCase().includes(query) ||
        config.help.toLowerCase().includes(query)
      ) {
        filtered[field] = config;
      }
    });
    
    return Object.keys(filtered).length > 0 ? filtered : null;
  };

  // Get settings for current category
  const getCategorySettings = () => {
    const categoryMap = {
      general: ['site_name', 'site_url', 'admin_email', 'support_email', 'timezone', 'maintenance_mode', 'maintenance_message'],
      email: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_secure', 'email_from', 'email_from_name'],
      security: ['password_min_length', 'session_timeout', 'max_login_attempts', 'account_lock_duration', 'enable_2fa', 'require_email_verification'],
      features: ['registration_enabled', 'va_approval_required', 'business_approval_required', 'messaging_enabled', 'video_calls_enabled', 'file_sharing_enabled', 'courses_enabled', 'announcements_enabled'],
      limits: ['max_vas_per_page', 'max_businesses_per_page', 'max_file_size', 'max_profile_images', 'max_portfolio_items', 'rate_limit_window', 'rate_limit_max_requests', 'max_message_length', 'max_bio_length', 'invitation_expiry_days']
    };
    
    return categoryMap[activeCategory] || [];
  };

  // Render field based on type
  const renderField = (field, config) => {
    const value = settings[field];
    const error = errors[field];
    const isModified = modifiedFields.has(field);
    
    // Check if field depends on another field
    if (config.dependsOn && !settings[config.dependsOn]) {
      return null;
    }

    return (
      <div key={field} className={`relative p-4 rounded-lg border ${error ? 'border-red-300 bg-red-50' : 'border-admin-200 bg-white'} hover:shadow-sm transition-shadow`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {config.icon && <config.icon className="w-4 h-4 text-admin-400" />}
              <label className="text-sm font-medium text-admin-900">
                {config.label}
                {config.required && <span className="text-red-500 ml-1">*</span>}
                {isModified && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    Modified
                  </span>
                )}
              </label>
            </div>
            
            <p className="text-xs text-admin-500 mb-3">{config.help}</p>
            
            {config.type === 'toggle' ? (
              <button
                onClick={() => handleFieldChange(field, !value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-primary-600' : 'bg-admin-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            ) : config.type === 'select' ? (
              <select
                value={value || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                className="admin-input text-sm"
              >
                <option value="">Select...</option>
                {config.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : config.type === 'textarea' ? (
              <textarea
                value={value || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                onBlur={() => {
                  const validationError = validateField(field, value);
                  if (validationError) {
                    setErrors(prev => ({ ...prev, [field]: validationError }));
                  }
                }}
                className="admin-input text-sm"
                rows="3"
                placeholder={config.placeholder || `Enter ${config.label.toLowerCase()}`}
              />
            ) : (
              <input
                type={config.type}
                value={value || ''}
                onChange={(e) => {
                  const newValue = config.type === 'number' ? 
                    (e.target.value === '' ? '' : Number(e.target.value)) : 
                    e.target.value;
                  handleFieldChange(field, newValue);
                }}
                onBlur={() => {
                  const validationError = validateField(field, value);
                  if (validationError) {
                    setErrors(prev => ({ ...prev, [field]: validationError }));
                  }
                }}
                className="admin-input text-sm"
                placeholder={config.placeholder || `Enter ${config.label.toLowerCase()}`}
                min={config.min}
                max={config.max}
              />
            )}
            
            {error && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
          
          {(config.default !== undefined || originalSettings[field] !== undefined) && value !== (config.default || originalSettings[field]) && (
            <button
              onClick={() => handleResetField(field)}
              className="ml-4 p-1 text-admin-400 hover:text-admin-600 transition-colors"
              title="Reset to default"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-sm text-admin-500">Loading system settings...</p>
        </div>
      </div>
    );
  }

  const filteredSettings = getFilteredSettings();
  const isSearching = searchQuery && filteredSettings;

  return (
    <div className="min-h-screen bg-admin-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-admin-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 rounded-lg hover:bg-admin-50 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-admin-600" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-admin-900">System Settings</h1>
                <p className="text-xs text-admin-500 hidden sm:block">Configure platform-wide settings and features</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-auto">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-admin-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search settings..."
                  className="w-full sm:w-64 pl-9 pr-4 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-admin-400 hover:text-admin-600"
                  >
                    ×
                  </button>
                )}
              </div>
              
              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving || modifiedFields.size === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  modifiedFields.size > 0
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-admin-100 text-admin-400 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Save Changes {modifiedFields.size > 0 && `(${modifiedFields.size})`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories */}
          {!isSearching && (
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-admin-200 overflow-hidden">
                <div className="p-4 border-b border-admin-200">
                  <h2 className="text-sm font-semibold text-admin-900">Categories</h2>
                </div>
                <nav className="p-2">
                  {Object.entries(categories).map(([key, category]) => {
                    const Icon = category.icon;
                    const isActive = activeCategory === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? `bg-${category.color}-50 text-${category.color}-700 border border-${category.color}-200`
                            : 'text-admin-600 hover:bg-admin-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? `text-${category.color}-600` : 'text-admin-400'}`} />
                        <div className="text-left">
                          <div>{category.name}</div>
                          {isActive && (
                            <div className="text-xs font-normal mt-0.5 text-admin-500">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 bg-white rounded-lg shadow-sm border border-admin-200 p-4">
                <h3 className="text-sm font-semibold text-admin-900 mb-3">Quick Stats</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-admin-500">Total Settings</span>
                    <span className="font-medium text-admin-900">{Object.keys(fieldConfigs).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-admin-500">Modified</span>
                    <span className="font-medium text-yellow-600">{modifiedFields.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-admin-500">Errors</span>
                    <span className="font-medium text-red-600">{Object.keys(errors).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {isSearching ? (
              <div className="bg-white rounded-lg shadow-sm border border-admin-200 p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-admin-900">
                    Search Results
                  </h2>
                  <p className="text-sm text-admin-500 mt-1">
                    Found {Object.keys(filteredSettings).length} settings matching "{searchQuery}"
                  </p>
                </div>
                <div className="space-y-4">
                  {Object.entries(filteredSettings).map(([field, config]) => 
                    renderField(field, config)
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-admin-200">
                <div className="p-6 border-b border-admin-200">
                  <div className="flex items-center gap-3">
                    {React.createElement(categories[activeCategory].icon, {
                      className: `w-6 h-6 text-${categories[activeCategory].color}-600`
                    })}
                    <div>
                      <h2 className="text-lg font-semibold text-admin-900">
                        {categories[activeCategory].name}
                      </h2>
                      <p className="text-sm text-admin-500 mt-0.5">
                        {categories[activeCategory].description}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {getCategorySettings().map(field => {
                      const config = fieldConfigs[field];
                      return config ? renderField(field, config) : null;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
          <CheckCircleIcon className="w-5 h-5" />
          Settings saved successfully
        </div>
      )}
    </div>
  );
};

export default SystemSettings;