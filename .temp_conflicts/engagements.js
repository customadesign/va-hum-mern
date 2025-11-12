const express = require('express');
const router = express.Router();
const Engagement = require('../models/Engagement');
const { protect, authorize } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const engagementController = require('../controllers/engagementController');

/**
 * @route GET /api/engagements/summary
 * @desc Get engagement summary counts for authenticated business (with caching)
 * @access Private (Business only)
 */
router.get('/summary',
  protect,
  authorize('business'),
  engagementController.getSummary
);

/**
 * @route GET /api/engagements
 * @desc Get paginated list of engagements with billing totals
 * @access Private (Business only)
 */
router.get('/',
  protect,
  authorize('business'),
  [
    query('status').optional().isIn(['all', 'active', 'inactive', 'considering', 'past', 'paused']).withMessage('Invalid status filter'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('sort').optional().isIn(['recent', 'oldest', 'status', 'name']).withMessage('Invalid sort option'),
    query('search').optional().isString().withMessage('Search must be a string')
  ],
  async (req, res) => {
    // Check validation errors
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

    // Delegate to controller
    await engagementController.getEngagements(req, res);
  }
);

/**
 * @route GET /api/engagements/:id
 * @desc Get specific engagement details
 * @access Private (Client/VA involved in engagement)
 */
router.get('/:id',
  protect,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid engagement ID'
        });
      }

      const engagement = await Engagement.findById(id)
        .populate({
          path: 'vaId',
          select: 'name firstName lastName displayName avatar email timezone'
        })
        .populate({
          path: 'clientId',
          select: 'name firstName lastName displayName avatar email'
        });

      if (!engagement) {
        return res.status(404).json({
          success: false,
          message: 'Engagement not found'
        });
      }

      // Check authorization - user must be either the client or the VA
      const userId = req.user._id.toString();
      const clientId = engagement.clientId._id.toString();
      const vaId = engagement.vaId._id.toString();

      if (userId !== clientId && userId !== vaId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Not authorized to view this engagement.'
        });
      }

      res.json({
        success: true,
        data: engagement
      });
    } catch (error) {
      console.error('Error fetching engagement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route GET /api/engagements/:id/billing
 * @desc Get detailed billing information for an engagement
 * @access Private (Business only)
 */
router.get('/:id/billing',
  protect,
  authorize('business'),
  engagementController.getBilling
);

/**
 * @route POST /api/v1/engagements
 * @desc Create new engagement
 * @access Private (Client only)
 */
router.post('/',
  protect,
  authorize('business'),
  [
    body('vaId').isMongoId().withMessage('Valid VA ID is required'),
    body('contract.startDate').isISO8601().withMessage('Valid start date is required'),
    body('contract.endDate').optional().isISO8601().withMessage('End date must be valid'),
    body('contract.hoursPerWeek').isInt({ min: 1, max: 168 }).withMessage('Hours per week must be between 1 and 168'),
    body('contract.rate').optional().isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
    body('status').optional().isIn(['considering', 'active', 'paused', 'past']).withMessage('Invalid status'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { vaId, contract, status = 'considering', notes, tags } = req.body;

      // Create engagement
      const engagement = new Engagement({
        clientId: req.user._id,
        vaId,
        status,
        contract: {
          startDate: contract.startDate,
          endDate: contract.endDate || null,
          hoursPerWeek: contract.hoursPerWeek,
          rate: contract.rate || null,
          currency: contract.currency || 'USD'
        },
        notes: notes || '',
        tags: tags || [],
        createdBy: req.user._id,
        lastActivityAt: new Date()
      });

      await engagement.save();

      // Populate the saved engagement
      await engagement.populate([
        {
          path: 'vaId',
          select: 'name firstName lastName displayName avatar email timezone'
        },
        {
          path: 'clientId',
          select: 'name firstName lastName displayName avatar email'
        }
      ]);

      res.status(201).json({
        success: true,
        message: 'Engagement created successfully',
        data: engagement
      });
    } catch (error) {
      console.error('Error creating engagement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create engagement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;
