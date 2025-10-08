const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

async function testLogin() {
  try {
    console.log('Testing login for pat@murphyconsulting.us');
    console.log('=====================================\n');

    // Step 1: Get CSRF token
    console.log('1. Fetching CSRF token...');
    const csrfResponse = await axios.get(`${API_URL}/auth/csrf`, {
      withCredentials: true
    });

    const csrfToken = csrfResponse.data.csrfToken;
    const cookies = csrfResponse.headers['set-cookie'];
    console.log('   ✅ CSRF token received');
    console.log('   Token:', csrfToken.substring(0, 20) + '...');

    // Extract XSRF-TOKEN from cookies
    let xsrfToken = csrfToken;
    if (cookies) {
      const xsrfCookie = cookies.find(c => c.includes('XSRF-TOKEN'));
      if (xsrfCookie) {
        xsrfToken = xsrfCookie.split('=')[1].split(';')[0];
      }
    }

    // Step 2: Attempt login
    console.log('\n2. Attempting login...');
    const loginResponse = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: 'pat@murphyconsulting.us',
        password: 'B5tccpbx'
      },
      {
        headers: {
          'X-CSRF-Token': xsrfToken,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    console.log('   ✅ Login successful!');
    console.log('\n3. Response details:');
    console.log('   - Success:', loginResponse.data.success);
    console.log('   - User ID:', loginResponse.data.user.id);
    console.log('   - Email:', loginResponse.data.user.email);
    console.log('   - Admin:', loginResponse.data.user.admin);
    console.log('   - Token:', loginResponse.data.token.substring(0, 50) + '...');

    console.log('\n✅ LOGIN TEST PASSED - User can authenticate successfully');
    console.log('\nThe user should now be able to login at http://localhost:3000/sign-in');
    console.log('The frontend has been updated to properly handle CSRF tokens.');

  } catch (error) {
    console.error('\n❌ Login test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);

      if (error.response.data.retryAfter) {
        const retryTime = new Date(error.response.data.retryAfter);
        const now = new Date();
        const waitSeconds = Math.ceil((retryTime - now) / 1000);
        console.error(`\n⏰ Rate limited. Please wait ${waitSeconds} seconds and try again.`);
      }
    } else {
      console.error('   Error:', error.message);
    }
  }
}

// Run the test
testLogin();