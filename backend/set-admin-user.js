const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function setAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find and update the admin user
    const adminEmail = 'pat@murphyconsulting.us';
    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      { admin: true },
      { new: true }
    );

    if (user) {
      console.log(`✅ Successfully set admin flag for user: ${adminEmail}`);
      console.log(`User admin status: ${user.admin}`);
    } else {
      console.log(`❌ User not found: ${adminEmail}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error setting admin user:', error);
    process.exit(1);
  }
}

setAdminUser();