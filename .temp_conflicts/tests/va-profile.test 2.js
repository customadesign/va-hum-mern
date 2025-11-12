const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const VA = require('../models/VA');
const Location = require('../models/Location');
const Specialty = require('../models/Specialty');
const RoleLevel = require('../models/RoleLevel');
const RoleType = require('../models/RoleType');

describe('GET /api/vas/profile', () => {
  let user;
  let va;
  let token;

  beforeAll(async () => {
    // Create test user
    user = await User.create({
      name: 'Test VA User',
      email: 'testva@example.com',
      password: 'password123',
      role: 'user'
    });

    // Create location
    const location = await Location.create({
      country: 'Philippines',
      countryCode: 'PH',
      city: 'Manila'
    });

    // Create specialties
    const specialty1 = await Specialty.create({
      name: 'Web Development',
      slug: 'web-development'
    });

    // Create VA profile
    va = await VA.create({
      user: user._id,
      name: 'Test VA',
      bio: 'Test bio',
      hero: 'Experienced Virtual Assistant',
      searchStatus: 'open',
      location: location._id,
      specialties: [specialty1._id]
    });

    // Update user with VA reference
    user.va = va._id;
    await user.save();

    // Create role level and type
    const roleLevel = await RoleLevel.create({ va: va._id });
    const roleType = await RoleType.create({ va: va._id });

    va.roleLevel = roleLevel._id;
    va.roleType = roleType._id;
    await va.save();

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testva@example.com',
        password: 'password123'
      });

    token = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({});
    await VA.deleteMany({});
    await Location.deleteMany({});
    await Specialty.deleteMany({});
    await RoleLevel.deleteMany({});
    await RoleType.deleteMany({});
    await mongoose.connection.close();
  });

  it('should return the current user VA profile when authenticated', async () => {
    const response = await request(app)
      .get('/api/vas/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.name).toBe('Test VA');
    expect(response.body.data.bio).toBe('Test bio');
    expect(response.body.data.location).toBeDefined();
    expect(response.body.data.specialties).toHaveLength(1);
    expect(response.body.data.roleLevel).toBeDefined();
    expect(response.body.data.roleType).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app)
      .get('/api/vas/profile')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Not authorized to access this route');
  });

  it('should return 403 when user does not have VA profile', async () => {
    // Create a user without VA profile
    const businessUser = await User.create({
      name: 'Business User',
      email: 'business@example.com',
      password: 'password123',
      role: 'user'
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'business@example.com',
        password: 'password123'
      });

    const businessToken = loginResponse.body.token;

    const response = await request(app)
      .get('/api/vas/profile')
      .set('Authorization', `Bearer ${businessToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('User role is not authorized to access this route');
  });
});