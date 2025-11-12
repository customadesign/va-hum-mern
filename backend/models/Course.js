const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description'],
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  shortDescription: {
    type: String,
    maxLength: [200, 'Short description cannot exceed 200 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VA',
    required: [true, 'Course must have an instructor']
  },
  category: {
    type: String,
    enum: ['business-management', 'communication', 'technical-skills', 'productivity', 'marketing', 'finance', 'other'],
    default: 'other'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP']
  },
  thumbnail: {
    type: String,
    default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop'
  },
  previewVideo: {
    type: String // URL to preview video
  },
  duration: {
    type: Number, // Total duration in minutes
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  requirements: [{
    type: String
  }],
  whatYouWillLearn: [{
    type: String
  }],
  tags: [{
    type: String,
    lowercase: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  totalEnrollments: {
    type: Number,
    default: 0
  },
  features: {
    certificateOffered: {
      type: Boolean,
      default: false
    },
    liveSessionsIncluded: {
      type: Boolean,
      default: false
    },
    downloadableResources: {
      type: Boolean,
      default: false
    },
    lifetimeAccess: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    videoProvider: {
      type: String,
      enum: ['videosdk', 'youtube', 'vimeo', 'custom'],
      default: 'videosdk'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for lessons
courseSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course'
});

// Virtual for enrollments
courseSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course'
});

// Create slug from title before saving
courseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Update publishedAt when course is published
courseSchema.pre('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Method to check if user is enrolled
courseSchema.methods.isUserEnrolled = async function(userId) {
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findOne({
    course: this._id,
    business: userId,
    status: 'active'
  });
  return !!enrollment;
};

// Method to get user's progress
courseSchema.methods.getUserProgress = async function(userId) {
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findOne({
    course: this._id,
    business: userId,
    status: 'active'
  }).populate('progress');
  
  if (!enrollment) return null;
  
  return {
    enrollmentId: enrollment._id,
    progress: enrollment.progress,
    completedLessons: enrollment.completedLessons,
    progressPercentage: enrollment.progressPercentage
  };
};

// Static method to get popular courses
courseSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isPublished: true })
    .sort('-totalEnrollments -averageRating')
    .limit(limit)
    .populate('instructor', 'name hero');
};

// Static method to get courses by category
courseSchema.statics.getByCategory = function(category, limit = 10) {
  return this.find({ 
    isPublished: true, 
    category: category 
  })
    .sort('-averageRating -totalEnrollments')
    .limit(limit)
    .populate('instructor', 'name hero');
};

module.exports = mongoose.model('Course', courseSchema);