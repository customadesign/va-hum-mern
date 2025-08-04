const express = require('express');
const router = express.Router();
const zoomController = require('../controllers/zoomController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all zoom routes
router.use(auth);

// Create a new webinar
router.post('/webinar', zoomController.createWebinar);

// Get webinar details
router.get('/webinar/:webinarId', zoomController.getWebinar);

// List user's webinars
router.get('/webinars', zoomController.listWebinars);

// Update webinar
router.patch('/webinar/:webinarId', zoomController.updateWebinar);

// Delete webinar
router.delete('/webinar/:webinarId', zoomController.deleteWebinar);

// Generate SDK signature for existing meeting
router.post('/signature', zoomController.generateSignature);

module.exports = router;