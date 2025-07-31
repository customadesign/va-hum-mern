const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub');
    
    const User = require('../models/User');
    const VA = require('../models/VA');
    const Location = require('../models/Location');
    const RoleType = require('../models/RoleType');
    const RoleLevel = require('../models/RoleLevel');
    
    console.log('🧹 Cleaning up test data...');
    
    // Find and delete test users
    const testUsers = await User.find({ email: { $regex: '@example.com$' } });
    console.log(`Found ${testUsers.length} test users`);
    
    if (testUsers.length > 0) {
      // Get user IDs
      const userIds = testUsers.map(u => u._id);
      
      // Delete related data
      await VA.deleteMany({ user: { $in: userIds } });
      await Location.deleteMany({}); // Clean all locations for now
      await RoleType.deleteMany({});
      await RoleLevel.deleteMany({});
      
      // Delete users
      await User.deleteMany({ _id: { $in: userIds } });
      
      console.log('✅ Cleaned up test data');
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanup();