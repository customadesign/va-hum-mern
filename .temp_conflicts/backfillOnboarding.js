#!/usr/bin/env node

/**
 * Backfill script to create onboarding conversations for existing users
 * who don't have any conversations yet
 *
 * Usage: node scripts/backfillOnboarding.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const OnboardingService = require('../services/onboardingService');

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Run the backfill
    console.log('\nStarting onboarding backfill process...');
    const result = await OnboardingService.backfillOnboarding();

    console.log('\nBackfill completed successfully!');
    console.log(`Created ${result.created} onboarding conversations`);
    console.log(`Skipped ${result.skipped} users (already have conversations or onboarding)`);

  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
main();