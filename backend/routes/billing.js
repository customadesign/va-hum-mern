const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateBillingInfo, validateStripeWebhook } = require('../middleware/billingValidation');
const {
  createSetupIntent,
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  purchaseTrial,
  getTrialStatus,
  getBillingHistory,
  startTrialSession,
  endTrialSession
} = require('../controllers/billingController');
const { handleStripeWebhook } = require('../controllers/stripeWebhookController');

// Stripe webhook route (must be before body parsing middleware)
// This route needs raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), validateStripeWebhook, handleStripeWebhook);

// All other routes require authentication and business profile
router.use(protect);
router.use(authorize('business'));

// Payment method routes
router.post('/setup-intent', createSetupIntent);
router.route('/payment-method')
  .get(getPaymentMethods)
  .post(addPaymentMethod);
router.delete('/payment-method/:id', deletePaymentMethod);

// Trial purchase and management
router.post('/purchase-trial', validateBillingInfo, purchaseTrial);
router.get('/trial-status', getTrialStatus);

// Billing history
router.get('/history', getBillingHistory);

// Trial session tracking
router.post('/trial/start-session', startTrialSession);
router.post('/trial/end-session', endTrialSession);

module.exports = router;