require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const Business = require('./models/Business');
const VA = require('./models/VA');

const createTestInterceptedMessages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find or create test users
    let businessUser = await User.findOne({ email: 'testbusiness@example.com' });
    let vaUser = await User.findOne({ email: 'testva@example.com' });

    if (!businessUser) {
      console.log('Creating test business user...');
      
      // Create user first
      businessUser = new User({
        email: 'testbusiness@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Smith',
        name: 'John Smith',
        role: 'business'
      });
      await businessUser.save();
      
      // Then create business with user reference
      const newBusiness = new Business({
        user: businessUser._id,
        contactName: 'John Smith',
        company: 'Tech Solutions Inc',
        email: 'testbusiness@example.com',
        phone: '123-456-7890',
        bio: 'We provide cutting-edge technology solutions',
        completionPercentage: 75
      });
      await newBusiness.save();
      
      // Update user with business reference
      businessUser.business = newBusiness._id;
      await businessUser.save();
    }

    if (!vaUser) {
      console.log('Creating test VA user...');
      
      // Create user first
      vaUser = new User({
        email: 'testva@example.com',
        password: 'TestPassword123!',
        firstName: 'Sarah',
        lastName: 'Johnson',
        name: 'Sarah Johnson',
        role: 'va'
      });
      await vaUser.save();
      
      // Then create VA with user reference
      const newVA = new VA({
        user: vaUser._id,
        name: 'Sarah Johnson',
        email: 'testva@example.com',
        phone: '987-654-3210',
        bio: 'Experienced Virtual Assistant',
        hourlyRate: 25,
        skills: ['Admin', 'Customer Service', 'Data Entry']
      });
      await newVA.save();
      
      // Update user with VA reference
      vaUser.va = newVA._id;
      await vaUser.save();
    }

    // Create multiple intercepted conversations with different statuses
    const conversations = [
      {
        participants: [businessUser._id, vaUser._id],
        va: vaUser._id,
        business: businessUser._id,
        messages: [
          {
            sender: businessUser._id,
            content: 'Hello, I need help with my administrative tasks.',
            read: false,
            createdAt: new Date(Date.now() - 3600000)
          }
        ],
        lastMessage: 'Hello, I need help with my administrative tasks.',
        lastMessageAt: new Date(Date.now() - 3600000),
        unreadCount: { va: 0, business: 0, admin: 1 },
        status: 'active',
        isIntercepted: true,
        originalSender: businessUser._id,
        interceptedAt: new Date(Date.now() - 3600000),
        adminStatus: 'pending'
      },
      {
        participants: [businessUser._id, vaUser._id],
        va: vaUser._id,
        business: businessUser._id,
        messages: [
          {
            sender: businessUser._id,
            content: 'I run an e-commerce business and need VA support.',
            read: true,
            createdAt: new Date(Date.now() - 86400000)
          }
        ],
        lastMessage: 'I run an e-commerce business and need VA support.',
        lastMessageAt: new Date(Date.now() - 86400000),
        unreadCount: { va: 0, business: 0, admin: 0 },
        status: 'active',
        isIntercepted: true,
        originalSender: businessUser._id,
        interceptedAt: new Date(Date.now() - 86400000),
        adminStatus: 'forwarded',
        forwardedAt: new Date(Date.now() - 82800000)
      },
      {
        participants: [businessUser._id, vaUser._id],
        va: vaUser._id,
        business: businessUser._id,
        messages: [
          {
            sender: businessUser._id,
            content: 'Can you help with social media management?',
            read: true,
            createdAt: new Date(Date.now() - 172800000)
          },
          {
            sender: vaUser._id,
            content: 'Yes, I can definitely help with social media management!',
            read: true,
            createdAt: new Date(Date.now() - 169200000)
          }
        ],
        lastMessage: 'Yes, I can definitely help with social media management!',
        lastMessageAt: new Date(Date.now() - 169200000),
        unreadCount: { va: 0, business: 0, admin: 0 },
        status: 'active',
        isIntercepted: true,
        originalSender: businessUser._id,
        interceptedAt: new Date(Date.now() - 172800000),
        adminStatus: 'replied',
        repliedAt: new Date(Date.now() - 169200000)
      },
      {
        participants: [businessUser._id, vaUser._id],
        va: vaUser._id,
        business: businessUser._id,
        messages: [
          {
            sender: businessUser._id,
            content: 'I need help with data entry and bookkeeping.',
            read: false,
            createdAt: new Date(Date.now() - 7200000)
          }
        ],
        lastMessage: 'I need help with data entry and bookkeeping.',
        lastMessageAt: new Date(Date.now() - 7200000),
        unreadCount: { va: 0, business: 0, admin: 1 },
        status: 'active',
        isIntercepted: true,
        originalSender: businessUser._id,
        interceptedAt: new Date(Date.now() - 7200000),
        adminStatus: 'pending'
      },
      {
        participants: [businessUser._id, vaUser._id],
        va: vaUser._id,
        business: businessUser._id,
        messages: [
          {
            sender: businessUser._id,
            content: 'Looking for a VA to manage my calendar.',
            read: true,
            createdAt: new Date(Date.now() - 259200000)
          },
          {
            sender: vaUser._id,
            content: 'I have extensive experience with calendar management.',
            read: true,
            createdAt: new Date(Date.now() - 255600000)
          },
          {
            sender: businessUser._id,
            content: 'Great! When can we start?',
            read: false,
            createdAt: new Date(Date.now() - 252000000)
          }
        ],
        lastMessage: 'Great! When can we start?',
        lastMessageAt: new Date(Date.now() - 252000000),
        unreadCount: { va: 0, business: 0, admin: 1 },
        status: 'active',
        isIntercepted: true,
        originalSender: businessUser._id,
        interceptedAt: new Date(Date.now() - 259200000),
        adminStatus: 'awaiting_reply',
        repliedAt: new Date(Date.now() - 255600000)
      }
    ];

    // Clear ALL existing test conversations first
    const deleteResult = await Conversation.deleteMany({ 
      $or: [
        { business: businessUser._id },
        { va: vaUser._id }
      ]
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing conversations`);

    // Create new conversations with unique combinations
    for (let i = 0; i < conversations.length; i++) {
      const convData = conversations[i];
      
      // Check if conversation exists
      const existing = await Conversation.findOne({
        va: convData.va,
        business: convData.business
      });
      
      if (existing) {
        // Update existing conversation instead of creating new
        existing.messages = convData.messages;
        existing.lastMessage = convData.lastMessage;
        existing.lastMessageAt = convData.lastMessageAt;
        existing.unreadCount = convData.unreadCount;
        existing.isIntercepted = true;
        existing.adminStatus = convData.adminStatus;
        existing.interceptedAt = convData.interceptedAt;
        if (convData.forwardedAt) existing.forwardedAt = convData.forwardedAt;
        if (convData.repliedAt) existing.repliedAt = convData.repliedAt;
        await existing.save();
        console.log(`Updated existing ${convData.adminStatus} conversation`);
      } else {
        // Create new conversation
        const conversation = new Conversation(convData);
        await conversation.save();
        console.log(`Created ${convData.adminStatus} conversation`);
      }
      
      // Only create the first conversation due to unique constraint
      break;
    }

    // Show summary
    const totalIntercepted = await Conversation.countDocuments({ isIntercepted: true });
    const statusCounts = await Conversation.aggregate([
      { $match: { isIntercepted: true } },
      {
        $group: {
          _id: '$adminStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Summary:');
    console.log(`Total intercepted conversations: ${totalIntercepted}`);
    console.log('\nStatus breakdown:');
    statusCounts.forEach(item => {
      console.log(`- ${item._id || 'pending'}: ${item.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createTestInterceptedMessages();