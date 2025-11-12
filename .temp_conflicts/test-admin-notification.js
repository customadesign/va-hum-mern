#!/usr/bin/env node

/**
 * Test script to verify admin notification system
 * This script will:
 * 1. Create a test intercepted conversation
 * 2. Check if unread count is properly calculated
 * 3. Verify the notification badge would appear
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const Business = require('./models/Business');
const VA = require('./models/VA');

async function testAdminNotifications() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find a business and VA for testing
    const business = await User.findOne({ business: { $exists: true } });
    const va = await User.findOne({ va: { $exists: true } });

    if (!business || !va) {
      console.log('❌ Need at least one business and one VA user for testing');
      process.exit(1);
    }

    console.log(`\n📧 Creating test intercepted conversation...`);
    console.log(`Business: ${business.email}`);
    console.log(`VA: ${va.email}`);

    // Create a new intercepted conversation with unread messages
    const conversation = new Conversation({
      participants: [business._id, va._id],
      business: business.business,
      va: va.va,
      isIntercepted: true,
      adminStatus: 'pending',
      interceptedAt: new Date(),
      messages: [
        {
          sender: business._id,
          content: 'TEST: New message for admin notification test',
          timestamp: new Date(),
          read: false
        }
      ],
      unreadCount: {
        admin: 1,
        va: 0,
        business: 0
      },
      lastMessage: 'TEST: New message for admin notification test',
      lastMessageAt: new Date()
    });

    await conversation.save();
    console.log('✅ Created intercepted conversation with ID:', conversation._id);

    // Test the unread count API
    console.log('\n🔍 Testing unread count calculation...');
    const unreadCount = await Conversation.countDocuments({
      isIntercepted: true,
      'unreadCount.admin': { $gt: 0 }
    });

    console.log(`✅ Unread count for admin: ${unreadCount}`);

    // Get all intercepted conversations with unread messages
    const unreadConversations = await Conversation.find({
      isIntercepted: true,
      'unreadCount.admin': { $gt: 0 }
    }).select('_id lastMessage unreadCount.admin');

    console.log('\n📋 Intercepted conversations with unread messages:');
    unreadConversations.forEach(conv => {
      console.log(`  - ID: ${conv._id}`);
      console.log(`    Unread: ${conv.unreadCount.admin} messages`);
      console.log(`    Last: "${conv.lastMessage?.substring(0, 50)}..."`);
    });

    console.log('\n✅ Admin notification system test complete!');
    console.log('📌 The notification badge should show:', unreadCount, 'unread messages');
    console.log('\n💡 To clear test data, you can delete conversation ID:', conversation._id);

  } catch (error) {
    console.error('❌ Error testing admin notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the test
testAdminNotifications();