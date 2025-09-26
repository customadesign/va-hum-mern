const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'new_message',
      'new_conversation',
      'profile_view',
      'profile_reminder',
      'va_added',
      'business_added',
      'admin_notification',
      'system_announcement',
      'referral_joined',
      'celebration_package',
      'hiring_invoice'
    ]
  },
  params: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  readAt: Date,
  actionUrl: String,
  // For new message notifications
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  // For profile view notifications
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'viewerModel'
  },
  viewerModel: {
    type: String,
    enum: ['VA', 'Business']
  },
  // For referral notifications
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Archive fields
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for recipient lookup and sorting
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1 });
notificationSchema.index({ type: 1 });
// Indexes for archive functionality
notificationSchema.index({ recipient: 1, archived: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, archived: 1, archivedAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1, createdAt: 1 }); // For auto-archiving old read notifications

// Virtual to check if notification is read
notificationSchema.virtual('isRead').get(function() {
  return !!this.readAt;
});

// Virtual to get notification title based on type
notificationSchema.virtual('title').get(function() {
  const titles = {
    'new_message': 'New Message',
    'new_conversation': 'New Conversation Started',
    'profile_view': 'Someone Viewed Your Profile',
    'profile_reminder': 'Complete Your Profile',
    'va_added': 'New VA Joined',
    'business_added': 'New Business Joined',
    'admin_notification': 'Admin Notification',
    'system_announcement': 'System Announcement',
    'referral_joined': 'Your Referral Joined',
    'celebration_package': 'Celebration Package Request',
    'hiring_invoice': 'Hiring Invoice Request'
  };
  return titles[this.type] || 'Notification';
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.readAt) {
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to mark multiple as read
notificationSchema.statics.markManyAsRead = function(notificationIds, userId) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId,
      readAt: null
    },
    {
      readAt: new Date()
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    readAt: null,
    archived: false
  });
};

// Archive methods
notificationSchema.methods.archive = function() {
  if (!this.archived) {
    this.archived = true;
    this.archivedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

notificationSchema.methods.unarchive = function() {
  if (this.archived) {
    this.archived = false;
    this.archivedAt = undefined;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to archive multiple notifications
notificationSchema.statics.archiveMany = function(notificationIds, userId) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId,
      archived: false
    },
    {
      archived: true,
      archivedAt: new Date()
    }
  );
};

// Static method to unarchive multiple notifications
notificationSchema.statics.unarchiveMany = function(notificationIds, userId) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId,
      archived: true
    },
    {
      archived: false,
      $unset: { archivedAt: 1 }
    }
  );
};

// Static method to auto-archive old read notifications
notificationSchema.statics.autoArchiveOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.updateMany(
    {
      readAt: { $ne: null, $lt: cutoffDate },
      archived: false
    },
    {
      archived: true,
      archivedAt: new Date()
    }
  );
};

// Static method to get archived count
notificationSchema.statics.getArchivedCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    archived: true
  });
};

// Static method to clear all archived notifications for a user
notificationSchema.statics.clearArchivedForUser = function(userId) {
  return this.deleteMany({
    recipient: userId,
    archived: true
  });
};

module.exports = mongoose.model('Notification', notificationSchema);