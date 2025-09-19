const mongoose = require('mongoose');

const announcementReadSchema = new mongoose.Schema({
  announcement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Track how user interacted with announcement
  interaction: {
    type: String,
    enum: ['viewed', 'clicked', 'dismissed'],
    default: 'viewed'
  },
  // For analytics - how long user spent reading
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  // Device/platform info for analytics
  deviceInfo: {
    userAgent: String,
    platform: String,
    ip: String
  }
}, {
  timestamps: true
});

// Compound index to ensure one read record per user per announcement
announcementReadSchema.index({ announcement: 1, user: 1 }, { unique: true });
// Indexes for querying
announcementReadSchema.index({ user: 1, readAt: -1 });
announcementReadSchema.index({ announcement: 1, readAt: -1 });
announcementReadSchema.index({ readAt: -1 });

// Static method to mark announcement as read by user
announcementReadSchema.statics.markAsRead = async function(announcementId, userId, additionalInfo = {}) {
  try {
    // Try to find existing read record
    const existingRead = await this.findOne({
      announcement: announcementId,
      user: userId
    });
    
    if (existingRead) {
      // Update existing record with new interaction time
      existingRead.readAt = new Date();
      if (additionalInfo.interaction) {
        existingRead.interaction = additionalInfo.interaction;
      }
      if (additionalInfo.timeSpent) {
        existingRead.timeSpent += additionalInfo.timeSpent;
      }
      return existingRead.save();
    }
    
    // Create new read record
    const readRecord = await this.create({
      announcement: announcementId,
      user: userId,
      ...additionalInfo
    });
    
    // Update the announcement's total reads count
    const Announcement = mongoose.model('Announcement');
    await Announcement.findByIdAndUpdate(announcementId, {
      $inc: { totalReads: 1 }
    });
    
    return readRecord;
  } catch (error) {
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return this.findOne({
        announcement: announcementId,
        user: userId
      });
    }
    throw error;
  }
};

// Static method to check if user has read an announcement
announcementReadSchema.statics.hasUserRead = async function(announcementId, userId) {
  const read = await this.findOne({
    announcement: announcementId,
    user: userId
  });
  return !!read;
};

// Static method to get all announcements read by a user
announcementReadSchema.statics.getReadByUser = async function(userId, options = {}) {
  const { limit = 50, skip = 0 } = options;
  
  return this.find({ user: userId })
    .sort({ readAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate({
      path: 'announcement',
      select: 'title priority category createdAt'
    });
};

// Static method to get read statistics for an announcement
announcementReadSchema.statics.getAnnouncementStats = async function(announcementId) {
  const stats = await this.aggregate([
    { $match: { announcement: new mongoose.Types.ObjectId(announcementId) } },
    {
      $group: {
        _id: null,
        totalReads: { $sum: 1 },
        avgTimeSpent: { $avg: '$timeSpent' },
        interactions: {
          $push: '$interaction'
        }
      }
    },
    {
      $project: {
        totalReads: 1,
        avgTimeSpent: 1,
        viewed: {
          $size: {
            $filter: {
              input: '$interactions',
              cond: { $eq: ['$$this', 'viewed'] }
            }
          }
        },
        clicked: {
          $size: {
            $filter: {
              input: '$interactions',
              cond: { $eq: ['$$this', 'clicked'] }
            }
          }
        },
        dismissed: {
          $size: {
            $filter: {
              input: '$interactions',
              cond: { $eq: ['$$this', 'dismissed'] }
            }
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalReads: 0,
    avgTimeSpent: 0,
    viewed: 0,
    clicked: 0,
    dismissed: 0
  };
};

// Static method to bulk mark announcements as read
announcementReadSchema.statics.bulkMarkAsRead = async function(announcementIds, userId) {
  const bulkOps = announcementIds.map(announcementId => ({
    updateOne: {
      filter: { announcement: announcementId, user: userId },
      update: {
        $set: { readAt: new Date(), interaction: 'viewed' },
        $setOnInsert: { announcement: announcementId, user: userId }
      },
      upsert: true
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

module.exports = mongoose.model('AnnouncementRead', announcementReadSchema);