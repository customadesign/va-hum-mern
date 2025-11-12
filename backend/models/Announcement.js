const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an announcement title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide announcement content'],
    maxlength: [5000, 'Content cannot be more than 5000 characters']
  },
  targetAudience: {
    type: String,
    enum: ['va', 'business', 'all'],
    default: 'all',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  // For tracking read counts
  totalReads: {
    type: Number,
    default: 0
  },
  // Rich text support - store both plain and formatted versions
  contentRichText: {
    type: String, // Can store HTML or markdown
    default: null
  },
  // Optional fields for enhanced announcements
  category: {
    type: String,
    enum: ['general', 'update', 'maintenance', 'feature', 'policy', 'event'],
    default: 'general'
  },
  attachments: [{
    filename: String,
    url: String,
    mimeType: String,
    size: Number
  }],
  // For scheduling announcements
  publishAt: {
    type: Date,
    default: Date.now
  },
  // Tags for filtering and searching
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
announcementSchema.index({ targetAudience: 1, isActive: 1, expiresAt: 1 });
announcementSchema.index({ priority: -1, publishAt: -1 });
announcementSchema.index({ createdBy: 1 });
announcementSchema.index({ tags: 1 });
announcementSchema.index({ category: 1 });

// Virtual to check if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual to check if announcement should be published
announcementSchema.virtual('isPublished').get(function() {
  if (!this.publishAt) return true;
  return new Date() >= this.publishAt;
});

// Method to check if announcement is viewable
announcementSchema.methods.isViewable = function() {
  return this.isActive && !this.isExpired && this.isPublished;
};

// Method to check if user can view this announcement
announcementSchema.methods.canBeViewedBy = function(user) {
  if (!this.isViewable()) return false;
  
  // Admins can see all announcements
  if (user.admin) return true;
  
  // Check target audience
  if (this.targetAudience === 'all') return true;
  
  // Check if user role matches target audience
  if (this.targetAudience === 'va' && user.role === 'va') return true;
  if (this.targetAudience === 'business' && user.role === 'business') return true;
  
  return false;
};

// Pre-save hook to auto-expire old announcements
announcementSchema.pre('save', function(next) {
  // If expiry is set and has passed, mark as inactive
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.isActive = false;
  }
  next();
});

// Static method to get active announcements for a user
announcementSchema.statics.getActiveForUser = async function(user, options = {}) {
  const { limit = 20, skip = 0, priority = null } = options;
  
  const query = {
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ],
    publishAt: { $lte: new Date() }
  };
  
  // Filter by target audience based on user role
  if (!user.admin) {
    if (user.role === 'va') {
      query.targetAudience = { $in: ['va', 'all'] };
    } else if (user.role === 'business') {
      query.targetAudience = { $in: ['business', 'all'] };
    } else {
      query.targetAudience = 'all';
    }
  }
  
  // Filter by priority if specified
  if (priority) {
    query.priority = priority;
  }
  
  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('createdBy', 'name email');
};

// Static method to archive expired announcements
announcementSchema.statics.archiveExpired = async function() {
  return this.updateMany(
    {
      isActive: true,
      expiresAt: { $lte: new Date() }
    },
    {
      isActive: false
    }
  );
};

module.exports = mongoose.model('Announcement', announcementSchema);