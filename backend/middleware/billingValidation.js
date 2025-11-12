const Billing = require('../models/Billing');
const Business = require('../models/Business');

// Validate that business has billing information before making purchases
exports.validateBillingInfo = async (req, res, next) => {
  try {
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required for billing operations'
      });
    }

    // Check if business profile is complete
    const business = await Business.findById(businessId);
    
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business profile not found'
      });
    }

    // Check for required business information
    const requiredFields = ['company', 'contactName', 'email'];
    const missingFields = requiredFields.filter(field => !business[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Please complete your business profile. Missing: ${missingFields.join(', ')}`
      });
    }

    // Check if billing profile exists
    const billing = await Billing.findOne({ business: businessId });
    
    if (!billing) {
      return res.status(400).json({
        success: false,
        error: 'No billing profile found. Please set up payment method first.'
      });
    }

    // Check if has valid payment method
    if (!billing.hasValidPaymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'No valid payment method found. Please add a payment method.'
      });
    }

    // Attach billing to request for use in controller
    req.billing = billing;
    req.business = business;
    
    next();
  } catch (error) {
    console.error('Billing validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error validating billing information'
    });
  }
};

// Validate Stripe webhook signatures
exports.validateStripeWebhook = (req, res, next) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({
      success: false,
      error: 'Webhook configuration error'
    });
  }

  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).json({
      success: false,
      error: 'No Stripe signature found'
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
    
    req.stripeEvent = event;
    next();
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid webhook signature'
    });
  }
};

// Check trial availability
exports.checkTrialAvailability = async (req, res, next) => {
  try {
    const businessId = req.user.business;
    
    if (!businessId) {
      return res.status(403).json({
        success: false,
        error: 'Business profile required'
      });
    }

    const Trial = require('../models/Trial');
    
    // Check for active trial
    const activeTrial = await Trial.findOne({
      business: businessId,
      status: 'active'
    });

    if (!activeTrial) {
      return res.status(400).json({
        success: false,
        error: 'No active trial found. Please purchase a trial package.'
      });
    }

    // Check if trial is usable
    if (!activeTrial.isUsable) {
      return res.status(400).json({
        success: false,
        error: 'Trial has expired or no hours remaining'
      });
    }

    // Attach trial to request
    req.trial = activeTrial;
    next();
  } catch (error) {
    console.error('Trial availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'Error checking trial availability'
    });
  }
};

// Rate limiting for billing operations
exports.billingRateLimit = (req, res, next) => {
  const rateLimit = require('express-rate-limit');
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many billing requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  return limiter(req, res, next);
};

// Validate payment method ownership
exports.validatePaymentMethodOwnership = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.body;
    const businessId = req.user.business;
    
    if (!paymentMethodId) {
      return next(); // No payment method specified, use default
    }

    const billing = await Billing.findOne({ business: businessId });
    
    if (!billing) {
      return res.status(404).json({
        success: false,
        error: 'Billing profile not found'
      });
    }

    // Check if payment method belongs to this business
    const paymentMethod = billing.paymentMethods.find(
      pm => pm.stripePaymentMethodId === paymentMethodId
    );

    if (!paymentMethod) {
      return res.status(403).json({
        success: false,
        error: 'Payment method not found or does not belong to this account'
      });
    }

    next();
  } catch (error) {
    console.error('Payment method validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Error validating payment method'
    });
  }
};