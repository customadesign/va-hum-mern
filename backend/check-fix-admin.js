const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function checkAndFixAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const adminEmail = 'admin@linkage.ph';
    const adminUser = await User.findOne({ email: adminEmail }).select('+password');

    if (!adminUser) {
      console.log('❌ Admin user not found! Creating...');

      const hashedPassword = await bcryptjs.hash('admin123', 10);
      const newAdmin = new User({
        email: adminEmail,
        password: hashedPassword,
        admin: true,
        emailVerified: true,
        twoFactorEnabled: false,
        suspended: false,
        profile: {
          name: 'System Administrator',
          company: 'Linkage VA Hub'
        }
      });

      await newAdmin.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user found:', {
        id: adminUser._id,
        email: adminUser.email,
        admin: adminUser.admin,
        twoFactorEnabled: adminUser.twoFactorEnabled,
        suspended: adminUser.suspended,
        emailVerified: adminUser.emailVerified
      });

      // Check password
      const passwordMatch = await adminUser.matchPassword('admin123');
      console.log('Password matches "admin123":', passwordMatch);

      if (!passwordMatch) {
        console.log('🔧 Resetting password to admin123...');
        adminUser.password = 'admin123'; // Will be hashed by pre-save hook
        await adminUser.save();
        console.log('✅ Password reset successfully');
      }

      // Ensure admin privileges and disable 2FA for testing
      let needsUpdate = false;

      if (!adminUser.admin) {
        console.log('🔧 Setting admin flag...');
        adminUser.admin = true;
        needsUpdate = true;
      }

      if (adminUser.twoFactorEnabled) {
        console.log('🔧 Disabling two-factor authentication for testing...');
        adminUser.twoFactorEnabled = false;
        adminUser.twoFactorSecret = undefined;
        needsUpdate = true;
      }

      if (adminUser.suspended) {
        console.log('🔧 Unsuspending admin account...');
        adminUser.suspended = false;
        needsUpdate = true;
      }

      if (!adminUser.emailVerified) {
        console.log('🔧 Verifying email...');
        adminUser.emailVerified = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await adminUser.save();
        console.log('✅ Admin user updated successfully');
      } else {
        console.log('✅ No updates needed');
      }
    }

    // Test login
    console.log('\n📝 Testing login...');
    const testUser = await User.findOne({ email: adminEmail }).select('+password');
    const testPassword = await testUser.matchPassword('admin123');

    if (testPassword && testUser.admin && !testUser.suspended && !testUser.twoFactorEnabled) {
      console.log('✅ Login test passed! You can now login with:');
      console.log('   Email: admin@linkage.ph');
      console.log('   Password: admin123');
      console.log('   URL: http://localhost:4000/login');
    } else {
      console.log('❌ Login test failed. Please check the configuration.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkAndFixAdmin();