const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function debugAdminPassword() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@linkage.ph';
    const adminPassword = 'admin123';

    // Get the user without password field excluded
    const userNoSelect = await User.findOne({ email: adminEmail });
    console.log('\nUser without select +password:');
    console.log('  Has password field:', userNoSelect.password ? 'Yes' : 'No');
    
    // Get the user with password field included
    const userWithSelect = await User.findOne({ email: adminEmail }).select('+password');
    console.log('\nUser with select +password:');
    console.log('  Has password field:', userWithSelect.password ? 'Yes' : 'No');
    console.log('  Password value:', userWithSelect.password ? `${userWithSelect.password.substring(0, 10)}...` : 'null/undefined');
    
    // Hash a new password
    const newHashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log('\nNew hashed password:', `${newHashedPassword.substring(0, 10)}...`);
    
    // Force update the password
    const updateResult = await User.updateOne(
      { email: adminEmail },
      { $set: { password: newHashedPassword } }
    );
    console.log('\nUpdate result:', updateResult);
    
    // Verify again
    const updatedUser = await User.findOne({ email: adminEmail }).select('+password');
    const passwordWorks = await bcrypt.compare(adminPassword, updatedUser.password);
    console.log('\nAfter update:');
    console.log('  Password works:', passwordWorks ? '✅' : '❌');
    
    // Test the login endpoint
    console.log('\nTesting login endpoint...');
    const axios = require('axios');
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email: adminEmail,
        password: adminPassword
      });
      console.log('  Login successful: ✅');
      console.log('  Token received:', response.data.token ? 'Yes' : 'No');
    } catch (error) {
      console.log('  Login failed: ❌');
      console.log('  Error:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugAdminPassword();