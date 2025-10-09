/**
 * Admin Engagement Controller
 *
 * Handles admin-only engagement operations including:
 * - Platform-wide engagement management
 * - Engagement creation/updates/deletion
 * - Status updates with cache invalidation
 * - Real-time event emission to affected businesses
 */

const Engagement = require('../models/Engagement');
const Billing = require('../models/Billing');
const User = require('../models/User');
const mongoose = require('mongoose');
const redisCache = require('../utils/redisCache');

/**
 * Emit engagement update event to business via Socket.io
 * @param {Object} io - Socket.io instance
 * @param {string} businessId - Business ID
 */
const emitEngagementUpdate = async (io, businessId) => {
  if (!io) {
    console.warn('[Admin Engagement] Socket.io not available for event emission');
    return;
  }

  try {
    // Calculate summary for event payload
    const result = await Engagement.getStatusCounts(businessId);
    const summary = result.length > 0 ? result[0] : {
      total: 0,
      active: 0,
      considering: 0,
      past: 0
    };

    summary.inactive = (summary.paused || 0) + (summary.past || 0);

    // Get billing total
    let totalSpent = 0;
    let currency = 'USD';
    try {
      const billing = await Billing.findOne({ business: businessId });
      if (billing && billing.payments) {
        totalSpent = billing.payments
          .filter(p => p.status === 'succeeded')
          .reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
        if (billing.payments.length > 0 && billing.payments[0].currency) {
          currency = billing.payments[0].currency.toUpperCase();
        }
      }
    } catch (error) {
      console.error('[Admin Engagement] Error fetching billing for event:', error.message);
    }

    summary.totalSpent = totalSpent;
    summary.currency = currency;

    // Emit to business-specific room
    const eventName = `engagements:summary:update:${businessId}`;
    const roomName = `business:${businessId}`;

    io.of('/engagements').to(roomName).emit(eventName, {
      businessId,
      summary,
      updatedAt: new Date().toISOString()
    });

    console.log(`[Admin Engagement] Emitted ${eventName} to room ${roomName}`);
  } catch (error) {
    console.error('[Admin Engagement] Error emitting event:', error);
  }
};

/**
 * Get all engagements (platform-wide) with filters
 * @route GET /api/admin/engagements
 * @access Private (Admin only)
 */
