const Business = require('../models/Business');
const BillingHistory = require('../models/BillingHistory');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Admin Billing Controller
 * Handles all billing-related operations for admin users
 */

// @desc    Get billing information for a specific business
// @route   GET /api/admin/businesses/:businessId/billing
// @access  Private/Admin
exports.getBusinessBilling = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Validate businessId
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business ID'
      });
    }
    
    const business = await Business.findById(businessId)
      .select('company contactName email billing')
      .populate('user', 'email');
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    // Get billing summary
    const summary = await BillingHistory.getBillingSummary(businessId);
    
    res.json({
      success: true,
      data: {
        business: {
          id: business._id,
          company: business.company,
          contactName: business.contactName,
          email: business.email,
          userEmail: business.user?.email
        },
        billing: business.billing || {},
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching business billing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing information'
    });
  }
};

// @desc    Update billing information for a business
// @route   PUT /api/admin/businesses/:businessId/billing
// @access  Private/Admin
exports.updateBusinessBilling = async (req, res) => {
  try {
    const { businessId } = req.params;
    const updateData = req.body;
    
    // Validate businessId
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business ID'
      });
    }
    
    const business = await Business.findById(businessId);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    // Initialize billing object if it doesn't exist
    if (!business.billing) {
      business.billing = {};
    }
    
    // Update billing fields
    const allowedFields = [
      'stripeCustomerId',
      'paymentMethod',
      'billingAddress',
      'subscription',
      'settings',
      'balance',
      'credits'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (typeof updateData[field] === 'object' && !Array.isArray(updateData[field])) {
          // Merge nested objects
          business.billing[field] = {
            ...business.billing[field]?.toObject?.() || {},
            ...updateData[field]
          };
        } else {
          business.billing[field] = updateData[field];
        }
      }
    });
    
    await business.save();
    
    // Log the update in billing history
    await BillingHistory.create({
      business: businessId,
      type: 'adjustment',
      status: 'completed',
      amount: 0,
      description: 'Billing information updated by admin',
      processedBy: req.user._id,
      notes: `Updated fields: ${Object.keys(updateData).join(', ')}`,
      processedAt: new Date()
    });
    
    res.json({
      success: true,
      data: {
        billing: business.billing,
        message: 'Billing information updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating business billing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update billing information'
    });
  }
};

