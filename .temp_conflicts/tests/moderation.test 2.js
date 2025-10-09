const request = require('supertest');
const express = require('express');
const Message = require('../models/Message');
const VA = require('../models/VA');
const File = require('../models/File');
const User = require('../models/User');
const Notification = require('../models/Notification');
const adminModerationRoutes = require('../routes/adminModeration');

describe('Admin Moderation Tests', () => {
  let app;
  let adminUser;
  let regularUser;
  let adminToken;
  let testVA;
  let testMessage;
  let testFile;

  beforeEach(async () => {
    // Create test users
    adminUser = await createTestUser();
    adminUser.admin = true;
    await adminUser.save();
    adminToken = generateTestToken(adminUser._id, true);

    regularUser = await createTestUser();

    // Create test VA profile
    testVA = await createTestVA(regularUser._id);

    // Create test message
    testMessage = await Message.create({
      conversation: '507f1f77bcf86cd799439011',
      sender: regularUser._id,
      content: 'Test message content',
      type: 'text'
    });

    // Create test file
    testFile = await File.create({
      filename: 'test.jpg',
      originalName: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      url: 'https://test.url/test.jpg',
      bucket: 'test-bucket',
      path: '/uploads/test.jpg',
      uploadedBy: regularUser._id,
      fileType: 'image'
    });

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = { _id: adminUser._id, admin: true };
      next();
    });
    app.use('/api/admin/moderation', adminModerationRoutes);
  });

  describe('GET /api/admin/moderation/activity/:userId', () => {
    it('should retrieve user activity', async () => {
      const response = await request(app)
        .get(`/api/admin/moderation/activity/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ days: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(regularUser._id.toString());
      expect(response.body.data.period).toBe('30 days');
      expect(response.body.data.messageCount).toBeDefined();
      expect(response.body.data.conversationCount).toBeDefined();
    });

    it('should validate userId format', async () => {
      const response = await request(app)
        .get('/api/admin/moderation/activity/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Invalid user ID');
    });
  });

  describe('GET /api/admin/moderation/queue', () => {
    beforeEach(async () => {
      // Flag some content for testing
      testMessage.flagged = true;
      testMessage.flags = [{
        reason: 'spam',
        details: 'Suspicious content',
        severity: 'medium',
        flaggedBy: adminUser._id,
        flaggedAt: new Date()
      }];
      testMessage.moderationStatus = 'pending';
      await testMessage.save();

      testVA.moderation = {
        flagged: true,
        flags: [{
          reason: 'fake_profile',
          details: 'Suspicious profile',
          severity: 'high',
          flaggedBy: adminUser._id,
          flaggedAt: new Date()
        }],
        status: 'pending'
      };
      await testVA.save();
    });

    it('should retrieve moderation queue', async () => {
      const response = await request(app)
        .get('/api/admin/moderation/queue')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ type: 'all', status: 'pending' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by content type', async () => {
      const response = await request(app)
        .get('/api/admin/moderation/queue')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ type: 'messages', status: 'pending' })
        .expect(200);

      expect(response.body.success).toBe(true);
      const items = response.body.data.items;
      expect(items.every(item => item.type === 'message')).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/admin/moderation/queue')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeLessThanOrEqual(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('POST /api/admin/moderation/flag/:contentType/:contentId', () => {
    it('should flag message content', async () => {
      const response = await request(app)
        .post(`/api/admin/moderation/flag/message/${testMessage._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'spam',
          details: 'This is spam content',
          severity: 'high'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('flagged');

      // Verify message was flagged
      const flaggedMessage = await Message.findById(testMessage._id);
      expect(flaggedMessage.flagged).toBe(true);
      expect(flaggedMessage.flags).toHaveLength(1);
      expect(flaggedMessage.flags[0].reason).toBe('spam');
    });

    it('should flag profile content', async () => {
      const response = await request(app)
        .post(`/api/admin/moderation/flag/profile/${testVA._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'fake_profile',
          details: 'Profile appears to be fake',
          severity: 'critical'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify profile was flagged
      const flaggedVA = await VA.findById(testVA._id);
      expect(flaggedVA.moderation.flagged).toBe(true);
      expect(flaggedVA.moderation.flags).toHaveLength(1);
    });

    it('should create admin notifications', async () => {
      await request(app)
        .post(`/api/admin/moderation/flag/message/${testMessage._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'inappropriate',
          details: 'Inappropriate content'
        })
        .expect(200);

      // Verify notifications were created
      const notifications = await Notification.find({
        type: 'moderation_flag'
      });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should validate content type', async () => {
      const response = await request(app)
        .post(`/api/admin/moderation/flag/invalid/${testMessage._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'spam'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/admin/moderation/review/:contentType/:contentId', () => {
    beforeEach(async () => {
      // Flag content for review
      testMessage.flagged = true;
      testMessage.moderationStatus = 'pending';
      await testMessage.save();
    });

    it('should approve flagged content', async () => {
      const response = await request(app)
        .post(`/api/admin/moderation/review/message/${testMessage._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'approve',
          notes: 'Content is acceptable'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify content was approved
      const approvedMessage = await Message.findById(testMessage._id);
      expect(approvedMessage.flagged).toBe(false);
      expect(approvedMessage.moderationStatus).toBe('approved');
    });

    it('should remove flagged content', async () => {
      const response = await request(app)
        .post(`/api/admin/moderation/review/message/${testMessage._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'remove',
          notes: 'Content violates guidelines'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify content was removed
      const removedMessage = await Message.findById(testMessage._id);
      expect(removedMessage.deleted).toBe(true);
      expect(removedMessage.deletedBy.toString()).toBe(adminUser._id.toString());
    });

    it('should warn user for violations', async () => {
      const response = await request(app)
        .post(`/api/admin/moderation/review/message/${testMessage._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'warn',
          notes: 'First warning for inappropriate content'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify warning was issued
      const warnedUser = await User.findById(regularUser._id);
      expect(warnedUser.warnings).toHaveLength(1);
      expect(warnedUser.warnings[0].reason).toContain('violation');
    });

    it('should suspend user account', async () => {
      const response = await request(app)
        .post(`/api/admin/moderation/review/message/${testMessage._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'suspend',
          notes: 'Repeated violations',
          banDuration: 7 // 7 days
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user was suspended
      const suspendedUser = await User.findById(regularUser._id);
      expect(suspendedUser.suspended).toBe(true);
      expect(suspendedUser.suspendedUntil).toBeDefined();
    });

    it('should log moderation actions', async () => {
      await request(app)
        .post(`/api/admin/moderation/review/message/${testMessage._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'approve',
          notes: 'Reviewed and approved'
        })
        .expect(200);

      // Verify action was logged
      const reviewedMessage = await Message.findById(testMessage._id);
      expect(reviewedMessage.moderationLog).toHaveLength(1);
      expect(reviewedMessage.moderationLog[0].action).toBe('approve');
      expect(reviewedMessage.moderationLog[0].moderator.toString()).toBe(adminUser._id.toString());
    });
  });

  describe('POST /api/admin/moderation/bulk', () => {
    let messages;

    beforeEach(async () => {
      // Create multiple flagged messages
      messages = await Message.create([
        {
          conversation: '507f1f77bcf86cd799439011',
          sender: regularUser._id,
          content: 'Spam message 1',
          flagged: true,
          moderationStatus: 'pending'
        },
        {
          conversation: '507f1f77bcf86cd799439011',
          sender: regularUser._id,
          content: 'Spam message 2',
          flagged: true,
          moderationStatus: 'pending'
        }
      ]);
    });

    it('should perform bulk moderation actions', async () => {
      const items = messages.map(m => ({
        type: 'message',
        id: m._id.toString()
      }));

      const response = await request(app)
        .post('/api/admin/moderation/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items,
          action: 'approve',
          notes: 'Bulk approval'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.summary.successful).toBe(2);
    });

    it('should validate bulk action items', async () => {
      const response = await request(app)
        .post('/api/admin/moderation/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: 'not-an-array',
          action: 'approve'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('must be an array');
    });
  });

  describe('GET /api/admin/moderation/stats', () => {
    beforeEach(async () => {
      // Create some moderation data
      await Message.create([
        {
          conversation: '507f1f77bcf86cd799439011',
          sender: regularUser._id,
          content: 'Flagged message',
          flagged: true,
          moderationStatus: 'pending'
        },
        {
          conversation: '507f1f77bcf86cd799439011',
          sender: regularUser._id,
          content: 'Approved message',
          moderationStatus: 'approved'
        }
      ]);
    });

    it('should retrieve moderation statistics', async () => {
      const response = await request(app)
        .get('/api/admin/moderation/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.totalFlags).toBeGreaterThanOrEqual(0);
      expect(response.body.data.overview.pendingReview).toBeGreaterThanOrEqual(0);
      expect(response.body.data.topViolations).toBeDefined();
    });

    it('should filter stats by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/admin/moderation/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
    });
  });

  describe('POST /api/admin/moderation/scan', () => {
    it('should scan text content for violations', async () => {
      const response = await request(app)
        .post('/api/admin/moderation/scan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'This is a spam message with scam content',
          type: 'text'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.safe).toBeDefined();
      expect(response.body.data.flags).toBeDefined();
    });

    it('should detect inappropriate keywords', async () => {
      const response = await request(app)
        .post('/api/admin/moderation/scan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'This message contains spam and scam words',
          type: 'text'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.safe).toBe(false);
      expect(response.body.data.flags.length).toBeGreaterThan(0);
    });

    it('should validate content type', async () => {
      const response = await request(app)
        .post('/api/admin/moderation/scan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Test content',
          type: 'invalid-type'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });
});