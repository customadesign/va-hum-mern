const axios = require('axios');

const API_URL = 'http://localhost:8000/api';

// Test credentials - you'll need to use real admin credentials
const ADMIN_EMAIL = 'admin@example.com'; // Replace with actual admin email
const ADMIN_PASSWORD = 'Admin123!'; // Replace with actual admin password

let authToken = '';

async function loginAsAdmin() {
  try {
    console.log('🔐 Attempting to login as admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Successfully logged in as admin');
      console.log('👤 User:', response.data.data.user.email);
      console.log('🔑 Role:', response.data.data.user.role);
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.error || error.message);
    console.log('\nNote: Please update the ADMIN_EMAIL and ADMIN_PASSWORD variables with valid admin credentials');
    return false;
  }
}

async function testGetConfig() {
  try {
    console.log('\n📋 Testing GET /admin/config...');
    const response = await axios.get(`${API_URL}/admin/config`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Successfully fetched configuration');
      const configs = response.data.data;
      
      // Count configs by category
      const categories = {};
      Object.entries(configs).forEach(([key, config]) => {
        categories[config.category] = (categories[config.category] || 0) + 1;
      });
      
      console.log('\n📊 Configuration Summary:');
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} settings`);
      });
      
      // Show sample configs
      console.log('\n📝 Sample Configurations:');
      const sampleKeys = ['site_name', 'registration_enabled', 'max_vas_per_page'];
      sampleKeys.forEach(key => {
        if (configs[key]) {
          console.log(`  ${key}:`, configs[key].value);
        }
      });
      
      return configs;
    }
  } catch (error) {
    console.error('❌ Failed to fetch config:', error.response?.data?.error || error.message);
    return null;
  }
}

async function testUpdateConfig() {
  try {
    console.log('\n🔧 Testing PUT /admin/config...');
    
    const testConfigs = {
      site_name: 'Linkage VA Hub - Test Update',
      max_vas_per_page: 25,
      registration_enabled: true
    };
    
    console.log('📤 Sending updates:', testConfigs);
    
    const response = await axios.put(`${API_URL}/admin/config`, {
      configs: testConfigs
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Successfully updated configuration');
      console.log('📝 Updated keys:', response.data.updated);
      
      // Fetch again to verify
      console.log('\n🔍 Verifying updates...');
      const verifyResponse = await axios.get(`${API_URL}/admin/config`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (verifyResponse.data.success) {
        const configs = verifyResponse.data.data;
        console.log('✅ Verification complete:');
        Object.entries(testConfigs).forEach(([key, value]) => {
          const actual = configs[key]?.value;
          const matches = actual === value;
          console.log(`  ${key}: ${actual} ${matches ? '✅' : '❌'}`);
        });
      }
      
      // Restore original values
      console.log('\n🔄 Restoring original values...');
      await axios.put(`${API_URL}/admin/config`, {
        configs: {
          site_name: 'Linkage VA Hub',
          max_vas_per_page: 20
        }
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Original values restored');
      
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to update config:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testAllFeatures() {
  console.log('====================================');
  console.log('System Settings API Test Suite');
  console.log('====================================\n');
  
  // Step 1: Login
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('\n⚠️  Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Test GET endpoint
  const configs = await testGetConfig();
  if (!configs) {
    console.log('\n⚠️  Cannot proceed without fetching configs');
    return;
  }
  
  // Step 3: Test PUT endpoint
  await testUpdateConfig();
  
  console.log('\n====================================');
  console.log('Test Suite Complete');
  console.log('====================================');
}

// Run the tests
testAllFeatures().catch(console.error);