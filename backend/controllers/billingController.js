const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Billing = require('../models/Billing');
const Trial = require('../models/Trial');
const Business = require('../models/Business');
const User = require('../models/User');

// @desc    Create a setup intent for saving card
// @route   POST /api/billing/setup-intent
// @access  Private (Business only)
exports.createSetupIntent = async (req, res) => {
  try {
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    // Get or create billing record
    let billing = await Billing.findOne({ business: businessId });
    
    if (!billing) {
      // Get business details for Stripe customer creation
      const business = await Business.findById(businessId);
      const user = await User.findById(req.user.id);
      
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: business.company,
        metadata: {
          businessId: businessId.toString(),
          userId: req.user.id.toString()
        }
      });

      // Create billing record
      billing = await Billing.create({
        business: businessId,
        stripeCustomerId: customer.id
      });
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: billing.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        businessId: businessId.toString()
      }
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        customerId: billing.stripeCustomerId
      }
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create setup intent'
    });
  }
};

// @desc    Add/Update payment method
// @route   POST /api/billing/payment-method
// @access  Private (Business only)
exports.addPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId, setAsDefault = true } = req.body;
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Payment method ID is required'
      });
    }

    // Get billing record
    const billing = await Billing.findOne({ business: businessId });
    
    if (!billing) {
      return res.status(404).json({
        success: false,
        error: 'Billing profile not found. Please create a setup intent first.'
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: billing.stripeCustomerId
    });

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Check if payment method already exists
    const existingMethodIndex = billing.paymentMethods.findIndex(
      pm => pm.stripePaymentMethodId === paymentMethodId
    );

    const paymentMethodData = {
      stripePaymentMethodId: paymentMethodId,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year
      } : undefined,
      isDefault: setAsDefault || billing.paymentMethods.length === 0
    };

    if (existingMethodIndex >= 0) {
      // Update existing payment method
      billing.paymentMethods[existingMethodIndex] = paymentMethodData;
    } else {
      // Add new payment method
      if (setAsDefault) {
        // Remove default from other methods
        billing.paymentMethods.forEach(pm => {
          pm.isDefault = false;
        });
      }
      billing.paymentMethods.push(paymentMethodData);
    }

    // Set as default payment method in Stripe
    if (setAsDefault) {
      await stripe.customers.update(billing.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    await billing.save();

    res.status(200).json({
      success: true,
      data: billing.paymentMethods
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add payment method'
    });
  }
};

// @desc    Get saved payment methods
// @route   GET /api/billing/payment-method
// @access  Private (Business only)
exports.getPaymentMethods = async (req, res) => {
  try {
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    const billing = await Billing.findOne({ business: businessId });
    
    if (!billing) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: billing.paymentMethods
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods'
    });
  }
};

// @desc    Delete payment method
// @route   DELETE /api/billing/payment-method/:id
// @access  Private (Business only)
exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    const billing = await Billing.findOne({ business: businessId });
    
    if (!billing) {
      return res.status(404).json({
        success: false,
        error: 'Billing profile not found'
      });
    }

    // Find the payment method
    const paymentMethod = billing.paymentMethods.find(
      pm => pm.stripePaymentMethodId === id
    );

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Don't allow deletion if it's the only payment method
    if (billing.paymentMethods.length === 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the only payment method'
      });
    }

    // Detach from Stripe
    await stripe.paymentMethods.detach(id);

    // Remove from database
    billing.paymentMethods = billing.paymentMethods.filter(
      pm => pm.stripePaymentMethodId !== id
    );

    // If deleted method was default, set another as default
    if (paymentMethod.isDefault && billing.paymentMethods.length > 0) {
      billing.paymentMethods[0].isDefault = true;
      
      // Update Stripe default
      await stripe.customers.update(billing.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: billing.paymentMethods[0].stripePaymentMethodId
        }
      });
    }

    await billing.save();

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment method'
    });
  }
};

