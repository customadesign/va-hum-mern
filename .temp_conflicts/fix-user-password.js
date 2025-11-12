const mongoose = require('mongoose');
require('dotenv').config();

async function fixUserPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const user = await User.findOne({ email: 'pat@esystemsmanagement.com' });
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('User found:', {
      id: user._id,
      email: user.email,
      admin: user.admin,
      suspended: user.suspended,
      hasPassword: !!user.password
    });
    
    if (!user.password) {
      console.log('Setting new password...');
      const hashedPassword = await bcrypt.hash('B5tccpbx', 12);
      user.password = hashedPassword;
      await user.save();
      console.log('✅ Password updated for user');
    } else {
      console.log('Testing existing password...');
      const isMatch = await bcrypt.compare('B5tccpbx', user.password);
      console.log('Password match:', isMatch ? '✅ Correct' : '❌ Incorrect');
      
      if (!isMatch) {
        console.log('Updating password...');
        const hashedPassword = await bcrypt.hash('B5tccpbx', 12);
        user.password = hashedPassword;
        await user.save();
        console.log('✅ Password updated for user');
      }
    }
    
    // Now test the login API
    console.log('\n🧪 Testing login API...');
    const axios = require('axios');
    
    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email: 'pat@esystemsmanagement.com',
        password: 'B5tccpbx'
      });
      
      if (response.data.success) {
        console.log('✅ Login API working correctly');
        console.log('👤 User:', response.data.data.user.email);
        console.log('🔑 Role:', response.data.data.user.role || (response.data.data.user.admin ? 'admin' : 'user'));
        console.log('🎫 Token received:', response.data.data.token ? 'Yes' : 'No');
      }
    } catch (apiError) {
      console.log('❌ Login API Error:', apiError.response?.data?.error || apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixUserPassword();