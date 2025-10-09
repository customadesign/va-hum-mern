// email.replyto.spec.js

'use strict';

const { _computeReplyTo } = require('../utils/email');

describe('Reply-To policy (_computeReplyTo)', () => {
  test('maps hello@ domain senders to support@ for reply-to', () => {
    expect(_computeReplyTo('hello@linkagevahub.com')).toBe('support@linkagevahub.com');
    expect(_computeReplyTo('hello@esystemsmanagement.com')).toBe('support@esystemsmanagement.com');
  });

  test('omits reply-to when sender is a noreply address', () => {
    expect(_computeReplyTo('noreply@admin.linkagevahub.com')).toBeUndefined();
  });

  test('explicit replyTo overrides policy-derived value', () => {
    expect(_computeReplyTo('hello@linkagevahub.com', 'support+ticket@linkagevahub.com')).toBe(
      'support+ticket@linkagevahub.com'
    );
    expect(_computeReplyTo('noreply@admin.linkagevahub.com', 'ops@admin.linkagevahub.com')).toBe(
      'ops@admin.linkagevahub.com'
    );
  });

  test('handles missing senderEmail safely', () => {
    expect(_computeReplyTo(undefined)).toBeUndefined();
    expect(_computeReplyTo(null)).toBeUndefined();
  });
});