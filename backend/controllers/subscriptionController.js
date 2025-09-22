/* eslint-disable no-console */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Billing = require('../models/Billing');
const Business = require('../models/Business');
const BillingHistory = require('../models/BillingHistory');

const DEFAULT_CURRENCY = (process.env.STRIPE_DEFAULT_CURRENCY || 'usd').toLowerCase();
const TAX_ENABLED = String(process.env.STRIPE_TAX_ENABLED || '').toLowerCase() === 'true';

/**
 * Helper: ensure Billing exists and Stripe Customer is available for the business
 */
async function ensureBillingForBusiness(businessId, user) {
  let billing = await Billing.findOne({ business: businessId });
  if (billing?.stripeCustomerId) return billing;

  // Create Stripe customer if missing
  const business = await Business.findById(businessId);
  const customer = await stripe.customers.create({
    email: user?.email || business?.email || undefined,
    name: business?.company || undefined,
    metadata: {
      businessId: String(businessId),
      userId: user ? String(user._id || user.id) : undefined,
    },
  });

  billing = await Billing.create({
    business: businessId,
    stripeCustomerId: customer.id,
  });

  return billing;
}

/**
 * GET /api/billing/prices
 * List active Stripe Prices (expanded with Product)
 */
exports.listPrices = async (req, res) => {
  try {
    const { active = 'true', limit = 50 } = req.query;
    const prices = await stripe.prices.list({
      active: active !== 'false',
      limit: Math.min(Number(limit) || 50, 100),
      expand: ['data.product'],
    });

    res.json({
      success: true,
      data: prices.data.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        currency: p.currency,
        unit_amount: p.unit_amount,
        recurring: p.recurring || null,
        product: p.product && typeof p.product === 'object'
          ? {
              id: p.product.id,
              name: p.product.name,
              description: p.product.description,
              metadata: p.product.metadata,
            }
          : { id: p.product },
        metadata: p.metadata,
        active: p.active,
      })),
    });
  } catch (err) {
    console.error('listPrices error:', err);
    res.status(500).json({ success: false, error: 'Failed to list prices' });
  }
};

/**
 * GET /api/billing/subscription
 * Return the current active subscription (if any)
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) return res.status(403).json({ success: false, error: 'Business profile required' });

    const billing = await Billing.findOne({ business: businessId });
    if (!billing?.stripeCustomerId) {
      return res.json({ success: true, data: null });
    }

    const subs = await stripe.subscriptions.list({
      customer: billing.stripeCustomerId,
      status: 'all',
      expand: ['data.items.data.price.product', 'data.latest_invoice.payment_intent'],
      limit: 3,
    });

    const current = subs.data.find((s) => ['active', 'trialing', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired'].includes(s.status)) || null;

    if (!current) return res.json({ success: true, data: null });

    res.json({
      success: true,
      data: {
        id: current.id,
        status: current.status,
        cancel_at_period_end: current.cancel_at_period_end,
        current_period_start: current.current_period_start,
        current_period_end: current.current_period_end,
        latest_invoice_id: current.latest_invoice,
        payment_intent_status: current.latest_invoice?.payment_intent?.status,
        items: current.items.data.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          price: {
            id: it.price.id,
            currency: it.price.currency,
            unit_amount: it.price.unit_amount,
            recurring: it.price.recurring,
            nickname: it.price.nickname,
            product: typeof it.price.product === 'object' ? {
              id: it.price.product.id,
              name: it.price.product.name,
              metadata: it.price.product.metadata,
            } : { id: it.price.product },
          },
        })),
      },
    });
  } catch (err) {
    console.error('getCurrentSubscription error:', err);
    res.status(500).json({ success: false, error: 'Failed to get subscription' });
  }
};

/**
 * POST /api/billing/subscription
 * Body: { priceId, quantity?, promotionCode?, prorationBehavior? }
 * Create a subscription for the business using default payment method.
 * Returns SCA clientSecret if action is required.
 */
