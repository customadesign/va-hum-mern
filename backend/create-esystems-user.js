require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Business = require('./models/Business');

async function createESystemsUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'pat@esystemsmanagement.com';
    const password = 'B5tccpbx';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      role: 'business',
      isVerified: true, // Auto-verify for testing
      isApproved: true, // Auto-approve for testing
    });

    const savedUser = await user.save();
    console.log('Business user created:', savedUser.email);

    // Create business profile
    const business = new Business({
      user: savedUser._id,
      contactName: 'Pat E-Systems',
      company: 'E-Systems Management Test',
      bio: 'Test business account for E-Systems Management Hub - helping businesses find skilled professionals.',
      industry: 'Technology',
      employeeCount: 25, // Number instead of string
      city: 'Test City',
      state: 'Test State',
      country: 'USA',
      verified: true // Auto-verify for testing
    });

    const savedBusiness = await business.save();
    console.log('Business profile created:', savedBusiness.businessName);

    // Update user with business reference
    await User.findByIdAndUpdate(savedUser._id, { business: savedBusiness._id });
    console.log('User updated with business reference');

    console.log('\n✅ E-Systems business user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: business');
    console.log('Login at: http://localhost:3002/login');

  } catch (error) {
    console.error('Error creating E-Systems user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createESystemsUser();