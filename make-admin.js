const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const User = require('./backend/models/User');

async function makeAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('👤 Looking for user: pat@esystemsmanagement.com');
    const user = await User.findOne({ email: 'pat@esystemsmanagement.com' });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      email: user.email,
      currentAdmin: user.admin,
      role: user.role
    });

    // Make user admin
    user.admin = true;
    user.role = 'admin';
    await user.save();

    console.log('🎉 User updated successfully!');
    console.log('✅ Admin privileges granted to:', user.email);
    console.log('🔑 Admin status:', user.admin);
    console.log('👤 Role:', user.role);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

makeAdmin();