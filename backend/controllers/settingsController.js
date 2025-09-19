const SiteConfig = require('../models/SiteConfig');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Comprehensive default settings structure
const DEFAULT_SETTINGS = {
  notifications: {
    email: {
      enabled: true,
      criticalAlerts: true,
      userActivity: false,
      systemUpdates: true,
      digestFrequency: 'weekly',
      digestDay: 'monday',
      transactional: true,
      support: true
    },
    inApp: {
      enabled: true,
      allUpdates: true,
      soundEnabled: false,
      desktopNotifications: false
    },
    slack: {
      enabled: false,
      webhookUrl: '',
      channels: {
        alerts: '',
        general: ''
      }
    }
  },
  security: {
    twoFactorAuth: {
      enabled: false,
      required: false,
      methods: ['authenticator', 'sms']
    },
    sessionTimeout: 30, // minutes
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expirationDays: 90
    },
    loginAttempts: {
      maxAttempts: 5,
      lockoutDuration: 30 // minutes
    },
    ipWhitelist: {
      enabled: false,
      addresses: []
    }
  },
  display: {
    theme: 'auto', // 'light', 'dark', 'auto'
    timezone: 'auto', // 'auto' or specific timezone
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    firstDayOfWeek: 'sunday',
    compactMode: false,
    animations: true
  },
  dataManagement: {
    backup: {
      enabled: true,
      schedule: 'daily',
      time: '02:00',
      retention: 30, // days
      destination: 'local'
    },
    logs: {
      retention: 90, // days
      level: 'info',
      includeUserActivity: true,
      includeSystemEvents: true
    },
    export: {
      defaultFormat: 'csv',
      includeHeaders: true,
      compression: false
    },
    archiving: {
      enabled: true,
      inactiveUsersDays: 365,
      deletedItemsRetention: 30
    }
  },
  userManagement: {
    registration: {
      requireEmailVerification: true,
      autoApprove: false,
      defaultRole: 'viewer',
      allowUpgradeRequests: true
    },
    activity: {
      trackLogins: true,
      trackActions: true,
      sessionRecording: false
    },
    permissions: {
      allowRoleChanges: true,
      requireApprovalForAdmin: true,
      allowSelfServicePasswordReset: true
    }
  },
  apiSettings: {
    rateLimit: {
      standard: 1000, // requests per hour
      authenticated: 5000,
      admin: 10000
    },
    webhook: {
      retryAttempts: 3,
      retryDelay: 5000, // ms
      timeout: 30000 // ms
    },
    cors: {
      enabled: true,
      origins: ['http://localhost:3000', 'http://localhost:4000']
    }
  },
  performance: {
    cache: {
      enabled: true,
      duration: 86400, // seconds (24 hours)
      strategy: 'memory',
      maxSize: '100MB'
    },
    pagination: {
      defaultLimit: 25,
      maxLimit: 100,
      showOptions: [10, 25, 50, 100]
    },
    autoSave: {
      enabled: true,
      interval: 60, // seconds
      showNotification: true
    },
    lazyLoading: {
      enabled: true,
      threshold: 0.1
    }
  },
  integrations: {
    calendar: {
      enabled: false,
      provider: 'google',
      syncInterval: 30 // minutes
    },
    storage: {
      provider: 'local',
      maxFileSize: '10MB',
      allowedTypes: ['image/*', 'application/pdf', 'text/*']
    },
    analytics: {
      enabled: true,
      provider: 'internal',
      trackingId: ''
    }
  },
  dashboard: {
    widgets: {
      userActivity: true,
      systemHealth: true,
      recentTasks: true,
      notifications: true,
      analytics: true,
      quickActions: true
    },
    refreshInterval: 300, // seconds (5 minutes)
    layout: 'grid', // 'grid' or 'list'
    density: 'comfortable' // 'compact', 'comfortable', 'spacious'
  },
  communication: {
    emailTemplates: {
      useCustom: false,
      brandingEnabled: true
    },
    sms: {
      enabled: false,
      provider: '',
      defaultCountryCode: '+1'
    },
    pushNotifications: {
      enabled: false,
      vapidKey: ''
    }
  }
};

