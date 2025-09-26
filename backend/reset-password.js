const mongoose = require('mongoose');
require('dotenv').config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const user = await User.findOne({ email: 'pat@murphyconsulting.us' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('Setting password using User model pre-save hook...');
    
    // Use the User model to set password - this should trigger the pre-save hook
    user.password = 'B5tccpbx';
    await user.save();
    
    console.log('✅ Password set using model save');
    
    // Fetch user again to verify
    const updatedUser = await User.findOne({ email: 'pat@murphyconsulting.us' }).select('+password');
    
    console.log('Testing new password...');
    const isMatch = await updatedUser.matchPassword('B5tccpbx');
    console.log('Password match:', isMatch ? '✅ Success' : '❌ Failed');
    
    if (isMatch) {
      // Test the API now
      console.log('\n🧪 Testing login API...');
      const axios = require('axios');
      
      try {
        const response = await axios.post('http://localhost:8000/api/auth/login', {
          email: 'pat@murphyconsulting.us',
          password: 'B5tccpbx'
        });
        
        if (response.data.success) {
          console.log('✅ Login API successful!');
          console.log('👤 User:', response.data.user.email);
          console.log('🔑 Admin:', response.data.user.admin);
          console.log('🎫 Token:', response.data.token ? 'Generated' : 'Missing');
        }
      } catch (apiError) {
        console.log('❌ API Error:', apiError.response?.data?.error || apiError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetPassword();