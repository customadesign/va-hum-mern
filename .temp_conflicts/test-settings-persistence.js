#!/usr/bin/env node

/**
 * Test script to verify settings persistence bug is fixed
 * Run with: node test-settings-persistence.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SiteConfig = require('./models/SiteConfig');

async function testSettingsPersistence() {
  console.log('🔧 Testing Settings Persistence Fix...\n');

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create or update the max_vas_per_page setting
    console.log('📝 Test 1: Setting max_vas_per_page to 25...');
    const testKey = 'max_vas_per_page';
    const testValue = 25;

    // Find existing config
    let config = await SiteConfig.findOne({ key: testKey });

    if (config) {
      console.log(`   Current value: ${config.value}`);
      config.value = testValue;
      config.markModified('value'); // Critical line for Mixed type fields
      await config.save();
      console.log(`   Updated to: ${testValue}`);
    } else {
      config = await SiteConfig.create({
        key: testKey,
        value: testValue,
        valueType: 'number',
        category: 'limits',
        description: 'Maximum number of VAs to display per page',
        isPublic: false,
        isEditable: true
      });
      console.log(`   Created with value: ${testValue}`);
    }

    // Test 2: Verify persistence by reading back
    console.log('\n📖 Test 2: Reading back the saved value...');
    const savedConfig = await SiteConfig.findOne({ key: testKey });

    if (savedConfig && savedConfig.value === testValue) {
      console.log(`   ✅ SUCCESS: Value persisted correctly: ${savedConfig.value}`);
    } else {
      console.log(`   ❌ FAILURE: Value did not persist. Found: ${savedConfig?.value}`);
      process.exit(1);
    }

    // Test 3: Test with different value to ensure updates work
    console.log('\n🔄 Test 3: Updating to a different value (30)...');
    const newTestValue = 30;

    savedConfig.value = newTestValue;
    savedConfig.markModified('value');
    await savedConfig.save();

    const verifyConfig = await SiteConfig.findOne({ key: testKey });

    if (verifyConfig && verifyConfig.value === newTestValue) {
      console.log(`   ✅ SUCCESS: Update persisted correctly: ${verifyConfig.value}`);
    } else {
      console.log(`   ❌ FAILURE: Update did not persist. Found: ${verifyConfig?.value}`);
      process.exit(1);
    }

    // Test 4: Test multiple settings at once
    console.log('\n📚 Test 4: Testing multiple settings persistence...');
    const multipleSettings = {
      'max_businesses_per_page': 20,
      'enable_notifications': true,
      'site_maintenance_mode': false
    };

    for (const [key, value] of Object.entries(multipleSettings)) {
      let config = await SiteConfig.findOne({ key });

      if (config) {
        config.value = value;
        config.markModified('value');
        await config.save();
      } else {
        await SiteConfig.create({
          key,
          value,
          valueType: typeof value === 'boolean' ? 'boolean' : 'number',
          category: 'general',
          isPublic: false,
          isEditable: true
        });
      }
    }

    // Verify all settings
    let allSuccess = true;
    for (const [key, expectedValue] of Object.entries(multipleSettings)) {
      const config = await SiteConfig.findOne({ key });
      if (config && config.value === expectedValue) {
        console.log(`   ✅ ${key}: ${config.value}`);
      } else {
        console.log(`   ❌ ${key}: Expected ${expectedValue}, got ${config?.value}`);
        allSuccess = false;
      }
    }

    if (allSuccess) {
      console.log('\n🎉 All tests passed! Settings persistence is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the implementation.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed.');
  }
}

// Run the test
testSettingsPersistence();