exports.createSubscription = async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) return res.status(403).json({ success: false, error: 'Business profile required' });

    const { priceId, quantity = 1, promotionCode, prorationBehavior = 'create_prorations', trialFromPrice = false } = req.body || {};
    if (!priceId) return res.status(400).json({ success: false, error: 'priceId is required' });

    const billing = await ensureBillingForBusiness(businessId, req.user);
    if (!billing?.hasValidPaymentMethod) {
      return res.status(400).json({ success: false, error: 'Please add a payment method first' });
    }
    const defaultPm = billing.getDefaultPaymentMethod().stripePaymentMethodId;

    const subParams = {
      customer: billing.stripeCustomerId,
      items: [{ price: priceId, quantity }],
      default_payment_method: defaultPm,
      payment_behavior: 'default_incomplete',
      proration_behavior: prorationBehavior,
      expand: ['latest_invoice.payment_intent', 'items.data.price.product'],
      automatic_tax: TAX_ENABLED ? { enabled: true } : undefined,
      collection_method: 'charge_automatically',
    };

    if (promotionCode) subParams.promotion_code = promotionCode;
    // If using plan-defined trial
    if (trialFromPrice) subParams.trial_from_plan = true;

    const subscription = await stripe.subscriptions.create(subParams);

    const pi = subscription.latest_invoice?.payment_intent;
    const needsAction = pi && (pi.status === 'requires_action' || pi.status === 'requires_confirmation');

    // Optionally write to Business model for quick lookup
    await Business.findByIdAndUpdate(
      businessId,
      {
        $set: {
          'billing.subscription.planId': subscription.items.data[0]?.price?.id,
          'billing.subscription.planName': subscription.items.data[0]?.price?.nickname || subscription.items.data[0]?.price?.id,
          'billing.subscription.status': subscription.status,
          'billing.subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
          'billing.subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          'billing.subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end === true,
          'billing.subscription.currency': subscription.items.data[0]?.price?.currency || DEFAULT_CURRENCY,
        },
      },
      { new: false }
    );

    res.json({
      success: true,
      data: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end,
        latest_invoice_id: subscription.latest_invoice?.id || subscription.latest_invoice,
        payment_intent_status: pi?.status,
        clientSecret: needsAction ? pi.client_secret : undefined,
        requiresAction: !!needsAction,
        items: subscription.items.data.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          price: {
            id: it.price.id,
            unit_amount: it.price.unit_amount,
            currency: it.price.currency,
            recurring: it.price.recurring,
            nickname: it.price.nickname,
          },
        })),
      },
    });
  } catch (err) {
    console.error('createSubscription error:', err);
    let msg = 'Failed to create subscription';
    if (err && err.raw && err.raw.message) msg = err.raw.message;
    res.status(400).json({ success: false, error: msg });
  }
};

/**
 * POST /api/billing/subscription/update
 * Body: { subscriptionId, priceId?, quantity?, prorationBehavior? }
 * Update a subscription's plan or quantity (proration aware).
 */
exports.updateSubscription = async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) return res.status(403).json({ success: false, error: 'Business profile required' });

    const { subscriptionId, priceId, quantity, prorationBehavior = 'create_prorations' } = req.body || {};
    if (!subscriptionId) return res.status(400).json({ success: false, error: 'subscriptionId is required' });

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data'] });

    const updatedItems = subscription.items.data.map((it) => ({
      id: it.id,
      price: priceId || it.price.id,
      quantity: typeof quantity === 'number' ? quantity : it.quantity,
    }));

    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: updatedItems,
      proration_behavior: prorationBehavior,
      expand: ['latest_invoice.payment_intent', 'items.data.price.product'],
      automatic_tax: TAX_ENABLED ? { enabled: true } : undefined,
    });

    await Business.updateOne(
      { _id: businessId },
      {
        $set: {
          'billing.subscription.planId': updated.items.data[0]?.price?.id,
          'billing.subscription.planName': updated.items.data[0]?.price?.nickname || updated.items.data[0]?.price?.id,
          'billing.subscription.status': updated.status,
          'billing.subscription.currentPeriodStart': new Date(updated.current_period_start * 1000),
          'billing.subscription.currentPeriodEnd': new Date(updated.current_period_end * 1000),
          'billing.subscription.cancelAtPeriodEnd': updated.cancel_at_period_end === true,
          'billing.subscription.currency': updated.items.data[0]?.price?.currency || DEFAULT_CURRENCY,
        },
      }
    );

    const pi = updated.latest_invoice?.payment_intent;
    const needsAction = pi && (pi.status === 'requires_action' || pi.status === 'requires_confirmation');

    res.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        cancel_at_period_end: updated.cancel_at_period_end,
        current_period_end: updated.current_period_end,
        latest_invoice_id: updated.latest_invoice?.id || updated.latest_invoice,
        payment_intent_status: pi?.status,
        clientSecret: needsAction ? pi.client_secret : undefined,
        requiresAction: !!needsAction,
      },
    });
  } catch (err) {
    console.error('updateSubscription error:', err);
    res.status(400).json({ success: false, error: err?.raw?.message || 'Failed to update subscription' });
  }
};

