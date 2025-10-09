const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const VA = require('../models/VA');
const Business = require('../models/Business');
const OnboardingService = require('../services/onboardingService');

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('OnboardingService', () => {
  describe('System Admin User', () => {
    test('should create system admin user on first call', async () => {
      const systemAdmin = await OnboardingService.getSystemAdminUser();

      expect(systemAdmin).toBeDefined();
      expect(systemAdmin.email).toBe('admin@esystems.linkage.com');
      expect(systemAdmin.systemName).toBe('E Systems Admin');
      expect(systemAdmin.isSystem).toBe(true);
      expect(systemAdmin.admin).toBe(true);
      expect(systemAdmin.brand).toBe('esystems');
    });

    test('should return existing system admin on subsequent calls (idempotency)', async () => {
      const firstCall = await OnboardingService.getSystemAdminUser();
      const secondCall = await OnboardingService.getSystemAdminUser();

      expect(firstCall._id.toString()).toBe(secondCall._id.toString());

      // Verify only one system admin exists
      const count = await User.countDocuments({
        isSystem: true,
        systemName: 'E Systems Admin'
      });
      expect(count).toBe(1);
    });
  });

  describe('Onboarding Conversation Creation', () => {
    let vaUser, businessUser, systemAdmin;

    beforeEach(async () => {
      // Create test users
      vaUser = await User.create({
        email: 'va@test.com',
        name: 'Test VA',
        password: 'password123',
        role: 'va'
      });

      businessUser = await User.create({
        email: 'business@test.com',
        name: 'Test Business',
        password: 'password123',
        role: 'business'
      });

      // Create VA profile for VA user
      await VA.create({
        user: vaUser._id,
        skills: ['typing'],
        hourlyRate: 10
      });
      vaUser.va = true;
      await vaUser.save();

      // Create Business profile for business user
      await Business.create({
        user: businessUser._id,
        companyName: 'Test Company',
        industry: 'Technology'
      });
      businessUser.business = true;
      await businessUser.save();

      systemAdmin = await OnboardingService.getSystemAdminUser();
    });

    test('should create onboarding conversation for VA user', async () => {
      const conversation = await OnboardingService.createOnboardingConversation(vaUser);

      expect(conversation).toBeDefined();
      expect(conversation.isSystemConversation).toBe(true);
      expect(conversation.systemConversationType).toBe('onboarding');
      expect(conversation.isOnboardingConversation).toBe(true);
      expect(conversation.participants).toContainEqual(vaUser._id);
      expect(conversation.participants).toContainEqual(systemAdmin._id);

      // Check messages
      expect(conversation.messages).toHaveLength(2);

      // First message should be the welcome message
      expect(conversation.messages[0].content).toContain('Welcome to Messages');
      expect(conversation.messages[0].systemCategory).toBe('onboarding');
      expect(conversation.messages[0].skipNotification).toBe(true);

      // Second message should be VA-specific
      expect(conversation.messages[1].content).toContain('Complete your profile to get matched and hired faster');
      expect(conversation.messages[1].content).toContain('<a href="/dashboard">Dashboard</a>');

      // Check unread count for VA
      expect(conversation.unreadCount.va).toBe(2);
      expect(conversation.unreadCount.business).toBe(0);
    });

    test('should create onboarding conversation for Business user', async () => {
      const conversation = await OnboardingService.createOnboardingConversation(businessUser);

      expect(conversation).toBeDefined();
      expect(conversation.isSystemConversation).toBe(true);
      expect(conversation.systemConversationType).toBe('onboarding');
      expect(conversation.isOnboardingConversation).toBe(true);
      expect(conversation.participants).toContainEqual(businessUser._id);
      expect(conversation.participants).toContainEqual(systemAdmin._id);

      // Check messages
      expect(conversation.messages).toHaveLength(2);

      // First message should be the welcome message
      expect(conversation.messages[0].content).toContain('Welcome to Messages');

      // Second message should be Business-specific
      expect(conversation.messages[1].content).toContain('Complete your company profile to attract the right VAs');
      expect(conversation.messages[1].content).toContain('<a href="/dashboard">Dashboard</a>');

      // Check unread count for Business
      expect(conversation.unreadCount.business).toBe(2);
      expect(conversation.unreadCount.va).toBe(0);
    });

    test('should not create duplicate onboarding conversations (idempotency)', async () => {
      // Create first onboarding
      const first = await OnboardingService.createOnboardingConversation(vaUser);
      expect(first).toBeDefined();

      // Try to create second onboarding
      const second = await OnboardingService.createOnboardingConversation(vaUser);
      expect(second).toBeNull();

      // Verify only one onboarding conversation exists
      const count = await Conversation.countDocuments({
        participants: vaUser._id,
        isSystemConversation: true,
        systemConversationType: 'onboarding'
      });
      expect(count).toBe(1);
    });

    test('should detect existing onboarding correctly', async () => {
      // No onboarding initially
      let hasOnboarding = await OnboardingService.hasReceivedOnboarding(vaUser._id);
      expect(hasOnboarding).toBe(false);

      // Create onboarding
      await OnboardingService.createOnboardingConversation(vaUser);

      // Should now have onboarding
      hasOnboarding = await OnboardingService.hasReceivedOnboarding(vaUser._id);
      expect(hasOnboarding).toBe(true);
    });
  });

  describe('Automatic Onboarding Check', () => {
    let newUser;

    beforeEach(async () => {
      newUser = await User.create({
        email: 'new@test.com',
        name: 'New User',
        password: 'password123',
        role: 'business'
      });
    });

    test('should create onboarding for user with no conversations', async () => {
      const conversation = await OnboardingService.checkAndCreateOnboarding(newUser);

      expect(conversation).toBeDefined();
      expect(conversation.isOnboardingConversation).toBe(true);
    });

    test('should not create onboarding for user with existing conversations', async () => {
      // Create a regular conversation for the user
      const otherUser = await User.create({
        email: 'other@test.com',
        name: 'Other User',
        password: 'password123'
      });

      await Conversation.create({
        participants: [newUser._id, otherUser._id],
        va: otherUser._id,
        business: newUser._id,
        messages: [{
          sender: newUser._id,
          content: 'Hello'
        }]
      });

      // Should not create onboarding
      const conversation = await OnboardingService.checkAndCreateOnboarding(newUser);
      expect(conversation).toBeNull();
    });

    test('should not create onboarding for system accounts', async () => {
      const systemUser = await User.create({
        email: 'system@test.com',
        name: 'System User',
        password: 'password123',
        isSystem: true
      });

      const conversation = await OnboardingService.checkAndCreateOnboarding(systemUser);
      expect(conversation).toBeNull();
    });
  });

  describe('Backfill Process', () => {
    test('should backfill onboarding for users without conversations', async () => {
      // Create users without conversations
      const user1 = await User.create({
        email: 'user1@test.com',
        name: 'User 1',
        password: 'password123',
        role: 'va'
      });

      const user2 = await User.create({
        email: 'user2@test.com',
        name: 'User 2',
        password: 'password123',
        role: 'business'
      });

      // Create a user with conversations (should be skipped)
      const user3 = await User.create({
        email: 'user3@test.com',
        name: 'User 3',
        password: 'password123',
        role: 'business'
      });

      await Conversation.create({
        participants: [user3._id, user1._id],
        va: user1._id,
        business: user3._id,
        messages: [{
          sender: user3._id,
          content: 'Test'
        }]
      });

      // Run backfill
      const result = await OnboardingService.backfillOnboarding();

      expect(result.created).toBe(2); // user1 and user2
      expect(result.skipped).toBe(2); // user3 and system admin

      // Verify onboarding conversations were created
      const user1Onboarding = await Conversation.findOne({
        participants: user1._id,
        isOnboardingConversation: true
      });
      expect(user1Onboarding).toBeDefined();

      const user2Onboarding = await Conversation.findOne({
        participants: user2._id,
        isOnboardingConversation: true
      });
      expect(user2Onboarding).toBeDefined();

      const user3Onboarding = await Conversation.findOne({
        participants: user3._id,
        isOnboardingConversation: true
      });
      expect(user3Onboarding).toBeNull();
    });
  });

  describe('Message Content Validation', () => {
    test('should include proper HTML links in messages', async () => {
      const user = await User.create({
        email: 'test@test.com',
        name: 'Test User',
        password: 'password123',
        role: 'va'
      });

      const conversation = await OnboardingService.createOnboardingConversation(user);

      // Check that Dashboard link is properly formatted
      const dashboardMessage = conversation.messages[1].content;
      expect(dashboardMessage).toContain('<a href="/dashboard">Dashboard</a>');
    });

    test('should set skipNotification flag on all messages', async () => {
      const user = await User.create({
        email: 'test@test.com',
        name: 'Test User',
        password: 'password123',
        role: 'business'
      });

      const conversation = await OnboardingService.createOnboardingConversation(user);

      // All messages should have skipNotification = true
      conversation.messages.forEach(message => {
        expect(message.skipNotification).toBe(true);
        expect(message.systemCategory).toBe('onboarding');
      });
    });
  });
});