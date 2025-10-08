const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.CLERK_SECRET_KEY = 'test-clerk-secret';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_BUCKET = 'test-bucket';
  
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Connect to in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Helper function to generate test JWT tokens
global.generateTestToken = (userId, isAdmin = false) => {
  const payload = {
    user: {
      id: userId,
      admin: isAdmin
    }
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Helper function to create test user
global.createTestUser = async () => {
  const User = require('../models/User');
  const user = await User.create({
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    emailVerified: true
  });
  return user;
};

// Helper function to create test VA
global.createTestVA = async (userId) => {
  const VA = require('../models/VA');
  const va = await VA.create({
    user: userId,
    name: 'Test VA',
    email: `va${Date.now()}@example.com`,
    phone: '1234567890',
    location: {
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country'
    },
    hourlyRate: 25,
    bio: 'Test bio',
    status: 'active'
  });
  return va;
};

// Helper function to create test Business
global.createTestBusiness = async (userId) => {
  const Business = require('../models/Business');
  const business = await Business.create({
    user: userId,
    company: 'Test Company',
    email: `business${Date.now()}@example.com`,
    phone: '0987654321',
    location: {
      city: 'Business City',
      state: 'Business State',
      country: 'Business Country'
    },
    industry: 'Technology',
    description: 'Test business description'
  });
  return business;
};

// Mock external services
jest.mock('../config/supabase', () => ({
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.url' } }),
      remove: jest.fn().mockResolvedValue({ error: null }),
      createSignedUrl: jest.fn().mockResolvedValue({ 
        data: { signedUrl: 'https://signed.test.url' }, 
        error: null 
      })
    }))
  }
}));

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://s3.test.url',
        Key: 'test-key',
        Bucket: 'test-bucket',
        ETag: 'test-etag'
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    getSignedUrlPromise: jest.fn().mockResolvedValue('https://s3.signed.url'),
    headObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        ContentType: 'image/jpeg',
        ContentLength: 1024,
        LastModified: new Date(),
        ETag: 'test-etag'
      })
    })
  }))
}));

// Suppress console during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};