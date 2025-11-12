const express = require('express');
const router = express.Router();
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect, authorize, optionalAuth } = require('../middleware/hybridAuth');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getEnrolledCourses,
  getCourseStats,
  getInstructorCourses
} = require('../controllers/courseController');
const {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  updateProgress,
  submitQuiz,
  submitAssignment
} = require('../controllers/lessonController');



// Public course routes
router.get('/', optionalAuth, getCourses);
router.get('/enrolled', protect, getEnrolledCourses);
router.get('/instructor', protect, authorize('va'), getInstructorCourses);
router.get('/:id', optionalAuth, getCourse);

// Course management (VA only)
router.post('/', protect, authorize('va'), createCourse);
router.put('/:id', protect, authorize('va'), updateCourse);
router.delete('/:id', protect, authorize('va'), deleteCourse);

// Course enrollment (Business only)
router.post('/:id/enroll', protect, authorize('business'), enrollInCourse);

// Course statistics (Instructor only)
router.get('/:id/stats', protect, authorize('va'), getCourseStats);

// Lesson routes
router.get('/:courseId/lessons', optionalAuth, getLessons);
router.post('/:courseId/lessons', protect, authorize('va'), createLesson);
router.put('/:courseId/lessons/reorder', protect, authorize('va'), reorderLessons);

// Individual lesson routes
router.get('/lessons/:id', protect, getLesson);
router.put('/lessons/:id', protect, authorize('va'), updateLesson);
router.delete('/lessons/:id', protect, authorize('va'), deleteLesson);

// Lesson progress and interaction
router.put('/lessons/:id/progress', protect, updateProgress);
router.post('/lessons/:id/quiz', protect, submitQuiz);
router.post('/lessons/:id/assignment', protect, submitAssignment);


module.exports = router;