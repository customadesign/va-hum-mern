const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: [true, 'Progress must belong to an enrollment'],
    index: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: [true, 'Progress must belong to a lesson'],
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Progress must belong to a user'],
    index: true
  },
  watchTime: {
    type: Number, // Total seconds watched
    default: 0,
    min: 0
  },
  lastWatchedPosition: {
    type: Number, // Last position in seconds
    default: 0,
    min: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  interactions: [{
    type: {
      type: String,
      enum: ['play', 'pause', 'seek', 'complete', 'resume'],
      required: true
    },
    timestamp: {
      type: Number, // Video timestamp in seconds
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  quiz: {
    attempted: {
      type: Boolean,
      default: false
    },
    attempts: [{
      score: Number,
      answers: [{
        questionIndex: Number,
        selectedAnswer: Number,
        isCorrect: Boolean
      }],
      attemptedAt: {
        type: Date,
        default: Date.now
      }
    }],
    bestScore: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    }
  },
  assignment: {
    submitted: {
      type: Boolean,
      default: false
    },
    submittedAt: Date,
    submissionUrl: String,
    submissionText: String,
    grade: {
      score: Number,
      maxScore: Number,
      feedback: String,
      gradedAt: Date,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VA'
      }
    }
  },
  watchSessions: [{
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    duration: Number, // in seconds
    startPosition: Number, // video position in seconds
    endPosition: Number,
    completed: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate progress records
progressSchema.index({ enrollment: 1, lesson: 1, user: 1 }, { unique: true });

// Update completion status based on watch percentage
progressSchema.pre('save', async function(next) {
  if (this.isModified('watchTime') || this.isModified('lastWatchedPosition')) {
    const Lesson = mongoose.model('Lesson');
    const lesson = await Lesson.findById(this.lesson);
    
    if (lesson && lesson.duration > 0) {
      // Calculate completion percentage based on watch time
      this.completionPercentage = Math.min(
        Math.round((this.watchTime / lesson.duration) * 100),
        100
      );
      
      // Mark as completed if watched 90% or more
      if (this.completionPercentage >= 90 && !this.completed) {
        this.completed = true;
        this.completedAt = new Date();
        
        // Add completion interaction
        this.interactions.push({
          type: 'complete',
          timestamp: this.lastWatchedPosition
        });
      }
    }
  }
  
  next();
});

// Update enrollment progress after saving
progressSchema.post('save', async function() {
  if (this.completed) {
    const Enrollment = mongoose.model('Enrollment');
    const enrollment = await Enrollment.findById(this.enrollment);
    if (enrollment) {
      await enrollment.updateProgress();
    }
  }
});

// Method to record watch session
progressSchema.methods.startWatchSession = function(startPosition = 0) {
  const session = {
    startTime: new Date(),
    startPosition: startPosition
  };
  
  this.watchSessions.push(session);
  this.interactions.push({
    type: 'play',
    timestamp: startPosition
  });
  
  return this.save();
};

// Method to end watch session
progressSchema.methods.endWatchSession = async function(endPosition) {
  if (this.watchSessions.length === 0) return;
  
  const currentSession = this.watchSessions[this.watchSessions.length - 1];
  if (!currentSession.endTime) {
    currentSession.endTime = new Date();
    currentSession.endPosition = endPosition;
    currentSession.duration = Math.round(
      (currentSession.endTime - currentSession.startTime) / 1000
    );
    
    // Update total watch time
    this.watchTime += currentSession.duration;
    this.lastWatchedPosition = endPosition;
    
    // Add pause interaction
    this.interactions.push({
      type: 'pause',
      timestamp: endPosition
    });
    
    await this.save();
  }
};

// Method to record seek
progressSchema.methods.recordSeek = function(fromPosition, toPosition) {
  this.interactions.push({
    type: 'seek',
    timestamp: toPosition
  });
  this.lastWatchedPosition = toPosition;
  return this.save();
};

// Method to submit quiz
progressSchema.methods.submitQuiz = async function(answers) {
  const Lesson = mongoose.model('Lesson');
  const lesson = await Lesson.findById(this.lesson);
  
  if (!lesson || lesson.type !== 'quiz') {
    throw new Error('This lesson is not a quiz');
  }
  
  // Calculate score
  let correctAnswers = 0;
  const processedAnswers = answers.map((answer, index) => {
    const question = lesson.quiz.questions[index];
    const isCorrect = question && answer === question.correctAnswer;
    if (isCorrect) correctAnswers++;
    
    return {
      questionIndex: index,
      selectedAnswer: answer,
      isCorrect
    };
  });
  
  const score = Math.round((correctAnswers / lesson.quiz.questions.length) * 100);
  
  // Record attempt
  this.quiz.attempts.push({
    score,
    answers: processedAnswers
  });
  
  this.quiz.attempted = true;
  this.quiz.bestScore = Math.max(this.quiz.bestScore, score);
  this.quiz.passed = score >= lesson.quiz.passingScore;
  
  // Mark lesson as completed if passed
  if (this.quiz.passed && !this.completed) {
    this.completed = true;
    this.completedAt = new Date();
    this.completionPercentage = 100;
  }
  
  await this.save();
  
  return {
    score,
    passed: this.quiz.passed,
    answers: processedAnswers
  };
};

// Method to submit assignment
progressSchema.methods.submitAssignment = function(submissionData) {
  this.assignment.submitted = true;
  this.assignment.submittedAt = new Date();
  this.assignment.submissionUrl = submissionData.url;
  this.assignment.submissionText = submissionData.text;
  
  // Mark as completed
  if (!this.completed) {
    this.completed = true;
    this.completedAt = new Date();
    this.completionPercentage = 100;
  }
  
  return this.save();
};

// Static method to get user's progress for a course
progressSchema.statics.getCourseProgress = async function(userId, courseId) {
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId,
    status: 'active'
  });
  
  if (!enrollment) return null;
  
  return await this.find({
    enrollment: enrollment._id,
    user: userId
  })
    .populate('lesson', 'title order type duration')
    .sort('lesson.order');
};

// Static method to get recently watched lessons
progressSchema.statics.getRecentlyWatched = function(userId, limit = 5) {
  return this.find({
    user: userId,
    watchTime: { $gt: 0 }
  })
    .populate('lesson', 'title thumbnail')
    .populate({
      path: 'enrollment',
      populate: {
        path: 'course',
        select: 'title slug thumbnail'
      }
    })
    .sort('-updatedAt')
    .limit(limit);
};

module.exports = mongoose.model('Progress', progressSchema);