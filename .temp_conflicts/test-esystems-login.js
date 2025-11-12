require('dotenv').config();
const axios = require('axios');

async function testESystemsLogin() {
  console.log('🧪 Testing E-Systems login...');
  
  try {
    const response = await axios.post('http://localhost:8000/api/auth/login', {
      email: 'pat@esystemsmanagement.com',
      password: 'B5tccpbx'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Login successful!');
    console.log('📄 Response structure:', JSON.stringify(response.data, null, 2));
    
    // Handle different response structures
    const data = response.data.data || response.data;
    const user = data.user || data;
    
    if (user) {
      console.log('👤 User:', user.email);
      console.log('🏢 Role:', user.role);
      console.log('🔑 Admin:', user.admin);
      console.log('✅ Verified:', user.isVerified);
      console.log('🎫 Token received:', (data.token || response.data.token) ? 'Yes' : 'No');
      console.log('📋 Business Profile:', user.business ? 'Linked' : 'Not linked');
      
      console.log('\n🎉 E-Systems user login is working!');
      console.log('🌐 You can now login at: http://localhost:3002/login');
    } else {
      console.log('❌ Could not extract user data from response');
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ Login API Error:');
      console.log('  - Status:', error.response.status);
      console.log('  - Error:', error.response.data?.error || error.response.data);
      
      if (error.response.status === 429) {
        console.log('  - Note: Rate limiting is still active. Wait a few minutes and try again.');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to server. Make sure backend is running on port 8000');
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testESystemsLogin();