// @desc    Purchase $100 trial
// @route   POST /api/billing/purchase-trial
// @access  Private (Business only)
exports.purchaseTrial = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    // Get billing record
    const billing = await Billing.findOne({ business: businessId });
    
    if (!billing || !billing.hasValidPaymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'Please add a payment method first'
      });
    }

    // Check for existing active trial
    const existingTrial = await Trial.findOne({
      business: businessId,
      status: 'active'
    });

    if (existingTrial) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active trial'
      });
    }

    // Use provided payment method or default
    const paymentMethod = paymentMethodId || billing.getDefaultPaymentMethod().stripePaymentMethodId;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 10000, // $100 in cents
      currency: 'usd',
      customer: billing.stripeCustomerId,
      payment_method: paymentMethod,
      off_session: true,
      confirm: true,
      description: '10 Hour VA Trial Package',
      metadata: {
        businessId: businessId.toString(),
        type: 'trial_purchase'
      }
    });

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'Payment failed. Please try again or use a different payment method.'
      });
    }

    // Create trial record
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days expiry

    const trial = await Trial.create({
      business: businessId,
      billing: billing._id,
      type: '10_hour_trial',
      status: 'active',
      totalHours: 10,
      usedHours: 0,
      remainingHours: 10,
      paymentIntentId: paymentIntent.id,
      amount: 100,
      currency: 'usd',
      purchasedAt: new Date(),
      expiresAt: expiryDate
    });

    // Update billing record
    await billing.addPayment({
      stripePaymentIntentId: paymentIntent.id,
      amount: 100,
      currency: 'usd',
      status: 'succeeded',
      description: '10 Hour VA Trial Package',
      receiptUrl: paymentIntent.charges.data[0]?.receipt_url
    });

    // Update billing current trial
    billing.currentTrial = trial._id;
    await billing.save();

    // TODO: Send confirmation email to business

    res.status(200).json({
      success: true,
      data: {
        trial,
        receiptUrl: paymentIntent.charges.data[0]?.receipt_url
      },
      message: 'Trial purchased successfully! You now have 10 hours of VA services.'
    });
  } catch (error) {
    console.error('Error purchasing trial:', error);
    
    // Handle Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        error: `Payment failed: ${error.message}`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process trial purchase'
    });
  }
};

// @desc    Get current trial status
// @route   GET /api/billing/trial-status
// @access  Private (Business only)
exports.getTrialStatus = async (req, res) => {
  try {
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    // Get active trial
    const trial = await Trial.findOne({
      business: businessId,
      status: 'active'
    }).populate('usageSessions.va', 'firstName lastName');

    if (!trial) {
      return res.status(200).json({
        success: true,
        data: {
          hasTrial: false,
          message: 'No active trial found'
        }
      });
    }

    // Check for notifications
    const notifications = trial.checkNotifications();

    res.status(200).json({
      success: true,
      data: {
        hasTrial: true,
        trial: {
          id: trial._id,
          status: trial.status,
          totalHours: trial.totalHours,
          usedHours: trial.usedHours,
          remainingHours: trial.remainingHours,
          percentageUsed: trial.percentageUsed,
          purchasedAt: trial.purchasedAt,
          expiresAt: trial.expiresAt,
          daysUntilExpiry: trial.daysUntilExpiry,
          isUsable: trial.isUsable,
          recentSessions: trial.usageSessions.slice(-5) // Last 5 sessions
        },
        notifications
      }
    });
  } catch (error) {
    console.error('Error getting trial status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trial status'
    });
  }
};

// @desc    Get billing history
// @route   GET /api/billing/history
// @access  Private (Business only)
exports.getBillingHistory = async (req, res) => {
  try {
    const businessId = req.user.business;
    const { limit = 10, offset = 0 } = req.query;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    const billing = await Billing.findOne({ business: businessId });
    
    if (!billing) {
      return res.status(200).json({
        success: true,
        data: {
          payments: [],
          totalSpent: 0
        }
      });
    }

    // Sort payments by date (newest first) and paginate
    const payments = billing.payments
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: {
        payments,
        totalSpent: billing.totalSpent,
        totalPayments: billing.payments.length
      }
    });
  } catch (error) {
    console.error('Error getting billing history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get billing history'
    });
  }
};

// @desc    Start trial session (for tracking usage)
// @route   POST /api/billing/trial/start-session
// @access  Private (Business only)
exports.startTrialSession = async (req, res) => {
  try {
    const { vaId, description, taskId } = req.body;
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    // Get active trial
    const trial = await Trial.findOne({
      business: businessId,
      status: 'active'
    });

    if (!trial || !trial.isUsable) {
      return res.status(400).json({
        success: false,
        error: 'No active trial available or trial has expired'
      });
    }

    // Start session
    await trial.startSession(vaId, description, taskId);

    res.status(200).json({
      success: true,
      data: {
        sessionId: trial.usageSessions[trial.usageSessions.length - 1]._id,
        remainingHours: trial.remainingHours
      }
    });
  } catch (error) {
    console.error('Error starting trial session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start trial session'
    });
  }
};

// @desc    End trial session
// @route   POST /api/billing/trial/end-session
// @access  Private (Business only)
exports.endTrialSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    // Get active trial
    const trial = await Trial.findOne({
      business: businessId,
      'usageSessions._id': sessionId
    });

    if (!trial) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // End session
    await trial.endSession(sessionId);

    // Check for notifications
    const notifications = trial.checkNotifications();

    res.status(200).json({
      success: true,
      data: {
        usedHours: trial.usedHours,
        remainingHours: trial.remainingHours,
        percentageUsed: trial.percentageUsed,
        notifications
      }
    });
  } catch (error) {
    console.error('Error ending trial session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to end trial session'
    });
  }
};