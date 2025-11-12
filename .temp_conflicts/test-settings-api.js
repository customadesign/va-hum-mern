const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

// You'll need to get a valid admin token first
// This can be done by logging in as an admin or using an existing token
const ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testSettingsAPI() {
  console.log('Testing Settings API Endpoints...\n');
  
  try {
    // Test 1: Get all settings
    console.log('1. Testing GET /api/admin/settings');
    const settingsResponse = await api.get('/api/admin/settings');
    console.log('✓ Settings fetched successfully');
    console.log('  Categories:', Object.keys(settingsResponse.data.data.configs));
    console.log('  Total configs:', settingsResponse.data.data.metadata.totalConfigs);
    console.log('  Invitation stats:', settingsResponse.data.data.invitations.stats);
    console.log('');

    // Test 2: Get specific config value
    console.log('2. Testing GET /api/admin/settings/:key');
    const configResponse = await api.get('/api/admin/settings/site_name');
    console.log('✓ Config value fetched successfully');
    console.log('  Key:', configResponse.data.data.key);
    console.log('  Value:', configResponse.data.data.value);
    console.log('  Type:', configResponse.data.data.valueType);
    console.log('');

    // Test 3: Update settings
    console.log('3. Testing PUT /api/admin/settings');
    const updateResponse = await api.put('/api/admin/settings', {
      configs: {
        site_name: 'Linkage VA Hub Test',
        registration_enabled: true,
        max_vas_per_page: 25
      }
    });
    console.log('✓ Settings updated successfully');
    console.log('  Updated:', updateResponse.data.data.updated);
    console.log('');

    // Test 4: Update category settings
    console.log('4. Testing PUT /api/admin/settings/category/:category');
    const categoryUpdateResponse = await api.put('/api/admin/settings/category/features', {
      configs: {
        registration_enabled: true,
        messaging_enabled: true,
        video_calls_enabled: false
      }
    });
    console.log('✓ Category settings updated successfully');
    console.log('  Category:', categoryUpdateResponse.data.data.category);
    console.log('  Updated count:', categoryUpdateResponse.data.data.updated.length);
    console.log('');

    // Test 5: Reset category to defaults
    console.log('5. Testing POST /api/admin/settings/reset/:category');
    const resetResponse = await api.post('/api/admin/settings/reset/limits');
    console.log('✓ Category reset to defaults successfully');
    console.log('  Category:', resetResponse.data.data.category);
    console.log('  Reset count:', resetResponse.data.data.resetCount);
    console.log('');

    // Test 6: Verify legacy endpoints still work
    console.log('6. Testing legacy GET /api/admin/config');
    const legacyResponse = await api.get('/api/admin/config');
    console.log('✓ Legacy config endpoint still works');
    console.log('  Config count:', Object.keys(legacyResponse.data.data).length);
    console.log('');

    console.log('✅ All tests passed successfully!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    process.exit(1);
  }
}

// Run tests
console.log('=================================');
console.log('Settings API Test Suite');
console.log('=================================\n');

if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
  console.error('⚠️  Please set a valid admin token in TEST_ADMIN_TOKEN environment variable');
  console.error('   You can get this by logging in as an admin and copying the token from the response');
  process.exit(1);
}

testSettingsAPI().then(() => {
  console.log('Test suite completed');
  process.exit(0);
});