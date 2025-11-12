const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const authRoutes = require('../routes/auth');
const { protect } = require('../middleware/auth');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined();

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePassword123!'
      };

      // Create user first
      await User.create(userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          confirmPassword: userData.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already registered');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'weakpass@example.com',
        password: '123',
        confirmPassword: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject registration when passwords do not match', async () => {
      const userData = {
        email: 'mismatch@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Passwords do not match');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'testlogin@example.com',
        password: 'TestPassword123!',
        emailVerified: true
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testlogin@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('testlogin@example.com');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testlogin@example.com',
          password: 'WrongPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login for suspended user', async () => {
      testUser.suspended = true;
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testlogin@example.com',
          password: 'TestPassword123!'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('suspended');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user data with valid token', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id);

      // Create test app with protected route
      const protectedApp = express();
      protectedApp.use(express.json());
      protectedApp.get('/api/auth/me', protect, async (req, res) => {
        res.json({
          success: true,
          user: req.user
        });
      });

      const response = await request(protectedApp)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user._id).toBe(user._id.toString());
    });

    it('should reject request without token', async () => {
      const protectedApp = express();
      protectedApp.use(express.json());
      protectedApp.use(protect);
      protectedApp.get('/api/auth/me', (req, res) => {
        res.json({ success: true, user: req.user });
      });

      const response = await request(protectedApp)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not authorized');
    });

    it('should reject request with invalid token', async () => {
      const protectedApp = express();
      protectedApp.use(express.json());
      protectedApp.use(protect);
      protectedApp.get('/api/auth/me', (req, res) => {
        res.json({ success: true, user: req.user });
      });

      const response = await request(protectedApp)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not authorized');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset email for existing user', async () => {
      const user = await createTestUser();

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: user.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('email sent');

      // Verify reset token was saved
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.resetPasswordToken).toBeDefined();
      expect(updatedUser.resetPasswordExpire).toBeDefined();
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should still return success to prevent email enumeration
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/auth/reset-password/:resetToken', () => {
    it('should reset password with valid token', async () => {
      const user = await createTestUser();
      const resetToken = user.getResetPasswordToken();
      await user.save();

      const response = await request(app)
        .put(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();

      // Verify password was changed
      const updatedUser = await User.findById(user._id).select('+password');
      const isMatch = await updatedUser.matchPassword('NewSecurePassword123!');
      expect(isMatch).toBe(true);
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .put('/api/auth/reset-password/invalidtoken123')
        .send({
          password: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should reject expired reset token', async () => {
      const user = await createTestUser();
      const resetToken = user.getResetPasswordToken();
      user.resetPasswordExpire = Date.now() - 3600000; // 1 hour ago
      await user.save();

      const response = await request(app)
        .put(`/api/auth/reset-password/${resetToken}`)
        .send({
          password: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('expired');
    });
  });
});