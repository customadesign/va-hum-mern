const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import User model
const User = require('./models/User');

async function checkUserAndAuth() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Search for the user
    const email = 'pat@murphyconsulting.us';
    const password = 'B5tccpbx';

    console.log('\n🔍 Searching for user:', email);
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ User not found in database');
      console.log('\n📋 Let me check all users in the database:');
      const allUsers = await User.find({}).select('email admin role');
      console.log('Total users:', allUsers.length);
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (admin: ${u.admin}, role: ${u.role})`);
      });

      console.log('\n💡 Creating user pat@murphyconsulting.us...');
      const newUser = await User.create({
        email: email,
        password: password,
        admin: false,
        role: 'business',
        isVerified: true
      });
      console.log('✅ User created successfully:', {
        id: newUser._id,
        email: newUser.email,
        admin: newUser.admin
      });

      // Test the newly created user
      const testUser = await User.findOne({ email }).select('+password');
      const isMatch = await testUser.matchPassword(password);
      console.log('🔐 Password verification for new user:', isMatch);

    } else {
      console.log('✅ User found:', {
        id: user._id,
        email: user.email,
        admin: user.admin,
        role: user.role,
        isVerified: user.isVerified,
        suspended: user.suspended,
        hasPassword: !!user.password
      });

      // Test password
      console.log('\n🔐 Testing password...');
      const isMatch = await user.matchPassword(password);
      console.log('Password match result:', isMatch);

      if (!isMatch) {
        console.log('❌ Password does not match!');
        console.log('🔄 Updating password to the correct one...');
        user.password = password;
        await user.save();

        // Test again
        const updatedUser = await User.findOne({ email }).select('+password');
        const isMatchAfterUpdate = await updatedUser.matchPassword(password);
        console.log('Password match after update:', isMatchAfterUpdate);
      }

      // Test JWT token generation
      console.log('\n🎫 Testing JWT token generation...');
      const token = user.getSignedJwtToken();
      console.log('JWT Token generated:', token ? '✅ Success' : '❌ Failed');

      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', {
          userId: decoded.id,
          expiresIn: new Date(decoded.exp * 1000).toISOString()
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

checkUserAndAuth();