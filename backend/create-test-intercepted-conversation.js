require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const Business = require('./models/Business');
const VA = require('./models/VA');

const createTestInterceptedConversation = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a business user and a VA user
    const businessUser = await User.findOne({ role: 'business' }).populate('business');
    const vaUser = await User.findOne({ role: 'va' }).populate('va');

    if (!businessUser) {
      console.log('No business user found. Creating one...');
      // Create a test business user
      const newBusiness = new Business({
        contactName: 'Test Business Owner',
        company: 'Test Company Inc',
        email: 'testbusiness@example.com',
        phone: '123-456-7890',
        bio: 'This is a test business',
        completionPercentage: 75 // Below 80% threshold
      });
      await newBusiness.save();

      const newBusinessUser = new User({
        email: 'testbusiness@example.com',
        firstName: 'Test',
        lastName: 'Business',
        role: 'business',
        business: newBusiness._id,
        profile: {
          business: newBusiness._id
        }
      });
      await newBusinessUser.save();
      
      businessUser = newBusinessUser;
      console.log('Created test business user');
    }

    if (!vaUser) {
      console.log('No VA user found. Creating one...');
      // Create a test VA user
      const newVA = new VA({
        firstName: 'Test',
        lastName: 'VA',
        email: 'testva@example.com',
        phone: '987-654-3210',
        bio: 'This is a test VA',
        hourlyRate: 25,
        skills: ['Admin', 'Customer Service']
      });
      await newVA.save();

      const newVAUser = new User({
        email: 'testva@example.com',
        firstName: 'Test',
        lastName: 'VA',
        role: 'va',
        va: newVA._id,
        profile: {
          va: newVA._id
        }
      });
      await newVAUser.save();
      
      vaUser = newVAUser;
      console.log('Created test VA user');
    }

    // Create an intercepted conversation
    const conversation = new Conversation({
      participants: [businessUser._id, vaUser._id],
      va: vaUser._id,
      business: businessUser._id,
      messages: [
        {
          sender: businessUser._id,
          content: 'Hello, I need help with my administrative tasks. Can you assist?',
          read: false,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          sender: businessUser._id,
          content: 'I specifically need help with email management and calendar scheduling.',
          read: false,
          createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
        }
      ],
      lastMessage: 'I specifically need help with email management and calendar scheduling.',
      lastMessageAt: new Date(Date.now() - 1800000),
      unreadCount: {
        va: 0, // VA doesn't see intercepted messages
        business: 0,
        admin: 2 // Admin has 2 unread messages
      },
      status: 'active',
      isIntercepted: true,
      originalSender: businessUser._id,
      interceptedAt: new Date(Date.now() - 3600000),
      adminStatus: 'pending',
      adminNotes: ''
    });

    await conversation.save();

    console.log('\n✅ Successfully created intercepted conversation!');
    console.log('Conversation details:');
    console.log('- ID:', conversation._id);
    console.log('- Business:', businessUser.email);
    console.log('- VA:', vaUser.email);
    console.log('- Messages:', conversation.messages.length);
    console.log('- Status:', conversation.adminStatus);
    console.log('- Intercepted:', conversation.isIntercepted);

    // Create another intercepted conversation with different status
    const conversation2 = new Conversation({
      participants: [businessUser._id, vaUser._id],
      va: vaUser._id,
      business: businessUser._id,
      messages: [
        {
          sender: businessUser._id,
          content: 'Hi, I run an e-commerce business and need VA support.',
          read: true,
          createdAt: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          sender: vaUser._id,
          content: '[Admin Response]\nThank you for your inquiry. I can definitely help with your e-commerce needs.',
          read: true,
          createdAt: new Date(Date.now() - 82800000) // 23 hours ago
        }
      ],
      lastMessage: '[Admin Response]\nThank you for your inquiry. I can definitely help with your e-commerce needs.',
      lastMessageAt: new Date(Date.now() - 82800000),
      unreadCount: {
        va: 0,
        business: 0,
        admin: 0
      },
      status: 'active',
      isIntercepted: true,
      originalSender: businessUser._id,
      interceptedAt: new Date(Date.now() - 86400000),
      adminStatus: 'replied',
      repliedAt: new Date(Date.now() - 82800000),
      adminNotes: 'Business seems legitimate. Responded with initial information.',
      adminActions: [
        {
          action: 'replied',
          performedBy: businessUser._id, // Using business user as placeholder for admin
          performedAt: new Date(Date.now() - 82800000),
          details: { asVA: true, messageLength: 89 }
        }
      ]
    });

    await conversation2.save();

    console.log('\n✅ Created second intercepted conversation!');
    console.log('- ID:', conversation2._id);
    console.log('- Status:', conversation2.adminStatus);

    // Show summary
    const totalIntercepted = await Conversation.countDocuments({ isIntercepted: true });
    console.log('\n📊 Summary:');
    console.log(`Total intercepted conversations: ${totalIntercepted}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createTestInterceptedConversation();