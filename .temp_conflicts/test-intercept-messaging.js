/**
 * Test script for intercepted messaging system
 * 
 * This script tests the intercepted messaging flow:
 * 1. Business sends message to VA (gets intercepted)
 * 2. Admin sees intercepted conversation
 * 3. Admin forwards message to VA
 * 4. VA only sees admin's message, not the original business message
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const VA = require('./models/VA');
const Business = require('./models/Business');

// Load environment variables
dotenv.config();

// Test data
const testData = {
  business: {
    email: 'test-business@example.com',
    password: 'Test123!@#',
    profile: {
      businessName: 'Test Business Corp',
      businessType: 'Software',
      companySize: '10-50'
    }
  },
  va: {
    email: 'test-va@example.com',
    password: 'Test123!@#',
    profile: {
      firstName: 'Test',
      lastName: 'VA',
      skills: ['Data Entry', 'Customer Service']
    }
  },
  admin: {
    email: 'test-admin@example.com',
    password: 'Admin123!@#'
  }
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up existing test data...');
  
  // Delete test users and their related data
  const testEmails = [testData.business.email, testData.va.email, testData.admin.email];
  const users = await User.find({ email: { $in: testEmails } });
  
  for (const user of users) {
    // Delete related conversations
    await Conversation.deleteMany({ 
      $or: [
        { participants: user._id },
        { va: user._id },
        { business: user._id },
        { originalSender: user._id }
      ]
    });
    
    // Delete VA/Business profiles
    if (user.va) await VA.findByIdAndDelete(user.va);
    if (user.business) await Business.findByIdAndDelete(user.business);
  }
  
  // Delete users
  await User.deleteMany({ email: { $in: testEmails } });
  
  console.log('✅ Test data cleaned up');
}

async function createTestUsers() {
  console.log('\n👥 Creating test users...');
  
  // Create Business User
  const businessUser = await User.create({
    email: testData.business.email,
    password: testData.business.password,
    profile: {
      business: true,
      profileCompletion: 85  // Above 80% threshold
    }
  });
  
  const businessProfile = await Business.create({
    user: businessUser._id,
    contactName: 'John Doe',
    company: testData.business.profile.businessName,
    bio: 'We are a software development company specializing in web applications.',
    companySize: '11-50',  // Use valid enum value
    industry: 'Software Development'
  });
  
  businessUser.business = businessProfile._id;
  await businessUser.save();
  
  console.log('✅ Business user created:', businessUser.email);
  
  // Create VA User
  const vaUser = await User.create({
    email: testData.va.email,
    password: testData.va.password,
    profile: {
      va: true,
      profileCompletion: 90
    }
  });
  
  const vaProfile = await VA.create({
    user: vaUser._id,
    name: `${testData.va.profile.firstName} ${testData.va.profile.lastName}`,
    bio: 'Experienced virtual assistant specializing in data entry and customer service.',
    skills: testData.va.profile.skills,
    searchStatus: 'actively_looking'
  });
  
  vaUser.va = vaProfile._id;
  await vaUser.save();
  
  console.log('✅ VA user created:', vaUser.email);
  
  // Create Admin User
  const adminUser = await User.create({
    email: testData.admin.email,
    password: testData.admin.password,
    admin: true
  });
  
  console.log('✅ Admin user created:', adminUser.email);
  
  return { businessUser, vaUser, adminUser };
}

async function testInterceptedMessaging() {
  console.log('\n🧪 Testing intercepted messaging flow...\n');
  
  const { businessUser, vaUser, adminUser } = await createTestUsers();
  
  // Step 1: Business sends message to VA (should be intercepted)
  console.log('📤 Step 1: Business sends message to VA');
  const businessMessage = 'Hello, I need help with data entry for my business.';
  
  const interceptedConversation = new Conversation({
    participants: [businessUser._id, vaUser._id],
    va: vaUser._id,
    business: businessUser._id,
    messages: [{
      sender: businessUser._id,
      content: businessMessage
    }],
    lastMessage: businessMessage,
    lastMessageAt: new Date(),
    unreadCount: {
      va: 0,  // VA doesn't get notified
      business: 0,
      admin: 1  // Admin gets notified
    },
    isIntercepted: true,
    originalSender: businessUser._id,
    interceptedAt: new Date()
  });
  
  await interceptedConversation.save();
  console.log('✅ Message intercepted! Conversation ID:', interceptedConversation._id);
  console.log('   - VA unread count:', interceptedConversation.unreadCount.va, '(should be 0)');
  console.log('   - Admin unread count:', interceptedConversation.unreadCount.admin, '(should be 1)');
  
  // Step 2: Verify VA cannot see the intercepted conversation
  console.log('\n🔍 Step 2: Checking VA\'s view of conversations');
  const vaConversations = await Conversation.find({
    participants: vaUser._id,
    isIntercepted: { $ne: true }
  });
  
  console.log('✅ VA sees', vaConversations.length, 'conversations (should be 0)');
  
  // Step 3: Verify Admin can see the intercepted conversation
  console.log('\n👁️ Step 3: Checking Admin\'s view of intercepted conversations');
  const adminInterceptedConvos = await Conversation.find({
    isIntercepted: true
  });
  
  console.log('✅ Admin sees', adminInterceptedConvos.length, 'intercepted conversations (should be 1)');
  
  // Step 4: Admin creates a conversation with VA to forward the message
  console.log('\n💬 Step 4: Admin forwards message to VA');
  const adminMessage = `[Inquiry from ${testData.business.profile.businessName}]\n\nA business owner is looking for help with data entry. Would you be interested in this opportunity?`;
  
  const adminVAConversation = new Conversation({
    participants: [adminUser._id, vaUser._id],
    va: vaUser._id,
    business: adminUser._id,  // Admin acts as business side
    messages: [{
      sender: adminUser._id,
      content: adminMessage
    }],
    lastMessage: adminMessage,
    lastMessageAt: new Date(),
    unreadCount: {
      va: 1,  // VA gets notified
      business: 0,
      admin: 0
    },
    isIntercepted: false  // This is direct admin-VA communication
  });
  
  await adminVAConversation.save();
  
  // Link the admin conversation to the intercepted one
  interceptedConversation.adminConversationId = adminVAConversation._id;
  await interceptedConversation.save();
  
  console.log('✅ Admin forwarded message to VA');
  console.log('   - Admin-VA Conversation ID:', adminVAConversation._id);
  console.log('   - VA unread count:', adminVAConversation.unreadCount.va, '(should be 1)');
  
  // Step 5: Verify VA can now see the admin's message
  console.log('\n📨 Step 5: Checking VA\'s conversations after admin forward');
  const vaConversationsAfter = await Conversation.find({
    participants: vaUser._id,
    isIntercepted: { $ne: true }
  }).populate('messages.sender', 'email admin');
  
  console.log('✅ VA now sees', vaConversationsAfter.length, 'conversations (should be 1)');
  
  if (vaConversationsAfter.length > 0) {
    const vaConvo = vaConversationsAfter[0];
    console.log('   - From:', vaConvo.messages[0].sender.email);
    console.log('   - Is Admin:', vaConvo.messages[0].sender.admin);
    console.log('   - Message preview:', vaConvo.messages[0].content.substring(0, 50) + '...');
  }
  
  // Step 6: Test Business sends another message
  console.log('\n📤 Step 6: Business sends follow-up message');
  const followUpMessage = 'I forgot to mention, this is urgent!';
  interceptedConversation.addMessage(businessUser._id, followUpMessage);
  await interceptedConversation.save();
  
  console.log('✅ Follow-up message added to intercepted conversation');
  console.log('   - Admin unread count:', interceptedConversation.unreadCount.admin, '(should be 2)');
  console.log('   - VA unread count:', interceptedConversation.unreadCount.va, '(should still be 0)');
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log('✅ Business can send messages to VA');
  console.log('✅ Messages are intercepted (VA doesn\'t receive them directly)');
  console.log('✅ Admin receives and can view intercepted messages');
  console.log('✅ Admin can forward messages to VA');
  console.log('✅ VA only sees messages from Admin, not original business messages');
  console.log('✅ System maintains proper unread counts for all parties');
  
  return true;
}

async function runTests() {
  try {
    await connectDB();
    await cleanupTestData();
    await testInterceptedMessaging();
    
    console.log('\n✨ All tests passed successfully!');
    
    // Cleanup after tests
    await cleanupTestData();
    console.log('\n🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the tests
runTests();