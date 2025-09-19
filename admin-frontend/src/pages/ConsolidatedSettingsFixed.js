import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  CogIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const ConsolidatedSettings = () => {
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
  
  // Admin invitations state
  const [invitations, setInvitations] = useState([]);
  const [inviteForm, setInviteForm] = useState({ email: '', message: '' });
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  
  // SendGrid-specific state
  const [sendgridValidation, setSendgridValidation] = useState({
    isValidating: false,
    connectionStatus: 'not_tested',
    domainAuthentication: 'unknown',
    senderIdentityStatus: 'unknown',
    lastValidated: null,
    senderValidation: {
      business: { verified: false, testing: false },
      va: { verified: false, testing: false },
      admin: { verified: false, testing: false }
    }
  });
  
  // Email type preview state
  const [emailPreview, setEmailPreview] = useState({
    activePreview: null,
    previewResults: {}
  });

  // Categories with admin management included
  const categories = {
    general: {
      name: 'General Settings',
      icon: CogIcon,
      description: 'Basic site configuration and information',
      color: 'blue'
    },
    admin: {
      name: 'Admin Management',
      icon: UserGroupIcon,
      description: 'Manage admin invitations and access',
      color: 'indigo'
    },
    email: {
      name: 'Email & Notifications',
      icon: EnvelopeIcon,
      description: 'SMTP and email delivery settings',
      color: 'green'
    },
    security: {
      name: 'Security & Authentication',
      icon: ShieldCheckIcon,
      description: 'Authentication and security policies',
      color: 'red'
    },
    features: {
      name: 'Features & Permissions',
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


  // Fetch all settings and invitations
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      // Fetch system settings
      const settingsResponse = await fetch(`${API_URL}/admin/settings`, {
        headers: {

          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (settingsResponse.ok) {
        const data = await settingsResponse.json();
        
        // Parse the categorized config structure from backend
        const flatSettings = {};
        if (data.data && data.data.configs) {
          Object.keys(data.data.configs).forEach(category => {
            Object.keys(data.data.configs[category]).forEach(key => {
              flatSettings[key] = data.data.configs[category][key].value;
            });
          });
        }
        
        setSettings(flatSettings);
        setOriginalSettings(flatSettings);
        console.log('Settings loaded:', flatSettings);
      } else {
        console.error('Failed to fetch settings:', settingsResponse.status);
      }

      // Fetch admin invitations
      const invitationsResponse = await fetch(`${API_URL}/admin/invitations`, {
        headers: {

          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (invitationsResponse.ok) {
        const data = await invitationsResponse.json();
        setInvitations(data.invitations || data.data || []);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send admin invitation
  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteForm.email.trim()) {
      setInviteError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setInviteError('');
      setInviteSuccess('');

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_URL}/admin/invitations`, {
        method: 'POST',
        headers: {

          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(inviteForm)
      });

      const data = await response.json();

      if (response.ok) {
        setInviteSuccess('Invitation sent successfully!');
        setInviteForm({ email: '', message: '' });
        fetchSettings(); // Refresh to get updated invitations
      } else {
        setInviteError(data.message || 'Failed to send invitation');
      }
    } catch (err) {
      setInviteError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_URL}/admin/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {

          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        setInviteSuccess('Invitation cancelled successfully');
        fetchSettings();
      }
    } catch (err) {
      setInviteError('Failed to cancel invitation');
    }
  };

  // Validate individual field
  const validateField = (key, value, options = {}) => {
    if (options.min !== undefined && value < options.min) {
      return `Minimum value is ${options.min}`;
    }
    if (options.max !== undefined && value > options.max) {
      return `Maximum value is ${options.max}`;
    }
    if (typeof value === 'number' && (isNaN(value) || value < 0)) {
      return 'Please enter a valid positive number';
    }
    return null;
  };

  // FIXED: Save system settings with proper validation and correct API endpoint
  const handleSaveSettings = async () => {
    console.log("=== Save button clicked ===");
    console.log("Modified fields:", Array.from(modifiedFields));
    console.log("Current settings:", settings);
    
    try {
      setSaving(true);
      setErrors({});
      
      // Validate all fields before saving
      const validationErrors = {};
      const fieldValidations = {
        max_file_size: { min: 1, max: 100 },
        max_vas_per_page: { min: 10, max: 100 },
        rate_limit_max_requests: { min: 10, max: 1000 },
        max_message_length: { min: 100, max: 10000 },
        password_min_length: { min: 6, max: 32 },
        session_timeout: { min: 5, max: 1440 }
      };

      Object.keys(settings).forEach(key => {
        if (fieldValidations[key] && settings[key] !== '') {
          const error = validateField(key, Number(settings[key]), fieldValidations[key]);
          if (error) {
            validationErrors[key] = error;
          }
        }
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setSaving(false);
        return;
      }
      
      // Get only modified fields
      const modifiedConfigs = {};
      modifiedFields.forEach(field => {
        modifiedConfigs[field] = settings[field];
      });
      
      // If no fields are modified, just show success
      if (Object.keys(modifiedConfigs).length === 0) {
        console.log("No modifications to save");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
        setSaving(false);
        return;
      }
      
      console.log("Saving configs:", modifiedConfigs);
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
      
      // FIXED: Use the correct endpoint - /admin/configs instead of /admin/settings
      const response = await fetch(`${API_URL}/admin/configs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ configs: modifiedConfigs })
      });

      const data = await response.json();
      console.log("Save response:", data);

      if (response.ok || data.success) {
        // Update with the properly formatted response
        if (data.data) {
          const updatedSettings = {};
          Object.keys(data.data).forEach(key => {
            updatedSettings[key] = data.data[key].value;
          });
          
          setSettings(prev => ({ ...prev, ...updatedSettings }));
          setOriginalSettings(prev => ({ ...prev, ...updatedSettings }));
        }
        
        setModifiedFields(new Set());
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
        
        console.log('Settings saved successfully!');
      } else {
        const errorMsg = data.message || 'Failed to save settings';
        setErrors({ general: errorMsg });
        console.error('Save failed:', errorMsg);
        
        // Show error even if validation passes
        alert(`Failed to save: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrors({ general: 'Network error while saving settings. Please check your connection.' });
      alert('Network error while saving settings. Please check the console for details.');
    } finally {
      setSaving(false);
    }
  };

  // The rest of the component remains the same...
  // [Rest of the code continues with the same structure as the original]