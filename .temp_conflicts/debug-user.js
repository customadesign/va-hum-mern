require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Business = require('./models/Business');

async function debugUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'pat@esystemsmanagement.com';
    const testPassword = 'B5tccpbx';

    // Find the user
    const user = await User.findOne({ email }).populate('business');
    if (!user) {
      console.log('❌ User not found:', email);
      return;
    }

    console.log('✅ User found:');
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- isVerified:', user.isVerified);
    console.log('- isApproved:', user.isApproved);
    console.log('- Business ID:', user.business?._id || 'No business linked');

    // Test password
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    console.log('- Password test:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

    // Check business profile
    if (user.business) {
      console.log('\n✅ Business profile found:');
      console.log('- Company:', user.business.company);
      console.log('- Contact Name:', user.business.contactName);
      console.log('- Verified:', user.business.verified);
    } else {
      const business = await Business.findOne({ user: user._id });
      if (business) {
        console.log('\n✅ Business profile found (separate query):');
        console.log('- Company:', business.company);
        console.log('- Contact Name:', business.contactName);
        console.log('- Verified:', business.verified);
        
        // Update user with business reference if missing
        await User.findByIdAndUpdate(user._id, { business: business._id });
        console.log('- Updated user with business reference');
      } else {
        console.log('\n❌ No business profile found');
      }
    }

    console.log('\n📝 Login test:');
    console.log('URL: http://localhost:3002/login');
    console.log('Email:', email);
    console.log('Password:', testPassword);

  } catch (error) {
    console.error('Error debugging user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugUser();