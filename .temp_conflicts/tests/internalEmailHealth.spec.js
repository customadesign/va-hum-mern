// internalEmailHealth.spec.js

'use strict';

const express = require('express');
const request = require('supertest');

// Ensure non-prod mode and sandbox flag for predictable behavior
process.env.NODE_ENV = 'test';
process.env.SENDGRID_SANDBOX = 'true';

describe('Internal Email Health Endpoint (non-prod)', () => {
  let app;

  beforeAll(() => {
    const route = require('../routes/internalEmailHealth');
    app = express();
    app.use('/api/internal/email', route);
  });

  test('GET /api/internal/email/health returns success with selections', async () => {
    const res = await request(app).get('/api/internal/email/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('environment');
    expect(res.body.data).toHaveProperty('configValidation');
    expect(res.body.data).toHaveProperty('sendgrid');
    expect(res.body.data).toHaveProperty('selections');

    // selections should include VA, Business, Admin examples
    expect(Array.isArray(res.body.data.selections)).toBe(true);
    expect(res.body.data.selections.length).toBeGreaterThanOrEqual(3);

    // Each selection should include template, recipientType, selectedSender, categories
    const item = res.body.data.selections[0];
    expect(item).toHaveProperty('template');
    expect(item).toHaveProperty('recipientType');
    expect(item).toHaveProperty('selectedSender');
    expect(item).toHaveProperty('categories');
  });
});