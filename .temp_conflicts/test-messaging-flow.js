require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const bcrypt = require('bcryptjs');

async function testMessagingFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // 1. Check admin user
    console.log('1. Checking admin user (admin@linkage.ph)...');
    const adminUser = await User.findOne({ email: 'admin@linkage.ph' });
    if (!adminUser) {
      console.log('   ❌ Admin user not found! Creating...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      const newAdmin = await User.create({
        email: 'admin@linkage.ph',
        password: hashedPassword,
        admin: true,
        profile: {
          name: 'System Admin',
          company: 'Linkage VA Hub'
        }
      });
      console.log('   ✅ Admin user created');
    } else {
      console.log('   ✅ Admin user exists');
      console.log('   Admin ID:', adminUser._id);
    }
    
    // 2. Check for intercepted conversations
    console.log('\n2. Checking for intercepted conversations...');
    const interceptedConvos = await Conversation.find({ isIntercepted: true })
      .populate('business', 'email profile')
      .populate('va', 'email profile')
      .populate('originalSender', 'email profile');
    
    console.log(`   Found ${interceptedConvos.length} intercepted conversations`);
    
    if (interceptedConvos.length > 0) {
      console.log('\n   Intercepted Conversations:');
      interceptedConvos.forEach((conv, index) => {
        console.log(`   ${index + 1}. Business: ${conv.business?.profile?.company || conv.business?.email}`);
        console.log(`      → VA: ${conv.va?.profile?.name || conv.va?.email}`);
        console.log(`      Messages: ${conv.messages.length}`);
        console.log(`      Last message: "${conv.lastMessage?.substring(0, 50)}..."`);
        console.log(`      Admin forwarded: ${conv.adminConversationId ? 'Yes' : 'No'}`);
        if (conv.adminNotes) {
          console.log(`      Admin notes: ${conv.adminNotes}`);
        }
        console.log('');
      });
    }
    
    // 3. Check regular conversations for admin
    console.log('\n3. Checking admin\'s direct conversations...');
    const adminConvos = await Conversation.find({ 
      participants: adminUser?._id,
      isIntercepted: { $ne: true }
    })
    .populate('va', 'email profile')
    .populate('business', 'email profile');
    
    console.log(`   Found ${adminConvos.length} direct admin conversations`);
    
    // 4. Summary
    console.log('\n📊 SUMMARY:');
    console.log('─────────────────────────────────────');
    console.log('Admin Login:');
    console.log('  URL: http://localhost:4000/login');
    console.log('  Email: admin@linkage.ph');
    console.log('  Password: admin123');
    console.log('');
    console.log('Main App Conversations:');
    console.log('  URL: http://localhost:3000/conversations');
    console.log('  Admin will see ALL conversations including intercepted ones');
    console.log('');
    console.log('Current Status:');
    console.log(`  • ${interceptedConvos.length} intercepted business→VA conversations`);
    console.log(`  • ${interceptedConvos.filter(c => !c.adminConversationId).length} pending admin review`);
    console.log(`  • ${interceptedConvos.filter(c => c.adminConversationId).length} forwarded to VAs`);
    console.log(`  • ${adminConvos.length} direct admin conversations`);
    
    await mongoose.disconnect();
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testMessagingFlow();