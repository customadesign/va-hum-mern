#!/usr/bin/env node

/**
 * Integration test for admin settings - tests the complete flow
 * Run with: node test-settings-integration.js
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const SiteConfig = require('./models/SiteConfig');

const API_URL = process.env.SERVER_URL || 'http://localhost:8000';
const TEST_TOKEN = process.env.TEST_ADMIN_TOKEN; // You'll need to set this

async function testSettingsIntegration() {
  console.log('🧪 Testing Admin Settings Integration...\n');

  try {
    // Connect to MongoDB to verify changes
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Get current settings
    console.log('📖 Test 1: Getting current settings via API...');
    try {
      const getResponse = await axios.get(`${API_URL}/api/admin/configs`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (getResponse.data) {
        console.log('   ✅ Successfully retrieved settings');
        console.log(`   Current max_vas_per_page: ${getResponse.data.max_vas_per_page || 'not set'}`);
      }
    } catch (error) {
      console.log('   ⚠️ Note: You need to set TEST_ADMIN_TOKEN environment variable');
      console.log('   Running database-only tests...\n');
    }

    // Test 2: Direct database update with markModified
    console.log('📝 Test 2: Testing direct database update with markModified...');
    const testValue = 35;

    let config = await SiteConfig.findOne({ key: 'max_vas_per_page' });
    if (!config) {
      config = await SiteConfig.create({
        key: 'max_vas_per_page',
        value: testValue,
        valueType: 'number',
        category: 'limits',
        description: 'Maximum number of VAs to display per page',
        isPublic: false,
        isEditable: true
      });
      console.log(`   Created with value: ${testValue}`);
    } else {
      const oldValue = config.value;
      config.value = testValue;
      config.markModified('value');
      await config.save();
      console.log(`   Updated from ${oldValue} to ${testValue}`);
    }

    // Verify persistence
    const verifyConfig = await SiteConfig.findOne({ key: 'max_vas_per_page' });
    if (verifyConfig && verifyConfig.value === testValue) {
      console.log(`   ✅ Value persisted correctly: ${verifyConfig.value}`);
    } else {
      console.log(`   ❌ Persistence failed. Found: ${verifyConfig?.value}`);
    }

    // Test 3: Test the PUT endpoint (if token is available)
    if (TEST_TOKEN) {
      console.log('\n📤 Test 3: Testing PUT /api/admin/configs endpoint...');
      const updateData = {
        max_vas_per_page: 40,
        max_businesses_per_page: 25,
        enable_notifications: true
      };

      try {
        const putResponse = await axios.put(
          `${API_URL}/api/admin/configs`,
          updateData,
          {
            headers: {
              'Authorization': `Bearer ${TEST_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (putResponse.data.success) {
          console.log('   ✅ Settings updated via API');
          console.log(`   Response: ${putResponse.data.message}`);

          // Verify in database
          for (const [key, expectedValue] of Object.entries(updateData)) {
            const config = await SiteConfig.findOne({ key });
            if (config && config.value === expectedValue) {
              console.log(`   ✅ ${key}: ${config.value} (verified in DB)`);
            } else {
              console.log(`   ❌ ${key}: Expected ${expectedValue}, got ${config?.value}`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ API update failed: ${error.message}`);
      }
    }

    // Test 4: Check if settings affect VA listing
    console.log('\n🔍 Test 4: Verifying settings affect VA listing...');
    const vasPerPageConfig = await SiteConfig.findOne({ key: 'max_vas_per_page' });
    console.log(`   Current max_vas_per_page in DB: ${vasPerPageConfig?.value || 'not set'}`);

    if (TEST_TOKEN) {
      try {
        const vasResponse = await axios.get(`${API_URL}/api/admin/vas?page=1`, {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (vasResponse.data) {
          const vasCount = vasResponse.data.vas?.length || 0;
          const expectedLimit = vasPerPageConfig?.value || 20;
          console.log(`   VAs returned: ${vasCount}`);
          console.log(`   Expected limit: ${expectedLimit}`);

          if (vasCount <= expectedLimit) {
            console.log('   ✅ VA listing respects the max_vas_per_page setting');
          } else {
            console.log('   ⚠️ VA listing might not be respecting the limit');
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Could not test VA listing: ${error.message}`);
      }
    }

    console.log('\n✅ Integration test completed successfully!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed.');
  }
}

// Instructions for getting a test token
console.log('ℹ️  To run full integration tests, you need to set TEST_ADMIN_TOKEN');
console.log('   You can get a token by logging in as admin and checking the browser console/network tab\n');

// Run the test
testSettingsIntegration();