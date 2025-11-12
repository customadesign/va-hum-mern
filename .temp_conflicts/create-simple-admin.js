require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

async function createSimpleAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin@test.com already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    
    if (existingAdmin) {
      console.log('🔄 Admin already exists, updating...');
      existingAdmin.admin = true;
      existingAdmin.isActive = true;
      existingAdmin.emailVerified = true;
      // Set plain password - the model should hash it in pre-save hook
      existingAdmin.password = 'admin123';
      await existingAdmin.save();
      console.log('✅ Admin updated successfully!');
    } else {
      // Create new admin with plain password
      const admin = new User({
        email: 'admin@test.com',
        password: 'admin123', // Model should hash this in pre-save
        firstName: 'Admin',
        lastName: 'User',
        admin: true,
        isActive: true,
        emailVerified: true
      });
      
      await admin.save();
      console.log('✅ Admin created successfully!');
    }

    console.log('\n📝 Admin Credentials:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
    console.log('\n🌐 Login URL: http://localhost:4000/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createSimpleAdmin();