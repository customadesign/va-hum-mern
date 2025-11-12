const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  billing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    required: true
  },
  // Trial details
  type: {
    type: String,
    enum: ['10_hour_trial'],
    default: '10_hour_trial'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'completed'],
    default: 'active'
  },
  // Hours tracking
  totalHours: {
    type: Number,
    default: 10,
    required: true
  },
  usedHours: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingHours: {
    type: Number,
    default: 10
  },
  // Usage tracking
  usageSessions: [{
    va: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VA'
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: Date,
    duration: {
      type: Number, // Duration in minutes
      default: 0
    },
    description: String,
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'cancelled'],
      default: 'in_progress'
    }
  }],
  // Payment information
  paymentIntentId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 100,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  // Dates
  purchasedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  completedAt: Date,
  cancelledAt: Date,
  // Notifications
  notifications: {
    sent50Percent: {
      type: Boolean,
      default: false
    },
    sent75Percent: {
      type: Boolean,
      default: false
    },
    sent90Percent: {
      type: Boolean,
      default: false
    },
    sentExpired: {
      type: Boolean,
      default: false
    }
  },
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['website', 'admin', 'api'],
      default: 'website'
    },
    referralCode: String,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes
trialSchema.index({ business: 1, status: 1 });
trialSchema.index({ expiresAt: 1 });
trialSchema.index({ status: 1, remainingHours: 1 });

// Pre-save middleware to calculate remaining hours and set expiry
trialSchema.pre('save', function(next) {
  // Calculate remaining hours
  this.remainingHours = Math.max(0, this.totalHours - this.usedHours);
  
  // Set expiry date (30 days from purchase) if not set
  if (!this.expiresAt && this.purchasedAt) {
    const expiryDate = new Date(this.purchasedAt);
    expiryDate.setDate(expiryDate.getDate() + 30);
    this.expiresAt = expiryDate;
  }
  
  // Update status based on hours and expiry
  if (this.remainingHours <= 0) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
  }
  
  next();
});

// Method to start a usage session
trialSchema.methods.startSession = function(vaId, description, taskId) {
  if (this.status !== 'active') {
    throw new Error('Trial is not active');
  }
  
  if (this.remainingHours <= 0) {
    throw new Error('No hours remaining in trial');
  }
  
  const session = {
    va: vaId,
    startTime: new Date(),
    description: description,
    task: taskId,
    status: 'in_progress'
  };
  
  this.usageSessions.push(session);
  return this.save();
};

// Method to end a usage session
trialSchema.methods.endSession = function(sessionId) {
  const session = this.usageSessions.id(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.status !== 'in_progress') {
    throw new Error('Session is not in progress');
  }
  
  session.endTime = new Date();
  session.duration = Math.round((session.endTime - session.startTime) / (1000 * 60)); // Duration in minutes
  session.status = 'completed';
  
  // Update used hours (convert minutes to hours)
  const hoursUsed = session.duration / 60;
  this.usedHours = Math.min(this.totalHours, this.usedHours + hoursUsed);
  
  return this.save();
};

// Method to cancel a session
trialSchema.methods.cancelSession = function(sessionId) {
  const session = this.usageSessions.id(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  session.status = 'cancelled';
  session.endTime = new Date();
  
  return this.save();
};

// Method to check if should send notification
trialSchema.methods.checkNotifications = function() {
  const percentUsed = (this.usedHours / this.totalHours) * 100;
  const notifications = [];
  
  if (percentUsed >= 50 && !this.notifications.sent50Percent) {
    notifications.push('50_percent');
    this.notifications.sent50Percent = true;
  }
  
  if (percentUsed >= 75 && !this.notifications.sent75Percent) {
    notifications.push('75_percent');
    this.notifications.sent75Percent = true;
  }
  
  if (percentUsed >= 90 && !this.notifications.sent90Percent) {
    notifications.push('90_percent');
    this.notifications.sent90Percent = true;
  }
  
  if (this.status === 'expired' && !this.notifications.sentExpired) {
    notifications.push('expired');
    this.notifications.sentExpired = true;
  }
  
  if (notifications.length > 0) {
    this.save();
  }
  
  return notifications;
};

// Virtual for checking if trial is usable
trialSchema.virtual('isUsable').get(function() {
  return this.status === 'active' && 
         this.remainingHours > 0 && 
         new Date() < this.expiresAt;
});

// Virtual for percentage used
trialSchema.virtual('percentageUsed').get(function() {
  return Math.round((this.usedHours / this.totalHours) * 100);
});

// Virtual for days until expiry
trialSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return 0;
  const now = new Date();
  const diffTime = this.expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

module.exports = mongoose.model('Trial', trialSchema);