exports.getAllEngagements = async (req, res) => {
  try {
    const {
      businessId,
      vaId,
      status,
      startDate,
      endDate,
      limit = 20,
      page = 1,
      sort = 'recent'
    } = req.query;

    const limitNum = Math.min(parseInt(limit), 100);
    const pageNum = Math.max(parseInt(page), 1);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};

    if (businessId && mongoose.isValidObjectId(businessId)) {
      filter.clientId = businessId;
    }

    if (vaId && mongoose.isValidObjectId(vaId)) {
      filter.vaId = vaId;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Build sort
    let sortOptions = {};
    switch (sort) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'status':
        sortOptions = { status: 1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Execute query
    const [engagements, totalCount] = await Promise.all([
      Engagement.find(filter)
        .populate('vaId', 'name firstName lastName displayName email avatar')
        .populate('clientId', 'name firstName lastName displayName email avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),

      Engagement.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: engagements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        businessId,
        vaId,
        status,
        startDate,
        endDate,
        sort
      }
    });
  } catch (error) {
    console.error('[Admin Engagement] Error fetching all engagements:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_FETCH_FAILED',
        message: 'Failed to fetch engagements',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Create new engagement (admin only)
 * @route POST /api/admin/engagements
 * @access Private (Admin only)
 */
exports.createEngagement = async (req, res) => {
  try {
    const {
      clientId,
      vaId,
      status = 'considering',
      contract,
      notes,
      tags
    } = req.body;

    // Validate required fields
    if (!clientId || !vaId || !contract) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'clientId, vaId, and contract are required'
        }
      });
    }

    // Validate ObjectIds
    if (!mongoose.isValidObjectId(clientId) || !mongoose.isValidObjectId(vaId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid clientId or vaId'
        }
      });
    }

    // Create engagement
    const engagement = new Engagement({
      clientId,
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

    // Populate references
    await engagement.populate([
      { path: 'vaId', select: 'name firstName lastName displayName email avatar' },
      { path: 'clientId', select: 'name firstName lastName displayName email avatar' }
    ]);

    // Invalidate cache for the business
    await redisCache.invalidateEngagementCache(clientId);

    // Emit real-time update
    if (req.app.locals.io) {
      await emitEngagementUpdate(req.app.locals.io, clientId);
    }

    console.log(`[Admin Engagement] Created engagement ${engagement._id} for business ${clientId}`);

    res.status(201).json({
      success: true,
      message: 'Engagement created successfully',
      data: engagement
    });
  } catch (error) {
    console.error('[Admin Engagement] Error creating engagement:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: 'Failed to create engagement',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Update engagement (admin only)
 * @route PUT /api/admin/engagements/:id
 * @access Private (Admin only)
 */
exports.updateEngagement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid engagement ID'
        }
      });
    }

    const engagement = await Engagement.findById(id);
    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Engagement not found'
        }
      });
    }

    // Store business ID for cache invalidation
    const businessId = engagement.clientId;

    // Update fields
    if (updates.status) engagement.status = updates.status;
    if (updates.contract) {
      engagement.contract = { ...engagement.contract, ...updates.contract };
    }
    if (updates.notes !== undefined) engagement.notes = updates.notes;
    if (updates.tags) engagement.tags = updates.tags;

    engagement.updatedBy = req.user._id;
    engagement.lastActivityAt = new Date();

    await engagement.save();

    // Populate references
    await engagement.populate([
      { path: 'vaId', select: 'name firstName lastName displayName email avatar' },
      { path: 'clientId', select: 'name firstName lastName displayName email avatar' }
    ]);

    // Invalidate cache
    await redisCache.invalidateEngagementCache(businessId);

    // Emit real-time update
    if (req.app.locals.io) {
      await emitEngagementUpdate(req.app.locals.io, businessId);
    }

    console.log(`[Admin Engagement] Updated engagement ${id} for business ${businessId}`);

    res.json({
      success: true,
      message: 'Engagement updated successfully',
      data: engagement
    });
  } catch (error) {
    console.error('[Admin Engagement] Error updating engagement:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update engagement',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Quick status update (admin only)
 * @route PATCH /api/admin/engagements/:id/status
 * @access Private (Admin only)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid engagement ID'
        }
      });
    }

    if (!['considering', 'active', 'paused', 'past'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be one of: considering, active, paused, past'
        }
      });
    }

    const engagement = await Engagement.findById(id);
    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Engagement not found'
        }
      });
    }

    const businessId = engagement.clientId;

    // Update status
    await engagement.updateStatus(status, req.user._id);

    // Invalidate cache
    await redisCache.invalidateEngagementCache(businessId);

    // Emit real-time update
    if (req.app.locals.io) {
      await emitEngagementUpdate(req.app.locals.io, businessId);
    }

    console.log(`[Admin Engagement] Updated status to ${status} for engagement ${id}`);

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        id: engagement._id,
        status: engagement.status,
        updatedAt: engagement.updatedAt
      }
    });
  } catch (error) {
    console.error('[Admin Engagement] Error updating status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_UPDATE_FAILED',
        message: 'Failed to update status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Delete engagement (admin only)
 * @route DELETE /api/admin/engagements/:id
 * @access Private (Admin only)
 */
exports.deleteEngagement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid engagement ID'
        }
      });
    }

    const engagement = await Engagement.findById(id);
    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Engagement not found'
        }
      });
    }

    const businessId = engagement.clientId;

    await engagement.deleteOne();

    // Invalidate cache
    await redisCache.invalidateEngagementCache(businessId);

    // Emit real-time update
    if (req.app.locals.io) {
      await emitEngagementUpdate(req.app.locals.io, businessId);
    }

    console.log(`[Admin Engagement] Deleted engagement ${id} for business ${businessId}`);

    res.json({
      success: true,
      message: 'Engagement deleted successfully'
    });
  } catch (error) {
    console.error('[Admin Engagement] Error deleting engagement:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete engagement',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Get platform-wide analytics
 * @route GET /api/admin/engagements/analytics
 * @access Private (Admin only)
 */
exports.getAnalytics = async (req, res) => {
  try {
    // Get overall statistics
    const [
      totalEngagements,
      activeEngagements,
      consideringEngagements,
      pausedEngagements,
      pastEngagements,
      recentEngagements
    ] = await Promise.all([
      Engagement.countDocuments(),
      Engagement.countDocuments({ status: 'active' }),
      Engagement.countDocuments({ status: 'considering' }),
      Engagement.countDocuments({ status: 'paused' }),
      Engagement.countDocuments({ status: 'past' }),
      Engagement.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('vaId', 'name firstName lastName displayName email')
        .populate('clientId', 'name firstName lastName displayName email')
        .lean()
    ]);

    // Get engagement growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newEngagementsLast30Days = await Engagement.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get average contract hours
    const avgHoursResult = await Engagement.aggregate([
      {
        $group: {
          _id: null,
          averageHours: { $avg: '$contract.hoursPerWeek' }
        }
      }
    ]);

    const averageHoursPerWeek = avgHoursResult.length > 0 ? avgHoursResult[0].averageHours : 0;

    const analytics = {
      overview: {
        totalEngagements,
        activeEngagements,
        consideringEngagements,
        pausedEngagements,
        pastEngagements,
        newEngagementsLast30Days,
        averageHoursPerWeek: Math.round(averageHoursPerWeek * 10) / 10
      },
      recentEngagements,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('[Admin Engagement] Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_FAILED',
        message: 'Failed to fetch analytics',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

module.exports = {
  getAllEngagements: exports.getAllEngagements,
  createEngagement: exports.createEngagement,
  updateEngagement: exports.updateEngagement,
  updateStatus: exports.updateStatus,
  deleteEngagement: exports.deleteEngagement,
  getAnalytics: exports.getAnalytics,
  emitEngagementUpdate
};