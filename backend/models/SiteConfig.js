const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
    default: 'general'
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isEditable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for lookup and filtering
// Note: key already has unique index from schema definition
siteConfigSchema.index({ category: 1 });
siteConfigSchema.index({ isPublic: 1 });

// Static method to get config value
siteConfigSchema.statics.getValue = async function(key, defaultValue = null) {
  const config = await this.findOne({ key });
  if (!config) return defaultValue;
  
  // Parse value based on type
  switch (config.valueType) {
    case 'number':
      return Number(config.value);
    case 'boolean':
      return config.value === true || config.value === 'true';
    case 'json':
      return typeof config.value === 'string' ? JSON.parse(config.value) : config.value;
    case 'array':
      return Array.isArray(config.value) ? config.value : [config.value];
    case 'email':
    case 'url':
    case 'text':
    case 'textarea':
    case 'string':
    default:
      return config.value;
  }
};

// Static method to set config value
siteConfigSchema.statics.setValue = async function(key, value, options = {}) {
  const { 
    valueType = 'string', 
    category = 'general', 
    description = '', 
    isPublic = false,
    isEditable = true 
  } = options;
  
  return this.findOneAndUpdate(
    { key },
    { 
      value, 
      valueType, 
      category, 
      description, 
      isPublic,
      isEditable 
    },
    { upsert: true, new: true }
  );
};

// Static method to get all public configs
siteConfigSchema.statics.getPublicConfigs = async function() {
  const configs = await this.find({ isPublic: true });
  const result = {};
  
  for (const config of configs) {
    result[config.key] = await this.getValue(config.key);
  }
  
  return result;
};

// Static method to get configs by category
siteConfigSchema.statics.getByCategory = async function(category) {
  const configs = await this.find({ category });
  const result = {};
  
  for (const config of configs) {
    result[config.key] = {
      value: await this.getValue(config.key),
      description: config.description,
      isEditable: config.isEditable
    };
  }
  
  return result;
};

module.exports = mongoose.model('SiteConfig', siteConfigSchema);