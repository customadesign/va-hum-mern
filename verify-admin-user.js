require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function verifyAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ admin: true }).select('email firstName lastName admin createdAt');
    
    if (adminUsers.length === 0) {
      console.log('\n❌ No admin users found!');
      console.log('You need to create an admin user first.');
      console.log('Run: node create-admin-user.js');
    } else {
      console.log(`\n✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
        console.log(`    Created: ${user.createdAt}`);
      });
    }

    // Also check for regular users that might need admin access
    const regularUsers = await User.find({ admin: { $ne: true } }).select('email firstName lastName').limit(5);
    if (regularUsers.length > 0) {
      console.log('\n📋 Regular users (first 5):');
      regularUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.firstName} ${user.lastName})`);
      });
      console.log('\nTo make a user admin, you can update them in MongoDB or use the admin invitation system.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyAdminUser();