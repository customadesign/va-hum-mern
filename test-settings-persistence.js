// Test script to verify settings persistence
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/admin/settings';

// Test settings update
async function testSettingsUpdate() {
  try {
    console.log('Testing settings persistence...\n');
    
    // First, get current settings
    console.log('1. Getting current settings...');
    const getResponse = await axios.get(API_URL, {
      headers: {
        'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJlM2FlZjBlOTQyOTA5YjQ5OTljNTYiLCJpYXQiOjE3MzcwMzcyMDAsImV4cCI6MTczNzY0MjAwMH0.qDJ5fKpSSqbVpeGT0ugMipLnpCJe1x3QQXxcpoTfC5o'
      }
    });
    
    const currentPageSize = getResponse.data.settings?.performance?.pagination?.defaultLimit || 25;
    console.log(`   Current page size: ${currentPageSize}`);
    
    // Update the settings
    console.log('\n2. Updating page size to 20...');
    const updateResponse = await axios.put(API_URL, {
      settings: {
        performance: {
          pagination: {
            defaultLimit: 20,
            maxLimit: 100,
            showOptions: [10, 20, 50, 100]
          }
        }
      }
    }, {
      headers: {
        'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJlM2FlZjBlOTQyOTA5YjQ5OTljNTYiLCJpYXQiOjE3MzcwMzcyMDAsImV4cCI6MTczNzY0MjAwMH0.qDJ5fKpSSqbVpeGT0ugMipLnpCJe1x3QQXxcpoTfC5o'
      }
    });
    
    console.log(`   Update response: ${updateResponse.data.message}`);
    console.log(`   Settings updated: ${updateResponse.data.updatedCount}`);
    
    // Verify the update
    console.log('\n3. Verifying the update...');
    const verifyResponse = await axios.get(API_URL, {
      headers: {
        'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJlM2FlZjBlOTQyOTA5YjQ5OTljNTYiLCJpYXQiOjE3MzcwMzcyMDAsImV4cCI6MTczNzY0MjAwMH0.qDJ5fKpSSqbVpeGT0ugMipLnpCJe1x3QQXxcpoTfC5o'
      }
    });
    
    const newPageSize = verifyResponse.data.settings?.performance?.pagination?.defaultLimit || 25;
    console.log(`   New page size: ${newPageSize}`);
    
    if (newPageSize === 20) {
      console.log('\n✅ SUCCESS: Settings are now persisting correctly!');
    } else {
      console.log('\n❌ FAILED: Settings did not persist. Value reverted to:', newPageSize);
    }
    
  } catch (error) {
    console.error('Error testing settings:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSettingsUpdate();
