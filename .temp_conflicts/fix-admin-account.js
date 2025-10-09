const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fixAdminAccount() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Fix admin@linkage.ph account
    const adminEmail = 'admin@linkage.ph';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // First try to update existing user
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log(`Found existing admin user: ${adminEmail}`);
      
      // Update the user with correct fields
      adminUser.password = hashedPassword;
      adminUser.admin = true;
      // Remove invalid role field if it exists
      if (adminUser.role === 'admin') {
        adminUser.role = undefined;
      }
      adminUser.isActive = true;
      adminUser.emailVerified = true;
      
      await adminUser.save();
      console.log(`✅ Updated admin user: ${adminEmail}`);
    } else {
      // Create new admin user
      console.log(`Creating new admin user: ${adminEmail}`);
      
      adminUser = new User({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        admin: true, // Use admin boolean instead of role
        isActive: true,
        emailVerified: true,
        provider: 'local'
      });
      
      await adminUser.save();
      console.log(`✅ Created admin user: ${adminEmail}`);
    }

    // Verify the admin login works
    const verifyUser = await User.findOne({ email: adminEmail }).select('+password');
    if (verifyUser) {
      const passwordWorks = await bcrypt.compare(adminPassword, verifyUser.password);
      console.log(`\nVerification:`);
      console.log(`  Email: ${verifyUser.email}`);
      console.log(`  Admin: ${verifyUser.admin ? '✅' : '❌'}`);
      console.log(`  Password works: ${passwordWorks ? '✅' : '❌'}`);
      console.log(`  Role field: ${verifyUser.role || 'undefined (correct for admin)'}`);
    }

    console.log('\n📋 Admin Login Credentials:');
    console.log('=====================================');
    console.log('Admin Panel (http://localhost:4000/login):');
    console.log('  Email: admin@linkage.ph');
    console.log('  Password: admin123');
    console.log('=====================================');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixAdminAccount();