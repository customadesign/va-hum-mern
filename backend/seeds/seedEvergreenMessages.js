const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
require('dotenv').config();

const evergreenMessages = [
  {
    title: "Welcome to Your Linkage Inbox",
    body: "Your inbox is where you'll receive client inquiries, job invitations, interview requests, file requests, contract updates, and platform notifications. You can reply directly to messages, archive completed conversations, mark items as unread for later, use filters to sort by type, search for specific senders or topics, and report any suspicious activity. We recommend responding to client messages within 24 hours to maintain a professional reputation. Enable notifications in your settings to never miss an important opportunity. For your safety, avoid sharing personal contact information or sensitive data until a contract is confirmed through our platform. Use the Report button if you receive any suspicious messages.",
    ctaLabel: "View Your Messages",
    ctaLink: "/conversations",
    priority: 1
  },
  {
    title: "Complete Your Profile for More Opportunities",
    body: "Virtual assistants with complete profiles receive three times more client inquiries and have higher response rates. A complete profile helps you appear in more search results, attract qualified clients who match your expertise, and build trust before the first conversation. To reach 100 percent completion, add your professional headline and bio, list all your services and skills, upload a professional photo, set your hourly rate and availability, specify your languages and time zone, add any certifications you hold, and showcase portfolio items or case studies. Once you start working with clients, ask them to leave reviews to further boost your credibility and attract more opportunities.",
    ctaLabel: "Complete Your Profile",
    ctaLink: "/profile",
    priority: 2
  }
];

async function seedEvergreenMessages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Find or create a system user for sending evergreen messages
    let systemUser = await User.findOne({ email: 'system@linkagevahub.com' });

    if (!systemUser) {
      systemUser = await User.create({
        email: 'system@linkagevahub.com',
        password: 'system-password-never-used',
        name: 'Linkage Support',
        role: 'va', // Use 'va' as role since 'admin' is not in the enum
        admin: true, // Mark as admin using the admin field
        isEmailVerified: true,
        isActive: true
      });
      console.log('Created system user for evergreen messages');
    }

    // Get all users who should receive evergreen messages
    const users = await User.find({
      role: { $in: ['va', 'business'] },
      isActive: true
    });

    console.log(`Found ${users.length} active users`);

    // Create evergreen messages for each user
    for (const user of users) {
      for (const messageData of evergreenMessages) {
        // Check if this evergreen message already exists for this user
        const existingConversation = await Conversation.findOne({
          participants: { $all: [systemUser._id, user._id] },
          'metadata.isEvergreen': true,
          'metadata.evergreenType': messageData.title
        });

        if (!existingConversation) {
          // Create a new conversation
          const conversation = await Conversation.create({
            participants: [systemUser._id, user._id],
            lastMessage: messageData.body.substring(0, 100) + '...',
            lastMessageAt: new Date(),
            metadata: {
              isEvergreen: true,
              evergreenType: messageData.title,
              priority: messageData.priority,
              ctaLabel: messageData.ctaLabel,
              ctaLink: messageData.ctaLink
            }
          });

          // Create the message
          await Message.create({
            conversation: conversation._id,
            sender: systemUser._id,
            recipient: user._id,
            content: messageData.body,
            subject: messageData.title,
            isRead: false,
            metadata: {
              isEvergreen: true,
              ctaLabel: messageData.ctaLabel,
              ctaLink: messageData.ctaLink
            }
          });

          console.log(`Created evergreen message "${messageData.title}" for user ${user.email}`);
        }
      }
    }

    console.log('Evergreen messages seeding completed successfully');
  } catch (error) {
    console.error('Error seeding evergreen messages:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Function to create evergreen messages for a new user
async function createEvergreenMessagesForUser(userId) {
  try {
    const systemUser = await User.findOne({ email: 'system@linkagevahub.com' });
    if (!systemUser) {
      console.error('System user not found');
      return;
    }

    const user = await User.findById(userId);
    if (!user || !['va', 'business'].includes(user.role)) {
      return;
    }

    for (const messageData of evergreenMessages) {
      // Check if this evergreen message already exists for this user
      const existingConversation = await Conversation.findOne({
        participants: { $all: [systemUser._id, user._id] },
        'metadata.isEvergreen': true,
        'metadata.evergreenType': messageData.title
      });

      if (!existingConversation) {
        // Create a new conversation
        const conversation = await Conversation.create({
          participants: [systemUser._id, user._id],
          lastMessage: messageData.body.substring(0, 100) + '...',
          lastMessageAt: new Date(),
          metadata: {
            isEvergreen: true,
            evergreenType: messageData.title,
            priority: messageData.priority,
            ctaLabel: messageData.ctaLabel,
            ctaLink: messageData.ctaLink
          }
        });

        // Create the message
        await Message.create({
          conversation: conversation._id,
          sender: systemUser._id,
          recipient: user._id,
          content: messageData.body,
          subject: messageData.title,
          isRead: false,
          metadata: {
            isEvergreen: true,
            ctaLabel: messageData.ctaLabel,
            ctaLink: messageData.ctaLink
          }
        });

        console.log(`Created evergreen message "${messageData.title}" for new user ${user.email}`);
      }
    }
  } catch (error) {
    console.error('Error creating evergreen messages for user:', error);
  }
}

// Run the seeding script if called directly
if (require.main === module) {
  seedEvergreenMessages();
}

module.exports = {
  seedEvergreenMessages,
  createEvergreenMessagesForUser,
  evergreenMessages
};