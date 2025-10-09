const mongoose = require('mongoose');
require('dotenv').config();

async function debugLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    
    // Find user with password field
    const user = await User.findOne({ email: 'pat@murphyconsulting.us' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:', {
      id: user._id,
      email: user.email,
      admin: user.admin,
      suspended: user.suspended,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Test password matching
    console.log('\n🔐 Testing password...');
    try {
      const isMatch = await user.matchPassword('B5tccpbx');
      console.log('Password match result:', isMatch ? '✅ Match' : '❌ No match');
    } catch (matchError) {
      console.log('❌ Error in matchPassword:', matchError.message);
    }
    
    // Test manual bcrypt comparison
    console.log('\n🧪 Manual bcrypt test...');
    const bcrypt = require('bcryptjs');
    try {
      const manualMatch = await bcrypt.compare('B5tccpbx', user.password);
      console.log('Manual bcrypt result:', manualMatch ? '✅ Match' : '❌ No match');
    } catch (bcryptError) {
      console.log('❌ Error in bcrypt.compare:', bcryptError.message);
    }
    
    // Test API with detailed logging
    console.log('\n🌐 Testing login API with detailed logging...');
    
    // Add request logging
    const axios = require('axios');
    axios.defaults.timeout = 5000;
    
    try {
      console.log('Sending request to: http://localhost:8000/api/auth/login');
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email: 'pat@murphyconsulting.us',
        password: 'B5tccpbx'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Login successful!');
      console.log('Response:', {
        success: response.data.success,
        userId: response.data.user?.id,
        userEmail: response.data.user?.email,
        admin: response.data.user?.admin,
        hasToken: !!response.data.token
      });
      
    } catch (apiError) {
      console.log('❌ API Error Details:');
      console.log('Status:', apiError.response?.status);
      console.log('Data:', apiError.response?.data);
      console.log('Message:', apiError.message);
      
      if (apiError.code === 'ECONNREFUSED') {
        console.log('🚨 Backend server is not running on port 8000');
      }
    }
    
    // Check if backend server is running
    console.log('\n🔍 Checking if backend server is running...');
    try {
      const healthResponse = await axios.get('http://localhost:8000/api/health');
      console.log('✅ Backend server is responding');
    } catch (healthError) {
      console.log('❌ Backend server not responding:', healthError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

debugLogin();