const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  type: {
    type: String,
    enum: ['google_calendar', 'outlook_calendar', 'slack', 'microsoft_teams', 'zoom', 'webhook', 'zapier', 'salesforce', 'hubspot', 'jira', 'trello', 'asana'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'pending'],
    default: 'pending'
  },
  config: {
    // Calendar integrations
    calendarId: String,
    calendarName: String,
    syncEvents: { type: Boolean, default: true },
    syncDirection: {
      type: String,
      enum: ['both', 'from_platform', 'to_platform'],
      default: 'both'
    },
    
    // Slack/Teams
    channelId: String,
    channelName: String,
    workspaceId: String,
    workspaceName: String,
    notificationTypes: [String],
    
    // Webhook
    webhookUrl: String,
    webhookSecret: String,
    webhookEvents: [{
      type: String,
      enum: ['va.applied', 'va.hired', 'va.completed', 'message.received', 'task.created', 'task.completed', 'payment.received']
    }],
    webhookMethod: {
      type: String,
      enum: ['POST', 'PUT'],
      default: 'POST'
    },
    webhookHeaders: mongoose.Schema.Types.Mixed,
    
    // OAuth tokens
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
    
    // API Keys
    apiKey: String,
    apiSecret: String,
    
    // Additional config
    customFields: mongoose.Schema.Types.Mixed
  },
  
  // OAuth/Connection details
  connectionDetails: {
    connectedAt: Date,
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastSync: Date,
    nextSync: Date,
    syncFrequency: {
      type: Number,
      default: 15 // minutes
    },
    lastError: String,
    errorCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    }
  },
  
  // Usage stats
  usage: {
    totalEvents: { type: Number, default: 0 },
    successfulEvents: { type: Number, default: 0 },
    failedEvents: { type: Number, default: 0 },
    lastEventAt: Date,
    monthlyEvents: [{
      month: String,
      year: Number,
      count: Number
    }]
  },
  
  // Permissions
  permissions: {
    read: { type: Boolean, default: true },
    write: { type: Boolean, default: true },
    delete: { type: Boolean, default: false }
  },
  
  isEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
integrationSchema.index({ business: 1, type: 1 });
integrationSchema.index({ business: 1, status: 1 });
integrationSchema.index({ 'config.webhookUrl': 1 });

// Encrypt sensitive data before saving
integrationSchema.pre('save', function(next) {
  // In production, you would encrypt these fields
  // For now, we'll just proceed
  next();
});

// Instance method to check if integration needs refresh
integrationSchema.methods.needsTokenRefresh = function() {
  if (!this.config.tokenExpiry) return false;
  const now = new Date();
  const expiry = new Date(this.config.tokenExpiry);
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  return (expiry - now) < bufferTime;
};

// Instance method to record event
integrationSchema.methods.recordEvent = async function(success = true) {
  this.usage.totalEvents += 1;
  if (success) {
    this.usage.successfulEvents += 1;
    this.connectionDetails.errorCount = 0;
  } else {
    this.usage.failedEvents += 1;
    this.connectionDetails.errorCount += 1;
  }
  this.usage.lastEventAt = new Date();
  
  // Update monthly stats
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  
  const monthStat = this.usage.monthlyEvents.find(
    stat => stat.month === month && stat.year === year
  );
  
  if (monthStat) {
    monthStat.count += 1;
  } else {
    this.usage.monthlyEvents.push({ month, year, count: 1 });
  }
  
  // Keep only last 12 months
  if (this.usage.monthlyEvents.length > 12) {
    this.usage.monthlyEvents = this.usage.monthlyEvents.slice(-12);
  }
  
  await this.save();
};

// Instance method to check if integration should be disabled due to errors
integrationSchema.methods.shouldDisable = function() {
  return this.connectionDetails.errorCount >= this.connectionDetails.maxRetries;
};

module.exports = mongoose.model('Integration', integrationSchema);