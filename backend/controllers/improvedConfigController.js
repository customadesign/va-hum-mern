const SiteConfig = require('../models/SiteConfig');

/**
 * Improved configuration controller with better persistence handling
 */
class ImprovedConfigController {
  /**
   * Get all configurations with proper type conversion
   */
  async getConfigs(req, res) {
    try {
      // Initialize default configs if none exist
      const configCount = await SiteConfig.countDocuments();
      if (configCount === 0) {
        await this.initializeDefaultConfigs();
      }

      const configs = await SiteConfig.find({ isEditable: true }).lean();
      const configMap = {};

      for (const config of configs) {
        try {
          configMap[config.key] = {
            value: await SiteConfig.getValue(config.key),
            description: config.description,
            valueType: config.valueType,
            category: config.category,
            isPublic: config.isPublic,
            isEditable: config.isEditable,
            lastModified: config.updatedAt
          };
        } catch (error) {
          console.error(`Error processing config ${config.key}:`, error);
        }
      }

      // Ensure vasPerPage setting exists
      if (!configMap['max_vas_per_page']) {
        const defaultVasPerPage = await SiteConfig.setValue('max_vas_per_page', 20, {
          valueType: 'number',
          category: 'limits',
          description: 'Maximum number of VAs to display per page',
          isPublic: false,
          isEditable: true,
          userId: req.user?._id
        });

        configMap['max_vas_per_page'] = {
          value: 20,
          description: defaultVasPerPage.description,
          valueType: 'number',
          category: 'limits',
          isPublic: false,
          isEditable: true,
          lastModified: defaultVasPerPage.updatedAt
        };
      }

      res.json({
        success: true,
        data: configMap,
        metadata: {
          totalConfigs: Object.keys(configMap).length,
          categories: [...new Set(Object.values(configMap).map(c => c.category))]
        }
      });
    } catch (error) {
      console.error('Error fetching configs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch configurations',
        details: error.message
      });
    }
  }

  /**
   * Update configurations with proper persistence
   */
  async updateConfigs(req, res) {
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

      // Process each configuration update
      for (const [key, value] of Object.entries(configs)) {
        try {
          // Special handling for vasPerPage
          const configKey = key === 'vasPerPage' ? 'max_vas_per_page' : key;

          // Find existing config to preserve metadata
          const existingConfig = await SiteConfig.findOne({ key: configKey });

          if (existingConfig) {
            // Use the improved update method
            await existingConfig.updateValue(value, req.user?._id);
            updates.push({
              key: configKey,
              value: existingConfig.value,
              status: 'updated'
            });
          } else {
            // Create new config with proper type detection
            const newConfig = await SiteConfig.setValue(configKey, value, {
              valueType: SiteConfig.detectValueType(value),
              category: this.determineCategory(configKey),
              description: `Configuration for ${configKey}`,
              isPublic: false,
              isEditable: true,
              userId: req.user?._id
            });

            updates.push({
              key: configKey,
              value: newConfig.value,
              status: 'created'
            });
          }

          // Force a verification read to ensure persistence
          const verifyConfig = await SiteConfig.findOne({ key: configKey });
          console.log(`Verified ${configKey} saved with value:`, verifyConfig.value);

        } catch (configError) {
          console.error(`Error updating config ${key}:`, configError);
          errors.push({
            key,
            error: configError.message
          });
        }
      }

      // Return appropriate response based on results
      if (errors.length > 0 && updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All configurations failed to update',
          errors
        });
      }

      if (errors.length > 0) {
        return res.status(207).json({
          success: false,
          message: 'Some configurations could not be updated',
          data: {
            updated: updates,
            errors
          }
        });
      }

      // Fetch all updated configs for response
      const updatedConfigs = await this.fetchUpdatedConfigs();

      res.json({
        success: true,
        message: 'Configurations updated successfully',
        data: {
          configs: updatedConfigs,
          updated: updates
        }
      });

    } catch (error) {
      console.error('Error updating configs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update configurations',
        details: error.message
      });
    }
  }

  /**
   * Update a single configuration value
   */
  async updateSingleConfig(req, res) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Value is required'
        });
      }

      // Handle special key mappings
      const configKey = key === 'vasPerPage' ? 'max_vas_per_page' : key;

      const config = await SiteConfig.findOne({ key: configKey });

      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Configuration '${key}' not found`
        });
      }

      // Update using the improved method
      await config.updateValue(value, req.user?._id);

      // Verify the update
      const updatedConfig = await SiteConfig.findOne({ key: configKey });
      const parsedValue = await SiteConfig.getValue(configKey);

      res.json({
        success: true,
        message: `Configuration '${key}' updated successfully`,
        data: {
          key: configKey,
          value: parsedValue,
          raw: updatedConfig.value,
          valueType: updatedConfig.valueType,
          lastModified: updatedConfig.updatedAt
        }
      });

    } catch (error) {
      console.error(`Error updating config ${req.params.key}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
        details: error.message
      });
    }
  }

  /**
   * Bulk update configurations with transaction support
   */
  async bulkUpdateConfigs(req, res) {
    try {
      const { configs } = req.body;

      if (!configs || typeof configs !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration data'
        });
      }

      // Use the bulk update method with transaction
      const result = await SiteConfig.bulkUpdate(configs, req.user?._id);

      if (result.errors.length > 0) {
        return res.status(207).json({
          success: false,
          message: 'Some configurations could not be updated',
          data: result
        });
      }

      res.json({
        success: true,
        message: 'All configurations updated successfully',
        data: result
      });

    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform bulk update',
        details: error.message
      });
    }
  }

  /**
   * Reset configurations to defaults
   */
  async resetToDefaults(req, res) {
    try {
      const { category } = req.params;
      const defaultConfigs = require('../scripts/defaultConfigs');

      const resetConfigs = [];
      const errors = [];

      for (const defaultConfig of defaultConfigs) {
        if (!category || defaultConfig.category === category) {
          try {
            await SiteConfig.setValue(
              defaultConfig.key,
              defaultConfig.value,
              {
                ...defaultConfig,
                userId: req.user?._id
              }
            );
            resetConfigs.push(defaultConfig.key);
          } catch (error) {
            errors.push({
              key: defaultConfig.key,
              error: error.message
            });
          }
        }
      }

      const updatedConfigs = category
        ? await SiteConfig.getByCategory(category)
        : await this.fetchUpdatedConfigs();

      res.json({
        success: true,
        message: category
          ? `${category} settings reset to defaults`
          : 'All settings reset to defaults',
        data: {
          configs: updatedConfigs,
          resetCount: resetConfigs.length,
          errors: errors.length > 0 ? errors : undefined
        }
      });

    } catch (error) {
      console.error('Reset to defaults error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset configurations',
        details: error.message
      });
    }
  }

  /**
   * Verify a specific configuration value
   */
  async verifyConfig(req, res) {
    try {
      const { key } = req.params;

      // Handle special key mappings
      const configKey = key === 'vasPerPage' ? 'max_vas_per_page' : key;

      // Direct database read
      const config = await SiteConfig.findOne({ key: configKey }).lean();

      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Configuration '${key}' not found`
        });
      }

      // Get parsed value
      const parsedValue = await SiteConfig.getValue(configKey);

      res.json({
        success: true,
        data: {
          key: configKey,
          rawValue: config.value,
          parsedValue: parsedValue,
          valueType: config.valueType,
          category: config.category,
          lastModified: config.updatedAt,
          version: config.version || 1
        }
      });

    } catch (error) {
      console.error(`Error verifying config ${req.params.key}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify configuration',
        details: error.message
      });
    }
  }

  // Helper methods

  /**
   * Initialize default configurations
   */
  async initializeDefaultConfigs() {
    try {
      const defaultConfigs = require('../scripts/defaultConfigs');

      for (const config of defaultConfigs) {
        await SiteConfig.setValue(config.key, config.value, config);
      }

      console.log('Default configurations initialized');
    } catch (error) {
      console.error('Error initializing default configs:', error);
    }
  }

  /**
   * Fetch all updated configurations organized by category
   */
  async fetchUpdatedConfigs() {
    const configs = await SiteConfig.find({ isEditable: true }).lean();
    const configsByCategory = {
      general: {},
      email: {},
      security: {},
      features: {},
      limits: {}
    };

    for (const config of configs) {
      const value = await SiteConfig.getValue(config.key);
      if (configsByCategory[config.category]) {
        configsByCategory[config.category][config.key] = {
          value,
          description: config.description,
          valueType: config.valueType,
          isPublic: config.isPublic,
          isEditable: config.isEditable,
          lastModified: config.updatedAt
        };
      }
    }

    return configsByCategory;
  }

  /**
   * Determine category for a configuration key
   */
  determineCategory(key) {
    if (key.includes('email') || key.includes('smtp')) return 'email';
    if (key.includes('password') || key.includes('auth') || key.includes('2fa')) return 'security';
    if (key.includes('_enabled') || key.includes('registration')) return 'features';
    if (key.includes('max_') || key.includes('limit') || key.includes('per_page')) return 'limits';
    return 'general';
  }
}

module.exports = new ImprovedConfigController();