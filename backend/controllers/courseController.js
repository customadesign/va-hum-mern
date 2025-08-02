const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const { videoSDKClient } = require('../utils/videosdk');

// @desc    Get all published courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  try {
    const {
      category,
      level,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 12,
      instructor
    } = req.query;

    // Build query
    const query = { isPublished: true };
    
    if (category) query.category = category;
    if (level) query.level = level;
    if (instructor) query.instructor = instructor;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Execute query with pagination
    const courses = await Course.find(query)
      .populate('instructor', 'name hero user')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const count = await Course.countDocuments(query);

    // Check enrollment status if user is authenticated
    if (req.user) {
      for (let course of courses) {
        course._doc.isEnrolled = await course.isUserEnrolled(req.user._id);
      }
    }

    res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findOne({
      $or: [
        { _id: req.params.id },
        { slug: req.params.id }
      ]
    })
      .populate('instructor', 'name hero bio user')
      .populate({
        path: 'lessons',
        select: 'title description order duration type isFree',
        options: { sort: 'order' }
      });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check enrollment status and get progress if user is authenticated
    if (req.user) {
      course._doc.isEnrolled = await course.isUserEnrolled(req.user._id);
      if (course._doc.isEnrolled) {
        course._doc.userProgress = await course.getUserProgress(req.user._id);
      }
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (VA only)
exports.createCourse = async (req, res, next) => {
  try {
    // Add instructor from authenticated VA
    req.body.instructor = req.va._id;

    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Course instructor or admin)
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

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
        error: 'Not authorized to update this course'
      });
    }

    // Prevent changing instructor
    delete req.body.instructor;

    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Course instructor or admin)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

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
        error: 'Not authorized to delete this course'
      });
    }

    // Delete all lessons
    await Lesson.deleteMany({ course: course._id });

    // Delete all enrollments and progress
    const enrollments = await Enrollment.find({ course: course._id });
    for (let enrollment of enrollments) {
      await Progress.deleteMany({ enrollment: enrollment._id });
    }
    await Enrollment.deleteMany({ course: course._id });

    await course.deleteOne();

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

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Business only)
exports.enrollInCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        error: 'Course is not available for enrollment'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      course: course._id,
      user: req.user._id,
      status: { $in: ['active', 'completed'] }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'Already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      course: course._id,
      business: req.business._id,
      user: req.user._id,
      payment: {
        amount: course.price,
        currency: course.currency,
        method: course.price === 0 ? 'free' : req.body.paymentMethod || 'card',
        paidAt: new Date()
      }
    });

    // Get course with lessons for response
    const enrolledCourse = await Course.findById(course._id)
      .populate('instructor', 'name hero')
      .populate({
        path: 'lessons',
        select: 'title order duration type',
        options: { sort: 'order' }
      });

    res.status(201).json({
      success: true,
      data: {
        enrollment,
        course: enrolledCourse
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user's enrolled courses
// @route   GET /api/courses/enrolled
// @access  Private
exports.getEnrolledCourses = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({
      user: req.user._id,
      status: { $in: ['active', 'completed'] }
    })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'name hero'
        }
      })
      .sort('-enrolledAt');

    const courses = enrollments.map(enrollment => ({
      ...enrollment.course.toObject(),
      enrollment: {
        id: enrollment._id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        completedAt: enrollment.completedAt
      }
    }));

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get course statistics (instructor)
// @route   GET /api/courses/:id/stats
// @access  Private (Course instructor)
exports.getCourseStats = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

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
        error: 'Not authorized to view course statistics'
      });
    }

    // Get enrollment statistics
    const enrollmentStats = await Enrollment.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get progress statistics
    const progressStats = await Enrollment.aggregate([
      { $match: { course: course._id, status: 'active' } },
      {
        $group: {
          _id: null,
          avgProgress: { $avg: '$progress.progressPercentage' },
          totalTimeSpent: { $sum: '$progress.totalTimeSpent' }
        }
      }
    ]);

    // Get rating statistics
    const ratingStats = await Enrollment.aggregate([
      { 
        $match: { 
          course: course._id,
          'rating.value': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.value' },
          totalRatings: { $sum: 1 },
          distribution: {
            $push: '$rating.value'
          }
        }
      }
    ]);

    // Calculate rating distribution
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingStats.length > 0 && ratingStats[0].distribution) {
      ratingStats[0].distribution.forEach(rating => {
        ratingDistribution[rating]++;
      });
    }

    // Get lesson completion stats
    const lessonStats = await Progress.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'enrollment',
          foreignField: '_id',
          as: 'enrollment'
        }
      },
      { $unwind: '$enrollment' },
      { $match: { 'enrollment.course': course._id } },
      {
        $group: {
          _id: '$lesson',
          completions: { $sum: { $cond: ['$completed', 1, 0] } },
          avgWatchTime: { $avg: '$watchTime' }
        }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: '_id',
          as: 'lesson'
        }
      },
      { $unwind: '$lesson' },
      {
        $project: {
          title: '$lesson.title',
          order: '$lesson.order',
          completions: 1,
          avgWatchTime: 1
        }
      },
      { $sort: { order: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        enrollments: {
          total: enrollmentStats.reduce((sum, stat) => sum + stat.count, 0),
          byStatus: enrollmentStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        },
        progress: progressStats[0] || { avgProgress: 0, totalTimeSpent: 0 },
        ratings: {
          average: ratingStats[0]?.avgRating || 0,
          total: ratingStats[0]?.totalRatings || 0,
          distribution: ratingDistribution
        },
        lessons: lessonStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get instructor's courses
// @route   GET /api/courses/instructor
// @access  Private (VA only)
exports.getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.va._id })
      .sort('-createdAt');

    // Add enrollment count for each course
    for (let course of courses) {
      const enrollmentCount = await Enrollment.countDocuments({
        course: course._id,
        status: { $in: ['active', 'completed'] }
      });
      course._doc.enrollmentCount = enrollmentCount;
    }

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};