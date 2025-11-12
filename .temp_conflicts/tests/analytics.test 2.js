/**
 * Tests for Profile Views Analytics Feature
 *
 * Tests:
 * - Tracking profile views
 * - Deduplication logic
 * - Self-view rejection
 * - Bot filtering
 * - Authorization enforcement
 * - Summary/series/referrers endpoints
 * - Cache correctness
 *
 * Requirements:
 * - Jest
 * - supertest
 * - MongoDB test database
 *
 * Usage:
 *   npm test tests/analytics.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import models
const User = require('../models/User');
const VA = require('../models/VA');
const ProfileView = require('../models/ProfileView');

// Import app (assumes you export the app from server.js for testing)
// If not, you'll need to create a test server setup
const app = require('../server');

describe('Profile Views Analytics', () => {
  let vaUser, clientUser, vaToken, clientToken;

  // Setup: Create test users before all tests
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || process.env.MONGODB_URI);
    }

    // Clear existing test data
    await User.deleteMany({ email: { $regex: /test\\.analytics/ } });
    await ProfileView.deleteMany({});

    // Create VA test user
    vaUser = await User.create({
      email: 'va.test.analytics@example.com',
      password: 'Test1234!',
      firstName: 'Test',
      lastName: 'VA',
      role: 'va',
      isVerified: true
    });

    // Create VA profile
    const vaProfile = await VA.create({
      user: vaUser._id,
      name: 'Test VA',
      bio: 'Test bio',
      searchStatus: 'open',
      status: 'approved'
    });

    vaUser.va = vaProfile._id;
    await vaUser.save();

    // Create client test user
    clientUser = await User.create({
      email: 'client.test.analytics@example.com',
      password: 'Test1234!',
      firstName: 'Test',
      lastName: 'Client',
      role: 'business',
      isVerified: true
    });

    // Generate tokens
    vaToken = jwt.sign({ id: vaUser._id }, process.env.JWT_SECRET);
    clientToken = jwt.sign({ id: clientUser._id }, process.env.JWT_SECRET);
  });

  // Cleanup after all tests
  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /test\\.analytics/ } });
    await ProfileView.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/analytics/profile-views/track', () => {
    beforeEach(async () => {
      // Clear profile views before each test
      await ProfileView.deleteMany({});
    });

    test('should track anonymous profile view', async () => {
      const res = await request(app)
        .post('/api/analytics/profile-views/track')
        .send({
          vaId: vaUser._id.toString(),
          referrer: 'https://google.com'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.tracked).toBe(true);

      // Verify view was saved
      const view = await ProfileView.findOne({ va: vaUser._id });
      expect(view).toBeTruthy();
      expect(view.referrer).toBe('https://google.com');
    });

    test('should track authenticated profile view', async () => {
      const res = await request(app)
        .post('/api/analytics/profile-views/track')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          vaId: vaUser._id.toString()
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.tracked).toBe(true);

      // Verify view was saved with viewer user
      const view = await ProfileView.findOne({ va: vaUser._id });
      expect(view).toBeTruthy();
      expect(view.viewerUser.toString()).toBe(clientUser._id.toString());
    });

    test('should reject self-views', async () => {
      const res = await request(app)
        .post('/api/analytics/profile-views/track')
        .set('Authorization', `Bearer ${vaToken}`)
        .send({
          vaId: vaUser._id.toString()
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.tracked).toBe(false);
      expect(res.body.reason).toContain('Self-views');

      // Verify no view was saved
      const count = await ProfileView.countDocuments({ va: vaUser._id });
      expect(count).toBe(0);
    });

    test('should deduplicate views within 30 minutes', async () => {
      // First view
      const res1 = await request(app)
        .post('/api/analytics/profile-views/track')
        .set('Cookie', ['linkage_anon_id=test-anon-123'])
        .send({
          vaId: vaUser._id.toString()
        })
        .expect(200);

      expect(res1.body.tracked).toBe(true);

      // Second view within 30 minutes (should be deduplicated)
      const res2 = await request(app)
        .post('/api/analytics/profile-views/track')
        .set('Cookie', ['linkage_anon_id=test-anon-123'])
        .send({
          vaId: vaUser._id.toString()
        })
        .expect(200);

      expect(res2.body.tracked).toBe(false);
      expect(res2.body.reason).toContain('already tracked');

      // Verify only one view was saved
      const count = await ProfileView.countDocuments({ va: vaUser._id });
      expect(count).toBe(1);
    });

    test('should filter bot user agents', async () => {
      const res = await request(app)
        .post('/api/analytics/profile-views/track')
        .set('User-Agent', 'Googlebot/2.1 (+http://www.google.com/bot.html)')
        .send({
          vaId: vaUser._id.toString()
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.tracked).toBe(false);
      expect(res.body.reason).toContain('Bot');

      // Verify no view was saved
      const count = await ProfileView.countDocuments({ va: vaUser._id });
      expect(count).toBe(0);
    });

    test('should return error for invalid VA ID', async () => {
      const res = await request(app)
        .post('/api/analytics/profile-views/track')
        .send({
          vaId: new mongoose.Types.ObjectId().toString()
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('should require vaId parameter', async () => {
      const res = await request(app)
        .post('/api/analytics/profile-views/track')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('VA ID is required');
    });
  });

  describe('GET /api/analytics/profile-views/summary', () => {
    beforeEach(async () => {
      // Clear and seed some test data
      await ProfileView.deleteMany({});

      // Create some test views
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      await ProfileView.create({
        va: vaUser._id,
        anonId: 'anon-1',
        dedupHash: 'hash-1',
        createdAt: now
      });

      await ProfileView.create({
        va: vaUser._id,
        anonId: 'anon-2',
        dedupHash: 'hash-2',
        createdAt: oneDayAgo
      });

      await ProfileView.create({
        va: vaUser._id,
        anonId: 'anon-1', // Same viewer, different time
        dedupHash: 'hash-3',
        createdAt: twoDaysAgo
      });
    });

    test('should return summary for VA user (me)', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/summary')
        .set('Authorization', `Bearer ${vaToken}`)
        .query({ vaId: 'me' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.uniqueTotal).toBe(2); // anon-1 and anon-2
    });

    test('should enforce authorization (VA can only see own data)', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/summary')
        .set('Authorization', `Bearer ${clientToken}`)
        .query({ vaId: vaUser._id.toString() })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Not authorized');
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/summary')
        .query({ vaId: vaUser._id.toString() })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    test('should filter by date range', async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const res = await request(app)
        .get('/api/analytics/profile-views/summary')
        .set('Authorization', `Bearer ${vaToken}`)
        .query({
          vaId: 'me',
          from: oneDayAgo.toISOString(),
          to: now.toISOString()
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2); // Only views within last 24 hours
    });

    test('should count unique viewers when unique=true', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/summary')
        .set('Authorization', `Bearer ${vaToken}`)
        .query({ vaId: 'me', unique: 'true' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2); // Unique viewers
      expect(res.body.data.uniqueTotal).toBe(2);
    });
  });

  describe('GET /api/analytics/profile-views/series', () => {
    test('should return time series data', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/series')
        .set('Authorization', `Bearer ${vaToken}`)
        .query({
          vaId: 'me',
          interval: 'day'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.series).toBeInstanceOf(Array);
      expect(res.body.data.interval).toBe('day');
    });

    test('should validate interval parameter', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/series')
        .set('Authorization', `Bearer ${vaToken}`)
        .query({
          vaId: 'me',
          interval: 'invalid'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid interval');
    });

    test('should enforce authorization', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/series')
        .set('Authorization', `Bearer ${clientToken}`)
        .query({ vaId: vaUser._id.toString() })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/analytics/profile-views/referrers', () => {
    beforeEach(async () => {
      await ProfileView.deleteMany({});

      // Create views with different referrers
      await ProfileView.create({
        va: vaUser._id,
        referrer: 'https://google.com',
        dedupHash: 'ref-hash-1'
      });

      await ProfileView.create({
        va: vaUser._id,
        referrer: 'https://google.com',
        dedupHash: 'ref-hash-2'
      });

      await ProfileView.create({
        va: vaUser._id,
        referrer: 'https://linkedin.com',
        dedupHash: 'ref-hash-3'
      });

      await ProfileView.create({
        va: vaUser._id,
        referrer: null, // Direct traffic
        dedupHash: 'ref-hash-4'
      });
    });

    test('should return top referrers', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/referrers')
        .set('Authorization', `Bearer ${vaToken}`)
        .query({ vaId: 'me' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.referrers).toBeInstanceOf(Array);
      expect(res.body.data.referrers.length).toBeGreaterThan(0);
      expect(res.body.data.referrers[0].referrer).toBe('https://google.com');
      expect(res.body.data.referrers[0].count).toBe(2);
      expect(res.body.data.directTraffic).toBe(1);
    });

    test('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/referrers')
        .set('Authorization', `Bearer ${vaToken}`)
        .query({ vaId: 'me', limit: 1 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.referrers.length).toBe(1);
    });

    test('should enforce authorization', async () => {
      const res = await request(app)
        .get('/api/analytics/profile-views/referrers')
        .set('Authorization', `Bearer ${clientToken}`)
        .query({ vaId: vaUser._id.toString() })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Cache functionality', () => {
    test('should cache summary results', async () => {
      // First request
      const res1 = await request(app)
        .get('/api/analytics/profile-views/summary')
        .set('Authorization', `Bearer ${vaToken}`)
        .query({ vaId: 'me' })
        .expect(200);

      expect(res1.body.data.cached).toBe(false);

      // Second request (should be cached)
      const res2 = await request(app)
        .get('/api/analytics/profile-views/summary')
        .set('Authorization', `Bearer ${vaToken}`)
        .query({ vaId: 'me' })
        .expect(200);

      expect(res2.body.data.cached).toBe(true);

      // Results should be identical
      expect(res2.body.data.total).toBe(res1.body.data.total);
    });
  });
});