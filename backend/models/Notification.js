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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for recipient lookup and sorting
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1 });
notificationSchema.index({ type: 1 });

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

// Virtual to get formatted message
notificationSchema.virtual('message').get(function() {
  // If params.message exists, use it
  if (this.params && this.params.message) {
    return this.params.message;
  }
  
  // Otherwise generate a default message based on type
  const messages = {
    'new_message': `You have a new message${this.params?.senderName ? ' from ' + this.params.senderName : ''}`,
    'new_conversation': `A new conversation has been started${this.params?.initiatorName ? ' by ' + this.params.initiatorName : ''}`,
    'profile_view': `${this.params?.viewerName || 'Someone'} viewed your profile`,
    'profile_reminder': 'Please complete your profile to get better visibility',
    'va_added': `${this.params?.vaName || 'A new VA'} has joined the platform`,
    'business_added': `${this.params?.businessName || 'A new business'} has joined the platform`,
    'admin_notification': this.params?.content || 'You have a notification from the admin',
    'system_announcement': this.params?.content || 'Important system announcement',
    'referral_joined': `${this.params?.referralName || 'Your referral'} has joined the platform`,
    'celebration_package': `${this.params?.businessName || 'A business'} requested a celebration package`,
    'hiring_invoice': `${this.params?.businessName || 'A business'} requested a hiring invoice`
  };
  
  return messages[this.type] || 'You have a new notification';
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
    readAt: null
  });
};

module.exports = mongoose.model('Notification', notificationSchema);