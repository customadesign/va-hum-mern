/* eslint-env jest */
const express = require('express');
const request = require('supertest');

// Mock protect to inject a VA user authorized for the conversation
jest.mock(require.resolve('../middleware/hybridAuth'), () => ({
  protect: (req, _res, next) => {
    req.user = { _id: 'u1', id: 'u1', va: 'v1' }; // VA identity
    next();
  }
}));

// Mock Conversation.findById to return a conversation where req.user.va matches
const ConversationFindById = jest.fn().mockResolvedValue({
  _id: 'c1',
  va: 'v1',
  business: 'b1',
  isIntercepted: false
});
jest.mock(require.resolve('../models/Conversation'), () => ({
  findById: (...args) => ConversationFindById(...args)
}));

// Helpers to simulate Mongoose query chain for Message.find()
function createFindChain(docs) {
  return {
    sort() { return this; },
    skip() { return this; },
    limit() { return Promise.resolve(docs); }
  };
}

// Mock Message.find and countDocuments
const MessageFind = jest.fn().mockImplementation(() => {
  const doc = {
    toObject: () => ({
      _id: 'm1',
      conversation: 'c1',
      body: 'Please visit <a href="/dashboard">Dashboard</a>',
      bodyHtml: 'Please visit <a href="/dashboard">Dashboard</a>',
      createdAt: new Date().toISOString()
    })
  };
  return createFindChain([doc]);
});
const MessageCount = jest.fn().mockResolvedValue(1);

jest.mock(require.resolve('../models/Message'), () => ({
  find: (...args) => MessageFind(...args),
  countDocuments: (...args) => MessageCount(...args)
}));

// Import router after mocks
const messagesRouter = require('../routes/messages');

describe('GET /api/messages/:conversationId', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/messages', messagesRouter);
  });

  beforeEach(() => {
    ConversationFindById.mockClear();
    MessageFind.mockClear();
    MessageCount.mockClear();
  });

  it('returns messages with bodyHtmlSafe computed and safe internal anchors', async () => {
    const res = await request(app)
      .get('/api/messages/c1')
      .expect(200);

    expect(res.body).toBeTruthy();
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);

    const msg = res.body.data[0];
    expect(typeof msg.bodyHtmlSafe).toBe('string');
    // Should contain internal anchor (not forced to _blank in web context)
    expect(msg.bodyHtmlSafe).toContain('href="/dashboard"');
    expect(msg.bodyHtmlSafe.toLowerCase()).not.toContain('javascript:');

    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total', 1);
  });
});