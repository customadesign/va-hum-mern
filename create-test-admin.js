const axios = require('axios');

async function createTestAdmin() {
  const API_URL = 'http://localhost:8000/api';
  
  try {
    // First, try to create admin with the secret key endpoint
    console.log('Attempting to create admin user...');
    
    try {
      const createResponse = await axios.post(`${API_URL}/auth/create-first-admin`, {
        email: 'testadmin@linkageva.com',
        password: 'testadmin123',
        secretKey: 'linkage-admin-2024'
      });
      
      console.log('✅ Admin created:', createResponse.data);
    } catch (createErr) {
      if (createErr.response?.data?.error === 'Admin user already exists') {
        console.log('ℹ️  Admin already exists, trying to find existing admin credentials...');
      } else {
        console.log('❌ Create error:', createErr.response?.data || createErr.message);
      }
    }
    
    // Test login with different credentials
    const testCredentials = [
      { email: 'testadmin@linkageva.com', password: 'testadmin123' },
      { email: 'admin@linkageva.com', password: 'admin123' },
      { email: 'pat@esystemsmanagement.com', password: 'B5tccpbx' },
    ];
    
    console.log('\n🔐 Testing login credentials...\n');
    
    for (const creds of testCredentials) {
      try {
        const loginResponse = await axios.post(`${API_URL}/auth/admin/login`, creds);
        
        if (loginResponse.data.success) {
          console.log(`✅ SUCCESS! Login works with:`);
          console.log(`   Email: ${creds.email}`);
          console.log(`   Password: ${creds.password}`);
          console.log(`   User info:`, loginResponse.data.user);
          console.log('\n🎉 You can now login to the admin panel at http://localhost:4000/login');
          return;
        }
      } catch (loginErr) {
        const error = loginErr.response?.data?.error || loginErr.message;
        console.log(`❌ ${creds.email}: ${error}`);
      }
    }
    
    console.log('\n⚠️  No working admin credentials found.');
    console.log('You may need to manually create an admin user in the database.');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

createTestAdmin();