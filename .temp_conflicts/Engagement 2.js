const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema({
  // Core relationship
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    index: true
  },

  // Engagement status
  status: {
    type: String,
    enum: ['considering', 'active', 'paused', 'past'],
    default: 'considering',
    index: true
  },

  // Contract details
  contract: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      default: null // null means ongoing
    },
    hoursPerWeek: {
      type: Number,
      min: 1,
      max: 168, // max hours in a week
      required: true
    },
    rate: {
      type: Number,
      min: 0,
      required: false // Optional hourly rate
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'PHP', 'EUR', 'GBP', 'CAD', 'AUD']
    }
  },

  // Metadata
  notes: {
    type: String,
    maxlength: 1000
  },
  tags: [{
    type: String,
    trim: true
  }],

  // Activity tracking
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
engagementSchema.index({ clientId: 1, status: 1 });
engagementSchema.index({ vaId: 1, status: 1 });
engagementSchema.index({ clientId: 1, lastActivityAt: -1 });
engagementSchema.index({ status: 1, lastActivityAt: -1 });

// Virtual for contract duration in days
engagementSchema.virtual('contractDurationDays').get(function() {
  if (!this.contract.endDate) return null;
  const start = new Date(this.contract.startDate);
  const end = new Date(this.contract.endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

// Virtual for contract status
engagementSchema.virtual('contractStatus').get(function() {
  const now = new Date();
  const start = new Date(this.contract.startDate);
  const end = this.contract.endDate ? new Date(this.contract.endDate) : null;
  
  if (now < start) return 'upcoming';
  if (end && now > end) return 'expired';
  return 'active';
});

// Instance methods
engagementSchema.methods.updateActivity = function() {
  this.lastActivityAt = new Date();
  return this.save();
};

engagementSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.updatedBy = updatedBy;
  this.lastActivityAt = new Date();
  return this.save();
};

// Static methods for aggregations
engagementSchema.statics.getStatusCounts = function(clientId) {
  return this.aggregate([
    { $match: { clientId: new mongoose.Types.ObjectId(clientId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        statuses: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        active: {
          $ifNull: [
            { $arrayElemAt: [
              { $filter: { input: '$statuses', cond: { $eq: ['$$this.status', 'active'] } } },
              0
            ]},
            { count: 0 }
          ]
        },
        considering: {
          $ifNull: [
            { $arrayElemAt: [
              { $filter: { input: '$statuses', cond: { $eq: ['$$this.status', 'considering'] } } },
              0
            ]},
            { count: 0 }
          ]
        },
        paused: {
          $ifNull: [
            { $arrayElemAt: [
              { $filter: { input: '$statuses', cond: { $eq: ['$$this.status', 'paused'] } } },
              0
            ]},
            { count: 0 }
          ]
        },
        past: {
          $ifNull: [
            { $arrayElemAt: [
              { $filter: { input: '$statuses', cond: { $eq: ['$$this.status', 'past'] } } },
              0
            ]},
            { count: 0 }
          ]
        }
      }
    },
    {
      $addFields: {
        'active': '$active.count',
        'considering': '$considering.count',
        'paused': '$paused.count',
        'past': '$past.count'
      }
    }
  ]);
};

// Pre-save middleware
engagementSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = new Date();
  }
  next();
});

// Pre-find middleware to populate VA details
engagementSchema.pre(/^find/, function() {
  this.populate({
    path: 'vaId',
    select: 'name firstName lastName displayName avatar email timezone',
    transform: function(doc) {
      if (!doc) return doc;
      return {
        id: doc._id,
        fullName: doc.displayName || doc.name || `${doc.firstName || ''} ${doc.lastName || ''}`.trim(),
        avatarUrl: doc.avatar,
        email: doc.email,
        timezone: doc.timezone
      };
    }
  });
});

module.exports = mongoose.model('Engagement', engagementSchema);
