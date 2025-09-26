import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// Create the Settings Context
const SettingsContext = createContext();

// Custom hook to use settings
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Settings Provider Component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cache settings in localStorage for persistence
  const SETTINGS_CACHE_KEY = 'app_settings_cache';
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  // Load settings from API or cache
  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setSettings(data);
            setLoading(false);
            return data;
          }
        }
      }

      // Fetch from API
      const response = await api.get('/admin/settings');
      const fetchedSettings = response.data.settings || {};
      
      // Cache the settings
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
        data: fetchedSettings,
        timestamp: Date.now()
      }));
      
      setSettings(fetchedSettings);
      return fetchedSettings;
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err.message);
      
      // Try to use cached settings on error
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        const { data } = JSON.parse(cached);
        setSettings(data);
        return data;
      }
      
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a specific setting
  const updateSetting = useCallback(async (path, value) => {
    try {
      const keys = path.split('.');
      const newSettings = { ...settings };
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Update local state optimistically
      setSettings(newSettings);
      
      // Update cache
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
        data: newSettings,
        timestamp: Date.now()
      }));
      
      // Sync with server
      await api.put('/admin/settings', { settings: newSettings });
      
      // Broadcast change to other tabs
      localStorage.setItem('settings_updated', JSON.stringify({
        timestamp: Date.now(),
        path,
        value
      }));
      
      return true;
    } catch (err) {
      console.error('Error updating setting:', err);
      // Revert on error
      await loadSettings(true);
      return false;
    }
  }, [settings, loadSettings]);

  // Get a specific setting value
  const getSetting = useCallback((path, defaultValue = null) => {
    const keys = path.split('.');
    let current = settings;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current !== undefined ? current : defaultValue;
  }, [settings]);

  // Apply theme based on settings
  const applyTheme = useCallback(() => {
    const theme = getSetting('display.theme', 'auto');
    
    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [getSetting]);

  // Apply language based on settings
  const applyLanguage = useCallback(() => {
    const language = getSetting('display.language', 'en');
    document.documentElement.lang = language;
    
    // Here you would integrate with i18n library
    // For example: i18n.changeLanguage(language);
  }, [getSetting]);

  // Apply animations based on settings
  const applyAnimations = useCallback(() => {
    const animationsEnabled = getSetting('display.animations', true);
    document.documentElement.classList.toggle('no-animations', !animationsEnabled);
  }, [getSetting]);

  // Apply compact mode based on settings
  const applyCompactMode = useCallback(() => {
    const compactMode = getSetting('display.compactMode', false);
    document.documentElement.classList.toggle('compact-mode', compactMode);
  }, [getSetting]);

  // Apply all display settings
  const applyDisplaySettings = useCallback(() => {
    applyTheme();
    applyLanguage();
    applyAnimations();
    applyCompactMode();
  }, [applyTheme, applyLanguage, applyAnimations, applyCompactMode]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Apply display settings when they change
  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      applyDisplaySettings();
    }
  }, [settings, applyDisplaySettings]);

  // Listen for cross-tab settings updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'settings_updated' && e.newValue) {
        const { timestamp } = JSON.parse(e.newValue);
        // Reload settings if updated in another tab
        if (timestamp) {
          console.log('Settings updated in another tab, syncing...');
          loadSettings(true);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSettings]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (getSetting('display.theme') === 'auto') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [getSetting, applyTheme]);

  // Context value
  const value = {
    settings,
    loading,
    error,
    getSetting,
    updateSetting,
    loadSettings,
    applyDisplaySettings,
    
    // Convenience methods for common settings
    theme: getSetting('display.theme', 'auto'),
    language: getSetting('display.language', 'en'),
    timezone: getSetting('display.timezone', 'auto'),
    dateFormat: getSetting('display.dateFormat', 'MM/DD/YYYY'),
    timeFormat: getSetting('display.timeFormat', '12h'),
    compactMode: getSetting('display.compactMode', false),
    animationsEnabled: getSetting('display.animations', true),
    
    // Notification settings
    emailNotifications: getSetting('notifications.email.enabled', true),
    inAppNotifications: getSetting('notifications.inApp.enabled', true),
    soundEnabled: getSetting('notifications.inApp.soundEnabled', false),
    desktopNotifications: getSetting('notifications.inApp.desktopNotifications', false),
    
    // Security settings
    twoFactorEnabled: getSetting('security.twoFactorAuth.enabled', false),
    sessionTimeout: getSetting('security.sessionTimeout', 30),
    
    // Performance settings
    cacheEnabled: getSetting('performance.cache.enabled', true),
    autoSaveEnabled: getSetting('performance.autoSave.enabled', true),
    autoSaveInterval: getSetting('performance.autoSave.interval', 60),
    lazyLoadingEnabled: getSetting('performance.lazyLoading.enabled', true)
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Utility functions for date/time formatting
export const formatDate = (date, format) => {
  // Simple date formatter - in production, use a library like date-fns or moment
  const d = new Date(date);
  const formats = {
    'MM/DD/YYYY': `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`,
    'DD/MM/YYYY': `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
    'YYYY-MM-DD': `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    'DD.MM.YYYY': `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
  };
  return formats[format] || d.toLocaleDateString();
};

export const formatTime = (date, format) => {
  const d = new Date(date);
  if (format === '24h') {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } else {
    const hours = d.getHours() % 12 || 12;
    const ampm = d.getHours() < 12 ? 'AM' : 'PM';
    return `${hours}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
  }
};

export default SettingsContext;