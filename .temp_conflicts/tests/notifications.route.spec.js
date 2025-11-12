/* eslint-env jest */
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const userId = new mongoose.Types.ObjectId();

// Mock hybridAuth protect middleware to inject a test user
jest.mock(require.resolve('../middleware/hybridAuth'), () => ({
  protect: (req, _res, next) => {
    req.user = { _id: userId, id: userId.toString(), admin: false, profile: {} };
    next();
  }
}));

// Import after mocks
const Notification = require('../models/Notification');
const notificationsRouter = require('../routes/notifications');

describe('GET /api/notifications', () => {
  let mongod;
  let app;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use('/api/notifications', notificationsRouter);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  beforeEach(async () => {
    // Clean database between tests
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  it('returns notifications with paramsSafe computed for legacy records', async () => {
    // Insert a legacy-style notification without paramsSafe
    await Notification.create({
      recipient: userId,
      type: 'system_announcement',
      params: {
        title: 'Profile Reminder',
        message: `<a href="javascript:alert(1)">bad</a> <a href="/dashboard">Go to Dashboard</a>`
      }
      // readAt: undefined (unread)
      // archived: false (default)
    });

    const res = await request(app)
      .get('/api/notifications')
      .expect(200);

    expect(res.body).toBeTruthy();
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);

    const item = res.body.data[0];
    expect(item).toHaveProperty('params');
    expect(item).toHaveProperty('paramsSafe');

    // Ensure sanitized content present and safe
    const safe = item.paramsSafe || {};
    expect(typeof safe).toBe('object');

    // Prefer message field in paramsSafe for this test
    expect(safe.message || '').toContain('href="/dashboard"');
    expect((safe.message || '').toLowerCase()).not.toContain('javascript:');

    // Ensure unreadCount is present and at least 1
    expect(typeof res.body.unreadCount).toBe('number');
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);

    // Ensure pagination shape exists
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('limit');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('pages');
  });
});