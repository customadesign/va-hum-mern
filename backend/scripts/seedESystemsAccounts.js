require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Business = require('../models/Business');

const seedAccounts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create business/employer account
    const businessPassword = await bcrypt.hash('employer123', 10);
    const businessUser = await User.create({
      email: 'employer@esystems.com',
      password: businessPassword,
      emailVerified: true,
      isActive: true
    });

    // Create business profile
    const business = await Business.create({
      user: businessUser._id,
      contactName: 'John Smith',
      company: 'Tech Solutions Inc.',
      bio: 'Leading technology company looking for talented virtual assistants to join our growing team.',
      website: 'https://techsolutions.example.com',
      industry: 'Technology',
      size: '50-100 employees',
      isActive: true
    });

    // Update user with business reference
    businessUser.business = business._id;
    await businessUser.save();

    console.log('Business account created:');
    console.log('Email: employer@esystems.com');
    console.log('Password: employer123');
    console.log('');

    // Create admin account
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      email: 'admin@esystems.com',
      password: adminPassword,
      emailVerified: true,
      isActive: true,
      admin: true
    });

    // Create a business profile for admin (admin can also be a business)
    const adminBusiness = await Business.create({
      user: adminUser._id,
      contactName: 'Admin User',
      company: 'E-Systems Management',
      bio: 'Platform administrator account',
      isActive: true
    });

    // Update admin user with business reference
    adminUser.business = adminBusiness._id;
    await adminUser.save();

    console.log('Admin account created:');
    console.log('Email: admin@esystems.com');
    console.log('Password: admin123');
    console.log('Admin: true');

    console.log('\nAccounts created successfully!');
    console.log('\nYou can now log in to E-Systems Management with these accounts.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating accounts:', error);
    process.exit(1);
  }
};

seedAccounts();