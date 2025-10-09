/* eslint-env jest */
const express = require('express');
const request = require('supertest');

// Mock protect to inject a non-VA business user
jest.mock(require.resolve('../middleware/hybridAuth'), () => ({
  protect: (req, _res, next) => {
    req.user = { _id: 'u1', id: 'u1', admin: false, profile: {} }; // business (no va flag)
    next();
  }
}));

// Mock completion calculator to return below threshold (e.g., 50%)
jest.mock(require.resolve('../middleware/profileCompletion'), () => ({
  profileCompletionGate: () => (req, _res, next) => next(),
  calculateCompletionPercentage: () => 50
}));

// Mock Business.findOne to simulate existing business profile
const BusinessFindOne = jest.fn().mockResolvedValue({ _id: 'biz1', user: 'u1' });
jest.mock(require.resolve('../models/Business'), () => ({
  findOne: (...args) => BusinessFindOne(...args)
}));

// Mock Conversation.find() chain to return empty list
const ConversationFind = jest.fn().mockReturnValue({
  populate() { return this; },
  sort() { return Promise.resolve([]); }
});
jest.mock(require.resolve('../models/Conversation'), () => ({
  find: (...args) => ConversationFind(...args)
}));

// Import router under test AFTER mocks
const conversationsRouter = require('../routes/conversations');

describe('GET /api/conversations - default system conversation injection', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/conversations', conversationsRouter);
  });

  beforeEach(() => {
    ConversationFind.mockClear();
    BusinessFindOne.mockClear();
  });

  it('injects a virtual system conversation when business completion < 80%', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .expect(200);

    expect(res.body).toBeTruthy();
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const first = res.body.data[0];
    // Verify virtual system conversation shape
    expect(first._id).toBe('system-default');
    expect(first.isSystemConversation).toBe(true);
    expect(Array.isArray(first.messages)).toBe(true);
    expect(first.messages.length).toBe(1);

    const msg = first.messages[0];
    expect(msg.isSystem).toBe(true);
    // Ensure server provided sanitized HTML variant
    expect(typeof msg.bodyHtmlSafe).toBe('string');
    expect(msg.bodyHtmlSafe).toContain('href="/dashboard"');
    // Ensure no dangerous schemes persisted
    expect(msg.bodyHtmlSafe.toLowerCase()).not.toContain('javascript:');
  });
});