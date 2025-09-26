const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// HitPay configuration and utilities
const getHitPayConfig = () => {
  const requiredVars = ['HITPAY_API_KEY', 'HITPAY_API_SALT', 'APP_BASE_URL'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const env = (process.env.HITPAY_ENV || 'sandbox').toLowerCase();
  const baseUrl = process.env.HITPAY_BASE_URL || 
    (env === 'live' ? 'https://api.hit-pay.com' : 'https://api.sandbox.hit-pay.com');

  return {
    apiKey: process.env.HITPAY_API_KEY,
    apiSalt: process.env.HITPAY_API_SALT,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    appBaseUrl: process.env.APP_BASE_URL.replace(/\/+$/, ''),
    env
  };
};

// HMAC utilities
const createHmac = (data, salt) => {
  // Sort keys alphabetically, exclude 'hmac' field, handle arrays
  const sortedPairs = [];
  
  Object.keys(data)
    .filter(key => key !== 'hmac')
    .sort()
    .forEach(key => {
      const value = data[key];
      if (Array.isArray(value)) {
        value.forEach(item => sortedPairs.push(`${key}=${item}`));
      } else if (value !== null && value !== undefined) {
        sortedPairs.push(`${key}=${value}`);
      }
    });

  const canonical = sortedPairs.join('&');
  return crypto.createHmac('sha256', salt).update(canonical).digest('hex');
};

const verifyHmac = (data, providedHmac, salt) => {
  if (!providedHmac) return { valid: false, reason: 'No HMAC provided' };
  
  const computed = createHmac(data, salt);
  const valid = crypto.timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(providedHmac, 'hex')
  );
  
  return { valid, computed, provided: providedHmac };
};

// In-memory payment store (replace with database in production)
const payments = new Map();
const idempotencyKeys = new Map();

const generateReferenceId = (prefix = 'webinar') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
};

const upsertPayment = (id, reference, update) => {
  const existing = payments.get(id) || {
    id,
    reference_number: reference,
    status: 'pending',
    history: [],
    created_at: new Date().toISOString()
  };

  const newRecord = {
    ...existing,
    ...update,
    updated_at: new Date().toISOString(),
    history: [
      ...existing.history,
      {
        status: update.status,
        source: update.source || 'unknown',
        note: update.note,
        at: new Date().toISOString()
      }
    ]
  };

  payments.set(id, newRecord);
  return newRecord;
};

