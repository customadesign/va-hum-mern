const SiteConfig = require('../models/SiteConfig');

// Helper functions
const detectValueType = (value) => {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (value.includes('@')) return 'email';
    if (value.startsWith('http://') || value.startsWith('https://')) return 'url';
    if (value.length > 100) return 'textarea';
    return 'text';
  }
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'json';
  return 'string';
};

const detectCategory = (key) => {
  if (key.includes('email') || key.includes('smtp') || key.includes('mail')) return 'email';
  if (key.includes('password') || key.includes('security') || key.includes('2fa') || key.includes('auth')) return 'security';
  if (key.includes('limit') || key.includes('max') || key.includes('rate')) return 'limits';
  if (key.includes('enable') || key.includes('_enabled') || key.includes('feature')) return 'features';
  return 'general';
};

const generateDescription = (key) => {
  // Convert snake_case to human readable
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Va\b/g, 'VA')
    .replace(/Smtp/g, 'SMTP')
    .replace(/2fa/gi, '2FA')
    .replace(/Url/g, 'URL');
};

// @desc    Get all site configurations
// @route   GET /api/admin/config
// @access  Private/Admin
exports.getConfigs = async (req, res) => {
  try {
    // Initialize default configs if none exist
    const configCount = await SiteConfig.countDocuments();
    if (configCount === 0) {
      const initializeConfig = require('../scripts/initializeConfig');
      await initializeConfig(true); // Run in silent mode
    }

    const configs = await SiteConfig.find({ isEditable: true });
    
    const configMap = {};
    for (const config of configs) {
      configMap[config.key] = {
        value: await SiteConfig.getValue(config.key),
        category: config.category,
        description: config.description,
        valueType: config.valueType,
        isPublic: config.isPublic,
        isEditable: config.isEditable
      };
    }

    // If no configs found, return default structure
    if (Object.keys(configMap).length === 0) {
      // Return a minimal default configuration
      configMap['site_name'] = {
        value: 'Linkage VA Hub',
        category: 'general',
        description: 'The name of your platform',
        valueType: 'text',
        isPublic: true,
        isEditable: true
      };
      configMap['registration_enabled'] = {
        value: true,
        category: 'features',
        description: 'Enable new user registration',
        valueType: 'boolean',
        isPublic: true,
        isEditable: true
      };
      configMap['max_vas_per_page'] = {
        value: 20,
        category: 'limits',
        description: 'Maximum number of VAs to display per page',
        valueType: 'number',
        isPublic: false,
        isEditable: true
      };
    }

    res.json({
      success: true,
      data: configMap
    });
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({
      success: false,
      error: 'Server error fetching configuration'
    });
  }
};

// @desc    Update site configurations
// @route   PUT /api/admin/config
// @access  Private/Admin
exports.updateConfigs = async (req, res) => {
  try {
    const { configs } = req.body;

    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data'
      });
    }

    const updates = [];
    const errors = [];

    for (const [key, value] of Object.entries(configs)) {
      try {
        // Find existing config to get its metadata
        const existingConfig = await SiteConfig.findOne({ key });
        
        if (existingConfig) {
          // Update existing config
          existingConfig.value = value;
          await existingConfig.save();
          updates.push(key);
        } else {
          // Create new config with default metadata
          await SiteConfig.create({
            key,
            value,
            valueType: detectValueType(value),
            category: detectCategory(key),
            description: generateDescription(key),
            isPublic: false,
            isEditable: true
          });
          updates.push(key);
        }
      } catch (configError) {
        console.error(`Error updating config ${key}:`, configError);
        errors.push({ key, error: configError.message });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some configurations could not be updated',
        errors,
        updated: updates
      });
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      updated: updates
    });
  } catch (err) {
    console.error('Error updating config:', err);
    res.status(500).json({
      success: false,
      error: 'Server error updating configuration'
    });
  }
};

// @desc    Get public configurations (for frontend)
// @route   GET /api/config/public
// @access  Public
exports.getPublicConfigs = async (req, res) => {
  try {
    const configs = await SiteConfig.getPublicConfigs();
    
    res.json({
      success: true,
      data: configs
    });
  } catch (err) {
    console.error('Error fetching public config:', err);
    res.status(500).json({
      success: false,
      error: 'Server error fetching public configuration'
    });
  }
};

// @desc    Get configurations by category
// @route   GET /api/admin/config/:category
// @access  Private/Admin
exports.getConfigsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['general', 'email', 'security', 'features', 'limits', 'payment', 'appearance', 'integrations'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category'
      });
    }
    
    const configs = await SiteConfig.getByCategory(category);
    
    res.json({
      success: true,
      data: configs
    });
  } catch (err) {
    console.error('Error fetching config by category:', err);
    res.status(500).json({
      success: false,
      error: 'Server error fetching configuration by category'
    });
  }
};

// @desc    Reset configuration to defaults
// @route   POST /api/admin/config/reset
// @access  Private/Admin
exports.resetConfigs = async (req, res) => {
  try {
    const { keys } = req.body; // Optional: specific keys to reset
    
    if (keys && Array.isArray(keys)) {
      // Reset specific configs
      for (const key of keys) {
        await SiteConfig.deleteOne({ key });
      }
    } else {
      // Reset all configs (dangerous!)
      if (!req.body.confirmReset) {
        return res.status(400).json({
          success: false,
          error: 'Please confirm reset by setting confirmReset: true'
        });
      }
      await SiteConfig.deleteMany({});
    }
    
    // Re-initialize defaults
    const initializeConfig = require('../scripts/initializeConfig');
    const result = await initializeConfig(true);
    
    res.json({
      success: true,
      message: 'Configuration reset to defaults',
      ...result
    });
  } catch (err) {
    console.error('Error resetting config:', err);
    res.status(500).json({
      success: false,
      error: 'Server error resetting configuration'
    });
  }
};