const axios = require('axios');

async function createAdminUser() {
  try {
    const response = await axios.post('http://localhost:8000/api/auth/create-first-admin', {
      email: 'admin@linkage.ph',
      password: 'admin123',
      secretKey: 'linkage-admin-2024'
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@linkage.ph');
    console.log('Password: admin123');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.data);
      console.log('💡 If admin already exists, try logging in with:');
      console.log('   Email: pat@esystemsmanagement.com');
      console.log('   Password: B5tccpbx');
      console.log('   (This user exists but may not be admin)');
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

createAdminUser();
