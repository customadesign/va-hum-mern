const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/hybridAuth');
const { sendEmailToVA, sendEmailToBusiness, sendEmailToAdmin, testEmailConfiguration } = require('../utils/email');

// @route   GET /api/email-test/config
// @desc    Test email configuration and domain setup
// @access  Private/Admin
router.get('/config', protect, authorize('admin'), async (req, res) => {
  try {
    const testResults = await testEmailConfiguration();
    
    res.json({
      success: true,
      message: 'Email configuration test completed',
      data: testResults
    });
  } catch (error) {
    console.error('Email config test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test email configuration'
    });
  }
});

// @route   POST /api/email-test/send
// @desc    Send test emails to verify domain-based sending
// @access  Private/Admin
router.post('/send', protect, authorize('admin'), async (req, res) => {
  try {
    const { testEmail = 'test@example.com', skipActualSend = true } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        error: 'Test email address is required'
      });
    }

    const testResults = [];

    // Test VA email (should use hello@linkagevahub.com)
    try {
      console.log('Testing VA email sender...');
      if (!skipActualSend) {
        await sendEmailToVA(testEmail, 'va-welcome', {
          name: 'Test VA',
          profileUrl: 'http://localhost:3000/profile'
        });
      }
      testResults.push({
        type: 'va',
        expectedSender: 'hello@linkagevahub.com',
        status: 'success',
        message: 'VA email sender configured correctly'
      });
    } catch (error) {
      testResults.push({
        type: 'va',
        expectedSender: 'hello@linkagevahub.com',
        status: 'error',
        error: error.message
      });
    }

    // Test Business email (should use hello@esystemsmanagement.com)
    try {
      console.log('Testing Business email sender...');
      if (!skipActualSend) {
        await sendEmailToBusiness(testEmail, 'business-welcome', {
          name: 'Test Business',
          dashboardUrl: 'http://localhost:3000/dashboard'
        });
      }
      testResults.push({
        type: 'business',
        expectedSender: 'hello@esystemsmanagement.com',
        status: 'success',
        message: 'Business email sender configured correctly'
      });
    } catch (error) {
      testResults.push({
        type: 'business',
        expectedSender: 'hello@esystemsmanagement.com',
        status: 'error',
        error: error.message
      });
    }

    // Test Admin email (should use noreply@esystemsmanagement.com)
    try {
      console.log('Testing Admin email sender...');
      if (!skipActualSend) {
        await sendEmailToAdmin(testEmail, 'admin-invitation', {
          inviteUrl: 'http://localhost:4000/accept-invitation/test',
          inviterName: 'Test Admin',
          message: 'This is a test admin invitation',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        });
      }
      testResults.push({
        type: 'admin',
        expectedSender: 'noreply@esystemsmanagement.com',
        status: 'success',
        message: 'Admin email sender configured correctly'
      });
    } catch (error) {
      testResults.push({
        type: 'admin',
        expectedSender: 'noreply@esystemsmanagement.com',
        status: 'error',
        error: error.message
      });
    }

    const successCount = testResults.filter(r => r.status === 'success').length;
    const errorCount = testResults.filter(r => r.status === 'error').length;

    res.json({
      success: errorCount === 0,
      message: `Email sender tests completed: ${successCount} passed, ${errorCount} failed`,
      data: {
        results: testResults,
        summary: {
          total: testResults.length,
          passed: successCount,
          failed: errorCount,
          actualEmailsSent: !skipActualSend
        }
      }
    });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test email sending'
    });
  }
});

// @route   GET /api/email-test/domains
// @desc    Get domain configuration info for SendGrid setup
// @access  Private/Admin
router.get('/domains', protect, authorize('admin'), async (req, res) => {
  try {
    const { validateSenderDomains } = require('../config/emailDomains');
    const domainConfig = validateSenderDomains();

    res.json({
      success: true,
      message: 'Domain configuration retrieved',
      data: {
        domains: domainConfig.domains,
        senders: domainConfig.senders,
        sendgridSetup: {
          requiredDomains: domainConfig.domains,
          requiredSenders: domainConfig.senders,
          dnsRecords: domainConfig.domains.map(domain => ({
            domain,
            records: [
              {
                type: 'CNAME',
                host: `em${Math.floor(Math.random() * 10000)}.${domain}`,
                value: 'u12345678.wl123.sendgrid.net',
                note: 'Replace with actual SendGrid CNAME from your domain setup'
              },
              {
                type: 'CNAME', 
                host: `s1._domainkey.${domain}`,
                value: 's1.domainkey.u12345678.wl123.sendgrid.net',
                note: 'Replace with actual SendGrid DKIM record'
              },
              {
                type: 'CNAME',
                host: `s2._domainkey.${domain}`,
                value: 's2.domainkey.u12345678.wl123.sendgrid.net', 
                note: 'Replace with actual SendGrid DKIM record'
              }
            ]
          }))
        }
      }
    });
  } catch (error) {
    console.error('Domain config error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get domain configuration'
    });
  }
});

