const axios = require('axios');

async function createAdminUser() {
  try {
    // First, try to create the admin user
    console.log('Creating admin user on production...');
    const response = await axios.post('https://linkage-va-hub-api.onrender.com/api/auth/create-first-admin', {
      email: 'pat@linkage.ph',
      password: 'admin123',
      secretKey: 'linkage-admin-2024'
    });

    console.log('✅ Admin user created/updated successfully!');
    console.log('Response:', response.data);
    
    // Now test login
    console.log('\nTesting login...');
    const loginResponse = await axios.post('https://linkage-va-hub-api.onrender.com/api/auth/login', {
      email: 'pat@linkage.ph',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log('User:', loginResponse.data.user);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.data);
      
      // If admin already exists, try to login anyway
      if (error.response.data.error === 'Admin user already exists') {
        console.log('\nAdmin user exists. Testing login...');
        try {
          const loginResponse = await axios.post('https://linkage-va-hub-api.onrender.com/api/auth/login', {
            email: 'pat@linkage.ph',
            password: 'admin123'
          });
          
          if (loginResponse.data.success) {
            console.log('✅ Login successful!');
            console.log('User:', loginResponse.data.user);
          }
        } catch (loginError) {
          console.log('❌ Login failed:', loginError.response?.data || loginError.message);
        }
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

createAdminUser();