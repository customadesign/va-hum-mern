const axios = require('axios');

async function testInterceptAPI() {
  const baseURL = 'http://localhost:8000/api';
  
  try {
    // First, login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/admin/login`, {
      email: 'admin@linkage.ph',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Now test the intercept conversations endpoint
    console.log('\n2. Testing intercept conversations endpoint...');
    const conversationsResponse = await axios.get(`${baseURL}/admin/intercept/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response structure:');
    console.log('- Status:', conversationsResponse.status);
    console.log('- Data type:', typeof conversationsResponse.data);
    console.log('- Has success field:', 'success' in conversationsResponse.data);
    console.log('- Has data field:', 'data' in conversationsResponse.data);
    
    if (conversationsResponse.data.data) {
      console.log('- Data.data type:', typeof conversationsResponse.data.data);
      console.log('- Is array:', Array.isArray(conversationsResponse.data.data));
      console.log('- Array length:', conversationsResponse.data.data.length);
    }
    
    console.log('\nFull response:', JSON.stringify(conversationsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Wait for server to start
setTimeout(testInterceptAPI, 2000);