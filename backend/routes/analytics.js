const express = require('express');
const router = express.Router();
// HYBRID AUTH: Support both Clerk and legacy JWT during migration
const { protect } = require('../middleware/hybridAuth');
const {
  getDashboardAnalytics,
  getProfileViews, 
  getConversationAnalytics
} = require('../controllers/analyticsController');

// Apply authentication middleware to all analytics routes
router.use(protect);

// Dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

// Profile views analytics (primarily for VAs)
router.get('/profile-views', getProfileViews);

// Conversation analytics  
router.get('/conversations', getConversationAnalytics);

module.exports = router;