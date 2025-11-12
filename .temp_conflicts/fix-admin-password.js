const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function fixAdminPassword() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');

    // Import User model
    const User = require('./models/User');

    // Find admin user
    const adminEmail = 'admin@linkage.ph';
    console.log(`🔍 Looking for admin user: ${adminEmail}`);

    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log('✅ Admin user found');

      // Hash the password
      const password = 'admin123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update the password
      adminUser.password = hashedPassword;
      adminUser.admin = true; // Ensure admin flag is set
      await adminUser.save();

      console.log('✅ Admin password has been set successfully');
      console.log('📧 Email: admin@linkage.ph');
      console.log('🔑 Password: admin123');

      // Verify the password works
      const updatedUser = await User.findOne({ email: adminEmail }).select('+password');
      const passwordWorks = await bcrypt.compare(password, updatedUser.password);
      console.log(`🔐 Password verification: ${passwordWorks ? 'SUCCESS' : 'FAILED'}`);

    } else {
      console.log('❌ Admin user not found, creating new admin user...');

      // Hash the password
      const password = 'admin123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create admin user
      adminUser = await User.create({
        email: adminEmail,
        password: hashedPassword,
        admin: true,
        emailConfirmed: true,
        createdAt: new Date()
      });

      console.log('✅ Admin user created successfully');
      console.log('📧 Email: admin@linkage.ph');
      console.log('🔑 Password: admin123');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAdminPassword();
