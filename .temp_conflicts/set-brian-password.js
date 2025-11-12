require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function setBrianPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'brian@esystemsmanagement.com';
    const newPassword = 'B5tccpbx';

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user and set verified/approved
    const result = await User.findOneAndUpdate(
      { email: email },
      {
        password: hashedPassword,
        isVerified: true,
        isApproved: true
      },
      { new: true }
    );

    if (result) {
      console.log(`✅ Updated password for ${email}`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`   Verified: true`);
      console.log(`   Approved: true`);

      // Verify the password works
      const user = await User.findOne({ email: email }).select('+password');
      const passwordWorks = await bcrypt.compare(newPassword, user.password);
      console.log(`   Password verification: ${passwordWorks ? '✅' : '❌'}`);

      console.log('\n📋 Login at: http://localhost:3002/sign-in');
    } else {
      console.log(`❌ User not found: ${email}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

setBrianPassword();