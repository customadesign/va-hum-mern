require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Business = require('./models/Business');

async function recreateESystemsUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'pat@esystemsmanagement.com';
    const password = 'B5tccpbx';

    // 1. Clean up existing user and business
    console.log('🧹 Cleaning up existing user and business...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Delete associated business first
      await Business.deleteMany({ user: existingUser._id });
      console.log('  - Deleted associated business profiles');
      
      // Delete user
      await User.findByIdAndDelete(existingUser._id);
      console.log('  - Deleted existing user');
    }

    // 2. Create new user
    console.log('👤 Creating new user...');
    // Don't pre-hash the password - let the model's pre-save hook handle it
    
    const newUser = new User({
      email: email,
      password: password, // Use plain text password - model will hash it
      role: 'business',
      isVerified: true,
      isApproved: true,
      admin: false,
      suspended: false,
      profileComplete: true
    });

    const savedUser = await newUser.save();
    console.log('  - User created with ID:', savedUser._id);

    // 3. Create business profile
    console.log('🏢 Creating business profile...');
    const business = new Business({
      user: savedUser._id,
      contactName: 'Pat Murphy',
      company: 'E-Systems Management',
      bio: 'E-Systems Management specializes in connecting businesses with skilled virtual professionals to build dream teams.',
      industry: 'Technology Services',
      employeeCount: 25,
      city: 'Austin',
      state: 'Texas',
      country: 'USA',
      verified: true
    });

    const savedBusiness = await business.save();
    console.log('  - Business profile created:', savedBusiness.company);

    // 4. Link business to user
    await User.findByIdAndUpdate(savedUser._id, { business: savedBusiness._id });
    console.log('  - User linked to business profile');

    // 5. Verify the setup
    console.log('\n🔍 Verifying setup...');
    // Include password field in query since it has select: false by default
    const verifyUser = await User.findById(savedUser._id).select('+password').populate('business');
    
    console.log('User Details:');
    console.log('  - Email:', verifyUser.email);
    console.log('  - Role:', verifyUser.role);
    console.log('  - Verified:', verifyUser.isVerified);
    console.log('  - Approved:', verifyUser.isApproved);
    console.log('  - Has Password:', !!verifyUser.password);
    console.log('  - Business Company:', verifyUser.business?.company);

    // 6. Test password hash
    if (verifyUser.password) {
      const isPasswordValid = await bcrypt.compare(password, verifyUser.password);
      console.log('  - Password Test:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    } else {
      console.log('  - Password Test: ❌ No password found');
    }

    console.log('\n🎉 E-Systems user recreated successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('  URL: http://localhost:3002/login');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('\n⚠️  Note: If you get rate limiting errors, wait a few minutes before testing login');

  } catch (error) {
    console.error('❌ Error recreating E-Systems user:', error);
    
    if (error.code === 11000) {
      console.log('\n💡 Duplicate key error - user might already exist. Try deleting manually first.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

recreateESystemsUser();