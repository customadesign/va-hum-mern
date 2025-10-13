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

module.exports = router;