// emailConfig.js - Centralized email env loader and validation

'use strict';

const { validateSenderDomains } = require('./emailDomains');

const isNonProd = () => (process.env.NODE_ENV || 'development') !== 'production';

const loadEmailConfig = () => {
  const rawFrom = process.env.EMAIL_FROM || '';
  const fromDomain = rawFrom.includes('@') ? rawFrom.split('@')[1].toLowerCase() : null;

  return {
    env: process.env.NODE_ENV || 'development',
    apiKeyPresent: !!process.env.SENDGRID_API_KEY,
    emailFrom: rawFrom || null,
    emailFromDomain: fromDomain,
    sandbox: String(process.env.SENDGRID_SANDBOX || '').toLowerCase() === 'true',
  };
};

const validateEmailConfig = (strict = false) => {
  const cfg = loadEmailConfig();
  const { domains, senders } = validateSenderDomains();

  const errors = [];
  const warnings = [];

  // API key validation
  if (!cfg.apiKeyPresent) {
    if (strict || !isNonProd()) {
      errors.push('SENDGRID_API_KEY is missing');
    } else {
      warnings.push('SENDGRID_API_KEY is missing (allowed in non-prod if using SMTP or sandbox)');
    }
  }

  // EMAIL_FROM validation (optional, but if provided must match an allowed domain)
  const senderEmails = Array.isArray(senders)
    ? senders.map((s) => String(s.email || '').toLowerCase())
    : [];

  if (cfg.emailFrom) {
    if (!cfg.emailFromDomain) {
      errors.push(`EMAIL_FROM "${cfg.emailFrom}" is invalid (no domain)`);
    } else if (!domains.includes(cfg.emailFromDomain)) {
      if (strict || !isNonProd()) {
        errors.push(
          `EMAIL_FROM domain "${cfg.emailFromDomain}" not allowed; must be one of: ${domains.join(', ')}`
        );
      } else {
        warnings.push(
          `EMAIL_FROM domain "${cfg.emailFromDomain}" not in allowed domains: ${domains.join(', ')}`
        );
      }
    } else if (strict) {
      // In strict mode (production), require EMAIL_FROM to match a configured sender email exactly
      if (!senderEmails.includes(cfg.emailFrom.toLowerCase())) {
        errors.push(
          `EMAIL_FROM "${cfg.emailFrom}" must match one of configured senders: ${senderEmails.join(', ')}`
        );
      }
    }
  }

  // Sender identities sanity check (at least one)
  if (!Array.isArray(senders) || senders.length === 0) {
    errors.push('No sender identities configured in emailDomains');
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    config: cfg,
    allowedDomains: domains,
    senders,
  };
};

const ensureEmailProdConfig = () => {
  if (isNonProd()) return true;

  const result = validateEmailConfig(true);
  if (!result.ok) {
    console.error('[EmailConfig] Production email configuration invalid:');
    result.errors.forEach((e) => console.error(' -', e));
    if (result.warnings.length) {
      console.warn('[EmailConfig] Warnings:');
      result.warnings.forEach((w) => console.warn(' -', w));
    }
    // Fail fast in production
    process.exit(1);
  }

  if (result.warnings.length) {
    console.warn('[EmailConfig] Production warnings:');
    result.warnings.forEach((w) => console.warn(' -', w));
  }
  console.log('[EmailConfig] Production email configuration validated.');
  return true;
};

module.exports = {
  loadEmailConfig,
  validateEmailConfig,
  ensureEmailProdConfig,
  isNonProd,
};