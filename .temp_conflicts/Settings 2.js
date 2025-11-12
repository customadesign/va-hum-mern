import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import api, { settingsAPI, settingsDocAPI, createDefaultSettingsDoc, migrateSettingsDoc, maskSecrets } from '../services/api';
import { useRegional } from '../contexts/RegionalContext';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import {
  BellIcon,
  LockClosedIcon,
  ComputerDesktopIcon,
  UserGroupIcon,
  BoltIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Cache key and duration
const CACHE_KEY = 'admin_settings_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Custom Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, disabled, label, checkedLabel, uncheckedLabel }) => {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={label || checkedLabel || uncheckedLabel || 'toggle switch'}
        />
        <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ${
          checked 
            ? 'bg-blue-600 dark:bg-blue-500' 
            : 'bg-gray-200 dark:bg-gray-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
        <div className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-6 h-6 rounded-full transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}></div>
      </div>
      {(label || checkedLabel || uncheckedLabel) && (
        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label || (checked ? (checkedLabel || 'Enabled') : (uncheckedLabel || 'Disabled'))}
        </span>
      )}
    </label>
  );
};

// Custom Number Input Component
const NumberInput = ({ value, onChange, min, max, step = 1, disabled, placeholder, className = '', label, name }) => {
  // Ensure we have a valid display value
  const displayValue = value !== undefined && value !== null ? value : '';
  
  const handleIncrement = () => {
    const currentValue = typeof value === 'number' ? value : (min ?? 0);
    const newValue = Math.min(max ?? Infinity, currentValue + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const currentValue = typeof value === 'number' ? value : (min ?? 0);
    const newValue = Math.max(min ?? -Infinity, currentValue - step);
    onChange(newValue);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '' || val === undefined) {
      // Do not coerce to min on empty to avoid concatenation artifacts like "510"
      onChange(null);
    } else {
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
        onChange(numVal);
      }
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || (min !== undefined && (value ?? min) <= min)}
        className="absolute left-0 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <input
        type="number"
        value={displayValue}
        onChange={handleInputChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder || `${min || 0}`}
        className={`w-full px-12 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label={label || placeholder || 'number input'}
        name={name}
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && (value || 0) >= max)}
        className="absolute right-0 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [formData, setFormData] = useState({});
  const { updateSettings } = useRegional();
  const { t } = useTranslation();
  const [settingsDoc, setSettingsDoc] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importRawDoc, setImportRawDoc] = useState(null);
  const [importMerge, setImportMerge] = useState(false);
  const [importError, setImportError] = useState('');
  const [importToast, setImportToast] = useState(null);

  // Admin management state
  const [invitations, setInvitations] = useState([]);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({ email: '', message: '' });

  // Tab configuration
  const tabs = [
    { key: 'general', label: t('settings.general.title'), icon: Cog6ToothIcon },
    { key: 'admin', label: t('settings.admin.title'), icon: UserGroupIcon },
    { key: 'email', label: t('settings.email.title'), icon: EnvelopeIcon },
    { key: 'notifications', label: t('settings.notifications.title'), icon: BellIcon },
    { key: 'security', label: t('settings.security.title'), icon: LockClosedIcon },
    { key: 'regional', label: t('settings.regional.title'), icon: ComputerDesktopIcon },
    { key: 'performance', label: t('settings.performance.title'), icon: BoltIcon }
  ];

  // Small helper to download a blob/json
  const downloadJson = useCallback((filename, obj) => {
    try {
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
      toast.error('Failed to download file');
    }
  }, []);

  // Deep difference count between two objects (count changed keys)
  const countChangedKeys = (a, b) => {
    const visited = new Set();
    const walk = (x, y, path = '') => {
      let count = 0;
      const keys = new Set([...Object.keys(x || {}), ...Object.keys(y || {})]);
      for (const k of keys) {
        const nx = x ? x[k] : undefined;
        const ny = y ? y[k] : undefined;
        const keyPath = `${path}.${k}`;
        if (visited.has(keyPath)) continue;
        visited.add(keyPath);
        if (typeof nx === 'object' && nx !== null && typeof ny === 'object' && ny !== null && !Array.isArray(nx) && !Array.isArray(ny)) {
          count += walk(nx, ny, keyPath);
        } else {
          const same = JSON.stringify(nx) === JSON.stringify(ny);
          if (!same) count += 1;
        }
      }
      return count;
    };
    return walk(a || {}, b || {}, '');
  };

  // Load settings with caching
  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Check cache first
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setSettings(data.settings || {});
            setFormData(data.settings || {});
            setLoading(false);
            console.log('Settings loaded from cache');
            return;
          }
        }
      }

      console.log('Fetching settings from server...');
      
      // Load user profile data for regional settings
      const [settingsResponse, profileResponse, settingsDocRes] = await Promise.all([
        // Use /admin/configs as canonical API for full settings payload
        settingsAPI.get('/admin/configs').catch(err => {
          console.error('Error loading admin configs:', err);
          return { data: { settings: {}, data: {} } };
        }),
        settingsAPI.get('/admin/profile').catch(err => {
          console.error('Error loading admin profile:', err);
          return { data: { data: {} } };
        }),
        settingsDocAPI.getSettings().catch(() => null)
      ]);

      console.log('Settings response:', settingsResponse.data);
      console.log('Profile response:', profileResponse.data);
      
      // Support multiple shapes: { settings }, or legacy { data: { defaultPageSize } }
      const raw = settingsResponse.data || {};
      const fetchedSettings = raw.settings || raw.configs?.settings || raw.data?.settings || {};
      const legacyDefault = raw.data?.defaultPageSize;

      const profileData = profileResponse.data.data || {};
      
      // Merge regional settings from profile into settings
      const mergedSettings = {
        ...(fetchedSettings || {}),
        regional: {
          language: profileData.language || 'en',
          timezone: profileData.timezone || 'Asia/Manila',
          dateFormat: profileData.dateFormat || 'MM/DD/YYYY',
          timeFormat: profileData.timeFormat || '12h',
          autoDetectTimezone: false,
          useSystemLocale: false,
          firstDayOfWeek: 'sunday',
          ...(fetchedSettings?.regional || {})
        },
        // Add default performance settings if not present
        performance: {
          cache: {
            enabled: false,
            duration: 86400,
            strategy: 'memory',
            maxSize: '100MB',
            ...fetchedSettings?.performance?.cache
          },
          pagination: {
            // Prefer server-provided setting, fallback to legacy default, else 25
            defaultLimit: fetchedSettings?.performance?.pagination?.defaultLimit ?? legacyDefault ?? 25,
            maxLimit: 100,
            ...fetchedSettings?.performance?.pagination
          },
          autoSave: {
            enabled: false,
            interval: 60,
            showNotification: false,
            ...fetchedSettings?.performance?.autoSave
          },
          lazyLoading: {
            enabled: false,
            threshold: 0.1,
            ...fetchedSettings?.performance?.lazyLoading
          },
          ...fetchedSettings?.performance
        }
      };
      
      // Update state
      setSettings(mergedSettings);
      setFormData(mergedSettings);
      
      // Update RegionalContext with loaded settings
      if (mergedSettings.regional) {
        updateSettings(mergedSettings.regional);
      }

      // Hold the canonical JSON doc for diffing and export/import preview
      if (settingsDocRes?.data?.data) {
        setSettingsDoc(settingsDocRes.data.data);
      } else {
        // Fallback: synthesize from current UI settings
        setSettingsDoc({
          metadata: { version: '1.0.0', updatedAt: new Date().toISOString() },
          settings: mergedSettings
        });
      }

      // Cache the data
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data: { settings: mergedSettings, defaults: raw.defaults },
        timestamp: Date.now()
      }));

      console.log('Settings loaded successfully:', {
        settingsCount: Object.keys(mergedSettings).length,
        regional: mergedSettings.regional,
        performance: mergedSettings.performance
      });
      
      if ((raw.dbCount === 0 || raw.defaults) && !profileData.timezone) {
        toast.info('No saved settings found, using defaults');
      }
    } catch (error) {
      console.error('Error loading settings - Full error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Admin access required to view settings');
      } else {
        toast.error(`Failed to load settings: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [updateSettings]);

  // Load admin invitations
  const loadInvitations = useCallback(async () => {
    try {
      const response = await api.get('/admin/invitations');
      setInvitations(response.data.invitations || response.data.data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  }, []);

  // Debounced save function for auto-save
  const debouncedSave = useMemo(
    () => debounce(async (values) => {
      try {
        setSaving(true);
        console.log('Auto-saving settings...');
        // Save via /admin/configs for canonical write
        const response = await settingsAPI.put('/admin/configs', { settings: values });
        console.log('Auto-save response:', response.data);
        
        // Update cache
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const cacheData = JSON.parse(cached);
          cacheData.data.settings = values;
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        }
        
        setSettings(values);
        setUnsavedChanges(false);
        
        if (response.data?.dbResult) {
          const { modified, upserted } = response.data.dbResult;
          toast.success(`Auto-saved: ${modified + upserted} settings updated`);
        } else {
          toast.success('Settings saved automatically');
        }
      } catch (error) {
        console.error('Error auto-saving settings:', error);
        console.error('Auto-save error response:', error.response?.data);
        
        if (error.code === 'ECONNABORTED') {
          toast.error('Auto-save timed out. Please save manually.');
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          toast.error('Authentication required to save settings');
          // Don't retry auto-save if auth fails
          debouncedSave.cancel();
        } else {
          toast.error('Failed to auto-save settings');
        }
      } finally {
        setSaving(false);
      }
    }, 2000),
    []
  );

  // Handle form field change
  const handleFieldChange = useCallback((path, value) => {
    const keys = path.split('.');
    const newFormData = { ...formData };
    let current = newFormData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setFormData(newFormData);
    setUnsavedChanges(true);
    
    // If regional settings changed, update the context immediately for preview
    if (path.startsWith('regional.')) {
      updateSettings(newFormData.regional || {});
    }
    
    // Auto-save if enabled
    if (newFormData.performance?.autoSave?.enabled) {
      debouncedSave(newFormData);
    }
  }, [formData, debouncedSave, updateSettings]);

  // Get nested value from object
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  };

  // Manual save
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      
      console.log('Saving settings...', formData);
      
      // Show saving notification
      toast.info('Saving settings...', { autoClose: false, toastId: 'saving-settings' });
      
      // Save settings (main config) via /admin/configs
      const settingsResponse = await settingsAPI.put('/admin/configs', { 
        settings: formData
      });
      
      console.log('Settings update response:', settingsResponse.data);
      
      // Save regional settings to profile separately if they exist
      const regionalSettings = formData.regional || {};
      if (regionalSettings && Object.keys(regionalSettings).length > 0) {
        try {
          const profileResponse = await settingsAPI.put('/admin/profile', {
            language: regionalSettings.language,
            timezone: regionalSettings.timezone,
            dateFormat: regionalSettings.dateFormat,
            timeFormat: regionalSettings.timeFormat
          });
          console.log('Profile update response:', profileResponse.data);
          
          // Update RegionalContext with saved settings immediately
          updateSettings(regionalSettings);
          // Also update localStorage for immediate persistence
          localStorage.setItem('regional_settings', JSON.stringify(regionalSettings));
        } catch (profileError) {
          console.warn('Profile update failed but settings saved:', profileError);
          // Don't fail the entire save if just profile update fails
        }
      }
      
      // Dismiss saving notification
      toast.dismiss('saving-settings');
      
      // Update cache with current form data to prevent reversion
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data: { settings: formData },
        timestamp: Date.now()
      }));
      
      // Update state with saved values (prevent reversion)
      setSettings(formData);
      setUnsavedChanges(false);
      
      // Broadcast settings update events
      localStorage.setItem('settingsUpdated', JSON.stringify({ 
        timestamp: Date.now(),
        settings: formData 
      }));
      window.dispatchEvent(new CustomEvent('settingsUpdated', { 
        detail: { settings: formData }
      }));
      
      // Show success message
      toast.success('Settings saved successfully', { autoClose: 3000 });
      
      console.log('Settings saved and state updated successfully');
    } catch (error) {
      toast.dismiss('saving-settings');
      console.error('Error saving settings - Full error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Admin access required to save settings');
      } else {
        toast.error(`Failed to save settings: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setSaving(false);
    }
  }, [formData, updateSettings]);

  // Reset to defaults
  const handleReset = useCallback((category) => {
    const confirmReset = window.confirm(
      category 
        ? t('settings.messages.resetCategoryConfirm', { category })
        : t('settings.messages.resetConfirm')
    );

    if (confirmReset) {
      (async () => {
        try {
          setLoading(true);
          await settingsAPI.post('/admin/settings/reset', { category });
          
          // Clear cache
          sessionStorage.removeItem(CACHE_KEY);
          
          // Reload settings
          await loadSettings(true);
          
          toast.success(t('settings.messages.resetSuccess'));
        } catch (error) {
          console.error('Error resetting settings:', error);
          if (error.code === 'ECONNABORTED') {
            toast.error('Reset operation timed out. Please try again.');
          } else {
            toast.error(t('settings.messages.resetError'));
          }
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [loadSettings, t]);

  // Export settings
  const handleExport = useCallback(async () => {
    try {
      // Try backend export first
      const response = await settingsDocAPI.exportSettings();
      const blob = new Blob([response.data], { type: 'application/json;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'va-hub-settings.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('settings.importExport.exportSuccess'), { toastId: 'settings-toast-success' });
    } catch (error) {
      console.error('Error exporting settings:', error);
      // Fallback: export from current in-memory state
      const fallbackDoc = migrateSettingsDoc({
        metadata: { version: '1.0.0', updatedAt: new Date().toISOString() },
        settings: formData || settings || {}
      });
      downloadJson('va-hub-settings.json', fallbackDoc);
      toast.warning(t('settings.importExport.exportError') + ' • Exported local copy', { toastId: 'settings-toast-error' });
    }
  }, [t, formData, settings, downloadJson]);

  // Download default JSON
  const handleDownloadDefault = useCallback(async () => {
    try {
      const res = await settingsDocAPI.getDefaultSettings();
      const doc = res?.data?.data || createDefaultSettingsDoc();
      downloadJson('va-hub-settings.default.json', doc);
      toast.success('Default settings downloaded', { toastId: 'settings-toast-success' });
    } catch (e) {
      console.warn('Default settings endpoint unavailable, using client default', e);
      downloadJson('va-hub-settings.default.json', createDefaultSettingsDoc());
      toast.warning('Backend unavailable; downloaded client default', { toastId: 'settings-toast-error' });
    }
  }, [downloadJson]);

  // Enhanced import settings with validation and feedback
  const handleImport = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // File size check (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('settings.importExport.fileSizeError'));
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Client-side validation for new schema
      let candidate = data;
      if (!candidate.metadata || typeof candidate.metadata !== 'object') {
        candidate.metadata = {};
      }
      if (!candidate.metadata.version) {
        candidate.metadata.version = '1.0.0';
      }
      if (!candidate.metadata.updatedAt) {
        candidate.metadata.updatedAt = new Date().toISOString();
      }
      if (typeof candidate.settings !== 'object' || candidate.settings === null) {
        throw new Error('Invalid file format: "settings" must be an object');
      }
      // Normalize and migrate without dropping unknown keys
      candidate = migrateSettingsDoc(candidate);
      setImportRawDoc(candidate);
      setImportError('');
      // Compute changed keys vs current doc.settings
      const current = settingsDoc?.settings || {};
      const maskedPreview = maskSecrets(candidate);
      maskedPreview.__diffCount = countChangedKeys(current, candidate.settings);
      setImportPreview(maskedPreview);
      // Keep modal open for confirmation
      setImportModalVisible(true);
    } catch (error) {
      setImportError(error.message || 'Invalid JSON');
      toast.error(t('settings.importExport.importError') + ': ' + (error.message || 'Invalid JSON'), { toastId: 'settings-toast-error' });
    }
    
    // Reset file input
    event.target.value = '';
  }, [t, settingsDoc]);

  // Send admin invitation
  const handleSendInvitation = useCallback(async () => {
    if (!inviteFormData.email) {
      toast.error(t('settings.admin.emailRequired'));
      return;
    }

    try {
      await api.post('/admin/invitations', inviteFormData);
      
      toast.success(t('settings.admin.invitationSent'));
      setInviteFormData({ email: '', message: '' });
      setInviteModalVisible(false);
      loadInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(t('settings.admin.invitationError'));
    }
  }, [inviteFormData, loadInvitations, t]);

  // Cancel invitation
  const handleCancelInvitation = useCallback(async (id) => {
    if (!window.confirm(t('settings.admin.confirmCancelInvitation'))) {
      return;
    }

    try {
      await api.delete(`/admin/invitations/${id}`);
      toast.success(t('settings.admin.invitationCancelled'));
      loadInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error(t('settings.admin.cancelInvitationError'));
    }
  }, [loadInvitations, t]);

  // Load settings and invitations on mount
  useEffect(() => {
    loadSettings();
    loadInvitations();
    
    // Set up cross-tab synchronization
    const handleStorageChange = (e) => {
      if (e.key === 'settings_updated' && e.newValue) {
        const { timestamp } = JSON.parse(e.newValue);
        // Reload settings if update from another tab
        if (timestamp && timestamp !== window.settingsTimestamp) {
          console.log('Settings updated in another tab, reloading...');
          loadSettings(true);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSettings, loadInvitations]);

  // Broadcast settings changes to other tabs
  useEffect(() => {
    if (unsavedChanges) {
      // Store timestamp for cross-tab sync
      window.settingsTimestamp = Date.now();
      localStorage.setItem('settings_updated', JSON.stringify({
        timestamp: window.settingsTimestamp,
        updated: true
      }));
    }
  }, [unsavedChanges]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  // Confirm apply import (merge or overwrite)
  const applyImport = useCallback(async () => {
    if (!importRawDoc) return;
    try {
      toast.info('Importing settings...', { autoClose: false, toastId: 'import-progress' });
      const res = await settingsDocAPI.importSettings(importRawDoc, importMerge);
      toast.dismiss('import-progress');
      setImportToast({ type: 'success', message: 'Settings imported successfully' });
      toast.success('Settings imported successfully', { toastId: 'settings-toast-success' });
      sessionStorage.removeItem(CACHE_KEY);
      await loadSettings(true);
      setImportModalVisible(false);
      setImportPreview(null);
      setImportRawDoc(null);
      setImportMerge(false);
    } catch (e) {
      console.warn('Import endpoint failed, attempting PUT fallback:', e);
      try {
        await settingsDocAPI.updateSettings(importRawDoc);
        toast.dismiss('import-progress');
        setImportToast({ type: 'success', message: 'Settings imported successfully' });
        toast.success('Settings imported successfully', { toastId: 'settings-toast-success' });
        sessionStorage.removeItem(CACHE_KEY);
        await loadSettings(true);
        setImportModalVisible(false);
      } catch (e2) {
        toast.dismiss('import-progress');
        setImportToast({ type: 'error', message: e2?.response?.data?.error || e2.message });
        toast.error('Import failed: ' + (e2?.response?.data?.error || e2.message), { toastId: 'settings-toast-error' });
      }
    }
  }, [importRawDoc, importMerge, loadSettings]);

  // Tab content renderers
  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.general.siteInformation')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.general.siteName')}</label>
            <input
              type="text"
              value={getNestedValue(formData, 'general.siteName') || ''}
              onChange={(e) => handleFieldChange('general.siteName', e.target.value)}
              placeholder={t('settings.general.siteNamePlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.general.siteUrl')}</label>
            <input
              type="text"
              value={getNestedValue(formData, 'general.siteUrl') || ''}
              onChange={(e) => handleFieldChange('general.siteUrl', e.target.value)}
              placeholder={t('settings.general.siteUrlPlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.general.adminEmail')}</label>
            <input
              type="email"
              value={getNestedValue(formData, 'general.adminEmail') || ''}
              onChange={(e) => handleFieldChange('general.adminEmail', e.target.value)}
              placeholder={t('settings.general.adminEmailPlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.general.supportEmail')}</label>
            <input
              type="email"
              value={getNestedValue(formData, 'general.supportEmail') || ''}
              onChange={(e) => handleFieldChange('general.supportEmail', e.target.value)}
              placeholder={t('settings.general.supportEmailPlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">{t('settings.general.maintenanceMode')}</label>
            <ToggleSwitch
              checked={getNestedValue(formData, 'general.maintenanceMode') || false}
              onChange={(value) => handleFieldChange('general.maintenanceMode', value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.security.twoFactorAuth.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.security.twoFactorAuth.enabled')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'security.twoFactorAuth.enabled') || false}
              onChange={(value) => handleFieldChange('security.twoFactorAuth.enabled', value)}
              checkedLabel={t('common.enabled')}
              uncheckedLabel={t('common.disabled')}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.security.twoFactorAuth.required')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'security.twoFactorAuth.required') || false}
              onChange={(value) => handleFieldChange('security.twoFactorAuth.required', value)}
            />
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.security.sessionManagement.title')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.security.sessionManagement.sessionTimeout')}</label>
            <NumberInput
              value={getNestedValue(formData, 'security.sessionTimeout') || 30}
              onChange={(value) => handleFieldChange('security.sessionTimeout', value)}
              min={5}
              max={1440}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.security.sessionManagement.maxLoginAttempts')}</label>
            <NumberInput
              value={getNestedValue(formData, 'security.loginAttempts.maxAttempts') || 5}
              onChange={(value) => handleFieldChange('security.loginAttempts.maxAttempts', value)}
              min={3}
              max={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.security.sessionManagement.lockoutDuration')}</label>
            <NumberInput
              value={getNestedValue(formData, 'security.loginAttempts.lockoutDuration') || 15}
              onChange={(value) => handleFieldChange('security.loginAttempts.lockoutDuration', value)}
              min={5}
              max={60}
            />
          </div>
        </div>
      </div>

      {/* Password Requirements */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.security.passwordRequirements.title')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.security.passwordRequirements.minLength')}</label>
            <NumberInput
              value={getNestedValue(formData, 'security.passwordRequirements.minLength') || 8}
              onChange={(value) => handleFieldChange('security.passwordRequirements.minLength', value)}
              min={6}
              max={32}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.security.passwordRequirements.requireUppercase')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'security.passwordRequirements.requireUppercase') || false}
              onChange={(value) => handleFieldChange('security.passwordRequirements.requireUppercase', value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.security.passwordRequirements.requireNumbers')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'security.passwordRequirements.requireNumbers') || false}
              onChange={(value) => handleFieldChange('security.passwordRequirements.requireNumbers', value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.security.passwordRequirements.requireSpecialChars')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'security.passwordRequirements.requireSpecialChars') || false}
              onChange={(value) => handleFieldChange('security.passwordRequirements.requireSpecialChars', value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.security.passwordRequirements.expirationDays')}</label>
            <NumberInput
              value={getNestedValue(formData, 'security.passwordRequirements.expirationDays') || 90}
              onChange={(value) => handleFieldChange('security.passwordRequirements.expirationDays', value)}
              min={0}
              max={365}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminManagement = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">{t('settings.admin.invitations')}</h3>
          <button
            onClick={() => setInviteModalVisible(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('settings.admin.sendInvitation')}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700 text-gray-400">
              <tr>
                <th className="px-6 py-3">{t('common.email')}</th>
                <th className="px-6 py-3">{t('common.status')}</th>
                <th className="px-6 py-3">{t('settings.admin.sentAt')}</th>
                <th className="px-6 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="px-6 py-4">{invitation.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invitation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    }`}>
                      {t(`settings.admin.status.${invitation.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {invitation.status === 'pending' && (
                      <button
                        onClick={() => handleCancelInvitation(invitation._id)}
                        className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                        title={t('settings.admin.cancelInvitation')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.email.title')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.email.sendgridApiKey')}</label>
            <input
              type="password"
              value={getNestedValue(formData, 'email.sendgridApiKey') || ''}
              onChange={(e) => handleFieldChange('email.sendgridApiKey', e.target.value)}
              placeholder={t('settings.email.sendgridApiKeyPlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.email.fromName')}</label>
            <input
              type="text"
              value={getNestedValue(formData, 'email.fromName') || ''}
              onChange={(e) => handleFieldChange('email.fromName', e.target.value)}
              placeholder={t('settings.email.fromNamePlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.email.fromEmail')}</label>
            <input
              type="email"
              value={getNestedValue(formData, 'email.fromEmail') || ''}
              onChange={(e) => handleFieldChange('email.fromEmail', e.target.value)}
              placeholder={t('settings.email.fromEmailPlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSettings = () => (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.notifications.email.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.notifications.email.enabled')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'notifications.email.enabled') || false}
              onChange={(value) => handleFieldChange('notifications.email.enabled', value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.notifications.email.criticalAlerts')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'notifications.email.criticalAlerts') || false}
              onChange={(value) => handleFieldChange('notifications.email.criticalAlerts', value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.notifications.email.userActivity')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'notifications.email.userActivity') || false}
              onChange={(value) => handleFieldChange('notifications.email.userActivity', value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.notifications.email.systemUpdates')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'notifications.email.systemUpdates') || false}
              onChange={(value) => handleFieldChange('notifications.email.systemUpdates', value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.notifications.email.digestFrequency')}</label>
            <select
              value={getNestedValue(formData, 'notifications.email.digestFrequency') || 'weekly'}
              onChange={(e) => handleFieldChange('notifications.email.digestFrequency', e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">{t('settings.notifications.frequency.daily')}</option>
              <option value="weekly">{t('settings.notifications.frequency.weekly')}</option>
              <option value="biweekly">{t('settings.notifications.frequency.biweekly')}</option>
              <option value="monthly">{t('settings.notifications.frequency.monthly')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.notifications.inApp.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.notifications.inApp.enabled')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'notifications.inApp.enabled') || false}
              onChange={(value) => handleFieldChange('notifications.inApp.enabled', value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.notifications.inApp.allUpdates')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'notifications.inApp.allUpdates') || false}
              onChange={(value) => handleFieldChange('notifications.inApp.allUpdates', value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.notifications.inApp.soundEnabled')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'notifications.inApp.soundEnabled') || false}
              onChange={(value) => handleFieldChange('notifications.inApp.soundEnabled', value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.notifications.inApp.desktopNotifications')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'notifications.inApp.desktopNotifications') || false}
              onChange={(value) => handleFieldChange('notifications.inApp.desktopNotifications', value)}
            />
          </div>
        </div>
      </div>

      {/* Slack Integration */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.notifications.slack.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.notifications.slack.enabled')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'notifications.slack.enabled') || false}
              onChange={(value) => handleFieldChange('notifications.slack.enabled', value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.notifications.slack.webhookUrl')}</label>
            <input
              type="text"
              value={getNestedValue(formData, 'notifications.slack.webhookUrl') || ''}
              onChange={(e) => handleFieldChange('notifications.slack.webhookUrl', e.target.value)}
              placeholder={t('settings.notifications.slack.webhookUrlPlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.notifications.slack.alertsChannel')}</label>
            <input
              type="text"
              value={getNestedValue(formData, 'notifications.slack.channels.alerts') || ''}
              onChange={(e) => handleFieldChange('notifications.slack.channels.alerts', e.target.value)}
              placeholder={t('settings.notifications.slack.alertsChannelPlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.notifications.slack.generalChannel')}</label>
            <input
              type="text"
              value={getNestedValue(formData, 'notifications.slack.channels.general') || ''}
              onChange={(e) => handleFieldChange('notifications.slack.channels.general', e.target.value)}
              placeholder={t('settings.notifications.slack.generalChannelPlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      {/* Regional Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.regional.title')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.regional.language')}</label>
            <select
              value={getNestedValue(formData, 'regional.language') || 'en'}
              onChange={(e) => handleFieldChange('regional.language', e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">{t('settings.regional.languages.english')}</option>
              <option value="es">{t('settings.regional.languages.spanish')}</option>
              <option value="tl">{t('settings.regional.languages.tagalog')}</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {t('settings.regional.currentTime')}: {new Date().toLocaleString('en-US', { 
                timeZone: getNestedValue(formData, 'regional.timezone') || 'Asia/Manila',
                dateStyle: 'medium',
                timeStyle: 'medium'
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.regional.timezone')}</label>
            <select
              value={getNestedValue(formData, 'regional.timezone') || 'Asia/Manila'}
              onChange={(e) => handleFieldChange('regional.timezone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="auto">{t('settings.regional.timezones.autoDetect')}</option>
              <optgroup label={t('settings.regional.timezones.usCanada')}>
                <option value="America/New_York">{t('settings.regional.timezones.easternTime')}</option>
                <option value="America/Chicago">{t('settings.regional.timezones.centralTime')}</option>
                <option value="America/Denver">{t('settings.regional.timezones.mountainTime')}</option>
                <option value="America/Phoenix">{t('settings.regional.timezones.arizonaTime')}</option>
                <option value="America/Los_Angeles">{t('settings.regional.timezones.pacificTime')}</option>
                <option value="America/Anchorage">{t('settings.regional.timezones.alaskaTime')}</option>
                <option value="Pacific/Honolulu">{t('settings.regional.timezones.hawaiiTime')}</option>
                <option value="America/Toronto">{t('settings.regional.timezones.toronto')}</option>
                <option value="America/Vancouver">{t('settings.regional.timezones.vancouver')}</option>
              </optgroup>
              <optgroup label={t('settings.regional.timezones.asia')}>
                <option value="Asia/Manila">{t('settings.regional.timezones.manila')}</option>
                <option value="Asia/Singapore">{t('settings.regional.timezones.singapore')}</option>
                <option value="Asia/Hong_Kong">{t('settings.regional.timezones.hongKong')}</option>
                <option value="Asia/Tokyo">{t('settings.regional.timezones.tokyo')}</option>
                <option value="Asia/Seoul">{t('settings.regional.timezones.seoul')}</option>
                <option value="Asia/Shanghai">{t('settings.regional.timezones.shanghai')}</option>
                <option value="Asia/Kolkata">{t('settings.regional.timezones.india')}</option>
                <option value="Asia/Dubai">{t('settings.regional.timezones.dubai')}</option>
                <option value="Asia/Bangkok">{t('settings.regional.timezones.bangkok')}</option>
                <option value="Asia/Jakarta">{t('settings.regional.timezones.jakarta')}</option>
              </optgroup>
              <optgroup label={t('settings.regional.timezones.europe')}>
                <option value="Europe/London">{t('settings.regional.timezones.london')}</option>
                <option value="Europe/Paris">{t('settings.regional.timezones.paris')}</option>
                <option value="Europe/Berlin">{t('settings.regional.timezones.berlin')}</option>
                <option value="Europe/Madrid">{t('settings.regional.timezones.madrid')}</option>
                <option value="Europe/Rome">{t('settings.regional.timezones.rome')}</option>
                <option value="Europe/Amsterdam">{t('settings.regional.timezones.amsterdam')}</option>
                <option value="Europe/Brussels">{t('settings.regional.timezones.brussels')}</option>
                <option value="Europe/Zurich">{t('settings.regional.timezones.zurich')}</option>
                <option value="Europe/Stockholm">{t('settings.regional.timezones.stockholm')}</option>
                <option value="Europe/Moscow">{t('settings.regional.timezones.moscow')}</option>
              </optgroup>
              <optgroup label={t('settings.regional.timezones.pacific')}>
                <option value="Australia/Sydney">{t('settings.regional.timezones.sydney')}</option>
                <option value="Australia/Melbourne">{t('settings.regional.timezones.melbourne')}</option>
                <option value="Australia/Perth">{t('settings.regional.timezones.perth')}</option>
                <option value="Pacific/Auckland">{t('settings.regional.timezones.auckland')}</option>
                <option value="Pacific/Fiji">{t('settings.regional.timezones.fiji')}</option>
              </optgroup>
              <optgroup label={t('settings.regional.timezones.others')}>
                <option value="UTC">UTC</option>
                <option value="Africa/Johannesburg">{t('settings.regional.timezones.johannesburg')}</option>
                <option value="Africa/Cairo">{t('settings.regional.timezones.cairo')}</option>
                <option value="America/Mexico_City">{t('settings.regional.timezones.mexicoCity')}</option>
                <option value="America/Sao_Paulo">{t('settings.regional.timezones.saoPaulo')}</option>
                <option value="America/Buenos_Aires">{t('settings.regional.timezones.buenosAires')}</option>
              </optgroup>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {t('settings.regional.currentTime')}: {new Date().toLocaleString('en-US', { 
                timeZone: getNestedValue(formData, 'regional.timezone') || 'Asia/Manila',
                dateStyle: 'medium',
                timeStyle: 'medium'
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.regional.dateFormat')}</label>
            <select
              value={getNestedValue(formData, 'regional.dateFormat') || 'MM/DD/YYYY'}
              onChange={(e) => handleFieldChange('regional.dateFormat', e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MM/DD/YYYY">{t('settings.regional.dateFormats.mmddyyyy')}</option>
              <option value="DD/MM/YYYY">{t('settings.regional.dateFormats.ddmmyyyy')}</option>
              <option value="YYYY-MM-DD">{t('settings.regional.dateFormats.yyyymmdd')}</option>
              <option value="DD.MM.YYYY">{t('settings.regional.dateFormats.ddmmyyyyDot')}</option>
              <option value="DD-MM-YYYY">{t('settings.regional.dateFormats.ddmmyyyyDash')}</option>
              <option value="MMM DD, YYYY">{t('settings.regional.dateFormats.mmmddyyyy')}</option>
              <option value="DD MMM YYYY">{t('settings.regional.dateFormats.ddmmmyyyy')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.regional.timeFormat')}</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="timeFormat"
                  value="12h"
                  checked={getNestedValue(formData, 'regional.timeFormat') === '12h' || !getNestedValue(formData, 'regional.timeFormat')}
                  onChange={(e) => handleFieldChange('regional.timeFormat', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300">{t('settings.regional.timeFormats.12hour')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="timeFormat"
                  value="24h"
                  checked={getNestedValue(formData, 'regional.timeFormat') === '24h'}
                  onChange={(e) => handleFieldChange('regional.timeFormat', e.target.value)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-300">{t('settings.regional.timeFormats.24hour')}</span>
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('settings.regional.example')}: {new Date().toLocaleTimeString('en-US', {
                hour12: getNestedValue(formData, 'regional.timeFormat') !== '24h',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.regional.firstDayOfWeek')}</label>
            <select
              value={getNestedValue(formData, 'regional.firstDayOfWeek') || 'sunday'}
              onChange={(e) => handleFieldChange('regional.firstDayOfWeek', e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sunday">{t('common.sunday')}</option>
              <option value="monday">{t('common.monday')}</option>
              <option value="saturday">{t('common.saturday')}</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.regional.autoDetectTimezone')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'regional.autoDetectTimezone') || false}
              onChange={(value) => {
                handleFieldChange('regional.autoDetectTimezone', value);
                if (value) {
                  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  handleFieldChange('regional.timezone', userTimezone);
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.regional.useSystemLocale')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'regional.useSystemLocale') || false}
              onChange={(value) => handleFieldChange('regional.useSystemLocale', value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-6">
      {/* Cache Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.performance.cache.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.performance.cache.enabled')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'performance.cache.enabled') || false}
              onChange={(value) => handleFieldChange('performance.cache.enabled', value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.performance.cache.duration')}</label>
            <NumberInput
              value={getNestedValue(formData, 'performance.cache.duration') || 86400}
              onChange={(value) => handleFieldChange('performance.cache.duration', value)}
              min={60}
              max={604800}
              step={60}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.performance.cache.strategy')}</label>
            <select
              value={getNestedValue(formData, 'performance.cache.strategy') || 'memory'}
              onChange={(e) => handleFieldChange('performance.cache.strategy', e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="memory">{t('settings.performance.cache.strategies.memory')}</option>
              <option value="disk">{t('settings.performance.cache.strategies.disk')}</option>
              <option value="hybrid">{t('settings.performance.cache.strategies.hybrid')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.performance.cache.maxSize')}</label>
            <input
              type="text"
              value={getNestedValue(formData, 'performance.cache.maxSize') || '100MB'}
              onChange={(value) => handleFieldChange('performance.cache.maxSize', value)}
              placeholder={t('settings.performance.cache.maxSizePlaceholder')}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Pagination Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.performance.pagination.title')}</h3>
        <div className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.performance.pagination.defaultLimit')}</label>
              <div data-test="default-page-size">
                <NumberInput
                  value={getNestedValue(formData, 'performance.pagination.defaultLimit') || 25}
                  onChange={(value) => handleFieldChange('performance.pagination.defaultLimit', value)}
                  min={5}
                  max={1000}
                  step={5}
                  placeholder="25"
                  label="Default Page Size"
                  name="defaultPageSize"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.performance.pagination.maxLimit')}</label>
              <NumberInput
                value={getNestedValue(formData, 'performance.pagination.maxLimit') || 100}
                onChange={(value) => handleFieldChange('performance.pagination.maxLimit', value)}
                min={10}
                max={5000}
                step={10}
                placeholder="100"
                label="Max Page Size"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Save Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.performance.autoSave.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.performance.autoSave.enabled')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'performance.autoSave.enabled') || false}
              onChange={(value) => handleFieldChange('performance.autoSave.enabled', value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.performance.autoSave.interval')}</label>
            <NumberInput
              value={getNestedValue(formData, 'performance.autoSave.interval') || 60}
              onChange={(value) => handleFieldChange('performance.autoSave.interval', value)}
              min={10}
              max={300}
              step={10}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.performance.autoSave.showNotification')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'performance.autoSave.showNotification') || false}
              onChange={(value) => handleFieldChange('performance.autoSave.showNotification', value)}
            />
          </div>
        </div>
      </div>

      {/* Lazy Loading */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-6">{t('settings.performance.lazyLoading.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">{t('settings.performance.lazyLoading.enabled')}</span>
            <ToggleSwitch
              checked={getNestedValue(formData, 'performance.lazyLoading.enabled') || false}
              onChange={(value) => handleFieldChange('performance.lazyLoading.enabled', value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.performance.lazyLoading.threshold')}</label>
            <input
              type="number"
              value={getNestedValue(formData, 'performance.lazyLoading.threshold') || 0.1}
              onChange={(e) => handleFieldChange('performance.lazyLoading.threshold', parseFloat(e.target.value))}
              min={0}
              max={1}
              step={0.1}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = (tab) => {
    switch (tab) {
      case 'general':
        return renderGeneralSettings();
      case 'admin':
        return renderAdminManagement();
      case 'email':
        return renderEmailSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationsSettings();
      case 'regional':
        return renderDisplaySettings();
      case 'performance':
        return renderPerformanceSettings();
      default:
        return (
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Cog6ToothIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-300">{t('settings.settingsCategory')}</h3>
                <p className="mt-1 text-sm text-blue-200">{t('settings.settingsWillDisplayHere', { tab })}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" data-test="settings-page">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Cog6ToothIcon className="h-6 w-6 mr-2" />
            {t('settings.title')}
          </h2>
          <div className="flex items-center space-x-3">
            {unsavedChanges && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-300 border border-yellow-700">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {t('common.unsavedChanges')}
              </span>
            )}
            <button
              onClick={() => loadSettings(true)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </button>
            <button
              onClick={handleDownloadDefault}
              data-test="settings-download-default-button"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
              title="Download default settings JSON"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download default
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {t('common.export')}
            </button>
            <button
              onClick={() => setImportModalVisible(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              {t('common.import')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              data-test="settings-save"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircleIcon className="h-4 w-4 mr-2" />
              )}
              {t('common.save')} {t('common.settings')}
            </button>
          </div>
        </div>
      </div>

      {/* Inline result hooks for tests */}
      {importToast?.type === 'success' && (
        <div data-test="settings-toast-success" className="sr-only">{importToast.message}</div>
      )}
      {importToast?.type === 'error' && (
        <div data-test="settings-toast-error" className="sr-only">{importToast.message}</div>
      )}

      {/* Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  data-test={`settings-tab-${tab.key}`}
                  className={`
                    py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {renderTabContent(activeTab)}
        
        {activeTab !== 'admin' && (
          <>
            <div className="mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={() => handleReset(activeTab)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-300 bg-red-900/20 hover:bg-red-900/30 border border-red-700 rounded-lg transition-colors duration-200"
              >
                {t('settings.resetToDefaults', { tab: activeTab })}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Import Modal */}
      {importModalVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setImportModalVisible(false)}></div>
            <div className="relative bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">{t('settings.importExport.importSettings')}</h3>
                <button
                  onClick={() => setImportModalVisible(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center relative"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f) {
                    const input = document.createElement('input');
                    input.type = 'file';
                    const dt = new DataTransfer();
                    dt.items.add(f);
                    input.files = dt.files;
                    const evt = { target: input };
                    // Reuse handler
                    handleImport(evt);
                  }
                }}
              >
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-300">Drag & drop va-hub-settings.json here</p>
                <p className="mt-1 text-xs text-gray-500">Only .json files are supported. Unknown keys are preserved. File includes metadata.version and metadata.updatedAt.</p>
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImport}
                  data-test="settings-import-input"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              
              {importError && (
                <div className="mt-4 text-sm text-red-400">
                  {importError}
                </div>
              )}
              
              {importPreview && (
                <div className="mt-4 p-3 rounded bg-gray-900 border border-gray-700 text-left" data-test="settings-import-preview">
                  <p className="text-sm text-gray-300">
                    Version: <span className="font-mono">{importPreview?.metadata?.version}</span> •
                    Updated At: <span className="font-mono">{importPreview?.metadata?.updatedAt}</span>
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    Keys to change (approx): <span className="font-semibold">{importPreview.__diffCount ?? 0}</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <label className="text-sm text-gray-300 flex items-center">
                      <input
                        type="checkbox"
                        checked={importMerge}
                        onChange={(e) => setImportMerge(e.target.checked)}
                        data-test="settings-import-merge-toggle"
                        className="mr-2"
                      />
                      Merge (objects recursively; arrays replaced wholesale). When unchecked, overwrite existing keys and preserve missing ones.
                    </label>
                    <button
                      onClick={applyImport}
                      data-test="settings-import-apply-button"
                      className="ml-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Invitation Modal */}
      {inviteModalVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setInviteModalVisible(false)}></div>
            <div className="relative bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">{t('settings.admin.sendInvitationModal')}</h3>
                <button
                  onClick={() => setInviteModalVisible(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.admin.emailAddress')}</label>
                  <input
                    type="email"
                    value={inviteFormData.email}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                    placeholder={t('settings.admin.emailPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('settings.admin.personalMessage')}</label>
                  <textarea
                    value={inviteFormData.message}
                    onChange={(e) => setInviteFormData({ ...inviteFormData, message: e.target.value })}
                    rows={3}
                    placeholder={t('settings.admin.messagePlaceholder')}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setInviteModalVisible(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSendInvitation}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                  {t('settings.admin.sendInvitation')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;