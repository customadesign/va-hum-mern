const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Now require the User model after env is loaded
const User = require('./backend/models/User');

async function fixAdminUser() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';
    console.log('Connecting to MongoDB...');

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Check if admin@linkage.ph exists
    let adminUser = await User.findOne({ email: 'admin@linkage.ph' });

    if (adminUser) {
      console.log('Found existing admin@linkage.ph user, updating...');

      // Update the password and ensure admin privileges
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser.password = hashedPassword;
      adminUser.isAdmin = true;
      adminUser.role = 'admin';
      adminUser.isEmailVerified = true;

      await adminUser.save();
      console.log('Updated admin@linkage.ph with password: admin123');
    } else {
      console.log('Creating new admin@linkage.ph user...');

      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        email: 'admin@linkage.ph',
        password: hashedPassword,
        isAdmin: true,
        role: 'admin',
        isEmailVerified: true
      });

      console.log('Created admin@linkage.ph with password: admin123');
    }

    // Verify the password works
    const testPassword = await bcrypt.compare('admin123', adminUser.password);
    console.log('\nPassword verification test:', testPassword ? 'PASSED' : 'FAILED');

    console.log('\nAdmin user details:');
    console.log('- Email:', adminUser.email);
    console.log('- Role:', adminUser.role);
    console.log('- Is Admin:', adminUser.isAdmin);
    console.log('- Email Verified:', adminUser.isEmailVerified);

    await mongoose.connection.close();
    console.log('\nAdmin user setup complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAdminUser();