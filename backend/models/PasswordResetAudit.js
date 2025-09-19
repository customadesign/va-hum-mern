const mongoose = require('mongoose');

const passwordResetAuditSchema = new mongoose.Schema({
  // User whose password is being reset
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Email address of the user
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  // Type of password reset
  resetType: {
    type: String,
    enum: ['admin_initiated', 'user_self_service'],
    required: true
  },
  // Admin who initiated the reset (if admin_initiated)
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.resetType === 'admin_initiated';
    }
  },
  // Admin email who initiated the reset
  initiatedByEmail: {
    type: String,
    required: function() {
      return this.resetType === 'admin_initiated';
    }
  },
  // Status of the password reset
  status: {
    type: String,
    enum: ['initiated', 'email_sent', 'email_failed', 'token_used', 'token_expired', 'completed', 'failed'],
    default: 'initiated'
  },
  // Token information (hashed for security)
  tokenHash: {
    type: String,
    required: true
  },
  // Token expiry time
  tokenExpiry: {
    type: Date,
    required: true
  },
  // Email delivery information
  emailDelivery: {
    provider: {
      type: String,
      enum: ['sendgrid', 'smtp'],
      required: false
    },
    senderEmail: String,
    senderDomain: String,
    messageId: String,
    deliveredAt: Date,
    failureReason: String
  },
  // User type for proper email routing
  userType: {
    type: String,
    enum: ['va', 'business', 'admin'],
    required: true
  },
  // IP address of the requester
  ipAddress: String,
  // User agent information
  userAgent: String,
  // Reason for admin-initiated reset
  reason: {
    type: String,
    required: function() {
      return this.resetType === 'admin_initiated';
    }
  },
  // Completion information
  completedAt: Date,
  completionIpAddress: String,
  completionUserAgent: String,
  // Security flags
  securityFlags: {
    suspiciousActivity: {
      type: Boolean,
      default: false
    },
    multipleAttempts: {
      type: Boolean,
      default: false
    },
    adminOverride: {
      type: Boolean,
      default: false
    }
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
passwordResetAuditSchema.index({ user: 1, createdAt: -1 });
passwordResetAuditSchema.index({ userEmail: 1, createdAt: -1 });
passwordResetAuditSchema.index({ status: 1, createdAt: -1 });
passwordResetAuditSchema.index({ resetType: 1, createdAt: -1 });
passwordResetAuditSchema.index({ initiatedBy: 1, createdAt: -1 });
passwordResetAuditSchema.index({ tokenExpiry: 1 }); // For cleanup of expired tokens

// Virtual for determining if token is expired
passwordResetAuditSchema.virtual('isExpired').get(function() {
  return Date.now() > this.tokenExpiry;
});

// Method to mark as completed
passwordResetAuditSchema.methods.markCompleted = function(ipAddress, userAgent) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completionIpAddress = ipAddress;
  this.completionUserAgent = userAgent;
  return this.save();
};

// Method to mark as failed
passwordResetAuditSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.metadata.failureReason = reason;
  return this.save();
};

// Method to update email delivery status
passwordResetAuditSchema.methods.updateEmailDelivery = function(deliveryInfo) {
  this.emailDelivery = {
    ...this.emailDelivery,
    ...deliveryInfo,
    deliveredAt: new Date()
  };
  this.status = 'email_sent';
  return this.save();
};

// Method to mark email as failed
passwordResetAuditSchema.methods.markEmailFailed = function(reason) {
  this.status = 'email_failed';
  this.emailDelivery.failureReason = reason;
  return this.save();
};

// Static method to get user's recent reset attempts
passwordResetAuditSchema.statics.getRecentAttempts = function(userEmail, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    userEmail: userEmail.toLowerCase(),
    createdAt: { $gte: since }
  }).sort({ createdAt: -1 });
};

// Static method to cleanup expired tokens
passwordResetAuditSchema.statics.cleanupExpiredTokens = function() {
  return this.updateMany(
    {
      status: { $in: ['initiated', 'email_sent'] },
      tokenExpiry: { $lt: new Date() }
    },
    {
      $set: { status: 'token_expired' }
    }
  );
};

// Static method to get admin activity report
passwordResetAuditSchema.statics.getAdminActivityReport = function(adminId, startDate, endDate) {
  const query = {
    resetType: 'admin_initiated',
    initiatedBy: adminId
  };
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.find(query)
    .populate('user', 'email')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('PasswordResetAudit', passwordResetAuditSchema);