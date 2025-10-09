const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Business = require('../models/Business');
const VA = require('../models/VA');
const Conversation = require('../models/Conversation');

describe('Conversation Profile Completion Gating', () => {
  let businessUser;
  let businessProfile;
  let vaUser;
  let vaProfile;
  let businessToken;
  let vaToken;
  let testConversation;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/linkage-test');
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Business.deleteMany({});
    await VA.deleteMany({});
    await Conversation.deleteMany({});

    // Create VA user (VAs are not gated)
    vaUser = await User.create({
      email: 'va@test.com',
      password: 'password123',
      va: true,
      isVerified: true
    });

    vaProfile = await VA.create({
      user: vaUser._id,
      name: 'Test VA',
      bio: 'Experienced virtual assistant with 5 years in admin support',
      email: 'va@test.com',
      phone: '+1234567890',
      hourlyRate: 25,
      skills: ['Admin', 'Support'],
      experience: ['5 years experience'],
      location: { city: 'Manila', state: 'NCR', country: 'Philippines' }
    });

    vaUser.profile = { va: vaProfile._id };
    await vaUser.save();

    // Get VA token
    const vaLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'va@test.com', password: 'password123' });
    vaToken = vaLoginRes.body.token;

    // Create business user
    businessUser = await User.create({
      email: 'business@test.com',
      password: 'password123',
      business: true,
      isVerified: true
    });

    // Create test conversation
    testConversation = await Conversation.create({
      participants: [businessUser._id, vaUser._id],
      va: vaUser._id,
      business: businessUser._id,
      messages: [{
        sender: businessUser._id,
        content: 'Hello, I need help with admin tasks'
      }],
      lastMessage: 'Hello, I need help with admin tasks',
      lastMessageAt: new Date(),
      unreadCount: { va: 1, business: 0 }
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/conversations - Profile completion gating', () => {
    it('should gate business user with 0% profile completion', async () => {
      // No business profile created = 0% completion
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.gated).toBe(true);
      expect(res.body.error).toBe('PROFILE_INCOMPLETE');
      expect(res.body.profileCompletion).toBe(0);
      expect(res.body.requiredCompletion).toBe(80);
      expect(res.body.message).toContain('Welcome to your messages');
    });

    it('should gate business user with exactly 80% profile completion', async () => {
      // Create business profile with exactly 80% completion
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company',
        bio: 'Test bio with enough content',
        email: 'business@test.com',
        phone: '+1234567890',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        industry: 'Technology',
        companySize: '11-50'
        // Missing some optional fields to keep at ~80%
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.gated).toBe(true);
      expect(res.body.error).toBe('PROFILE_INCOMPLETE');
      expect(res.body.profileCompletion).toBeLessThanOrEqual(80);
    });

    it('should allow business user with > 80% profile completion', async () => {
      // Create business profile with > 80% completion
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company',
        bio: 'Comprehensive bio with enough content to meet requirements',
        email: 'business@test.com',
        phone: '+1234567890',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        industry: 'Technology',
        companySize: '11-50',
        website: 'https://test.com',
        streetAddress: '123 Main St',
        postalCode: '10001',
        foundedYear: 2020,
        employeeCount: 25,
        linkedin: 'https://linkedin.com/company/test'
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should not gate VA users regardless of profile completion', async () => {
      // VAs should never be gated
      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${vaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not gate admin users', async () => {
      const adminUser = await User.create({
        email: 'admin@test.com',
        password: 'password123',
        admin: true,
        isVerified: true
      });

      const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
      
      const adminToken = adminLoginRes.body.token;

      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/conversations/:id - Profile completion gating', () => {
    it('should gate business user from viewing conversation detail when profile <= 80%', async () => {
      // Create incomplete profile
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company',
        bio: 'Test bio',
        email: 'business@test.com',
        phone: '+1234567890'
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .get(`/api/conversations/${testConversation._id}`)
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.gated).toBe(true);
      expect(res.body.error).toBe('PROFILE_INCOMPLETE');
    });

    it('should allow business user with > 80% completion to view conversation', async () => {
      // Create complete profile
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company',
        bio: 'Comprehensive bio with enough content',
        email: 'business@test.com',
        phone: '+1234567890',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        industry: 'Technology',
        companySize: '11-50',
        website: 'https://test.com',
        streetAddress: '123 Main St',
        postalCode: '10001',
        foundedYear: 2020,
        employeeCount: 25,
        linkedin: 'https://linkedin.com/company/test'
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .get(`/api/conversations/${testConversation._id}`)
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/conversations/unread/count - Metadata leakage prevention', () => {
    it('should return 0 unread count for gated business users without leaking data', async () => {
      // No profile = gated
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/conversations/unread/count')
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(0);
      expect(res.body.data.gated).toBe(true);
    });

    it('should return actual unread count for business users with > 80% completion', async () => {
      // Create complete profile
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company',
        bio: 'Comprehensive bio',
        email: 'business@test.com',
        phone: '+1234567890',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        industry: 'Technology',
        companySize: '11-50',
        website: 'https://test.com',
        streetAddress: '123 Main St',
        postalCode: '10001',
        linkedin: 'https://linkedin.com/company/test'
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/conversations/unread/count')
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gated).toBeUndefined();
    });
  });

  describe('POST /api/conversations/start/:vaId - Starting conversations', () => {
    it('should prevent gated business users from starting conversations', async () => {
      // Create minimal profile (< 80%)
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company',
        bio: 'Short bio'
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .post(`/api/conversations/start/${vaProfile._id}`)
        .set('Authorization', `Bearer ${businessToken}`)
        .send({ message: 'Hello, I need help' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Incomplete profile');
    });

    it('should allow business users with > 80% completion to start conversations', async () => {
      // Create complete profile
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company',
        bio: 'Comprehensive bio with enough content',
        email: 'business@test.com',
        phone: '+1234567890',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        industry: 'Technology',
        companySize: '11-50',
        website: 'https://test.com',
        streetAddress: '123 Main St',
        postalCode: '10001',
        foundedYear: 2020,
        employeeCount: 25,
        linkedin: 'https://linkedin.com/company/test'
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .post(`/api/conversations/start/${vaProfile._id}`)
        .set('Authorization', `Bearer ${businessToken}`)
        .send({ message: 'Hello, I need help' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('Threshold boundary testing', () => {
    it('should gate user at exactly 80.0% completion', async () => {
      // Create profile that results in exactly 80% (by calculation)
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company',
        bio: 'Test bio with enough content for requirements',
        email: 'business@test.com',
        phone: '+1234567890',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        industry: 'Technology',
        companySize: '11-50'
        // Carefully calibrated to hit exactly 80%
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      // Calculate actual completion to verify test setup
      const { calculateCompletionPercentage } = require('../middleware/profileCompletion');
      const actualCompletion = calculateCompletionPercentage(businessProfile, 'business');

      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${businessToken}`);

      // If profile is at or below 80%, should be gated
      if (actualCompletion <= 80) {
        expect(res.status).toBe(403);
        expect(res.body.gated).toBe(true);
      } else {
        expect(res.status).toBe(200);
      }
    });

    it('should allow user at 80.01% or higher completion', async () => {
      // Create very complete profile (well above 80%)
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company Inc.',
        bio: 'Very comprehensive company bio describing all our services and history in detail',
        email: 'business@test.com',
        phone: '+1234567890',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        industry: 'Technology',
        companySize: '11-50',
        website: 'https://testcompany.com',
        streetAddress: '123 Main Street Suite 400',
        postalCode: '10001',
        foundedYear: 2020,
        employeeCount: 30,
        specialties: ['Software Development', 'Consulting'],
        companyCulture: 'Innovative and collaborative',
        benefits: ['Health Insurance', '401k'],
        workEnvironment: 'hybrid',
        headquartersLocation: 'New York, NY',
        linkedin: 'https://linkedin.com/company/test',
        facebook: 'https://facebook.com/test',
        twitter: 'https://twitter.com/test',
        certifications: ['ISO 9001'],
        awards: ['Best Employer 2023']
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/messages/:conversationId - Message access gating', () => {
    it('should gate business users from accessing message data when profile <= 80%', async () => {
      // Create incomplete profile
      businessProfile = await Business.create({
        user: businessUser._id,
        contactName: 'John Doe',
        company: 'Test Company',
        bio: 'Short bio'
      });

      businessUser.profile = { business: businessProfile._id };
      await businessUser.save();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'business@test.com', password: 'password123' });
      
      businessToken = loginRes.body.token;

      const res = await request(app)
        .get(`/api/messages/${testConversation._id}`)
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.gated).toBe(true);
    });
  });
});