// Get all settings with defaults
exports.getSettings = async (req, res) => {
  console.log('=== GET SETTINGS REQUEST ===');
  console.log('User:', req.user ? { id: req.user._id, email: req.user.email, admin: req.user.admin } : 'No user');
  
  try {
    // Use lean() for better performance
    const configs = await SiteConfig.find({}).lean();
    console.log('Settings found in database:', configs.length);
    
    if (configs.length > 0) {
      console.log('First 5 settings from DB:', configs.slice(0, 5).map(c => ({ key: c.key, value: c.value })));
    }
    
    // Create a map for faster lookup
    const configMap = new Map(configs.map(c => [c.key, c.value]));
    
    // Build settings object with stored values or defaults
    const settings = {};
    
    // Efficiently merge stored configs with defaults
    Object.keys(DEFAULT_SETTINGS).forEach(category => {
      settings[category] = {};
      Object.keys(DEFAULT_SETTINGS[category]).forEach(key => {
        const configKey = `${category}.${key}`;
        if (configMap.has(configKey)) {
          settings[category][key] = configMap.get(configKey);
        } else if (typeof DEFAULT_SETTINGS[category][key] === 'object' && !Array.isArray(DEFAULT_SETTINGS[category][key])) {
          // Handle nested objects
          settings[category][key] = {};
          Object.keys(DEFAULT_SETTINGS[category][key]).forEach(subKey => {
            const subConfigKey = `${category}.${key}.${subKey}`;
            settings[category][key][subKey] = configMap.has(subConfigKey)
              ? configMap.get(subConfigKey)
              : DEFAULT_SETTINGS[category][key][subKey];
          });
        } else {
          settings[category][key] = DEFAULT_SETTINGS[category][key];
        }
      });
    });

    console.log('Settings object built, categories:', Object.keys(settings));
    console.log('Sample setting value - notifications.email.enabled:', settings.notifications?.email?.enabled);

    res.json({
      success: true,
      settings,
      defaults: DEFAULT_SETTINGS,
      dbCount: configs.length
    });
  } catch (error) {
    console.error('Error fetching settings - Full error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  console.log('=== UPDATE SETTINGS REQUEST ===');
  console.log('User:', req.user ? { id: req.user._id, email: req.user.email, admin: req.user.admin } : 'No user');
  console.log('Body received:', JSON.stringify(req.body, null, 2));
  
  try {
    const { settings } = req.body;
    
    if (!settings) {
      console.error('No settings object in request body');
      return res.status(400).json({
        success: false,
        message: 'No settings provided in request body'
      });
    }
    
    const updates = [];

    // Flatten nested settings for storage
    const flattenSettings = (obj, prefix = '') => {
      const flattened = [];
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          flattened.push(...flattenSettings(value, newKey));
        } else {
          flattened.push({ key: newKey, value });
        }
      });
      return flattened;
    };

    const flatSettings = flattenSettings(settings);
    console.log('Flattened settings count:', flatSettings.length);
    console.log('First 5 flattened settings:', flatSettings.slice(0, 5));
    
    // Map settings keys to valid SiteConfig categories
    const getCategoryForKey = (key) => {
      const categoryMap = {
        'notifications': 'features',
        'security': 'security',
        'display': 'appearance',
        'dataManagement': 'general',
        'userManagement': 'features',
        'apiSettings': 'integrations',
        'performance': 'general',
        'integrations': 'integrations',
        'dashboard': 'appearance',
        'communication': 'email'
      };
      
      const topLevelKey = key.split('.')[0];
      return categoryMap[topLevelKey] || 'general';
    };
    
    // Helper to determine value type
    const getValueType = (value) => {
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'number') return 'number';
      if (Array.isArray(value)) return 'array';
      if (typeof value === 'string') {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
        if (/^https?:\/\/.+/.test(value)) return 'url';
        if (value.length > 100) return 'textarea';
        return 'text';
      }
      if (typeof value === 'object' && value !== null) return 'json';
      return 'string';
    };
    
    // Use bulkWrite for better performance
    const bulkOps = flatSettings.map(({ key, value }) => ({
      updateOne: {
        filter: { key },
        update: {
          $set: {
            value,
            category: getCategoryForKey(key),
            valueType: getValueType(value),
            updatedAt: new Date(),
            updatedBy: req.user?._id || 'system'
          }
        },
        upsert: true
      }
    }));

    console.log('Bulk operations to perform:', bulkOps.length);
    
    let result = null;
    if (bulkOps.length > 0) {
      result = await SiteConfig.bulkWrite(bulkOps);
      console.log('BulkWrite result:', {
        acknowledged: result.acknowledged,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
        matchedCount: result.matchedCount,
        insertedCount: result.insertedCount
      });
    }

    // Verify settings were actually saved
    const verificationCount = await SiteConfig.countDocuments();
    console.log('Total settings in database after update:', verificationCount);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      updatedCount: bulkOps.length,
      dbResult: result ? {
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        matched: result.matchedCount
      } : null,
      totalSettingsInDb: verificationCount
    });
  } catch (error) {
    console.error('Error updating settings - Full error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

// Reset settings to defaults
exports.resetSettings = async (req, res) => {
  try {
    const { category } = req.body;
    
    if (category && DEFAULT_SETTINGS[category]) {
      // Reset specific category
      await SiteConfig.deleteMany({ 
        key: { $regex: `^${category}\\.` }
      });
      
      res.json({
        success: true,
        message: `${category} settings reset to defaults`,
        defaults: DEFAULT_SETTINGS[category]
      });
    } else {
      // Reset all settings
      await SiteConfig.deleteMany({});
      
      res.json({
        success: true,
        message: 'All settings reset to defaults',
        defaults: DEFAULT_SETTINGS
      });
    }
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
};

// Schema validation for imported settings
const validateSettingsSchema = (data) => {
  const errors = [];
  
  // Check required fields
  if (!data.version) errors.push('Missing version field');
  if (!data.settings || !Array.isArray(data.settings)) errors.push('Invalid or missing settings array');
  
  // Validate each setting
  if (data.settings && Array.isArray(data.settings)) {
    data.settings.forEach((setting, index) => {
      if (!setting.key) errors.push(`Setting at index ${index} missing key`);
      if (setting.value === undefined) errors.push(`Setting at index ${index} missing value`);
      
      // Validate category if present
      if (setting.category) {
        const validCategories = Object.keys(DEFAULT_SETTINGS);
        if (!validCategories.includes(setting.category)) {
          errors.push(`Invalid category "${setting.category}" at index ${index}`);
        }
      }
    });
  }
  
  return errors;
};

// Create backup before import
const createBackup = async (userId) => {
  const configs = await SiteConfig.find({}).lean();
  const backup = {
    timestamp: new Date(),
    userId,
    settings: configs,
    version: '1.0'
  };
  
  // Store backup (you could save to a separate collection or file)
  // For now, we'll return it to be stored temporarily
  return backup;
};

// Calculate checksum for data integrity
const calculateChecksum = (data) => {
  const jsonString = JSON.stringify(data, null, 0);
  return crypto.createHash('md5').update(jsonString).digest('hex');
};

// Enhanced export with metadata
exports.exportSettings = async (req, res) => {
  try {
    const configs = await SiteConfig.find({}).lean();
    const timestamp = new Date().toISOString();
    
    // Prepare export data
    const exportData = {
      version: '2.0',
      timestamp,
      exportedBy: req.user._id,
      settings: configs,
      metadata: {
        totalSettings: configs.length,
        categories: [...new Set(configs.map(c => c.key.split('.')[0]))],
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    // Add checksum for integrity verification
    exportData.checksum = calculateChecksum(exportData.settings);
    
    // Set headers for file download
    const filename = `settings-backup-${timestamp.replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export settings',
      error: error.message
    });
  }
};

// Enhanced import with validation and transactions
exports.importSettings = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const importData = req.body;
    
    // File size check (assuming middleware sets req.body size)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (JSON.stringify(importData).length > maxSize) {
      throw new Error('Import file exceeds maximum size limit (10MB)');
    }
    
    // Schema validation
    const validationErrors = validateSettingsSchema(importData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    const { settings, checksum, version } = importData;
    
    // Verify checksum if provided
    if (checksum) {
      const calculatedChecksum = calculateChecksum(settings);
      if (calculatedChecksum !== checksum) {
        throw new Error('Checksum verification failed - data may be corrupted');
      }
    }
    
    // Create backup before import
    const backup = await createBackup(req.user._id);
    
    // Track import results
    const results = {
      imported: [],
      updated: [],
      skipped: [],
      errors: []
    };
    
    // Process each setting
    for (const setting of settings) {
      try {
        // Check if setting exists
        const existing = await SiteConfig.findOne({ key: setting.key }).session(session);
        
        // Map settings keys to valid SiteConfig categories
        const getCategoryForKey = (key) => {
          const categoryMap = {
            'notifications': 'features',
            'security': 'security',
            'display': 'appearance',
            'dataManagement': 'general',
            'userManagement': 'features',
            'apiSettings': 'integrations',
            'performance': 'general',
            'integrations': 'integrations',
            'dashboard': 'appearance',
            'communication': 'email'
          };
          
          const topLevelKey = key.split('.')[0];
          return categoryMap[topLevelKey] || 'general';
        };
        
        if (existing) {
          // Update existing setting
          await SiteConfig.updateOne(
            { key: setting.key },
            {
              $set: {
                value: setting.value,
                category: setting.category || getCategoryForKey(setting.key),
                description: setting.description || existing.description,
                updatedAt: new Date(),
                updatedBy: req.user._id
              }
            }
          ).session(session);
          
          results.updated.push(setting.key);
        } else {
          // Create new setting
          await SiteConfig.create([{
            key: setting.key,
            value: setting.value,
            category: setting.category || getCategoryForKey(setting.key),
            description: setting.description || '',
            createdBy: req.user._id,
            updatedBy: req.user._id
          }], { session });
          
          results.imported.push(setting.key);
        }
      } catch (error) {
        results.errors.push({
          key: setting.key,
          error: error.message
        });
      }
    }
    
    // Commit transaction
    await session.commitTransaction();
    
    // Log import event
    console.log('Settings import completed:', {
      userId: req.user._id,
      timestamp: new Date(),
      results: {
        imported: results.imported.length,
        updated: results.updated.length,
        errors: results.errors.length
      }
    });
    
    res.json({
      success: true,
      message: 'Import completed',
      results,
      backup: {
        created: true,
        timestamp: backup.timestamp
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    
    console.error('Error importing settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import settings',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Restore from backup
exports.restoreFromBackup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { backup } = req.body;
    
    if (!backup || !backup.settings) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup data'
      });
    }
    
    // Clear current settings
    await SiteConfig.deleteMany({}).session(session);
    
    // Restore settings from backup
    const bulkOps = backup.settings.map(setting => ({
      insertOne: {
        document: {
          ...setting,
          restoredAt: new Date(),
          restoredBy: req.user._id
        }
      }
    }));
    
    if (bulkOps.length > 0) {
      await SiteConfig.bulkWrite(bulkOps, { session });
    }
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: `Restored ${backup.settings.length} settings from backup`,
      timestamp: backup.timestamp
    });
  } catch (error) {
    await session.abortTransaction();
    
    console.error('Error restoring from backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore from backup',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Get import/export history
exports.getSettingsHistory = async (req, res) => {
  try {
    // This would typically query a separate audit log collection
    // For now, return mock data structure
    const history = {
      exports: [],
      imports: [],
      backups: []
    };
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching settings history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings history',
      error: error.message
    });
  }
};

// Get specific setting category
exports.getSettingCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!DEFAULT_SETTINGS[category]) {
      return res.status(404).json({
        success: false,
        message: 'Setting category not found'
      });
    }
    
    const configs = await SiteConfig.find({
      key: { $regex: `^${category}\\.` }
    }).lean();
    
    const configMap = new Map(configs.map(c => [c.key, c.value]));
    const categorySettings = {};
    
    // Build category settings with defaults
    Object.keys(DEFAULT_SETTINGS[category]).forEach(key => {
      const configKey = `${category}.${key}`;
      categorySettings[key] = configMap.has(configKey) 
        ? configMap.get(configKey)
        : DEFAULT_SETTINGS[category][key];
    });
    
    res.json({
      success: true,
      category,
      settings: categorySettings,
      defaults: DEFAULT_SETTINGS[category]
    });
  } catch (error) {
    console.error('Error fetching category settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category settings',
      error: error.message
    });
  }
};
