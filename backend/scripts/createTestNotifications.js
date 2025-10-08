const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
require('dotenv').config();

const createTestNotifications = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub');
    console.log('Connected to MongoDB');

    // Find a test user (you can specify an email if needed)
    const user = await User.findOne({ email: process.env.TEST_USER_EMAIL || 'test@example.com' });
    
    if (!user) {
      console.log('No user found. Please specify a valid TEST_USER_EMAIL in your .env file');
      process.exit(1);
    }

    console.log(`Creating test notifications for user: ${user.email}`);

    // Clear existing notifications for this user (optional)
    // await Notification.deleteMany({ recipient: user._id });

    // Create various types of test notifications
    const notifications = [
      {
        recipient: user._id,
        type: 'new_message',
        params: {
          message: 'You have a new message from Sarah Johnson',
          senderName: 'Sarah Johnson'
        },
        actionUrl: '/conversations'
      },
      {
        recipient: user._id,
        type: 'profile_view',
        params: {
          viewerName: 'Tech Solutions Inc.',
          message: 'Tech Solutions Inc. viewed your profile'
        },
        actionUrl: '/dashboard'
      },
      {
        recipient: user._id,
        type: 'new_conversation',
        params: {
          message: 'John Smith started a new conversation with you',
          initiatorName: 'John Smith'
        },
        actionUrl: '/conversations'
      },
      {
        recipient: user._id,
        type: 'system_announcement',
        params: {
          message: 'New features have been added to the platform!'
        },
        actionUrl: '/about'
      },
      {
        recipient: user._id,
        type: 'referral_joined',
        params: {
          message: 'Your referral Emma Wilson has joined the platform',
          referralName: 'Emma Wilson'
        },
        actionUrl: '/dashboard'
      }
    ];

    // Create notifications with some marked as read
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      // Mark first 2 as read, rest as unread
      if (i < 2) {
        notification.readAt = new Date(Date.now() - 1000 * 60 * 60 * 24); // Read 1 day ago
      }
      
      // Set different creation times for realistic display
      const createdNotification = await Notification.create(notification);
      
      // Manually update createdAt for variety
      if (i === 0) {
        createdNotification.createdAt = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes ago
      } else if (i === 1) {
        createdNotification.createdAt = new Date(Date.now() - 1000 * 60 * 60 * 2); // 2 hours ago
      } else if (i === 2) {
        createdNotification.createdAt = new Date(Date.now() - 1000 * 60 * 30); // 30 minutes ago
      } else if (i === 3) {
        createdNotification.createdAt = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      } else if (i === 4) {
        createdNotification.createdAt = new Date(Date.now() - 1000 * 60 * 15); // 15 minutes ago
      }
      
      await createdNotification.save();
    }

    // Get the unread count
    const unreadCount = await Notification.getUnreadCount(user._id);
    
    console.log(`✅ Successfully created ${notifications.length} test notifications`);
    console.log(`📊 Unread count: ${unreadCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test notifications:', error);
    process.exit(1);
  }
};

// Add command line argument support
if (process.argv[2]) {
  process.env.TEST_USER_EMAIL = process.argv[2];
}

console.log('Creating test notifications...');
console.log('Usage: node createTestNotifications.js [email]');
console.log('Example: node createTestNotifications.js user@example.com');

createTestNotifications();