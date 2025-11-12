// Test script to verify esystems backend connection
const axios = require('axios');

async function testConnection() {
  console.log('🔍 Testing E-Systems Backend Connection...\n');
  
  // Test development connection
  const devUrl = 'http://localhost:8000/api';
  console.log(`1. Testing development endpoint: ${devUrl}`);
  
  try {
    const response = await axios.get(`${devUrl}/auth/test-cors`, {
      timeout: 5000
    });
    console.log('✅ Development connection successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Development connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure esystems-backend is running on port 8000');
      console.log('   Run: cd esystems-backend && npm run dev');
    }
  }
  
  console.log('\n');
  
  // Test production connection
  const prodUrl = 'https://esystems-backend.onrender.com/api';
  console.log(`2. Testing production endpoint: ${prodUrl}`);
  
  try {
    const response = await axios.get(`${prodUrl}/auth/test-cors`, {
      timeout: 10000
    });
    console.log('✅ Production connection successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Production connection failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
  
  console.log('\n🔍 Testing database connection through backend...');
  
  try {
    const healthResponse = await axios.get(`${devUrl}/health`, {
      timeout: 5000
    });
    console.log('✅ Health check successful!');
    console.log('Health response:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

testConnection().catch(console.error);