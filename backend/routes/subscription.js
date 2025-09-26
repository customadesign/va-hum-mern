const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// All routes below require authenticated business
router.use(protect);
router.use(authorize('business'));

// Prices and plans
router.get('/prices', subscriptionController.listPrices);

// Current subscription
router.get('/subscription', subscriptionController.getCurrentSubscription);

// Create subscription
router.post('/subscription', subscriptionController.createSubscription);

// Update subscription (plan/quantity/proration)
router.post('/subscription/update', subscriptionController.updateSubscription);

// Cancel at period end
router.post('/subscription/cancel', subscriptionController.cancelSubscription);

// Resume (turn off cancel at period end)
router.post('/subscription/resume', subscriptionController.resumeSubscription);

// Invoice history and upcoming invoice preview
router.get('/invoices', subscriptionController.listInvoices);
router.get('/invoice-upcoming', subscriptionController.retrieveUpcomingInvoice);

// Apply promotion code
router.post('/promo/apply', subscriptionController.applyPromotionCode);

// Issue a refund
router.post('/refund', subscriptionController.issueRefund);

module.exports = router;