// @desc    Get billing history for a business
// @route   GET /api/admin/businesses/:businessId/billing/history
// @access  Private/Admin
exports.getBillingHistory = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status,
      startDate,
      endDate,
      sort = '-createdAt'
    } = req.query;
    
    // Validate businessId
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business ID'
      });
    }
    
    // Build query
    const query = { business: businessId };
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [history, total, business] = await Promise.all([
      BillingHistory.find(query)
        .populate('processedBy', 'email name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      BillingHistory.countDocuments(query),
      Business.findById(businessId).select('company')
    ]);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    // Get summary for the period
    const summary = await BillingHistory.getBillingSummary(
      businessId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.json({
      success: true,
      data: {
        business: {
          id: business._id,
          company: business.company
        },
        history,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing history'
    });
  }
};

// @desc    Add a manual charge or payment
// @route   POST /api/admin/businesses/:businessId/billing/charge
// @access  Private/Admin
exports.addManualCharge = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { 
      type, 
      amount, 
      description, 
      status = 'completed',
      paymentMethod,
      notes,
      invoiceDetails
    } = req.body;
    
    // Validate businessId
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business ID'
      });
    }
    
    // Validate required fields
    if (!type || !amount || !description) {
      return res.status(400).json({
        success: false,
        error: 'Type, amount, and description are required'
      });
    }
    
    // Validate type
    const validTypes = ['charge', 'payment', 'refund', 'credit', 'adjustment'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }
    
    const business = await Business.findById(businessId);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    // Create billing history entry
    const billingEntry = await BillingHistory.create({
      business: businessId,
      type,
      status,
      amount: amount * 100, // Convert to cents for consistency
      currency: 'USD',
      description,
      paymentMethod,
      invoice: invoiceDetails,
      processedBy: req.user._id,
      notes,
      processedAt: status === 'completed' ? new Date() : undefined,
      metadata: {
        addedBy: 'admin',
        adminId: req.user._id,
        adminEmail: req.user.email
      }
    });
    
    // Update business billing info if payment is completed
    if (status === 'completed') {
      if (!business.billing) {
        business.billing = {};
      }
      
      // Update balance based on transaction type
      if (!business.billing.balance) {
        business.billing.balance = 0;
      }
      
      switch(type) {
        case 'charge':
          business.billing.balance -= amount;
          break;
        case 'payment':
          business.billing.balance += amount;
          business.billing.lastPayment = {
            amount: amount,
            date: new Date(),
            status: 'completed',
            invoiceId: billingEntry._id
          };
          break;
        case 'credit':
          if (!business.billing.credits) {
            business.billing.credits = 0;
          }
          business.billing.credits += amount;
          break;
        case 'refund':
          business.billing.balance += amount;
          break;
      }
      
      // Add to billing history array
      if (!business.billingHistory) {
        business.billingHistory = [];
      }
      business.billingHistory.push(billingEntry._id);
      
      await business.save();
    }
    
    // Populate the response
    await billingEntry.populate('processedBy', 'email name');
    
    res.status(201).json({
      success: true,
      data: {
        transaction: billingEntry,
        currentBalance: business.billing?.balance || 0,
        currentCredits: business.billing?.credits || 0,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`
      }
    });
  } catch (error) {
    console.error('Error adding manual charge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add charge/payment'
    });
  }
};

// @desc    Get all businesses with billing information (for billing overview)
// @route   GET /api/admin/billing/overview
// @access  Private/Admin
exports.getBillingOverview = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      search,
      subscriptionStatus,
      hasOutstandingBalance,
      sort = '-updatedAt'
    } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { company: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (subscriptionStatus) {
      query['billing.subscription.status'] = subscriptionStatus;
    }
    
    if (hasOutstandingBalance === 'true') {
      query['billing.balance'] = { $lt: 0 };
    }
    
    const skip = (page - 1) * limit;
    
    const [businesses, total] = await Promise.all([
      Business.find(query)
        .select('company contactName email billing createdAt updatedAt')
        .populate('user', 'email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Business.countDocuments(query)
    ]);
    
    // Calculate totals
    const totals = await Business.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$billing.balance' },
          totalCredits: { $sum: '$billing.credits' },
          activeSubscriptions: {
            $sum: {
              $cond: [
                { $eq: ['$billing.subscription.status', 'active'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        businesses,
        totals: totals[0] || {
          totalBalance: 0,
          totalCredits: 0,
          activeSubscriptions: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching billing overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing overview'
    });
  }
};

// @desc    Process a refund for a transaction
// @route   POST /api/admin/billing/history/:transactionId/refund
// @access  Private/Admin
exports.processRefund = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;
    
    // Validate transactionId
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID'
      });
    }
    
    const originalTransaction = await BillingHistory.findById(transactionId);
    
    if (!originalTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    if (!originalTransaction.canBeRefunded()) {
      return res.status(400).json({
        success: false,
        error: 'This transaction cannot be refunded'
      });
    }
    
    const refundAmount = amount || originalTransaction.amount;
    
    if (refundAmount > originalTransaction.amount) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount cannot exceed original transaction amount'
      });
    }
    
    // Create refund entry
    const refund = await BillingHistory.create({
      business: originalTransaction.business,
      type: 'refund',
      status: 'completed',
      amount: refundAmount,
      currency: originalTransaction.currency,
      description: `Refund for transaction ${originalTransaction._id}`,
      processedBy: req.user._id,
      notes: reason,
      processedAt: new Date(),
      metadata: {
        originalTransactionId: originalTransaction._id,
        refundReason: reason,
        refundedBy: req.user.email
      }
    });
    
    // Update original transaction
    originalTransaction.refundedAt = new Date();
    originalTransaction.metadata.set('refundId', refund._id);
    await originalTransaction.save();
    
    // Update business balance
    const business = await Business.findById(originalTransaction.business);
    if (business && business.billing) {
      business.billing.balance = (business.billing.balance || 0) + (refundAmount / 100);
      await business.save();
    }
    
    res.json({
      success: true,
      data: {
        refund,
        message: 'Refund processed successfully'
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
};

// @desc    Export billing data for a business
// @route   GET /api/admin/businesses/:businessId/billing/export
// @access  Private/Admin
exports.exportBillingData = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;
    
    // Validate businessId
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business ID'
      });
    }
    
    const query = { business: businessId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const [business, history] = await Promise.all([
      Business.findById(businessId).select('company contactName email billing'),
      BillingHistory.find(query)
        .populate('processedBy', 'email name')
        .sort('-createdAt')
    ]);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }
    
    const exportData = {
      business: {
        id: business._id,
        company: business.company,
        contactName: business.contactName,
        email: business.email
      },
      billing: business.billing,
      transactions: history,
      exportDate: new Date(),
      period: {
        start: startDate || 'All time',
        end: endDate || 'Present'
      }
    };
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(history);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="billing-${businessId}-${Date.now()}.csv"`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting billing data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export billing data'
    });
  }
};

// Helper function to convert billing history to CSV
function convertToCSV(history) {
  const headers = ['Date', 'Type', 'Status', 'Amount', 'Description', 'Payment Method', 'Processed By'];
  const rows = history.map(item => [
    item.createdAt.toISOString(),
    item.type,
    item.status,
    (item.amount / 100).toFixed(2),
    item.description,
    item.paymentMethod?.type || '',
    item.processedBy?.email || 'System'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}