// HitPay API helper
const callHitPayAPI = async (endpoint, options = {}) => {
  const config = getHitPayConfig();
  const url = `${config.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-BUSINESS-API-KEY': config.apiKey,
      'X-Api-Key': config.apiKey, // Compatibility
      ...options.headers
    }
  });

  const text = await response.text();
  let data = null;
  
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = (data?.message) || `HitPay API error (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
};

// POST /api/payments/hitpay/create
router.post('/create', async (req, res) => {
  try {
    console.log('[HitPay] Creating payment request...', req.body);

    const config = getHitPayConfig();
    const {
      firstName,
      lastName,
      email,
      country,
      experience,
      messenger,
      amount = 999,
      currency = 'PHP'
    } = req.body;

    // Validation
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: email, firstName, lastName'
      });
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid email format'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'Amount must be greater than 0'
      });
    }

    const reference_number = generateReferenceId('webinar');
    const redirect_url = `${config.appBaseUrl}/community/payment/return`;
    const webhook_url = `${config.appBaseUrl}/api/hitpay/webhook`;

    const paymentPayload = {
      amount: Number(amount).toFixed(2),
      currency: currency.toUpperCase(),
      reference_number,
      redirect_url,
      webhook: webhook_url,
      name: `${firstName} ${lastName}`.trim(),
      email: email.toLowerCase().trim()
    };

    console.log('[HitPay] Payment payload:', paymentPayload);

    let hitpayResponse;
    try {
      hitpayResponse = await callHitPayAPI('/v1/payment-requests', {
        method: 'POST',
        body: JSON.stringify(paymentPayload)
      });
    } catch (apiError) {
      console.error('[HitPay] API error:', {
        status: apiError.status,
        message: apiError.message,
        body: apiError.body
      });

      const status = apiError.status || 502;
      const message = apiError.body?.message || apiError.message || 'HitPay API error';
      
      return res.status(status).json({
        ok: false,
        error: message,
        details: apiError.body
      });
    }

    const paymentUrl = hitpayResponse?.payment_url || hitpayResponse?.url;
    const paymentId = String(hitpayResponse?.id || '');

    if (!paymentUrl || !paymentId) {
      console.error('[HitPay] Missing URL or ID in response:', hitpayResponse);
      return res.status(502).json({
        ok: false,
        error: 'Invalid response from payment service'
      });
    }

    // Store initial payment record
    upsertPayment(paymentId, reference_number, {
      status: 'pending',
      amount: Number(amount),
      currency: currency.toUpperCase(),
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      country,
      experience,
      messenger,
      raw: hitpayResponse,
      source: 'server',
      note: 'Webinar payment created'
    });

    console.log('[HitPay] Payment created successfully:', {
      id: paymentId,
      reference: reference_number,
      url: paymentUrl
    });

    res.json({
      ok: true,
      url: paymentUrl,
      id: paymentId,
      reference: reference_number
    });

  } catch (error) {
    console.error('[HitPay] Unexpected error:', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// POST /api/hitpay/webhook
router.post('/webhook', async (req, res) => {
  try {
    console.log('[HitPay] Webhook received:', req.body);

    const config = getHitPayConfig();
    const body = req.body;

    // Verify HMAC
    const providedHmac = body.hmac;
    const verification = verifyHmac(body, providedHmac, config.apiSalt);

    if (!verification.valid) {
      console.error('[HitPay] Invalid webhook HMAC:', verification);
      return res.status(400).json({
        ok: false,
        error: 'Invalid HMAC signature'
      });
    }

    // Idempotency check
    const idempotencyKey = `${body.payment_request_id || body.id}_${providedHmac}`;
    if (idempotencyKeys.has(idempotencyKey)) {
      console.log('[HitPay] Duplicate webhook (idempotent):', idempotencyKey);
      return res.json({ ok: true, idempotent: true });
    }

    idempotencyKeys.set(idempotencyKey, Date.now());

    // Map HitPay status to our internal status
    const statusMap = {
      'completed': 'completed',
      'failed': 'failed',
      'canceled': 'cancelled',
      'cancelled': 'cancelled',
      'pending': 'pending'
    };

    const status = statusMap[body.status] || body.status || 'unknown';
    const paymentId = body.payment_request_id || body.id;

    if (!paymentId) {
      console.error('[HitPay] No payment ID in webhook:', body);
      return res.status(400).json({
        ok: false,
        error: 'Missing payment ID'
      });
    }

    // Update payment record
    const updated = upsertPayment(paymentId, body.reference_number || '', {
      status,
      amount: Number(body.amount || 0),
      currency: body.currency || 'PHP',
      raw: body,
      source: 'webhook',
      note: `Webhook: ${body.status} → ${status}`
    });

    console.log('[HitPay] Payment updated:', {
      id: paymentId,
      status,
      reference: body.reference_number
    });

    // Clean up old idempotency keys (keep last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [key, timestamp] of idempotencyKeys.entries()) {
      if (timestamp < oneHourAgo) {
        idempotencyKeys.delete(key);
      }
    }

    res.json({ ok: true, status });

  } catch (error) {
    console.error('[HitPay] Webhook error:', error);
    res.status(500).json({
      ok: false,
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

// GET /api/payments/:id - Debug endpoint to check payment status
router.get('/payments/:id', (req, res) => {
  try {
    const payment = payments.get(req.params.id);
    
    if (!payment) {
      return res.status(404).json({
        ok: false,
        error: 'Payment not found'
      });
    }

    res.json({
      ok: true,
      payment
    });
  } catch (error) {
    console.error('[HitPay] Get payment error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to retrieve payment'
    });
  }
});

module.exports = router;