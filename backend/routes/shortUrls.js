const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createShortUrl,
  redirectShortUrl,
  getShortUrlInfo,
  getUserShortUrls,
  deactivateShortUrl,
  reactivateShortUrl
} = require('../controllers/shortUrlController');

// Public route for redirecting short URLs
router.get('/:shortCode', redirectShortUrl);

// Protected routes (require authentication)
router.use(protect);

// Create short URL for a VA profile
router.post('/vas/:vaId', createShortUrl);

// Get short URL info and analytics
router.get('/info/:shortCode', getShortUrlInfo);

// Get all short URLs for the authenticated user
router.get('/user/all', getUserShortUrls);

// Deactivate a short URL
router.patch('/:shortCode/deactivate', deactivateShortUrl);

// Reactivate a short URL
router.patch('/:shortCode/reactivate', reactivateShortUrl);

module.exports = router; 