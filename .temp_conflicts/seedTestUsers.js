#!/usr/bin/env node

/**
 * Seed script to create test users for analytics testing
 *
 * Creates:
 * - VA test user: va.test@example.com / Test1234!
 * - Client test user: client.test@example.com / Test1234!
 *
 * Usage:
 *   node scripts/seedTestUsers.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');

const TEST_PASSWORD = 'Test1234!';

async function seedTestUsers() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Calculate date 30 days ago for createdAt
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ========== Create VA Test User ==========
    console.log('\nCreating VA test user...');

    // Check if VA test user already exists
    let vaUser = await User.findOne({ email: 'va.test@example.com' });

    if (vaUser) {
      console.log('VA test user already exists:', vaUser.email);
    } else {
      // Create VA user
      vaUser = await User.create({
        email: 'va.test@example.com',
        password: TEST_PASSWORD,
        firstName: 'Test',
        lastName: 'VA',
        displayName: 'Test VA',
        role: 'va',
        isVerified: true,
        confirmedAt: new Date(),
        createdAt: thirtyDaysAgo,
        updatedAt: thirtyDaysAgo
      });
      console.log('Created VA user:', vaUser.email);

      // Create VA profile
      const vaProfile = await VA.create({
        user: vaUser._id,
        name: 'Test VA',
        bio: 'This is a test VA profile for analytics testing.',
        hero: 'Experienced Virtual Assistant for Testing',
        searchStatus: 'open',
        status: 'approved',
        email: 'va.test@example.com',
        preferredMinHourlyRate: 15,
        preferredMaxHourlyRate: 35,
        specialties: ['Administrative Support', 'Data Entry'],
        skills: ['Microsoft Office', 'Google Workspace', 'Email Management'],
        createdAt: thirtyDaysAgo,
        updatedAt: thirtyDaysAgo
      });

      // Link VA profile to user
      vaUser.va = vaProfile._id;
      await vaUser.save();

      console.log('Created VA profile for user:', vaProfile.name);
    }

    // ========== Create Client Test User ==========
    console.log('\nCreating Client test user...');

    // Check if client test user already exists
    let clientUser = await User.findOne({ email: 'client.test@example.com' });

    if (clientUser) {
      console.log('Client test user already exists:', clientUser.email);
    } else {
      // Create client user
      clientUser = await User.create({
        email: 'client.test@example.com',
        password: TEST_PASSWORD,
        firstName: 'Test',
        lastName: 'Client',
        displayName: 'Test Client',
        role: 'business',
        isVerified: true,
        confirmedAt: new Date(),
        createdAt: thirtyDaysAgo,
        updatedAt: thirtyDaysAgo
      });
      console.log('Created Client user:', clientUser.email);

      // Create business profile
      const businessProfile = await Business.create({
        user: clientUser._id,
        companyName: 'Test Business Inc.',
        description: 'This is a test business profile for analytics testing.',
        industry: 'Technology',
        companySize: '1-10',
        website: 'https://testbusiness.example.com',
        email: 'client.test@example.com',
        createdAt: thirtyDaysAgo,
        updatedAt: thirtyDaysAgo
      });

      // Link business profile to user
      clientUser.business = businessProfile._id;
      await clientUser.save();

      console.log('Created Business profile for user:', businessProfile.companyName);
    }

    // ========== Summary ==========
    console.log('\n========== Test Users Created Successfully ==========');
    console.log('\nVA Test User:');
    console.log('  Email:', 'va.test@example.com');
    console.log('  Password:', TEST_PASSWORD);
    console.log('  User ID:', vaUser._id);
    console.log('  Created:', vaUser.createdAt);
    console.log('\nClient Test User:');
    console.log('  Email:', 'client.test@example.com');
    console.log('  Password:', TEST_PASSWORD);
    console.log('  User ID:', clientUser._id);
    console.log('  Created:', clientUser.createdAt);
    console.log('\n====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding test users:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTestUsers();