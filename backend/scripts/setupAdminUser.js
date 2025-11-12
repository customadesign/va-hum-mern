const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

// Admin credentials to set up
const ADMIN_EMAIL = 'admin@linkage.ph';
const ADMIN_PASSWORD = 'admin123';

async function setupAdminUser() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    console.log(`🔍 Checking for existing user with email: ${ADMIN_EMAIL}`);
    let user = await User.findOne({ email: ADMIN_EMAIL });

    if (user) {
      console.log('📝 User already exists. Updating credentials and admin status...');
      
      // Need to select password field since it's excluded by default
      user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
      
      // Update user with new password and admin privileges
      // The password will be hashed automatically by the pre-save hook
      user.password = ADMIN_PASSWORD;
      user.admin = true;
      user.isVerified = true;
      user.name = user.name || 'Admin User';
      user.firstName = user.firstName || 'Admin';
      user.lastName = user.lastName || 'User';
      user.displayName = user.displayName || 'Administrator';
      
      await user.save();
      console.log('✅ User updated successfully!');
    } else {
      console.log('🆕 Creating new admin user...');
      
      // Create new admin user
      // The password will be hashed automatically by the pre-save hook
      user = new User({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        admin: true,
        isVerified: true,
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        displayName: 'Administrator',
        provider: 'local',
        confirmedAt: new Date(),
        profileCompletion: {
          percentage: 100,
          completedSteps: ['basic', 'email', 'verified'],
          lastUpdated: new Date()
        }
      });
      
      await user.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🎉 Admin user setup complete!');
    console.log('─────────────────────────────────');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('🔐 Admin Access: Enabled');
    console.log('✅ Email Verified: Yes');
    console.log('─────────────────────────────────');
    console.log('\n🌐 You can now login at: http://localhost:4000/login');
    
    // Verify the password works
    const testUser = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
    const isPasswordValid = await testUser.matchPassword(ADMIN_PASSWORD);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('⚠️  Warning: Password verification failed. Please check the setup.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin user:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the setup
console.log('🚀 Starting admin user setup...');
console.log('─────────────────────────────────');
setupAdminUser();