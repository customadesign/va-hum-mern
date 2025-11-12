// ... existing code ...
/* eslint-disable no-console */
const express = require('express');
const request = require('supertest');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock 2FA middleware to keep login flow simple for this test
jest.mock('../middleware/twoFactorAuth', () => ({
  checkTwoFactorStatus: async () => ({ enabled: false }),
  validateTwoFactorForLogin: async () => ({ valid: true, attemptsRemaining: 5 }),
}));

// Ensure JWT secret for signing/verifying tokens
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-please-change';

describe('Auth Login Flow (CSRF + Cookie Session)', () => {
  let mongo;
  let app;
  let agent;
  const EMAIL = 'pat@murphyconsulting.us';
  const PASSWORD = 'B5tccpbx';

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

    // Seed user (password hashed via pre-save hook)
    const User = require('../models/User');
    await User.create({
      email: EMAIL,
      password: PASSWORD,
      provider: 'local',
      isVerified: true,
    });

    // Minimal test app mounting only auth routes (no need to boot full server)
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', require('../routes/auth'));
    agent = request.agent(app);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  test('POST /api/auth/login issues httpOnly auth cookie and allows /api/auth/me', async () => {
    // 1) CSRF bootstrap
    const csrfRes = await agent.get('/api/auth/csrf').expect(200);
    expect(csrfRes.body?.success).toBe(true);
    const csrfToken = csrfRes.body?.csrfToken;
    expect(typeof csrfToken).toBe('string');

    // 2) Login with CSRF header and persisted cookie jar
    const loginRes = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', csrfToken)
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);

    // Assert Set-Cookie contains authToken
    const setCookies = loginRes.headers['set-cookie'] || [];
    const hasAuthCookie = setCookies.some((c) => /^authToken=/.test(c));
    expect(hasAuthCookie).toBe(true);

    // 3) Access protected endpoint using cookie session
    const meRes = await agent.get('/api/auth/me').expect(200);
    expect(meRes.body?.success).toBe(true);
    expect(meRes.body?.user?.email).toBe(EMAIL);
  });
});
// ... existing code ...