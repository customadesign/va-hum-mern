const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Enrollment must have a course'],
    index: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Enrollment must have a business'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Enrollment must have a user'],
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'suspended'],
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  progress: {
    completedLessons: {
      type: Number,
      default: 0
    },
    totalLessons: {
      type: Number,
      default: 0
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    },
    totalTimeSpent: {
      type: Number, // in seconds
      default: 0
    },
    currentLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }
  },
  payment: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    method: {
      type: String,
      enum: ['card', 'paypal', 'free', 'coupon'],
      default: 'free'
    },
    transactionId: String,
    paidAt: Date
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedAt: Date,
    certificateId: String,
    certificateUrl: String
  },
  rating: {
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  notes: [{
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    content: String,
    timestamp: Number, // video timestamp in seconds
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate enrollments
enrollmentSchema.index({ course: 1, user: 1 }, { unique: true });

// Virtual for progress details
enrollmentSchema.virtual('progressDetails', {
  ref: 'Progress',
  localField: '_id',
  foreignField: 'enrollment'
});

// Update course enrollment count on save
enrollmentSchema.post('save', async function() {
  if (this.status === 'active') {
    const Course = mongoose.model('Course');
    const count = await this.constructor.countDocuments({ 
      course: this.course, 
      status: 'active' 
    });
    await Course.findByIdAndUpdate(this.course, { 
      totalEnrollments: count 
    });
  }
});

// Update course enrollment count on status change
enrollmentSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const Course = mongoose.model('Course');
    
    // If changing to completed, update completedAt
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
    
    // Update course enrollment count
    const count = await this.constructor.countDocuments({ 
      course: this.course, 
      status: 'active' 
    });
    await Course.findByIdAndUpdate(this.course, { 
      totalEnrollments: count 
    });
  }
  next();
});

// Method to update progress
enrollmentSchema.methods.updateProgress = async function() {
  const Progress = mongoose.model('Progress');
  const Lesson = mongoose.model('Lesson');
  
  // Get total lessons for the course
  const totalLessons = await Lesson.countDocuments({ 
    course: this.course, 
    isPublished: true 
  });
  
  // Get completed lessons
  const completedLessons = await Progress.countDocuments({
    enrollment: this._id,
    completed: true
  });
  
  // Calculate percentage
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;
  
  // Update enrollment progress
  this.progress.completedLessons = completedLessons;
  this.progress.totalLessons = totalLessons;
  this.progress.progressPercentage = progressPercentage;
  this.progress.lastAccessedAt = new Date();
  
  // Check if course is completed
  if (progressPercentage === 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  await this.save();
  return this.progress;
};

// Method to check if enrollment is valid
enrollmentSchema.methods.isValid = function() {
  if (this.status !== 'active') return false;
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
    this.save();
    return false;
  }
  return true;
};

// Method to issue certificate
enrollmentSchema.methods.issueCertificate = async function() {
  if (this.progress.progressPercentage !== 100) {
    throw new Error('Course must be 100% completed to issue certificate');
  }
  
  if (this.certificate.issued) {
    throw new Error('Certificate already issued');
  }
  
  // Generate certificate ID
  this.certificate.certificateId = `CERT-${this.course}-${this.user}-${Date.now()}`;
  this.certificate.issued = true;
  this.certificate.issuedAt = new Date();
  
  // TODO: Generate actual certificate PDF and upload to storage
  // this.certificate.certificateUrl = await generateCertificate(this);
  
  await this.save();
  return this.certificate;
};

// Method to add a note
enrollmentSchema.methods.addNote = function(lessonId, content, timestamp) {
  this.notes.push({
    lessonId,
    content,
    timestamp
  });
  return this.save();
};

// Static method to get active enrollments for a user
enrollmentSchema.statics.getActiveEnrollments = function(userId) {
  return this.find({ 
    user: userId, 
    status: 'active' 
  })
    .populate('course', 'title slug thumbnail instructor duration')
    .populate('progress.currentLesson', 'title order')
    .sort('-enrolledAt');
};

// Static method to check if user is enrolled
enrollmentSchema.statics.isUserEnrolled = async function(userId, courseId) {
  const enrollment = await this.findOne({
    user: userId,
    course: courseId,
    status: 'active'
  });
  return !!enrollment;
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);