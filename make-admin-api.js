const axios = require('axios');

async function makeAdminViaAPI() {
  try {
    console.log('🔐 First, logging in to get admin token...');

    // Login first to get token
    const loginResponse = await axios.post('http://localhost:8000/api/auth/login', {
      email: 'pat@esystemsmanagement.com',
      password: 'B5tccpbx'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Got token, now making user admin...');

    // Try to update user to admin via API
    // This assumes there's an admin endpoint to update user roles
    try {
      const updateResponse = await axios.put(
        'http://localhost:8000/api/admin/users/68be4e05e961165daa958fdd', // User ID from login response
        {
          admin: true,
          role: 'admin'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ User updated to admin successfully!');
      console.log('Response:', updateResponse.data);

    } catch (updateError) {
      console.log('⚠️ Admin update endpoint not available, but user can login');
      console.log('The user exists and password works, but may not have admin privileges');
      console.log('Try creating a new admin user with: node create-admin-user.js');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

makeAdminViaAPI();