const mongoose = require('mongoose');
const fetch = require('node-fetch');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:8000/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // You'll need to set this or login first

async function testConfigAPI() {
  try {
    console.log('Testing Configuration API Endpoints\n');
    console.log('=====================================\n');

    // Test 1: Get configuration without authentication (should fail)
    console.log('Test 1: GET /api/admin/config without auth');
    try {
      const response = await fetch(`${API_URL}/admin/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        console.log('✓ Correctly rejected unauthorized request\n');
      } else {
        console.log('✗ Should have rejected unauthorized request\n');
      }
    } catch (err) {
      console.log('✗ Error:', err.message, '\n');
    }

    // If no admin token provided, create a test scenario
    if (!ADMIN_TOKEN) {
      console.log('No ADMIN_TOKEN provided. Simulating authenticated request...\n');
      
      // Connect to MongoDB directly for testing
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      const SiteConfig = require('./models/SiteConfig');
      
      // Test 2: Initialize configurations
      console.log('Test 2: Initialize default configurations');
      const initializeConfig = require('./scripts/initializeConfig');
      const result = await initializeConfig(true);
      console.log(`✓ Initialized configs - Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}\n`);
      
      // Test 3: Get all configurations
      console.log('Test 3: Fetch all configurations');
      const configs = await SiteConfig.find({ isEditable: true });
      console.log(`✓ Found ${configs.length} editable configurations\n`);
      
      // Test 4: Test configuration categories
      console.log('Test 4: Verify configuration categories');
      const categories = ['general', 'email', 'security', 'features', 'limits'];
      for (const category of categories) {
        const categoryConfigs = await SiteConfig.find({ category });
        console.log(`  - ${category}: ${categoryConfigs.length} configs`);
      }
      console.log();
      
      // Test 5: Update a configuration value
      console.log('Test 5: Update configuration value');
      const testConfig = await SiteConfig.findOne({ key: 'site_name' });
      if (testConfig) {
        const originalValue = testConfig.value;
        testConfig.value = 'Test Platform Name';
        await testConfig.save();
        console.log(`✓ Updated site_name from "${originalValue}" to "${testConfig.value}"`);
        
        // Restore original value
        testConfig.value = originalValue;
        await testConfig.save();
        console.log(`✓ Restored original value: "${originalValue}"\n`);
      }
      
      // Test 6: Test value type handling
      console.log('Test 6: Test value type handling');
      const testConfigs = [
        { key: 'test_boolean', value: true, expectedType: 'boolean' },
        { key: 'test_number', value: 42, expectedType: 'number' },
        { key: 'test_email', value: 'test@example.com', expectedType: 'email' },
        { key: 'test_url', value: 'https://example.com', expectedType: 'url' },
        { key: 'test_text', value: 'Short text', expectedType: 'text' },
        { key: 'test_textarea', value: 'This is a longer text that should be treated as a textarea because it exceeds the typical length for a simple text input field', expectedType: 'textarea' }
      ];
      
      for (const test of testConfigs) {
        const created = await SiteConfig.create({
          key: test.key,
          value: test.value,
          valueType: test.expectedType,
          category: 'general',
          description: `Test ${test.expectedType} configuration`,
          isPublic: false,
          isEditable: true
        });
        
        const retrieved = await SiteConfig.getValue(test.key);
        console.log(`  ✓ ${test.expectedType}: stored and retrieved correctly`);
        
        // Clean up test config
        await SiteConfig.deleteOne({ key: test.key });
      }
      console.log();
      
      // Test 7: Test configuration structure for frontend
      console.log('Test 7: Test configuration structure for frontend');
      const configMap = {};
      const allConfigs = await SiteConfig.find({ isEditable: true }).limit(5);
      
      for (const config of allConfigs) {
        configMap[config.key] = {
          value: await SiteConfig.getValue(config.key),
          category: config.category,
          description: config.description,
          valueType: config.valueType,
          isPublic: config.isPublic,
          isEditable: config.isEditable
        };
      }
      
      console.log('Sample configuration structure:');
      console.log(JSON.stringify(configMap, null, 2).substring(0, 500) + '...\n');
      
      console.log('=====================================');
      console.log('Configuration API Tests Complete');
      console.log('=====================================\n');
      
      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      
    } else {
      // Test with actual API endpoints using provided token
      console.log('Testing with provided ADMIN_TOKEN\n');
      
      // Test 2: Get configuration with authentication
      console.log('Test 2: GET /api/admin/config with auth');
      const getResponse = await fetch(`${API_URL}/admin/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        console.log(`✓ Successfully fetched configurations`);
        console.log(`  Found ${Object.keys(data.data).length} configurations\n`);
      } else {
        console.log(`✗ Failed to fetch configurations: ${getResponse.status}\n`);
      }
      
      // Test 3: Update configuration
      console.log('Test 3: PUT /api/admin/config');
      const updateResponse = await fetch(`${API_URL}/admin/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          configs: {
            'site_name': 'Updated Test Name',
            'max_vas_per_page': 25
          }
        })
      });
      
      if (updateResponse.ok) {
        const data = await updateResponse.json();
        console.log('✓ Successfully updated configurations');
        console.log(`  Message: ${data.message}\n`);
      } else {
        console.log(`✗ Failed to update configurations: ${updateResponse.status}\n`);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testConfigAPI();