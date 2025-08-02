const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
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
const {
  createRoom,
  getToken,
  startRecording,
  stopRecording,
  getRecordings,
  startLiveStream,
  stopLiveStream,
  handleWebhook,
  uploadVideo,
  validateRoom,
  getParticipants
} = require('../controllers/videoSDKController');

// Multer for video uploads
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

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

// VideoSDK routes
router.post('/videosdk/rooms', protect, authorize('va'), createRoom);
router.post('/videosdk/token', protect, getToken);
router.post('/videosdk/recording/start', protect, authorize('va'), startRecording);
router.post('/videosdk/recording/stop', protect, authorize('va'), stopRecording);
router.get('/videosdk/recordings/:sessionId', protect, getRecordings);
router.post('/videosdk/livestream/start', protect, authorize('va'), startLiveStream);
router.post('/videosdk/livestream/stop', protect, authorize('va'), stopLiveStream);
router.post('/videosdk/upload', protect, authorize('va'), upload.single('video'), uploadVideo);
router.get('/videosdk/rooms/:roomId/validate', protect, validateRoom);
router.get('/videosdk/sessions/:sessionId/participants', protect, authorize('va'), getParticipants);

// VideoSDK webhook (public but verified)
router.post('/webhooks/videosdk', handleWebhook);

module.exports = router;