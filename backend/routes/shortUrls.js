const express = require('express');
const router = express.Router();
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect } = require('../middleware/hybridAuth');
const {
  createShortUrl,
  createPublicVAShortUrl,
  redirectShortUrl,
  getShortUrlInfo,
  getUserShortUrls,
  deactivateShortUrl,
  reactivateShortUrl
} = require('../controllers/shortUrlController');

// Public routes (no authentication required)
router.get('/:shortCode', redirectShortUrl);

// Public VA profile sharing - anyone can create shareable links
router.post('/vas/:vaId', createPublicVAShortUrl);

// Protected routes (require authentication)
router.use(protect);

// Create short URL for own VA profile (authenticated)
router.post('/user/vas/:vaId', createShortUrl);

// Get short URL info and analytics
router.get('/info/:shortCode', getShortUrlInfo);

// Get all short URLs for the authenticated user
router.get('/user/all', getUserShortUrls);

// Deactivate a short URL
router.patch('/:shortCode/deactivate', deactivateShortUrl);

// Reactivate a short URL
router.patch('/:shortCode/reactivate', reactivateShortUrl);

module.exports = router; 