const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
  loginTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  logoutTime: Date,
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  browser: String,
  browserVersion: String,
  os: String,
  osVersion: String,
  device: String,
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  location: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String
  },
  loginMethod: {
    type: String,
    enum: ['email', 'google', 'linkedin', 'api_key', 'sso'],
    default: 'email'
  },
  sessionId: String,
  success: {
    type: Boolean,
    default: true
  },
  failureReason: String,
  twoFactorUsed: {
    type: Boolean,
    default: false
  },
  suspicious: {
    type: Boolean,
    default: false
  },
  suspiciousReasons: [String],
  blocked: {
    type: Boolean,
    default: false
  },
  blockReason: String
}, {
  timestamps: true
});

// Indexes
loginHistorySchema.index({ user: 1, loginTime: -1 });
loginHistorySchema.index({ business: 1, loginTime: -1 });
loginHistorySchema.index({ ipAddress: 1 });
loginHistorySchema.index({ sessionId: 1 });
loginHistorySchema.index({ suspicious: 1, loginTime: -1 });

// Static method to check for suspicious activity
loginHistorySchema.statics.checkSuspiciousActivity = async function(userId, ipAddress, userAgent) {
  const suspiciousReasons = [];
  
  // Check for multiple failed login attempts
  const recentFailures = await this.countDocuments({
    user: userId,
    success: false,
    loginTime: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
  });
  
  if (recentFailures >= 3) {
    suspiciousReasons.push('Multiple failed login attempts');
  }
  
  // Check for login from new location
  const previousLogins = await this.find({
    user: userId,
    success: true,
    ipAddress: { $ne: ipAddress }
  }).limit(10);
  
  if (previousLogins.length > 0 && !previousLogins.some(login => login.ipAddress === ipAddress)) {
    suspiciousReasons.push('Login from new IP address');
  }
  
  // Check for rapid location changes
  const lastLogin = await this.findOne({
    user: userId,
    success: true,
    loginTime: { $lt: new Date() }
  }).sort({ loginTime: -1 });
  
  if (lastLogin && lastLogin.location && lastLogin.loginTime > new Date(Date.now() - 60 * 60 * 1000)) {
    // If last login was within an hour from a different country
    // This would need geolocation service to properly implement
    suspiciousReasons.push('Rapid location change detected');
  }
  
  return {
    suspicious: suspiciousReasons.length > 0,
    reasons: suspiciousReasons
  };
};

// Instance method to calculate session duration
loginHistorySchema.methods.getSessionDuration = function() {
  if (!this.logoutTime) {
    return null;
  }
  return Math.floor((this.logoutTime - this.loginTime) / 1000); // Duration in seconds
};

module.exports = mongoose.model('LoginHistory', loginHistorySchema);