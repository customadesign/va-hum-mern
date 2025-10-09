require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkBrianUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: 'brian@esystemsmanagement.com' }).select('+password');

    if (user) {
      console.log('\n👤 User found:');
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  Verified:', user.isVerified);
      console.log('  Approved:', user.isApproved);
      console.log('  Admin:', user.admin);
      console.log('  Has Password:', !!user.password);
      console.log('  Password Hash (first 30 chars):', user.password?.substring(0, 30) + '...');
      console.log('\n⚠️  Password is hashed and cannot be retrieved.');
      console.log('💡 You can reset it using the reset-password.js script.');
    } else {
      console.log('\n❌ User not found: brian@esystemsmanagement.com');
      console.log('\n💡 Available E-Systems users:');
      const esystemsUsers = await User.find({ email: { $regex: 'esystemsmanagement.com$' } });
      esystemsUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkBrianUser();