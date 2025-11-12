const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/hybridAuth');
const adminModerationController = require('../controllers/adminModerationController');

// All routes require admin authorization
router.use(protect, authorize('admin'));

// @route   GET /api/admin/moderation/activity/:userId
// @desc    Get detailed user activity for moderation
// @access  Private/Admin
router.get('/activity/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    query('days').optional().isInt({ min: 1, max: 365 })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminModerationController.getUserActivity
);

// @route   GET /api/admin/moderation/queue
// @desc    Get moderation queue with flagged content
// @access  Private/Admin
router.get('/queue',
  [
    query('type').optional().isIn(['all', 'messages', 'profiles', 'files']),
    query('status').optional().isIn(['pending', 'reviewed', 'flagged']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminModerationController.getModerationQueue
);

// @route   POST /api/admin/moderation/flag/:contentType/:contentId
// @desc    Flag content for review
// @access  Private/Admin
router.post('/flag/:contentType/:contentId',
  [
    param('contentType').isIn(['message', 'profile', 'file']),
    param('contentId').isMongoId(),
    body('reason').isIn(['spam', 'inappropriate', 'harassment', 'fake_profile', 'scam', 'copyright', 'other']),
    body('details').optional().isString().isLength({ max: 500 }),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical'])
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminModerationController.flagContent
);

// @route   POST /api/admin/moderation/review/:contentType/:contentId
// @desc    Review and take action on flagged content
// @access  Private/Admin
router.post('/review/:contentType/:contentId',
  [
    param('contentType').isIn(['message', 'profile', 'file']),
    param('contentId').isMongoId(),
    body('action').isIn(['approve', 'remove', 'warn', 'suspend']),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('banDuration').optional().isInt({ min: 1, max: 365 })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminModerationController.reviewContent
);

// @route   POST /api/admin/moderation/bulk
// @desc    Perform bulk moderation actions
// @access  Private/Admin
router.post('/bulk',
  [
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.type').isIn(['message', 'profile', 'file']),
    body('items.*.id').isMongoId(),
    body('action').isIn(['approve', 'remove', 'warn', 'suspend']),
    body('notes').optional().isString().isLength({ max: 1000 })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminModerationController.bulkModeration
);

// @route   GET /api/admin/moderation/stats
// @desc    Get moderation statistics
// @access  Private/Admin
router.get('/stats',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminModerationController.getModerationStats
);

// @route   POST /api/admin/moderation/scan
// @desc    Scan content for violations (AI/ML integration point)
// @access  Private/Admin
router.post('/scan',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('type').isIn(['text', 'image', 'video'])
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminModerationController.scanContent
);

module.exports = router;