#!/usr/bin/env node

/**
 * Manual script to create onboarding conversation for a specific user
 *
 * Usage: node scripts/createOnboardingForUser.js <userEmail>
 * Example: node scripts/createOnboardingForUser.js john@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const OnboardingService = require('../services/onboardingService');

async function main() {
  try {
    // Get user email from command line argument
    const userEmail = process.argv[2];
    if (!userEmail) {
      console.error('Please provide a user email as argument');
      console.log('Usage: node scripts/createOnboardingForUser.js <userEmail>');
      process.exit(1);
    }

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

    // Find the user
    console.log(`\nLooking for user with email: ${userEmail}`);
    const user = await User.findOne({ email: userEmail.toLowerCase() });

    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name || user.email}`);
    console.log(`User role: ${user.role || 'Not set'}`);
    console.log(`User ID: ${user._id}`);

    // Check if user already has onboarding
    const hasOnboarding = await OnboardingService.hasReceivedOnboarding(user._id);
    if (hasOnboarding) {
      console.log('\nUser already has an onboarding conversation');
      process.exit(0);
    }

    // Create onboarding conversation
    console.log('\nCreating onboarding conversation...');
    const conversation = await OnboardingService.createOnboardingConversation(user);

    if (conversation) {
      console.log('\nOnboarding conversation created successfully!');
      console.log(`Conversation ID: ${conversation._id}`);
      console.log(`Messages: ${conversation.messages.length}`);
      console.log('\nMessage contents:');
      conversation.messages.forEach((msg, index) => {
        console.log(`\nMessage ${index + 1}:`);
        console.log(msg.content.substring(0, 100) + '...');
      });
    } else {
      console.log('\nFailed to create onboarding conversation');
    }

  } catch (error) {
    console.error('Error:', error);
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