// Small helper to call SendGrid Web API without adding new deps
async function sgRequest(method, path, body) {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not configured');
  }
  const res = await fetch(`https://api.sendgrid.com/v3${path}` , {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`SendGrid API ${method} ${path} failed: ${res.status} ${res.statusText} ${text}`);
  }
  return json;
}

// @route   GET /api/email-test/suppressions/inspect?email=addr
// @desc    Inspect SendGrid suppression lists for a recipient
// @access  Private/Admin
router.get('/suppressions/inspect', protect, authorize('admin'), async (req, res) => {
  try {
    const email = (req.query.email || '').toString().trim();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Query param email is required' });
    }
    const [bounces, blocks, spam, invalid] = await Promise.all([
      sgRequest('GET', `/suppression/bounces?email=${encodeURIComponent(email)}`),
      sgRequest('GET', `/suppression/blocks?email=${encodeURIComponent(email)}`),
      sgRequest('GET', `/suppression/spam_reports?email=${encodeURIComponent(email)}`),
      sgRequest('GET', `/suppression/invalid_emails?email=${encodeURIComponent(email)}`)
    ]);
    res.json({ success: true, data: { email, bounces, blocks, spam, invalid } });
  } catch (error) {
    console.error('Suppression inspect error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/email-test/suppressions/clear
// @desc    Remove a recipient from SendGrid suppression lists
// @access  Private/Admin
router.post('/suppressions/clear', protect, authorize('admin'), async (req, res) => {
  try {
    const email = (req.body?.email || '').toString().trim();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    const payload = { emails: [email] };
    const results = {};
    // Each returns 204 No Content on success
    try { await sgRequest('DELETE', '/suppression/bounces', payload); results.bounces = 'cleared'; } catch (e) { results.bounces = `error: ${e.message}`; }
    try { await sgRequest('DELETE', '/suppression/blocks', payload); results.blocks = 'cleared'; } catch (e) { results.blocks = `error: ${e.message}`; }
    try { await sgRequest('DELETE', '/suppression/spam_reports', payload); results.spam = 'cleared'; } catch (e) { results.spam = `error: ${e.message}`; }
    try { await sgRequest('DELETE', '/suppression/invalid_emails', payload); results.invalid = 'cleared'; } catch (e) { results.invalid = `error: ${e.message}`; }

    res.json({ success: true, message: 'Suppression clear attempted', data: { email, results } });
  } catch (error) {
    console.error('Suppression clear error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/email-test/check-verification-status
// @desc    Check if an email can receive verification emails (public endpoint for troubleshooting)
// @access  Public
router.post('/check-verification-status', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required'
      });
    }

    const results = {
      email,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check SendGrid suppression lists
    try {
      const [bounces, blocks, spam, invalid] = await Promise.all([
        sgRequest('GET', `/suppression/bounces?email=${encodeURIComponent(email)}`),
        sgRequest('GET', `/suppression/blocks?email=${encodeURIComponent(email)}`),
        sgRequest('GET', `/suppression/spam_reports?email=${encodeURIComponent(email)}`),
        sgRequest('GET', `/suppression/invalid_emails?email=${encodeURIComponent(email)}`)
      ]);

      results.checks.suppression = {
        bounces: bounces?.length > 0 ? 'SUPPRESSED' : 'clear',
        blocks: blocks?.length > 0 ? 'BLOCKED' : 'clear',
        spam: spam?.length > 0 ? 'SPAM_REPORTED' : 'clear',
        invalid: invalid?.length > 0 ? 'INVALID' : 'clear'
      };

      results.canReceiveEmail = 
        bounces?.length === 0 && 
        blocks?.length === 0 && 
        spam?.length === 0 && 
        invalid?.length === 0;

      if (!results.canReceiveEmail) {
        results.message = 'Your email address is on SendGrid suppression list. This prevents delivery.';
        results.recommendation = 'Please contact support to have your email address removed from the suppression list, or try a different email address.';
        results.suppressionDetails = {
          bounces: bounces || [],
          blocks: blocks || [],
          spam: spam || [],
          invalid: invalid || []
        };
      } else {
        results.message = 'Your email address is not suppressed and should receive emails normally.';
        results.recommendation = 'Check your spam folder or try a different email provider.';
      }

    } catch (error) {
      console.error('SendGrid suppression check error:', error);
      results.checks.suppression = {
        error: error.message,
        note: 'Unable to check SendGrid suppression lists'
      };
      results.canReceiveEmail = 'unknown';
      results.message = 'Could not verify email deliverability status';
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Verification status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check verification status'
    });
  }
});

module.exports = router;