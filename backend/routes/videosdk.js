const express = require('express');
const router = express.Router();
const videosdkController = require('../controllers/videoSDKController');
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect } = require('../middleware/hybridAuth');

// Apply authentication middleware to all videosdk routes
router.use(protect);

// Create a new meeting
router.post('/meeting', videosdkController.createMeeting);

// Get meeting details
router.get('/meeting/:roomId', videosdkController.getMeeting);

// List user's meetings
router.get('/meetings', videosdkController.listMeetings);

// Generate token for existing meeting
router.post('/token', videosdkController.generateToken);

// Validate API key
router.get('/validate', videosdkController.validateApiKey);

module.exports = router;