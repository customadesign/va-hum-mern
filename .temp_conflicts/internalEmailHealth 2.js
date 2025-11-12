// internalEmailHealth.js - Non-prod email health and sandbox validation

'use strict';

const express = require('express');
const router = express.Router();

const { isNonProd, validateEmailConfig } = require('../config/emailConfig');
const { testSendGridConfig } = require('../utils/sendgrid');
const { getSenderForTemplate } = require('../config/emailDomains');

// @route   GET /api/internal/email/health
// @desc    Non-prod: return SendGrid config/sandbox status and sender selections
// @access  Non-production only (returns 404 in production)
router.get('/health', async (req, res) => {
  try {
    if (!isNonProd()) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // Basic env and SendGrid checks
    const envValidation = validateEmailConfig(false);
    const sendgridStatus = await testSendGridConfig();

    // Demonstrate how senders/categories will be derived per recipient type
    const samples = [
      {
        template: 'system-notification',
        recipientType: 'va',
        email: 'sample.va@example.com',
        userData: { role: 'va' }
      },
      {
        template: 'system-notification',
        recipientType: 'business',
        email: 'owner@biz.example.com',
        userData: { role: 'business' }
      },
      {
        template: 'admin-invitation',
        recipientType: 'admin',
        email: 'ops@admin.linkagevahub.com',
        userData: { admin: true }
      }
    ];

    const selections = samples.map(s => {
      const sender = getSenderForTemplate(s.template, s.email, s.userData);
      // Default category computation mirrors utils/sendgrid.js behavior
      const categories = [sender.domain, s.template, s.recipientType]
        .filter(Boolean)
        .map(x => String(x).trim().toLowerCase().slice(0, 50));

      return {
        template: s.template,
        recipientType: s.recipientType,
        selectedSender: {
          email: sender.email,
          name: sender.name,
          domain: sender.domain
        },
        categories
      };
    });

    return res.json({
      success: true,
      message: 'Email health check',
      data: {
        environment: envValidation.config.env,
        configValidation: {
          ok: envValidation.ok,
          errors: envValidation.errors,
          warnings: envValidation.warnings,
          allowedDomains: envValidation.allowedDomains,
          senders: envValidation.senders
        },
        sendgrid: sendgridStatus,
        selections
      }
    });
  } catch (error) {
    console.error('[InternalEmailHealth] error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal email health check failed'
    });
  }
});

module.exports = router;