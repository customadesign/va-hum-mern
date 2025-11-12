/**
 * Admin Engagement Routes
 *
 * Platform-wide engagement management endpoints for administrators
 * All routes require admin authentication
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { body, query, validationResult } = require('express-validator');
const adminEngagementController = require('../controllers/adminEngagementController');

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminAuth);

/**
 * @route GET /api/admin/engagements
 * @desc Get all engagements (platform-wide) with filters
 * @access Private (Admin only)
 */
router.get('/',
  [
    query('businessId').optional().isMongoId().withMessage('Invalid business ID'),
    query('vaId').optional().isMongoId().withMessage('Invalid VA ID'),
    query('status').optional().isIn(['all', 'active', 'considering', 'paused', 'past']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('sort').optional().isIn(['recent', 'oldest', 'status']).withMessage('Invalid sort option')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation errors',
          details: errors.array()
        }
      });
    }

    await adminEngagementController.getAllEngagements(req, res);
  }
);

/**
 * @route GET /api/admin/engagements/analytics
 * @desc Get platform-wide engagement analytics
 * @access Private (Admin only)
 */
router.get('/analytics', adminEngagementController.getAnalytics);

/**
 * @route POST /api/admin/engagements
 * @desc Create new engagement
 * @access Private (Admin only)
 */
router.post('/',
  [
    body('clientId').isMongoId().withMessage('Valid client ID is required'),
    body('vaId').isMongoId().withMessage('Valid VA ID is required'),
    body('status').optional().isIn(['considering', 'active', 'paused', 'past']).withMessage('Invalid status'),
    body('contract.startDate').isISO8601().withMessage('Valid start date is required'),
    body('contract.endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('contract.hoursPerWeek').isInt({ min: 1, max: 168 }).withMessage('Hours per week must be between 1 and 168'),
    body('contract.rate').optional().isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
    body('contract.currency').optional().isIn(['USD', 'PHP', 'EUR', 'GBP', 'CAD', 'AUD']).withMessage('Invalid currency'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation errors',
          details: errors.array()
        }
      });
    }

    await adminEngagementController.createEngagement(req, res);
  }
);

/**
 * @route PUT /api/admin/engagements/:id
 * @desc Update engagement (full update)
 * @access Private (Admin only)
 */
router.put('/:id',
  [
    body('status').optional().isIn(['considering', 'active', 'paused', 'past']).withMessage('Invalid status'),
    body('contract.startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('contract.endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('contract.hoursPerWeek').optional().isInt({ min: 1, max: 168 }).withMessage('Hours per week must be between 1 and 168'),
    body('contract.rate').optional().isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
    body('contract.currency').optional().isIn(['USD', 'PHP', 'EUR', 'GBP', 'CAD', 'AUD']).withMessage('Invalid currency'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation errors',
          details: errors.array()
        }
      });
    }

    await adminEngagementController.updateEngagement(req, res);
  }
);

/**
 * @route PATCH /api/admin/engagements/:id/status
 * @desc Quick status update for an engagement
 * @access Private (Admin only)
 */
router.patch('/:id/status',
  [
    body('status').isIn(['considering', 'active', 'paused', 'past']).withMessage('Valid status is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation errors',
          details: errors.array()
        }
      });
    }

    await adminEngagementController.updateStatus(req, res);
  }
);

/**
 * @route DELETE /api/admin/engagements/:id
 * @desc Delete engagement (permanent)
 * @access Private (Admin only)
 */
router.delete('/:id', adminEngagementController.deleteEngagement);

module.exports = router;