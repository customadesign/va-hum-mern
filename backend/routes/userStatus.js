const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { protect } = require('../middleware/hybridAuth');
const userStatusController = require('../controllers/userStatusController');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  next();
};

// Get online status for multiple users
// GET /api/user-status
router.get('/',
  protect,
  query('userIds').optional().isString(),
  handleValidationErrors,
  userStatusController.getUserStatuses
);

// Get current user's status
// GET /api/user-status/me
router.get('/me',
  protect,
  userStatusController.getMyStatus
);

// Update current user's status
// PUT /api/user-status/me
router.put('/me',
  protect,
  [
    body('status').optional().isIn(['online', 'away', 'busy', 'offline']),
    body('customStatus').optional().custom((value) => {
      if (value === null) return true;
      if (typeof value !== 'object') return false;
      if (value.emoji && typeof value.emoji !== 'string') return false;
      if (value.text && typeof value.text !== 'string') return false;
      if (value.duration && typeof value.duration !== 'number') return false;
      return true;
    }).withMessage('Invalid custom status format')
  ],
  handleValidationErrors,
  userStatusController.updateMyStatus
);

// Update status settings
// PUT /api/user-status/settings
router.put('/settings',
  protect,
  [
    body('showOnlineStatus').optional().isBoolean(),
    body('showLastSeen').optional().isBoolean(),
    body('showTypingIndicator').optional().isBoolean(),
    body('activeStatusTimeout').optional().isInt({ min: 60000, max: 3600000 })
  ],
  handleValidationErrors,
  userStatusController.updateStatusSettings
);

// Set user online (called on connection)
// POST /api/user-status/online
router.post('/online',
  protect,
  body('socketId').optional().isString(),
  handleValidationErrors,
  userStatusController.setOnline
);

// Set user offline (called on disconnection)
// POST /api/user-status/offline
router.post('/offline',
  protect,
  userStatusController.setOffline
);

// Update last activity (heartbeat)
// POST /api/user-status/heartbeat
router.post('/heartbeat',
  protect,
  userStatusController.updateActivity
);

// Get online users in a conversation
// GET /api/user-status/conversation/:conversationId/online
router.get('/conversation/:conversationId/online',
  protect,
  userStatusController.getConversationOnlineUsers
);

// Admin route: Cleanup stale statuses
// POST /api/user-status/cleanup (admin only)
router.post('/cleanup',
  protect,
  async (req, res, next) => {
    if (!req.user.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    next();
  },
  userStatusController.cleanupStaleStatuses
);

module.exports = router;