/**
 * Seed Test Data for Tasks 45/46
 * Creates sample Business, VA, Conversation, and Messages for testing
 *
 * Usage:
 *   node backend/scripts/seedMessengerSample.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Business = require('../models/Business');
const VA = require('../models/VA');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

async function seedData() {
  try {
    console.log('=== Seeding Messenger Sample Data (Tasks 45/46) ===\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check if sample data already exists
    const existingBusiness = await User.findOne({ email: 'acme-robotics@test.com' });
    const existingVA = await User.findOne({ email: 'jane-doe@test.com' });

    if (existingBusiness || existingVA) {
      console.log('⚠️  Sample data already exists. Cleaning up first...\n');

      if (existingBusiness) {
        await Business.deleteOne({ user: existingBusiness._id });
        await Message.deleteMany({ sender: existingBusiness._id });
        await Conversation.deleteMany({ business: existingBusiness._id });
        await User.deleteOne({ _id: existingBusiness._id });
      }

      if (existingVA) {
        await VA.deleteOne({ user: existingVA._id });
        await Message.deleteMany({ sender: existingVA._id });
        await Conversation.deleteMany({ va: existingVA._id });
        await User.deleteOne({ _id: existingVA._id });
      }

      console.log('✅ Cleaned up existing sample data\n');
    }

    // Create Business User
    console.log('Creating Business User...');
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    const businessUser = await User.create({
      email: 'acme-robotics@test.com',
      password: hashedPassword,
      name: 'Acme Robotics Contact',
      emailVerified: true,
      role: 'business'
    });

    const businessProfile = await Business.create({
      user: businessUser._id,
      company: 'Acme Robotics',
      contactName: 'John Smith',
      contactRole: 'CEO',
      bio: 'Leading robotics company specializing in automation solutions.',
      email: 'acme-robotics@test.com',
      phone: '+1-555-0100',
      streetAddress: '123 Tech Drive',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'United States',
      approved: true,
      status: 'active'
    });

    console.log(`✅ Business created: ${businessProfile.company} (ID: ${businessUser._id})\n`);

    // Create VA User
    console.log('Creating VA User...');
    const vaUser = await User.create({
      email: 'jane-doe@test.com',
      password: hashedPassword,
      name: 'Jane Doe',
      emailVerified: true,
      role: 'va'
    });

    const vaProfile = await VA.create({
      user: vaUser._id,
      name: 'Jane Doe',
      hero: 'Expert Virtual Assistant with 10+ years experience',
      bio: 'Experienced virtual assistant specializing in administrative support, customer service, and project management. I help businesses streamline their operations and improve productivity.',
      email: 'jane-doe@test.com',
      phone: '+1-555-0200',
      city: 'Austin',
      state: 'TX',
      country: 'United States',
      hourlyRate: 45,
      approved: true,
      status: 'active'
    });

    console.log(`✅ VA created: ${vaProfile.name} (ID: ${vaUser._id})\n`);

    // Create Conversation
    console.log('Creating Conversation...');
    const conversation = await Conversation.create({
      business: businessUser._id,
      va: vaUser._id,
      participants: [businessUser._id, vaUser._id],
      type: 'BUSINESS_ADMIN_MASQUERADE',
      status: 'active',
      lastMessageAt: new Date()
    });

    console.log(`✅ Conversation created (ID: ${conversation._id})\n`);

    // Create Messages
    console.log('Creating Messages...\n');

    const messages = [
      {
        text: "Hello Jane! We're looking for administrative support for our growing robotics team.",
        sender: businessUser._id,
        senderModel: 'Business',
        senderType: 'business',
        senderId: businessUser._id,
        delay: 0
      },
      {
        text: "Hi John! I'd love to help. I have extensive experience with administrative tasks and project coordination.",
        sender: vaUser._id,
        senderModel: 'VA',
        senderType: 'va',
        senderId: vaUser._id,
        delay: 2000
      },
      {
        text: "That sounds great! What's your availability like?",
        sender: businessUser._id,
        senderModel: 'Business',
        senderType: 'business',
        senderId: businessUser._id,
        delay: 4000
      },
      {
        text: "I'm available 20-30 hours per week. I can start immediately if needed.",
        sender: vaUser._id,
        senderModel: 'VA',
        senderType: 'va',
        senderId: vaUser._id,
        delay: 6000
      },
      {
        text: "Perfect! Can you help with scheduling meetings and managing email correspondence?",
        sender: businessUser._id,
        senderModel: 'Business',
        senderType: 'business',
        senderId: businessUser._id,
        delay: 8000
      },
      {
        text: "Absolutely! I'm proficient with Google Calendar, Outlook, and various CRM systems.",
        sender: vaUser._id,
        senderModel: 'VA',
        senderType: 'va',
        senderId: vaUser._id,
        delay: 10000
      },
      // Legacy message without senderType/senderId for backfill testing
      {
        text: "This is a legacy message for backfill testing (no senderType/senderId).",
        sender: businessUser._id,
        senderModel: 'Business',
        senderType: null,
        senderId: null,
        delay: 12000,
        isLegacy: true
      }
    ];

    const baseTime = new Date(Date.now() - 3600000); // 1 hour ago
    const createdMessages = [];

    for (const msgData of messages) {
      const messageDate = new Date(baseTime.getTime() + msgData.delay);

      const messageDoc = {
        conversation: conversation._id,
        sender: msgData.sender,
        senderModel: msgData.senderModel,
        body: msgData.text,
        bodyHtml: msgData.text.replace(/\n/g, '<br>'),
        status: 'sent',
        createdAt: messageDate,
        updatedAt: messageDate
      };

      // Only add senderType/senderId if not legacy
      if (!msgData.isLegacy) {
        messageDoc.senderType = msgData.senderType;
        messageDoc.senderId = msgData.senderId;
      }

      const message = await Message.create(messageDoc);
      createdMessages.push(message);

      const senderLabel = msgData.senderType === 'business' ? 'Business' : msgData.senderType === 'va' ? 'VA' : 'Legacy';
      const senderInfo = msgData.senderType
        ? `(${senderLabel}: ${msgData.senderType}/${msgData.senderId})`
        : '(Legacy: no senderType/senderId)';

      console.log(`✅ Message ${createdMessages.length}: ${senderInfo}`);
      console.log(`   "${msgData.text.substring(0, 60)}${msgData.text.length > 60 ? '...' : ''}"\n`);
    }

    // Update conversation with last message
    conversation.lastMessage = messages[messages.length - 2].text; // Last non-legacy message
    conversation.lastMessageAt = new Date(baseTime.getTime() + messages[messages.length - 2].delay);
    await conversation.save();

    console.log('=== Seed Summary ===');
    console.log(`Business: ${businessProfile.company} (${businessUser.email})`);
    console.log(`  User ID: ${businessUser._id}`);
    console.log(`\nVA: ${vaProfile.name} (${vaUser.email})`);
    console.log(`  User ID: ${vaUser._id}`);
    console.log(`\nConversation ID: ${conversation._id}`);
    console.log(`\nMessages created: ${createdMessages.length}`);
    console.log(`  - With senderType/senderId: ${createdMessages.filter(m => m.senderType).length}`);
    console.log(`  - Legacy (needs backfill): ${createdMessages.filter(m => !m.senderType).length}`);

    console.log('\n=== Next Steps ===');
    console.log('1. Run validation: node backend/scripts/validateMessageDB.js');
    console.log('2. Test backfill: node backend/scripts/backfillMessageSenderFields.js --dry-run');
    console.log('3. Run backfill: node backend/scripts/backfillMessageSenderFields.js');
    console.log('4. Test API:');
    console.log(`   GET /api/messenger/conversations/${conversation._id}`);
    console.log(`   GET /api/messenger/conversations/${conversation._id}/messages`);
    console.log('\n✅ Seed complete!\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seed error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seed
seedData();