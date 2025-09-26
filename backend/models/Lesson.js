const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Lesson must belong to a course'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a lesson title'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number, // Duration in seconds
    required: [true, 'Please provide lesson duration'],
    min: 0
  },
  type: {
    type: String,
    enum: ['video', 'live', 'text', 'quiz', 'assignment'],
    default: 'video'
  },
  content: {
    videoUrl: {
      type: String,
      required: function() { return this.type === 'video'; }
    },
    videoId: {
      type: String // VideoSDK video ID or YouTube ID
    },
    textContent: {
      type: String,
      required: function() { return this.type === 'text'; }
    },
    liveSessionDetails: {
      scheduledAt: Date,
      meetingId: String,
      roomId: String,
      recordingUrl: String,
      isRecorded: {
        type: Boolean,
        default: false
      }
    },
    resources: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['pdf', 'doc', 'image', 'link', 'other'],
        default: 'other'
      }
    }]
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  metadata: {
    videoProvider: {
      type: String,
      enum: ['videosdk', 'youtube', 'vimeo', 'custom'],
      default: 'videosdk'
    },
    videoQuality: {
      type: String,
      enum: ['360p', '480p', '720p', '1080p', '4k'],
      default: '720p'
    },
    captions: {
      available: {
        type: Boolean,
        default: false
      },
      languages: [String]
    },
    thumbnailUrl: String,
    transcript: String
  },
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String
    }],
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    }
  },
  assignment: {
    instructions: String,
    dueInDays: Number,
    attachmentRequired: Boolean,
    maxScore: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true
});

// Compound index for course and order
lessonSchema.index({ course: 1, order: 1 }, { unique: true });

// Virtual for formatted duration
lessonSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

// Update course statistics when lesson is added/updated
lessonSchema.post('save', async function() {
  const Course = mongoose.model('Course');
  const lessons = await this.constructor.find({ course: this.course });
  
  const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  const totalLessons = lessons.length;
  
  await Course.findByIdAndUpdate(this.course, {
    duration: Math.round(totalDuration / 60), // Convert to minutes
    totalLessons: totalLessons,
    'metadata.lastUpdated': new Date()
  });
});

// Update course statistics when lesson is deleted
lessonSchema.post('remove', async function() {
  const Course = mongoose.model('Course');
  const lessons = await this.constructor.find({ course: this.course });
  
  const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  const totalLessons = lessons.length;
  
  await Course.findByIdAndUpdate(this.course, {
    duration: Math.round(totalDuration / 60), // Convert to minutes
    totalLessons: totalLessons,
    'metadata.lastUpdated': new Date()
  });
});

// Method to check if user has completed this lesson
lessonSchema.methods.isCompletedByUser = async function(enrollmentId) {
  const Progress = mongoose.model('Progress');
  const progress = await Progress.findOne({
    enrollment: enrollmentId,
    lesson: this._id,
    completed: true
  });
  return !!progress;
};

// Method to get user's progress for this lesson
lessonSchema.methods.getUserProgress = async function(enrollmentId) {
  const Progress = mongoose.model('Progress');
  return await Progress.findOne({
    enrollment: enrollmentId,
    lesson: this._id
  });
};

// Static method to reorder lessons
lessonSchema.statics.reorderLessons = async function(courseId, lessonOrders) {
  const bulkOps = lessonOrders.map(item => ({
    updateOne: {
      filter: { _id: item.lessonId, course: courseId },
      update: { order: item.order }
    }
  }));
  
  return await this.bulkWrite(bulkOps);
};

// Static method to get next lesson
lessonSchema.statics.getNextLesson = async function(courseId, currentOrder) {
  return await this.findOne({
    course: courseId,
    order: { $gt: currentOrder },
    isPublished: true
  }).sort('order');
};

module.exports = mongoose.model('Lesson', lessonSchema);