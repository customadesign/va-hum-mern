import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';

/**
 * Example component demonstrating how to use the SettingsContext
 * This shows various ways to access and utilize settings throughout the application
 */
const SettingsUsageExample = () => {
  const { 
    settings, 
    formatDate, 
    formatTime, 
    formatCurrency, 
    formatNumber,
    getLanguageDirection 
  } = useSettings();

  // Example data
  const sampleDate = new Date();
  const sampleAmount = 1234.56;
  const sampleNumber = 1234567.89;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Settings Usage Examples
      </h2>

      {/* Display Settings Examples */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Display Settings
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Theme: <span className="font-medium">{settings.display?.theme || 'light'}</span></p>
          <p>Font Size: <span className="font-medium">{settings.display?.fontSize || 'medium'}</span></p>
          <p>Language: <span className="font-medium">{settings.display?.language || 'en'}</span></p>
          <p>Compact Mode: <span className="font-medium">{settings.display?.compactMode ? 'Enabled' : 'Disabled'}</span></p>
          <p>Show Animations: <span className="font-medium">{settings.display?.showAnimations ? 'Yes' : 'No'}</span></p>
        </div>
      </div>

      {/* Date/Time Formatting Examples */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Date/Time Formatting
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Current Date: <span className="font-medium">{formatDate(sampleDate)}</span></p>
          <p>Current Time: <span className="font-medium">{formatTime(sampleDate)}</span></p>
          <p>Date Format: <span className="font-medium">{settings.display?.dateFormat || 'MM/DD/YYYY'}</span></p>
          <p>Time Format: <span className="font-medium">{settings.display?.timeFormat || '12h'}</span></p>
          <p>Timezone: <span className="font-medium">{settings.display?.timezone || 'UTC'}</span></p>
        </div>
      </div>

      {/* Number Formatting Examples */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Number Formatting
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Currency: <span className="font-medium">{formatCurrency(sampleAmount)}</span></p>
          <p>Number: <span className="font-medium">{formatNumber(sampleNumber)}</span></p>
          <p>Currency Setting: <span className="font-medium">{settings.display?.currency || 'USD'}</span></p>
          <p>Number Format: <span className="font-medium">{settings.display?.numberFormat || 'comma'}</span></p>
        </div>
      </div>

      {/* Notification Settings Examples */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Notification Settings
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Desktop Notifications: <span className="font-medium">{settings.notifications?.desktop ? 'Enabled' : 'Disabled'}</span></p>
          <p>Email Notifications: <span className="font-medium">{settings.notifications?.email ? 'Enabled' : 'Disabled'}</span></p>
          <p>Sound Alerts: <span className="font-medium">{settings.notifications?.sound ? 'Enabled' : 'Disabled'}</span></p>
          <p>Notification Position: <span className="font-medium">{settings.notifications?.position || 'top-right'}</span></p>
        </div>
      </div>

      {/* Performance Settings Examples */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Performance Settings
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Auto-refresh: <span className="font-medium">{settings.performance?.autoRefresh ? 'Enabled' : 'Disabled'}</span></p>
          <p>Refresh Interval: <span className="font-medium">{settings.performance?.refreshInterval || 30} seconds</span></p>
          <p>Lazy Loading: <span className="font-medium">{settings.performance?.lazyLoad ? 'Enabled' : 'Disabled'}</span></p>
          <p>Cache Duration: <span className="font-medium">{settings.performance?.cacheDuration || 300} seconds</span></p>
        </div>
      </div>

      {/* Language Direction Example */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Language Direction
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Current Direction: <span className="font-medium">{getLanguageDirection()}</span></p>
          {getLanguageDirection() === 'rtl' && (
            <p className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
              RTL mode is active - UI elements will be mirrored
            </p>
          )}
        </div>
      </div>

      {/* Code Example */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          How to Use in Your Components
        </h3>
        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`import { useSettings } from '../../contexts/SettingsContext';

const MyComponent = () => {
  const { 
    settings,         // Access all settings
    formatDate,       // Format dates according to user preference
    formatTime,       // Format times according to user preference
    formatCurrency,   // Format currency values
    formatNumber      // Format numbers with separators
  } = useSettings();

  // Use settings in your component
  const dateStr = formatDate(new Date());
  const amount = formatCurrency(99.99);
  
  // Check specific settings
  if (settings.display?.theme === 'dark') {
    // Apply dark theme specific logic
  }
  
  // Check for compact mode
  const spacing = settings.display?.compactMode ? 'p-2' : 'p-4';
  
  return <div className={spacing}>...</div>;
};`}
        </pre>
      </div>
    </div>
  );
};

export default SettingsUsageExample;