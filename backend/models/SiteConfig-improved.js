const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true // Explicit index for faster lookups
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  valueType: {
    type: String,
    enum: ['string', 'text', 'textarea', 'number', 'boolean', 'json', 'array', 'email', 'url'],
    default: 'string'
  },
  category: {
    type: String,
    enum: ['general', 'email', 'payment', 'features', 'appearance', 'security', 'integrations', 'limits'],
    default: 'general',
    index: true // Index for category-based queries
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true // Index for public config queries
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  // Add metadata for tracking changes
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  // Enable versioning for optimistic concurrency control
  optimisticConcurrency: true
});

// Compound indexes for common query patterns
siteConfigSchema.index({ category: 1, isEditable: 1 });
siteConfigSchema.index({ key: 1, category: 1 });

// Pre-save middleware to handle Mixed type changes
siteConfigSchema.pre('save', function(next) {
  // Mark the value field as modified for Mixed types
  if (this.isModified('value')) {
    this.markModified('value');
    this.version = (this.version || 0) + 1;
  }
  next();
});

// Instance method to safely update value with proper type handling
siteConfigSchema.methods.updateValue = async function(newValue, userId = null) {
  try {
    // Validate and convert value based on valueType
    const validatedValue = this.constructor.validateAndConvertValue(newValue, this.valueType);

    // Set the new value
    this.value = validatedValue;

    // Explicitly mark as modified for Mixed type
    this.markModified('value');

    // Track who made the change
    if (userId) {
      this.lastModifiedBy = userId;
    }

    // Save with retry logic for concurrent updates
    let retries = 3;
    while (retries > 0) {
      try {
        await this.save();
        return this;
      } catch (error) {
        if (error.name === 'VersionError' && retries > 1) {
          // Reload and retry on version conflict
          await this.constructor.findById(this._id);
          this.value = validatedValue;
          this.markModified('value');
          retries--;
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(`Error updating config ${this.key}:`, error);
    throw error;
  }
};

// Static method to validate and convert values
siteConfigSchema.statics.validateAndConvertValue = function(value, valueType) {
  switch (valueType) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Invalid number value: ${value}`);
      }
      return num;

    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);

    case 'json':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          throw new Error(`Invalid JSON value: ${value}`);
        }
      }
      return value;

    case 'array':
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            return [value];
          }
          return parsed;
        } catch (e) {
          return [value];
        }
      }
      return Array.isArray(value) ? value : [value];

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error(`Invalid email value: ${value}`);
      }
      return value.toLowerCase().trim();

    case 'url':
      try {
        new URL(value);
        return value.trim();
      } catch (e) {
        throw new Error(`Invalid URL value: ${value}`);
      }

    case 'text':
    case 'textarea':
    case 'string':
    default:
      return String(value).trim();
  }
};

// Static method to get config value with caching
siteConfigSchema.statics.getValue = async function(key, defaultValue = null) {
  const config = await this.findOne({ key }).lean();
  if (!config) return defaultValue;

  // Parse value based on type
  try {
    return this.validateAndConvertValue(config.value, config.valueType);
  } catch (error) {
    console.error(`Error parsing config value for ${key}:`, error);
    return defaultValue;
  }
};

// Static method to set config value with atomic update
siteConfigSchema.statics.setValue = async function(key, value, options = {}) {
  const {
    valueType = 'string',
    category = 'general',
    description = '',
    isPublic = false,
    isEditable = true,
    userId = null
  } = options;

  try {
    // Validate the value first
    const validatedValue = this.validateAndConvertValue(value, valueType);

    // Use findOneAndUpdate for atomic operation
    const config = await this.findOneAndUpdate(
      { key },
      {
        $set: {
          value: validatedValue,
          valueType,
          category,
          description,
          isPublic,
          isEditable,
          lastModifiedBy: userId
        },
        $inc: { version: 1 }
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    // Ensure the value is properly saved for Mixed types
    if (config) {
      config.markModified('value');
      await config.save();
    }

    return config;
  } catch (error) {
    console.error(`Error setting config ${key}:`, error);
    throw error;
  }
};

// Static method to bulk update configs with transaction
siteConfigSchema.statics.bulkUpdate = async function(configs, userId = null) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updates = [];
    const errors = [];

    for (const [key, value] of Object.entries(configs)) {
      try {
        const existingConfig = await this.findOne({ key }).session(session);

        if (existingConfig) {
          const validatedValue = this.validateAndConvertValue(value, existingConfig.valueType);

          await this.updateOne(
            { key },
            {
              $set: {
                value: validatedValue,
                lastModifiedBy: userId
              },
              $inc: { version: 1 }
            },
            { session }
          );

          updates.push({ key, value: validatedValue, action: 'updated' });
        } else {
          // Create new config with defaults
          const newConfig = await this.create([{
            key,
            value,
            valueType: this.detectValueType(value),
            category: 'general',
            description: `Auto-created config for ${key}`,
            isPublic: false,
            isEditable: true,
            lastModifiedBy: userId
          }], { session });

          updates.push({ key, value, action: 'created' });
        }
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }

    if (errors.length === 0) {
      await session.commitTransaction();
    } else {
      await session.abortTransaction();
      throw new Error(`Bulk update failed: ${JSON.stringify(errors)}`);
    }

    return { updates, errors };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Helper to detect value type
siteConfigSchema.statics.detectValueType = function(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'json';

  // Check for email pattern
  if (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'email';
  }

  // Check for URL pattern
  if (typeof value === 'string') {
    try {
      new URL(value);
      return 'url';
    } catch (e) {
      // Not a URL
    }
  }

  return 'string';
};

// Static method to get all public configs with caching
siteConfigSchema.statics.getPublicConfigs = async function() {
  const configs = await this.find({ isPublic: true }).lean();
  const result = {};

  for (const config of configs) {
    try {
      result[config.key] = this.validateAndConvertValue(config.value, config.valueType);
    } catch (error) {
      console.error(`Error parsing public config ${config.key}:`, error);
    }
  }

  return result;
};

// Static method to get configs by category
siteConfigSchema.statics.getByCategory = async function(category) {
  const configs = await this.find({ category }).lean();
  const result = {};

  for (const config of configs) {
    try {
      result[config.key] = {
        value: this.validateAndConvertValue(config.value, config.valueType),
        description: config.description,
        isEditable: config.isEditable,
        valueType: config.valueType,
        lastModified: config.updatedAt
      };
    } catch (error) {
      console.error(`Error parsing config ${config.key}:`, error);
    }
  }

  return result;
};

// Add text index for searching configs
siteConfigSchema.index({ key: 'text', description: 'text' });

module.exports = mongoose.model('SiteConfig', siteConfigSchema);