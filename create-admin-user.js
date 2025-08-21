const axios = require('axios');

async function createAdminUser() {
  try {
    const response = await axios.post('http://localhost:8000/api/auth/create-first-admin', {
      email: 'pat@linkage.ph',
      password: 'admin123',
      secretKey: 'linkage-admin-2024'
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: pat@linkage.ph');
    console.log('Password: admin123');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

createAdminUser();
