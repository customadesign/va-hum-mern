// emailDomains.mapping.spec.js

'use strict';

const {
  getSenderForTemplate,
  detectRecipientType,
  emailDomains,
} = require('../config/emailDomains');

describe('config/emailDomains.js sender mapping', () => {
  test('VA templates map to hello@linkagevahub.com', () => {
    const sender = getSenderForTemplate('va-welcome', 'user@example.com', { role: 'va' });
    expect(sender.email).toBe('hello@linkagevahub.com');
    expect(sender.domain).toBe('linkagevahub.com');
  });

  test('Business templates map to hello@esystemsmanagement.com', () => {
    const sender = getSenderForTemplate('business-welcome', 'owner@company.com', { role: 'business' });
    expect(sender.email).toBe('hello@esystemsmanagement.com');
    expect(sender.domain).toBe('esystemsmanagement.com');
  });

  test('Admin templates map to noreply@admin.linkagevahub.com', () => {
    const sender = getSenderForTemplate('admin-invitation', 'ops@admin.linkagevahub.com', { admin: true });
    expect(sender.email).toBe('noreply@admin.linkagevahub.com');
    expect(sender.domain).toBe('admin.linkagevahub.com');
  });

  test('Unknown template uses detectRecipientType() and falls back to business', () => {
    const recipientType = detectRecipientType('random@gmail.com');
    expect(recipientType).toBe('business');

    const sender = getSenderForTemplate('unknown-template', 'random@gmail.com');
    expect(sender.email).toBe(emailDomains.senders.business.email);
  });

  test('detectRecipientType recognizes admin domains', () => {
    expect(detectRecipientType('ops@admin.linkagevahub.com')).toBe('admin');
    expect(detectRecipientType('it@esystemsmanagement.com')).toBe('admin');
  });
});