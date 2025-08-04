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

// Public route for creating VA profile short URLs (no auth required)
router.post('/vas/:vaId', createShortUrl);

// Protected routes (require authentication)
router.use(protect);

// Get short URL info and analytics
router.get('/info/:shortCode', getShortUrlInfo);

// Get all short URLs for the authenticated user
router.get('/user/all', getUserShortUrls);

// Deactivate a short URL
router.patch('/:shortCode/deactivate', deactivateShortUrl);

// Reactivate a short URL
router.patch('/:shortCode/reactivate', reactivateShortUrl);

module.exports = router; 