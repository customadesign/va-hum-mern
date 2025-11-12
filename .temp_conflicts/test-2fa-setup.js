const axios = require('axios');

const API_URL = 'http://localhost:8000/api';
const email = 'pat@esystemsmanagement.com';
const password = 'B5tccpbx';

async function test2FASetup() {
  try {
    // First, login to get the token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful');
    
    // Now try to setup 2FA
    console.log('\n2. Setting up 2FA...');
    const setup2FAResponse = await axios.post(
      `${API_URL}/settings/2fa/setup`,
      { password },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✓ 2FA setup response:', setup2FAResponse.data);
    
    if (setup2FAResponse.data.data && setup2FAResponse.data.data.qrCode) {
      console.log('✓ QR Code generated successfully');
      console.log('Secret:', setup2FAResponse.data.data.secret);
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

test2FASetup();