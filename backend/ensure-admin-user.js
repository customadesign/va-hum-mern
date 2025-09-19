require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function ensureAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const adminEmail = 'admin@linkage.ph';
    const adminPassword = 'admin123';
    
    console.log('Checking for admin user:', adminEmail);
    
    // Check if admin exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log('Admin user found, updating to ensure it has correct settings...');
      
      // Update password and ensure admin flag is set
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      adminUser.password = hashedPassword;
      adminUser.admin = true;
      adminUser.suspended = false;
      adminUser.emailVerified = true;
      
      // Ensure profile exists
      if (!adminUser.profile) {
        adminUser.profile = {};
      }
      adminUser.profile.name = 'System Administrator';
      adminUser.profile.company = 'Linkage VA Hub';
      
      await adminUser.save();
      console.log('✅ Admin user updated successfully');
    } else {
      console.log('Admin user not found, creating new admin...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      adminUser = await User.create({
        email: adminEmail,
        password: hashedPassword,
        admin: true,
        emailVerified: true,
        suspended: false,
        profile: {
          name: 'System Administrator',
          company: 'Linkage VA Hub'
        }
      });
      
      console.log('✅ Admin user created successfully');
    }
    
    console.log('\n📋 Admin Login Details:');
    console.log('─────────────────────────');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Admin ID:', adminUser._id);
    console.log('Admin Flag:', adminUser.admin);
    console.log('');
    console.log('📍 Access Points:');
    console.log('─────────────────────────');
    console.log('Admin Dashboard: http://localhost:4000/login');
    console.log('Main App: http://localhost:3000/login');
    console.log('');
    
    // Test the password
    console.log('Testing password...');
    const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (isMatch) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
    
    await mongoose.disconnect();
    console.log('\nDatabase connection closed.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

ensureAdminUser();