/**
 * POST /api/billing/subscription/cancel
 * Body: { subscriptionId, cancelAtPeriodEnd? = true }
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) return res.status(403).json({ success: false, error: 'Business profile required' });

    const { subscriptionId, cancelAtPeriodEnd = true } = req.body || {};
    if (!subscriptionId) return res.status(400).json({ success: false, error: 'subscriptionId is required' });

    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !!cancelAtPeriodEnd,
    });

    await Business.updateOne(
      { _id: businessId },
      {
        $set: {
          'billing.subscription.status': updated.status,
          'billing.subscription.cancelAtPeriodEnd': updated.cancel_at_period_end === true,
          'billing.subscription.currentPeriodEnd': new Date(updated.current_period_end * 1000),
        },
      }
    );

    res.json({ success: true, data: { id: updated.id, status: updated.status, cancel_at_period_end: updated.cancel_at_period_end } });
  } catch (err) {
    console.error('cancelSubscription error:', err);
    res.status(400).json({ success: false, error: err?.raw?.message || 'Failed to cancel subscription' });
  }
};

/**
 * POST /api/billing/subscription/resume
 * Body: { subscriptionId }
 * Resume a subscription by turning off cancel_at_period_end
 */
exports.resumeSubscription = async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) return res.status(403).json({ success: false, error: 'Business profile required' });

    const { subscriptionId } = req.body || {};
    if (!subscriptionId) return res.status(400).json({ success: false, error: 'subscriptionId is required' });

    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    await Business.updateOne(
      { _id: businessId },
      {
        $set: {
          'billing.subscription.status': updated.status,
          'billing.subscription.cancelAtPeriodEnd': updated.cancel_at_period_end === true,
          'billing.subscription.currentPeriodEnd': new Date(updated.current_period_end * 1000),
        },
      }
    );

    res.json({ success: true, data: { id: updated.id, status: updated.status, cancel_at_period_end: updated.cancel_at_period_end } });
  } catch (err) {
    console.error('resumeSubscription error:', err);
    res.status(400).json({ success: false, error: err?.raw?.message || 'Failed to resume subscription' });
  }
};

/**
 * GET /api/billing/invoices?limit=10
 * Return invoice history (with PDF links)
 */
exports.listInvoices = async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) return res.status(403).json({ success: false, error: 'Business profile required' });

    const { limit = 10 } = req.query;

    const billing = await Billing.findOne({ business: businessId });
    if (!billing?.stripeCustomerId) return res.json({ success: true, data: [] });

    const invoices = await stripe.invoices.list({
      customer: billing.stripeCustomerId,
      limit: Math.min(Number(limit) || 10, 100),
      expand: ['data.charge', 'data.payment_intent'],
    });

    res.json({
      success: true,
      data: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        currency: inv.currency,
        amount_due: inv.amount_due,
        amount_paid: inv.amount_paid,
        amount_remaining: inv.amount_remaining,
        hosted_invoice_url: inv.hosted_invoice_url,
        invoice_pdf: inv.invoice_pdf,
        created: inv.created,
      })),
    });
  } catch (err) {
    console.error('listInvoices error:', err);
    res.status(500).json({ success: false, error: 'Failed to list invoices' });
  }
};

