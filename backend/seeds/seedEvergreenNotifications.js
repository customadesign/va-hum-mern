const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
require('dotenv').config();

const evergreenNotifications = [
  {
    title: "Welcome to Your Linkage Inbox",
    content: "Your inbox is where you'll receive client inquiries, job invitations, interview requests, file requests, contract updates, and platform notifications. You can reply directly to messages, archive completed conversations, mark items as unread for later, use filters to sort by type, search for specific senders or topics, and report any suspicious activity. We recommend responding to client messages within 24 hours to maintain a professional reputation. Enable notifications in your settings to never miss an important opportunity. For your safety, avoid sharing personal contact information or sensitive data until a contract is confirmed through our platform. Use the Report button if you receive any suspicious messages.",
    type: 'system',
    priority: 'normal',
    actionUrl: '/conversations',
    actionLabel: 'View Your Messages'
  },
  {
    title: "Complete Your Profile for More Opportunities",
    content: "Virtual assistants with complete profiles receive three times more client inquiries and have higher response rates. A complete profile helps you appear in more search results, attract qualified clients who match your expertise, and build trust before the first conversation. To reach 100 percent completion, add your professional headline and bio, list all your services and skills, upload a professional photo, set your hourly rate and availability, specify your languages and time zone, add any certifications you hold, and showcase portfolio items or case studies. Once you start working with clients, ask them to leave reviews to further boost your credibility and attract more opportunities.",
    type: 'system',
    priority: 'high',
    actionUrl: '/va/profile',
    actionLabel: 'Complete Your Profile'
  }
];

async function seedEvergreenNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get the user
    const user = await User.findOne({ email: 'pat@murphyconsulting.us' });

    if (!user) {
      console.log('User pat@murphyconsulting.us not found');
      return;
    }

    console.log('Found user:', user.email);

    // Create notifications for the user
    for (const notificationData of evergreenNotifications) {
      // Check if this notification already exists
      const existingNotification = await Notification.findOne({
        recipient: user._id,
        title: notificationData.title,
        type: 'system'
      });

      if (!existingNotification) {
        const notification = await Notification.create({
          recipient: user._id,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type,
          priority: notificationData.priority,
          isRead: false,
          metadata: {
            isEvergreen: true,
            actionUrl: notificationData.actionUrl,
            actionLabel: notificationData.actionLabel
          }
        });

        console.log(`Created notification: "${notificationData.title}"`);
      } else {
        console.log(`Notification already exists: "${notificationData.title}"`);
      }
    }

    console.log('Evergreen notifications seeding completed successfully');
  } catch (error) {
    console.error('Error seeding notifications:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the seeding script
seedEvergreenNotifications();