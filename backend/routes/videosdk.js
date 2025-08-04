const express = require('express');
const router = express.Router();
const videosdkController = require('../controllers/videosdkController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all videosdk routes
router.use(auth);

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