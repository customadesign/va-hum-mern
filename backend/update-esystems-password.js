const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function updateESystemsPassword() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'pat@esystemsmanagement.com';
    const password = 'B5tccpbx';  // Note: without the exclamation mark for e-systems
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the user
    const result = await User.findOneAndUpdate(
      { email: email },
      { password: hashedPassword },
      { new: true }
    );

    if (result) {
      console.log(`✅ Updated password for ${email}`);
      console.log(`   New password: ${password}`);
      
      // Verify the password works
      const user = await User.findOne({ email: email }).select('+password');
      const passwordWorks = await bcrypt.compare(password, user.password);
      console.log(`   Password verification: ${passwordWorks ? '✅' : '❌'}`);
    } else {
      console.log(`❌ User not found: ${email}`);
    }

    console.log('\n📋 Updated Login Credentials:');
    console.log('=====================================');
    console.log('Main App (http://localhost:3000/sign-in):');
    console.log('  Email: pat@murphyconsulting.us');
    console.log('  Password: B5tccpbx!');
    console.log('');
    console.log('E-Systems (http://localhost:3002/):');
    console.log('  Email: pat@esystemsmanagement.com');
    console.log('  Password: B5tccpbx');
    console.log('');
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

updateESystemsPassword();