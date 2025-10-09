/**
 * Engagement Controller
 *
 * Handles business-facing engagement operations including:
 * - Dashboard summary (with caching)
 * - Engagement list with pagination and filtering
 * - Individual engagement details
 * - Billing information aggregation
 */

const Engagement = require('../models/Engagement');
const Billing = require('../models/Billing');
const mongoose = require('mongoose');
const redisCache = require('../utils/redisCache');

/**
 * Get engagement summary for dashboard widget
 * @route GET /api/engagements/summary
 * @access Private (Business only)
 */
exports.getSummary = async (req, res) => {
  try {
    const businessId = req.user._id;
    const cacheKey = redisCache.CacheKeys.engagementSummary(businessId);

    // Try to get from cache
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      console.log(`[Engagement] Returning cached summary for business ${businessId}`);
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Get status counts using aggregation
    const result = await Engagement.getStatusCounts(businessId);

    const summary = result.length > 0 ? result[0] : {
      total: 0,
      active: 0,
      considering: 0,
      paused: 0,
      past: 0
    };

    // Calculate inactive count (paused + past per PRD)
    summary.inactive = (summary.paused || 0) + (summary.past || 0);

    // Get total spent from billing
    let totalSpent = 0;
    let currency = 'USD';

    try {
      const billing = await Billing.findOne({ business: businessId });
      if (billing && billing.payments) {
        // Sum all successful payments
        totalSpent = billing.payments
          .filter(p => p.status === 'succeeded')
          .reduce((sum, p) => sum + (p.amount || 0), 0) / 100; // Convert cents to dollars

        // Get currency from first payment or default
        if (billing.payments.length > 0 && billing.payments[0].currency) {
          currency = billing.payments[0].currency.toUpperCase();
        }
      }
    } catch (billingError) {
      console.error('[Engagement] Error fetching billing data:', billingError.message);
      // Continue without billing data
    }

    // Add billing information
    summary.totalSpent = totalSpent;
    summary.currency = currency;

    // Cache the result (5 minutes TTL as per PRD)
    await redisCache.set(cacheKey, summary, 300);

    res.json({
      success: true,
      data: summary,
      cached: false
    });
  } catch (error) {
    console.error('[Engagement] Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUMMARY_FETCH_FAILED',
        message: 'Failed to fetch engagement summary',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Get paginated list of engagements
 * @route GET /api/engagements
 * @access Private (Business only)
 */
exports.getEngagements = async (req, res) => {
  try {
    const businessId = req.user._id;

    // Parse query parameters
    const {
      status = 'all',
      limit = 20,
      page = 1,
      sort = 'recent',
      search = ''
    } = req.query;

    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page
    const pageNum = Math.max(parseInt(page), 1);
    const skip = (pageNum - 1) * limitNum;

    // Build query filter
    const filter = { clientId: businessId };

    // Add status filter
    if (status !== 'all') {
      if (status === 'inactive') {
        // Inactive includes paused and past only (per PRD)
        filter.status = { $in: ['paused', 'past'] };
      } else {
        filter.status = status;
      }
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'recent':
        sortOptions = { lastActivityAt: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { lastActivityAt: 1, createdAt: 1 };
        break;
      case 'status':
        sortOptions = { status: 1, lastActivityAt: -1 };
        break;
      case 'name':
        sortOptions = { 'vaId.fullName': 1 };
        break;
      default:
        sortOptions = { lastActivityAt: -1, createdAt: -1 };
    }

    // Execute query with population
    const [engagements, totalCount] = await Promise.all([
      Engagement.find(filter)
        .populate({
          path: 'vaId',
          select: 'name firstName lastName displayName avatar email timezone specialties location',
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),

      Engagement.countDocuments(filter)
    ]);

    // Get billing totals for each engagement
    const engagementsWithBilling = await Promise.all(
      engagements.map(async (engagement) => {
        let totalBilled = 0;

        try {
          // Calculate total from billing records
          const billing = await Billing.findOne({ business: businessId });
          if (billing && billing.payments) {
            // For now, we attribute all payments to the engagement
            // In future, add engagementId field to payments for granular tracking
            totalBilled = billing.payments
              .filter(p => p.status === 'succeeded')
              .reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
          }
        } catch (error) {
          console.error('[Engagement] Error fetching billing for engagement:', error.message);
        }

        return {
          id: engagement._id,
          status: engagement.status,
          va: engagement.vaId ? {
            id: engagement.vaId._id,
            fullName: engagement.vaId.displayName || engagement.vaId.name ||
              `${engagement.vaId.firstName || ''} ${engagement.vaId.lastName || ''}`.trim() || 'Unknown VA',
            avatarUrl: engagement.vaId.avatar,
            email: engagement.vaId.email,
            timezone: engagement.vaId.timezone,
            location: engagement.vaId.location,
            specialties: engagement.vaId.specialties || []
          } : null,
          contract: {
            startDate: engagement.contract.startDate,
            endDate: engagement.contract.endDate,
            hoursPerWeek: engagement.contract.hoursPerWeek,
            rate: engagement.contract.rate,
            currency: engagement.contract.currency || 'USD'
          },
          totalBilled,
          lastActivityAt: engagement.lastActivityAt,
          updatedAt: engagement.updatedAt,
          createdAt: engagement.createdAt,
          notes: engagement.notes,
          tags: engagement.tags || []
        };
      })
    );

    // Apply search filter if provided (client-side for now)
    let filteredEngagements = engagementsWithBilling;
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      filteredEngagements = engagementsWithBilling.filter(eng => {
        const searchableText = [
          eng.va?.fullName,
          eng.va?.email,
          eng.notes,
          ...(eng.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      });
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: filteredEngagements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        status,
        sort,
        search
      }
    });
  } catch (error) {
    console.error('[Engagement] Error fetching engagements:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ENGAGEMENTS_FETCH_FAILED',
        message: 'Failed to fetch engagements',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Get detailed billing information for an engagement
 * @route GET /api/engagements/:id/billing
 * @access Private (Business involved in engagement)
 */
exports.getBilling = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user._id;

    // Validate engagement ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ENGAGEMENT_ID',
          message: 'Invalid engagement ID format'
        }
      });
    }

    // Check cache
    const cacheKey = redisCache.CacheKeys.engagementBilling(id);
    const cached = await redisCache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Verify engagement exists and belongs to business
    const engagement = await Engagement.findById(id);
    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ENGAGEMENT_NOT_FOUND',
          message: 'Engagement not found'
        }
      });
    }

    // Authorization check
    if (engagement.clientId.toString() !== businessId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to view this engagement billing'
        }
      });
    }

    // Get billing data
    const billing = await Billing.findOne({ business: businessId });

    if (!billing || !billing.payments || billing.payments.length === 0) {
      const noBillingData = {
        engagementId: id,
        totalAmount: 0,
        currency: 'USD',
        payments: [],
        statistics: {
          totalPayments: 0,
          successfulPayments: 0,
          failedPayments: 0,
          averageAmount: 0
        }
      };

      return res.json({
        success: true,
        data: noBillingData
      });
    }

    // Aggregate payment data
    // Note: Future enhancement - filter by engagement-specific payments
    const payments = billing.payments.map(p => ({
      id: p.stripePaymentIntentId,
      amount: p.amount / 100, // Convert cents to dollars
      currency: p.currency ? p.currency.toUpperCase() : 'USD',
      status: p.status,
      description: p.description,
      receiptUrl: p.receiptUrl,
      createdAt: p.createdAt
    }));

    // Calculate statistics
    const successfulPayments = payments.filter(p => p.status === 'succeeded');
    const failedPayments = payments.filter(p => p.status === 'failed');
    const totalAmount = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
    const averageAmount = successfulPayments.length > 0 ? totalAmount / successfulPayments.length : 0;

    const billingData = {
      engagementId: id,
      totalAmount,
      currency: payments[0]?.currency || 'USD',
      payments: payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      statistics: {
        totalPayments: payments.length,
        successfulPayments: successfulPayments.length,
        failedPayments: failedPayments.length,
        averageAmount: Math.round(averageAmount * 100) / 100
      }
    };

    // Cache for 5 minutes
    await redisCache.set(cacheKey, billingData, 300);

    res.json({
      success: true,
      data: billingData,
      cached: false
    });
  } catch (error) {
    console.error('[Engagement] Error fetching billing:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BILLING_FETCH_FAILED',
        message: 'Failed to fetch billing information',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};