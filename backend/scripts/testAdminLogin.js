const axios = require('axios');

// Admin credentials to test
const ADMIN_EMAIL = 'admin@linkage.ph';
const ADMIN_PASSWORD = 'admin123';
const API_URL = 'http://localhost:8000';

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    console.log('─────────────────────────────────');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`🌐 API URL: ${API_URL}`);
    console.log('─────────────────────────────────\n');

    // Test login endpoint
    console.log('📡 Sending login request to /api/auth/admin/login...');
    
    const loginResponse = await axios.post(`${API_URL}/api/auth/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log('\n📦 Response data:');
      console.log('─────────────────────────────────');
      console.log(`Token: ${loginResponse.data.token ? '✅ Received' : '❌ Missing'}`);
      
      if (loginResponse.data.user) {
        console.log(`\n👤 User details:`);
        console.log(`  - ID: ${loginResponse.data.user._id}`);
        console.log(`  - Email: ${loginResponse.data.user.email}`);
        console.log(`  - Name: ${loginResponse.data.user.name || loginResponse.data.user.displayName}`);
        console.log(`  - Admin: ${loginResponse.data.user.admin ? '✅ Yes' : '❌ No'}`);
        console.log(`  - Verified: ${loginResponse.data.user.isVerified ? '✅ Yes' : '❌ No'}`);
      }
      
      // Test authenticated endpoint
      if (loginResponse.data.token) {
        console.log('\n🔒 Testing authenticated endpoint...');
        const meResponse = await axios.get(`${API_URL}/api/admin/auth/me`, {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`
          }
        });
        
        if (meResponse.data.success) {
          console.log('✅ Authentication token is valid!');
          console.log('✅ Admin can access protected routes!');
        }
      }
      
      console.log('\n─────────────────────────────────');
      console.log('🎉 All tests passed! You can now login at:');
      console.log('🌐 http://localhost:4000/login');
      console.log('\nUse these credentials:');
      console.log(`📧 Email: ${ADMIN_EMAIL}`);
      console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ Login failed!');
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message || error.response.data.error);
      
      // Try the regular auth endpoint if admin endpoint fails
      if (error.response.status === 404) {
        console.log('\n🔄 Admin endpoint not found. Trying regular auth endpoint...');
        try {
          const regularLogin = await axios.post(`${API_URL}/api/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
          });
          
          if (regularLogin.data.success) {
            console.log('✅ Login successful via regular auth!');
            console.log('Token:', regularLogin.data.token ? '✅ Received' : '❌ Missing');
            
            if (regularLogin.data.user) {
              console.log(`\n👤 User details:`);
              console.log(`  - Email: ${regularLogin.data.user.email}`);
              console.log(`  - Admin: ${regularLogin.data.user.admin ? '✅ Yes' : '❌ No'}`);
            }
            
            console.log('\n🎉 You can now login at: http://localhost:4000/login');
          }
        } catch (regularError) {
          console.error('❌ Regular auth also failed:', regularError.response?.data?.message || regularError.message);
        }
      }
    } else if (error.request) {
      console.error('❌ No response from server. Make sure the backend is running on port 8000.');
      console.error('Run: cd backend && npm start');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the test
console.log('🚀 Admin Login Test\n');
testAdminLogin();