/**
 * GET /api/billing/invoice-upcoming
 * Preview upcoming invoice for current subscription or with params.
 */
exports.retrieveUpcomingInvoice = async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) return res.status(403).json({ success: false, error: 'Business profile required' });

    const billing = await Billing.findOne({ business: businessId });
    if (!billing?.stripeCustomerId) return res.status(400).json({ success: false, error: 'No Stripe customer' });

    const upcoming = await stripe.invoices.retrieveUpcoming({
      customer: billing.stripeCustomerId,
    });

    res.json({
      success: true,
      data: {
        amount_due: upcoming.amount_due,
        currency: upcoming.currency,
        total: upcoming.total,
        lines: upcoming.lines?.data?.map((line) => ({
          id: line.id,
          amount: line.amount,
          currency: line.currency,
          description: line.description,
          period: line.period,
          price: line.price ? { id: line.price.id, nickname: line.price.nickname, unit_amount: line.price.unit_amount } : null,
        })) || [],
      },
    });
  } catch (err) {
    console.error('retrieveUpcomingInvoice error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve upcoming invoice' });
  }
};

/**
 * POST /api/billing/promo/apply
 * Body: { subscriptionId?, promotionCode }
 * Apply a promotion code to current subscription or customer.
 */
exports.applyPromotionCode = async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) return res.status(403).json({ success: false, error: 'Business profile required' });

    const { subscriptionId, promotionCode } = req.body || {};
    if (!promotionCode) return res.status(400).json({ success: false, error: 'promotionCode is required' });

    const billing = await Billing.findOne({ business: businessId });
    if (!billing?.stripeCustomerId) return res.status(400).json({ success: false, error: 'No Stripe customer' });

    if (subscriptionId) {
      const updated = await stripe.subscriptions.update(subscriptionId, { promotion_code: promotionCode });
      return res.json({ success: true, data: { id: updated.id, discount: updated.discount } });
    }

    // apply to customer for future invoices/subscriptions
    const updatedCustomer = await stripe.customers.update(billing.stripeCustomerId, { promotion_code: promotionCode });
    res.json({ success: true, data: { id: updatedCustomer.id } });
  } catch (err) {
    console.error('applyPromotionCode error:', err);
    res.status(400).json({ success: false, error: err?.raw?.message || 'Failed to apply promotion code' });
  }
};

/**
 * POST /api/billing/refund
 * Body: { paymentIntentId, amount? (in cents), reason? }
 */
exports.issueRefund = async (req, res) => {
  try {
    const businessId = req.user.business;
    if (!businessId) return res.status(403).json({ success: false, error: 'Business profile required' });

    const { paymentIntentId, amount, reason } = req.body || {};
    if (!paymentIntentId) return res.status(400).json({ success: false, error: 'paymentIntentId is required' });

    // Optional: verify PI belongs to this business by checking Billing.payments
    const billing = await Billing.findOne({ business: businessId });
    const hasPayment = billing?.payments?.some((p) => p.stripePaymentIntentId === paymentIntentId);
    if (!hasPayment) {
      // Not found in local records; proceed but log
      console.warn(`Refund requested for PI not found in billing.payments: ${paymentIntentId}`);
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: typeof amount === 'number' ? amount : undefined,
      reason: reason || undefined,
    });

    // Record to BillingHistory
    await BillingHistory.create({
      business: businessId,
      type: 'refund',
      status: refund.status === 'succeeded' ? 'completed' : 'processing',
      amount: refund.amount || 0,
      currency: DEFAULT_CURRENCY.toUpperCase(),
      description: `Refund for ${paymentIntentId}`,
      stripeRefundId: refund.id,
      metadata: { paymentIntentId, reason },
      processedAt: new Date(),
    });

    res.json({ success: true, data: { id: refund.id, status: refund.status } });
  } catch (err) {
    console.error('issueRefund error:', err);
    res.status(400).json({ success: false, error: err?.raw?.message || 'Failed to issue refund' });
  }
};