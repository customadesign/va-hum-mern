const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');

// @desc    Get lessons for a course
// @route   GET /api/courses/:courseId/lessons
// @access  Public (limited data) / Private (full data for enrolled users)
exports.getLessons = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    let query = { course: req.params.courseId };
    let selectFields = 'title description order duration type isFree';
    
    // Check if user is enrolled or is the instructor
    let isEnrolled = false;
    let isInstructor = false;
    
    if (req.user) {
      isEnrolled = await Enrollment.isUserEnrolled(req.user._id, course._id);
      isInstructor = req.va && course.instructor.toString() === req.va._id.toString();
      
      if (isEnrolled || isInstructor || req.user.admin) {
        // Show all fields for enrolled users, instructors, or admins
        selectFields = null;
      }
    }

    const lessons = await Lesson.find(query)
      .select(selectFields)
      .sort('order');

    // Get progress for enrolled users
    if (isEnrolled && req.user) {
      const enrollment = await Enrollment.findOne({
        user: req.user._id,
        course: course._id,
        status: 'active'
      });

      if (enrollment) {
        for (let lesson of lessons) {
          const progress = await Progress.findOne({
            enrollment: enrollment._id,
            lesson: lesson._id
          });
          
          lesson._doc.progress = progress ? {
            completed: progress.completed,
            completionPercentage: progress.completionPercentage,
            lastWatchedPosition: progress.lastWatchedPosition,
            watchTime: progress.watchTime
          } : null;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: lessons,
      isEnrolled,
      isInstructor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single lesson
// @route   GET /api/lessons/:id
// @access  Private (enrolled users or instructor)
exports.getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'title instructor');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check access rights
    const isEnrolled = req.user ? await Enrollment.isUserEnrolled(req.user._id, lesson.course._id) : false;
    const isInstructor = req.va && lesson.course.instructor.toString() === req.va._id.toString();
    
    if (!lesson.isFree && !isEnrolled && !isInstructor && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'You must be enrolled to access this lesson'
      });
    }

    // Get user progress if enrolled
    let progress = null;
    if (isEnrolled) {
      const enrollment = await Enrollment.findOne({
        user: req.user._id,
        course: lesson.course._id,
        status: 'active'
      });

      if (enrollment) {
        progress = await Progress.findOne({
          enrollment: enrollment._id,
          lesson: lesson._id
        });

        // Create progress record if it doesn't exist
        if (!progress) {
          progress = await Progress.create({
            enrollment: enrollment._id,
            lesson: lesson._id,
            user: req.user._id
          });
        }
      }
    }

    // Get next lesson
    const nextLesson = await Lesson.getNextLesson(lesson.course._id, lesson.order);

    res.status(200).json({
      success: true,
      data: {
        lesson,
        progress,
        nextLesson: nextLesson ? {
          _id: nextLesson._id,
          title: nextLesson.title,
          order: nextLesson.order
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create lesson
// @route   POST /api/courses/:courseId/lessons
// @access  Private (course instructor)
exports.createLesson = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check ownership
    if (course.instructor.toString() !== req.va._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add lessons to this course'
      });
    }

    // Add course reference
    req.body.course = course._id;

    // Auto-increment order if not provided
    if (!req.body.order) {
      const lastLesson = await Lesson.findOne({ course: course._id })
        .sort('-order');
      req.body.order = lastLesson ? lastLesson.order + 1 : 1;
    }

    const lesson = await Lesson.create(req.body);

    res.status(201).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private (course instructor)
exports.updateLesson = async (req, res, next) => {
  try {
    let lesson = await Lesson.findById(req.params.id)
      .populate('course', 'instructor');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check ownership
    if (lesson.course.instructor.toString() !== req.va._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this lesson'
      });
    }

    // Prevent changing course
    delete req.body.course;

    lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Private (course instructor)
exports.deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'instructor');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check ownership
    if (lesson.course.instructor.toString() !== req.va._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this lesson'
      });
    }

    // Delete all progress records for this lesson
    await Progress.deleteMany({ lesson: lesson._id });

    await lesson.deleteOne();

    // Reorder remaining lessons
    await Lesson.updateMany(
      { course: lesson.course._id, order: { $gt: lesson.order } },
      { $inc: { order: -1 } }
    );

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Reorder lessons
// @route   PUT /api/courses/:courseId/lessons/reorder
// @access  Private (course instructor)
exports.reorderLessons = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check ownership
    if (course.instructor.toString() !== req.va._id.toString() && !req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reorder lessons'
      });
    }

    const { lessonOrders } = req.body;

    if (!Array.isArray(lessonOrders)) {
      return res.status(400).json({
        success: false,
        error: 'lessonOrders must be an array'
      });
    }

    await Lesson.reorderLessons(course._id, lessonOrders);

    const lessons = await Lesson.find({ course: course._id })
      .sort('order');

    res.status(200).json({
      success: true,
      data: lessons
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update lesson progress
// @route   PUT /api/lessons/:id/progress
// @access  Private (enrolled users)
exports.updateProgress = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: lesson.course,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'You must be enrolled to track progress'
      });
    }

    // Find or create progress record
    let progress = await Progress.findOne({
      enrollment: enrollment._id,
      lesson: lesson._id,
      user: req.user._id
    });

    if (!progress) {
      progress = await Progress.create({
        enrollment: enrollment._id,
        lesson: lesson._id,
        user: req.user._id
      });
    }

    const { action, position, duration } = req.body;

    switch (action) {
      case 'start':
        await progress.startWatchSession(position || 0);
        break;
      
      case 'update':
        if (position !== undefined) {
          progress.lastWatchedPosition = position;
          await progress.save();
        }
        break;
      
      case 'end':
        await progress.endWatchSession(position || progress.lastWatchedPosition);
        break;
      
      case 'seek':
        if (req.body.from !== undefined && req.body.to !== undefined) {
          await progress.recordSeek(req.body.from, req.body.to);
        }
        break;
      
      case 'complete':
        progress.completed = true;
        progress.completedAt = new Date();
        progress.completionPercentage = 100;
        await progress.save();
        break;
    }

    // Update enrollment's last accessed time
    enrollment.progress.lastAccessedAt = new Date();
    if (progress.completed && !enrollment.progress.currentLesson) {
      const nextLesson = await Lesson.getNextLesson(lesson.course, lesson.order);
      if (nextLesson) {
        enrollment.progress.currentLesson = nextLesson._id;
      }
    }
    await enrollment.save();

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Submit quiz
// @route   POST /api/lessons/:id/quiz
// @access  Private (enrolled users)
exports.submitQuiz = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson || lesson.type !== 'quiz') {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: lesson.course,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'You must be enrolled to take this quiz'
      });
    }

    // Get or create progress
    let progress = await Progress.findOne({
      enrollment: enrollment._id,
      lesson: lesson._id,
      user: req.user._id
    });

    if (!progress) {
      progress = await Progress.create({
        enrollment: enrollment._id,
        lesson: lesson._id,
        user: req.user._id
      });
    }

    const result = await progress.submitQuiz(req.body.answers);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Submit assignment
// @route   POST /api/lessons/:id/assignment
// @access  Private (enrolled users)
exports.submitAssignment = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson || lesson.type !== 'assignment') {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: lesson.course,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'You must be enrolled to submit assignments'
      });
    }

    // Get or create progress
    let progress = await Progress.findOne({
      enrollment: enrollment._id,
      lesson: lesson._id,
      user: req.user._id
    });

    if (!progress) {
      progress = await Progress.create({
        enrollment: enrollment._id,
        lesson: lesson._id,
        user: req.user._id
      });
    }

    await progress.submitAssignment({
      url: req.body.url,
      text: req.body.text
    });

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};