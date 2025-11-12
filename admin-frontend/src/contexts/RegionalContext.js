import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';
import { changeLanguage } from '../i18n';

const RegionalContext = createContext();

export const useRegional = () => {
  const context = useContext(RegionalContext);
  if (!context) {
    throw new Error('useRegional must be used within a RegionalProvider');
  }
  return context;
};

export const RegionalProvider = ({ children }) => {
  const [regionalSettings, setRegionalSettings] = useState(() => {
    // Try to load from localStorage first
    const stored = localStorage.getItem('regional_settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored regional settings:', e);
      }
    }
    
    // Default settings
    return {
      language: 'en',
      timezone: 'Asia/Manila',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      firstDayOfWeek: 'sunday',
      autoDetectTimezone: false,
      useSystemLocale: false
    };
  });
  const [loading, setLoading] = useState(true);

  // Load regional settings from backend (admin profile)
  const loadSettings = useCallback(async () => {
    try {
      const response = await api.get('/admin/profile');
      if (response.data?.data) {
        const user = response.data.data;
        // Extract regional settings from user preferences
        const loadedSettings = {
          language: user.language || 'en',
          timezone: user.timezone || 'Asia/Manila',
          dateFormat: user.dateFormat || 'MM/DD/YYYY',
          timeFormat: user.timeFormat || '12h',
          firstDayOfWeek: user.firstDayOfWeek || 'sunday',
          autoDetectTimezone: user.autoDetectTimezone || false,
          useSystemLocale: user.useSystemLocale || false
        };
        
        setRegionalSettings(loadedSettings);
        // Store in localStorage for quick access
        localStorage.setItem('regional_settings', JSON.stringify(loadedSettings));
        
        // Update i18n language
        if (loadedSettings.language) {
          changeLanguage(loadedSettings.language);
        }
      }
    } catch (error) {
      console.error('Failed to load regional settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update settings (called by Settings page)
  const updateSettings = useCallback((newSettings) => {
    setRegionalSettings(newSettings);
    // Store in localStorage immediately
    localStorage.setItem('regional_settings', JSON.stringify(newSettings));
    
    // Update i18n language if changed
    if (newSettings.language) {
      changeLanguage(newSettings.language);
    }
  }, []);

  // Save regional settings to backend (called after updateSettings)
  const saveSettings = useCallback(async (newSettings) => {
    try {
      // Save to backend via admin profile endpoint
      const response = await api.put('/admin/profile', {
        language: newSettings.language,
        timezone: newSettings.timezone,
        dateFormat: newSettings.dateFormat,
        timeFormat: newSettings.timeFormat,
        firstDayOfWeek: newSettings.firstDayOfWeek,
        autoDetectTimezone: newSettings.autoDetectTimezone,
        useSystemLocale: newSettings.useSystemLocale
      });
      
      if (response.data?.user) {
        // Update with the saved settings from backend
        const user = response.data.user;
        const savedSettings = {
          language: user.preferences?.display?.language || user.language || newSettings.language,
          timezone: user.preferences?.display?.timezone || user.location?.timezone || newSettings.timezone,
          dateFormat: user.preferences?.display?.dateFormat || newSettings.dateFormat,
          timeFormat: user.preferences?.display?.timeFormat || newSettings.timeFormat,
          firstDayOfWeek: user.preferences?.display?.firstDayOfWeek || newSettings.firstDayOfWeek,
          autoDetectTimezone: user.preferences?.display?.autoDetectTimezone || newSettings.autoDetectTimezone,
          useSystemLocale: user.preferences?.display?.useSystemLocale || newSettings.useSystemLocale
        };
        
        setRegionalSettings(savedSettings);
        localStorage.setItem('regionalSettings', JSON.stringify(savedSettings));
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to save regional settings:', error);
      throw error;
    }
  }, []);

  // Format date based on regional settings
  const formatDate = useCallback((date, options = {}) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const { dateFormat, timezone, language } = regionalSettings;
    
    try {
      const formatOptions = {
        timeZone: timezone === 'auto' ? undefined : timezone,
        ...options
      };

      if (dateFormat === 'MM/DD/YYYY') {
        formatOptions.month = '2-digit';
        formatOptions.day = '2-digit';
        formatOptions.year = 'numeric';
      } else if (dateFormat === 'DD/MM/YYYY') {
        formatOptions.day = '2-digit';
        formatOptions.month = '2-digit';
        formatOptions.year = 'numeric';
      } else if (dateFormat === 'YYYY-MM-DD') {
        formatOptions.year = 'numeric';
        formatOptions.month = '2-digit';
        formatOptions.day = '2-digit';
      } else if (dateFormat === 'MMM DD, YYYY') {
        formatOptions.month = 'short';
        formatOptions.day = 'numeric';
        formatOptions.year = 'numeric';
      } else if (dateFormat === 'DD MMM YYYY') {
        formatOptions.day = 'numeric';
        formatOptions.month = 'short';
        formatOptions.year = 'numeric';
      }

      return dateObj.toLocaleDateString(language || 'en', formatOptions);
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateObj.toLocaleDateString();
    }
  }, [regionalSettings]);

  // Format time based on regional settings
  const formatTime = useCallback((date, options = {}) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const { timeFormat, timezone, language } = regionalSettings;
    
    try {
      const formatOptions = {
        timeZone: timezone === 'auto' ? undefined : timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: timeFormat !== '24h',
        ...options
      };

      return dateObj.toLocaleTimeString(language || 'en', formatOptions);
    } catch (error) {
      console.error('Time formatting error:', error);
      return dateObj.toLocaleTimeString();
    }
  }, [regionalSettings]);

  // Format date and time together
  const formatDateTime = useCallback((date, options = {}) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const { timeFormat, dateFormat, timezone, language } = regionalSettings;
    
    try {
      const formatOptions = {
        timeZone: timezone === 'auto' ? undefined : timezone,
        hour12: timeFormat !== '24h',
        hour: 'numeric',
        minute: '2-digit',
        ...options
      };

      // Add date format options
      if (dateFormat === 'MM/DD/YYYY') {
        formatOptions.month = '2-digit';
        formatOptions.day = '2-digit';
        formatOptions.year = 'numeric';
      } else if (dateFormat === 'DD/MM/YYYY') {
        formatOptions.day = '2-digit';
        formatOptions.month = '2-digit';
        formatOptions.year = 'numeric';
      } else if (dateFormat === 'YYYY-MM-DD') {
        formatOptions.year = 'numeric';
        formatOptions.month = '2-digit';
        formatOptions.day = '2-digit';
      } else if (dateFormat === 'MMM DD, YYYY') {
        formatOptions.month = 'short';
        formatOptions.day = 'numeric';
        formatOptions.year = 'numeric';
      } else if (dateFormat === 'DD MMM YYYY') {
        formatOptions.day = 'numeric';
        formatOptions.month = 'short';
        formatOptions.year = 'numeric';
      }

      return dateObj.toLocaleString(language || 'en', formatOptions);
    } catch (error) {
      console.error('DateTime formatting error:', error);
      return dateObj.toLocaleString();
    }
  }, [regionalSettings]);

  // Get relative time (e.g., "2 hours ago")
  const getRelativeTime = useCallback((date) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    const language = regionalSettings.language || 'en';
    
    try {
      const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
      
      if (diffDays > 7) {
        return formatDate(dateObj);
      } else if (diffDays > 0) {
        return rtf.format(-diffDays, 'day');
      } else if (diffHours > 0) {
        return rtf.format(-diffHours, 'hour');
      } else if (diffMinutes > 0) {
        return rtf.format(-diffMinutes, 'minute');
      } else {
        return rtf.format(-diffSeconds, 'second');
      }
    } catch (error) {
      // Fallback for browsers that don't support RelativeTimeFormat
      if (diffDays > 7) {
        return formatDate(dateObj);
      } else if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    }
  }, [regionalSettings, formatDate]);

  // Auto-detect timezone on mount
  useEffect(() => {
    if (regionalSettings.autoDetectTimezone) {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setRegionalSettings(prev => ({
        ...prev,
        timezone: userTimezone
      }));
      // Update localStorage
      localStorage.setItem('regionalSettings', JSON.stringify({
        ...regionalSettings,
        timezone: userTimezone
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionalSettings.autoDetectTimezone]); // Only depend on autoDetectTimezone to avoid infinite loop

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'regionalSettings' && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setRegionalSettings(newSettings);
        } catch (error) {
          console.error('Failed to parse storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    regionalSettings,
    setRegionalSettings,
    updateSettings,
    saveSettings,
    formatDate,
    formatTime,
    formatDateTime,
    getRelativeTime,
    loading
  };

  return (
    <RegionalContext.Provider value={value}>
      {children}
    </RegionalContext.Provider>
  );
};

export default RegionalContext;