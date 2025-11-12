const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/hybridAuth');
const adminNotificationController = require('../controllers/adminNotificationController');

// All routes require admin authorization
router.use(protect, authorize('admin'));

// @route   POST /api/admin/notifications/send-targeted
// @desc    Send notification to specific users
// @access  Private/Admin
router.post('/send-targeted',
  [
    body('userIds').isArray().withMessage('User IDs must be an array'),
    body('userIds.*').isMongoId().withMessage('Invalid user ID'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').optional().isString(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('sendEmailNotification').optional().isBoolean()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminNotificationController.sendTargetedNotification
);

// @route   POST /api/admin/notifications/send-broadcast
// @desc    Send broadcast notification to user groups
// @access  Private/Admin
router.post('/send-broadcast',
  [
    body('targetGroup').isIn(['all', 'vas', 'businesses', 'admins']),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').optional().isString(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('sendEmailNotification').optional().isBoolean(),
    body('filters').optional().isObject()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminNotificationController.sendBroadcastNotification
);

// @route   POST /api/admin/notifications/schedule
// @desc    Schedule a notification for future delivery
// @access  Private/Admin
router.post('/schedule',
  [
    body('scheduledFor').isISO8601().withMessage('Valid date is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('targetUsers').optional().isArray(),
    body('targetGroup').optional().isIn(['all', 'vas', 'businesses', 'admins']),
    body('type').optional().isString(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('sendEmailNotification').optional().isBoolean()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminNotificationController.scheduleNotification
);

// @route   GET /api/admin/notifications/templates
// @desc    Get notification templates
// @access  Private/Admin
router.get('/templates', adminNotificationController.getNotificationTemplates);

// @route   GET /api/admin/notifications/stats
// @desc    Get notification statistics
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
  adminNotificationController.getNotificationStats
);

// @route   DELETE /api/admin/notifications
// @desc    Delete notifications
// @access  Private/Admin
router.delete('/',
  [
    body('notificationIds').optional().isArray(),
    body('notificationIds.*').optional().isMongoId(),
    body('deleteAll').optional().isBoolean(),
    body('olderThan').optional().isISO8601()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Ensure at least one deletion criteria is provided
    const { notificationIds, deleteAll, olderThan } = req.body;
    if (!notificationIds && !deleteAll && !olderThan) {
      return res.status(400).json({
        error: 'At least one deletion criteria must be specified'
      });
    }
    
    next();
  },
  adminNotificationController.deleteNotifications
);

// @route   PUT /api/admin/notifications/user-settings
// @desc    Update notification settings for multiple users
// @access  Private/Admin
router.put('/user-settings',
  [
    body('userIds').isArray().withMessage('User IDs must be an array'),
    body('userIds.*').isMongoId().withMessage('Invalid user ID'),
    body('settings').isObject().withMessage('Settings must be an object'),
    body('settings.email').optional().isObject(),
    body('settings.push').optional().isObject(),
    body('settings.sms').optional().isObject()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminNotificationController.updateUserNotificationSettings
);

// @route   GET /api/admin/notifications/archived/stats
// @desc    Get archived notifications statistics
// @access  Private/Admin
router.get('/archived/stats',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('userId').optional().isMongoId()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminNotificationController.getArchivedStats
);

// @route   POST /api/admin/notifications/bulk-archive
// @desc    Bulk archive notifications based on criteria
// @access  Private/Admin
router.post('/bulk-archive',
  [
    body('criteria').isObject().withMessage('Archive criteria must be provided'),
    body('criteria.olderThan').optional().isISO8601(),
    body('criteria.type').optional().isString(),
    body('criteria.read').optional().isBoolean(),
    body('criteria.userId').optional().isMongoId()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  adminNotificationController.bulkArchiveNotifications
);

// @route   POST /api/admin/notifications/restore-archived
// @desc    Restore archived notifications
// @access  Private/Admin
router.post('/restore-archived',
  [
    body('notificationIds').optional().isArray(),
    body('notificationIds.*').optional().isMongoId(),
    body('criteria').optional().isObject(),
    body('criteria.archivedAfter').optional().isISO8601(),
    body('criteria.type').optional().isString(),
    body('criteria.userId').optional().isMongoId()
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Ensure at least one restoration criteria is provided
    const { notificationIds, criteria } = req.body;
    if (!notificationIds && !criteria) {
      return res.status(400).json({
        error: 'Either notification IDs or restoration criteria must be specified'
      });
    }
    
    next();
  },
  adminNotificationController.restoreArchivedNotifications
);

module.exports = router;