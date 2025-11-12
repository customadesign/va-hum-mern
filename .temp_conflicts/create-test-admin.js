require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createTestAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test admin already exists
    const existingAdmin = await User.findOne({ email: 'testadmin@linkageva.com' });
    
    if (existingAdmin) {
      console.log('🔄 Test admin already exists, updating...');
      existingAdmin.admin = true;
      // Don't set role for admin users
      existingAdmin.isActive = true;
      existingAdmin.emailVerified = true;
      const hashedPassword = await bcrypt.hash('TestAdmin123!', 10);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✅ Test admin updated successfully!');
    } else {
      // Create new test admin
      const hashedPassword = await bcrypt.hash('TestAdmin123!', 10);
      const testAdmin = new User({
        email: 'testadmin@linkageva.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        admin: true,
        // Don't set role for admin users
        isActive: true,
        emailVerified: true
      });
      
      await testAdmin.save();
      console.log('✅ Test admin created successfully!');
    }

    console.log('\n📝 Test Admin Credentials:');
    console.log('   Email: testadmin@linkageva.com');
    console.log('   Password: TestAdmin123!');
    console.log('\n🌐 Login URL: http://localhost:4000/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestAdmin();