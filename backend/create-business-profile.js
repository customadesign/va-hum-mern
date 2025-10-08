require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Business = require('./models/Business');

async function createBusinessProfile() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'pat@esystemsmanagement.com';

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return;
    }

    // Check if business profile already exists
    const existingBusiness = await Business.findOne({ user: user._id });
    if (existingBusiness) {
      console.log('Business profile already exists for:', email);
      return;
    }

    // Create business profile
    const business = new Business({
      user: user._id,
      contactName: 'Pat E-Systems',
      company: 'E-Systems Management Test',
      bio: 'Test business account for E-Systems Management Hub - helping businesses find skilled professionals.',
      industry: 'Technology',
      employeeCount: 25,
      city: 'Test City',
      state: 'Test State',
      country: 'USA',
      verified: true
    });

    const savedBusiness = await business.save();
    console.log('Business profile created:', savedBusiness.company);

    // Update user with business reference
    await User.findByIdAndUpdate(user._id, { business: savedBusiness._id });
    console.log('User updated with business reference');

    console.log('\n✅ E-Systems business profile created successfully!');
    console.log('Email:', email);
    console.log('Password: B5tccpbx');
    console.log('Company:', savedBusiness.company);
    console.log('Login at: http://localhost:3002/login');

  } catch (error) {
    console.error('Error creating business profile:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createBusinessProfile();