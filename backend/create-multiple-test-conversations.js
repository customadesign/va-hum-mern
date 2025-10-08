require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const Business = require('./models/Business');
const VA = require('./models/VA');

const createMultipleTestConversations = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create multiple businesses and VAs
    const testData = [
      {
        business: { 
          email: 'tech.solutions@example.com',
          firstName: 'John',
          lastName: 'Smith',
          company: 'Tech Solutions Inc',
          bio: 'Technology consulting firm'
        },
        va: {
          email: 'sarah.va@example.com',
          firstName: 'Sarah',
          lastName: 'Johnson',
          name: 'Sarah Johnson',
          bio: 'Experienced Virtual Assistant'
        },
        adminStatus: 'pending',
        lastMessage: 'I need help with administrative tasks and email management.'
      },
      {
        business: {
          email: 'marketing.pro@example.com',
          firstName: 'Emily',
          lastName: 'Davis',
          company: 'Marketing Pro Agency',
          bio: 'Digital marketing agency'
        },
        va: {
          email: 'michael.va@example.com',
          firstName: 'Michael',
          lastName: 'Brown',
          name: 'Michael Brown',
          bio: 'Social media specialist'
        },
        adminStatus: 'forwarded',
        lastMessage: 'Looking for social media management support.'
      },
      {
        business: {
          email: 'ecommerce.store@example.com', 
          firstName: 'David',
          lastName: 'Wilson',
          company: 'E-Commerce Store Ltd',
          bio: 'Online retail business'
        },
        va: {
          email: 'jessica.va@example.com',
          firstName: 'Jessica',
          lastName: 'Martinez',
          name: 'Jessica Martinez',
          bio: 'E-commerce specialist'
        },
        adminStatus: 'replied',
        lastMessage: 'Yes, I can help with your inventory management!'
      },
      {
        business: {
          email: 'consulting.firm@example.com',
          firstName: 'Robert',
          lastName: 'Anderson',
          company: 'Consulting Firm LLC',
          bio: 'Business consulting services'
        },
        va: {
          email: 'amanda.va@example.com',
          firstName: 'Amanda',
          lastName: 'Taylor',
          name: 'Amanda Taylor',
          bio: 'Business administration expert'
        },
        adminStatus: 'awaiting_reply',
        lastMessage: 'When can we schedule a call to discuss further?'
      },
      {
        business: {
          email: 'startup.hub@example.com',
          firstName: 'Lisa',
          lastName: 'Chen',
          company: 'Startup Hub Inc',
          bio: 'Startup incubator'
        },
        va: {
          email: 'daniel.va@example.com',
          firstName: 'Daniel',
          lastName: 'Garcia',
          name: 'Daniel Garcia',
          bio: 'Startup support specialist'
        },
        adminStatus: 'pending',
        lastMessage: 'Need help with investor relations and pitch decks.'
      }
    ];

    // Clear existing test data
    console.log('Clearing existing test data...');
    const testEmails = testData.flatMap(d => [d.business.email, d.va.email]);
    await User.deleteMany({ email: { $in: testEmails } });
    
    // Create all test data
    for (const data of testData) {
      console.log(`\nCreating conversation: ${data.business.company} <-> ${data.va.name}`);
      
      // Create business user
      const businessUser = new User({
        email: data.business.email,
        password: 'TestPassword123!',
        firstName: data.business.firstName,
        lastName: data.business.lastName,
        name: `${data.business.firstName} ${data.business.lastName}`,
        role: 'business'
      });
      await businessUser.save();
      
      // Create business profile
      const business = new Business({
        user: businessUser._id,
        contactName: `${data.business.firstName} ${data.business.lastName}`,
        company: data.business.company,
        email: data.business.email,
        phone: '555-0100',
        bio: data.business.bio,
        completionPercentage: 75 // Below 80% to trigger interception
      });
      await business.save();
      
      businessUser.business = business._id;
      await businessUser.save();
      
      // Create VA user
      const vaUser = new User({
        email: data.va.email,
        password: 'TestPassword123!',
        firstName: data.va.firstName,
        lastName: data.va.lastName,
        name: data.va.name,
        role: 'va'
      });
      await vaUser.save();
      
      // Create VA profile
      const va = new VA({
        user: vaUser._id,
        name: data.va.name,
        email: data.va.email,
        phone: '555-0200',
        bio: data.va.bio,
        hourlyRate: 30,
        skills: ['Admin', 'Customer Service', 'Data Entry']
      });
      await va.save();
      
      vaUser.va = va._id;
      await vaUser.save();
      
      // Create conversation
      const messages = [];
      const now = Date.now();
      
      // Add messages based on status
      if (data.adminStatus === 'pending') {
        messages.push({
          sender: businessUser._id,
          content: data.lastMessage,
          read: false,
          createdAt: new Date(now - 3600000)
        });
      } else if (data.adminStatus === 'forwarded') {
        messages.push({
          sender: businessUser._id,
          content: data.lastMessage,
          read: true,
          createdAt: new Date(now - 7200000)
        });
      } else if (data.adminStatus === 'replied') {
        messages.push({
          sender: businessUser._id,
          content: 'I need help with my business operations.',
          read: true,
          createdAt: new Date(now - 10800000)
        });
        messages.push({
          sender: vaUser._id,
          content: data.lastMessage,
          read: true,
          createdAt: new Date(now - 7200000)
        });
      } else if (data.adminStatus === 'awaiting_reply') {
        messages.push({
          sender: businessUser._id,
          content: 'I need regular VA support for my business.',
          read: true,
          createdAt: new Date(now - 14400000)
        });
        messages.push({
          sender: vaUser._id,
          content: 'I would be happy to help with your business needs.',
          read: true,
          createdAt: new Date(now - 10800000)
        });
        messages.push({
          sender: businessUser._id,
          content: data.lastMessage,
          read: false,
          createdAt: new Date(now - 3600000)
        });
      }
      
      const conversation = new Conversation({
        participants: [businessUser._id, vaUser._id],
        va: vaUser._id,
        business: businessUser._id,
        messages: messages,
        lastMessage: data.lastMessage,
        lastMessageAt: messages[messages.length - 1].createdAt,
        unreadCount: {
          va: 0,
          business: 0,
          admin: data.adminStatus === 'pending' || data.adminStatus === 'awaiting_reply' ? 1 : 0
        },
        status: 'active',
        isIntercepted: true,
        originalSender: businessUser._id,
        interceptedAt: messages[0].createdAt,
        adminStatus: data.adminStatus,
        ...(data.adminStatus === 'forwarded' && { forwardedAt: new Date(now - 5400000) }),
        ...(data.adminStatus === 'replied' && { repliedAt: new Date(now - 7200000) }),
        ...(data.adminStatus === 'awaiting_reply' && { repliedAt: new Date(now - 10800000) })
      });
      
      await conversation.save();
      console.log(`✅ Created ${data.adminStatus} conversation`);
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
    
    const statusMap = {};
    statusCounts.forEach(item => {
      statusMap[item._id || 'pending'] = item.count;
    });
    
    console.log(`- pending: ${statusMap.pending || 0}`);
    console.log(`- forwarded: ${statusMap.forwarded || 0}`);
    console.log(`- replied: ${statusMap.replied || 0}`);
    console.log(`- awaiting_reply: ${statusMap.awaiting_reply || 0}`);
    
    console.log('\n✅ Successfully created all test conversations!');
    console.log('You can now test the filtering on the InterceptedMessages page.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createMultipleTestConversations();