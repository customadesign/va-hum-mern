const mongoose = require('mongoose');

const userStatusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isTyping: {
    type: Boolean,
    default: false
  },
  typingIn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  customStatus: {
    emoji: String,
    text: String,
    expiresAt: Date
  },
  activeConversations: [{
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }],
  deviceInfo: {
    platform: String, // web, mobile, desktop
    browser: String,
    os: String,
    deviceId: String
  },
  settings: {
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    showLastSeen: {
      type: Boolean,
      default: true
    },
    showTypingIndicator: {
      type: Boolean,
      default: true
    },
    activeStatusTimeout: {
      type: Number,
      default: 300000 // 5 minutes in milliseconds
    }
  },
  socketId: String, // Current socket.io connection ID
  connectedAt: Date,
  disconnectedAt: Date
}, {
  timestamps: true
});

// Index for quick lookups
userStatusSchema.index({ user: 1 });
userStatusSchema.index({ status: 1 });
userStatusSchema.index({ lastSeen: -1 });

// Method to update online status
userStatusSchema.methods.setOnline = function(socketId) {
  this.status = 'online';
  this.lastSeen = new Date();
  this.connectedAt = new Date();
  this.socketId = socketId;
  this.disconnectedAt = null;
  return this.save();
};

// Method to update offline status
userStatusSchema.methods.setOffline = function() {
  this.status = 'offline';
  this.lastSeen = new Date();
  this.disconnectedAt = new Date();
  this.socketId = null;
  this.isTyping = false;
  this.typingIn = null;
  return this.save();
};

// Method to update away status (auto-away after inactivity)
userStatusSchema.methods.setAway = function() {
  if (this.status === 'online') {
    this.status = 'away';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update busy status
userStatusSchema.methods.setBusy = function() {
  this.status = 'busy';
  return this.save();
};

// Method to update typing status
userStatusSchema.methods.setTyping = function(conversationId, isTyping) {
  this.isTyping = isTyping;
  this.typingIn = isTyping ? conversationId : null;
  return this.save();
};

// Method to update custom status
userStatusSchema.methods.setCustomStatus = function(emoji, text, duration) {
  this.customStatus = {
    emoji,
    text,
    expiresAt: duration ? new Date(Date.now() + duration) : null
  };
  return this.save();
};

// Method to update last activity
userStatusSchema.methods.updateActivity = function() {
  this.lastSeen = new Date();
  if (this.status === 'away') {
    this.status = 'online';
  }
  return this.save();
};

// Static method to get online users
userStatusSchema.statics.getOnlineUsers = function(userIds) {
  const query = { status: { $in: ['online', 'away', 'busy'] } };
  if (userIds && userIds.length > 0) {
    query.user = { $in: userIds };
  }
  return this.find(query).populate('user', 'name email avatar');
};

// Static method to clean up stale statuses
userStatusSchema.statics.cleanupStaleStatuses = async function() {
  const staleTimeout = 10 * 60 * 1000; // 10 minutes
  const staleDate = new Date(Date.now() - staleTimeout);
  
  await this.updateMany(
    {
      status: { $in: ['online', 'away'] },
      lastSeen: { $lt: staleDate }
    },
    {
      $set: { status: 'offline', socketId: null }
    }
  );
};

// Virtual for checking if user is currently active
userStatusSchema.virtual('isActive').get(function() {
  if (this.status === 'offline') return false;
  
  const inactiveTimeout = this.settings.activeStatusTimeout || 300000;
  const lastActivity = this.lastSeen || this.updatedAt;
  
  return (Date.now() - lastActivity.getTime()) < inactiveTimeout;
});

module.exports = mongoose.model('UserStatus', userStatusSchema);