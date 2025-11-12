#!/usr/bin/env node

/**
 * Test script to verify the complete upload workflow
 * This simulates what the frontend should be doing
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE = 'http://localhost:8000/api';

// Test user credentials - update these with valid credentials
const TEST_USER = {
  email: 'hpmurphy@icloud.com', // Update with a valid test user email
  password: 'testpassword123' // Update with the actual password
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'bright');
  console.log('='.repeat(50));
}

// Create a simple test image if it doesn't exist
async function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-upload.png');
  
  if (!fs.existsSync(testImagePath)) {
    log('Creating test image...', 'cyan');
    // Create a 1x1 pixel PNG
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, buffer);
  }
  
  return testImagePath;
}

// Login and get JWT token
async function login() {
  try {
    log('Logging in...', 'cyan');
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    
    if (response.data.token) {
      log('✅ Login successful', 'green');
      return response.data.token;
    }
    
    throw new Error('No token received');
  } catch (error) {
    log(`❌ Login failed: ${error.response?.data?.error || error.message}`, 'red');
    
    // Try to create the user if login fails
    if (error.response?.status === 401) {
      log('Attempting to register user...', 'yellow');
      try {
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
          ...TEST_USER,
          name: 'Test User'
        });
        
        if (registerResponse.data.token) {
          log('✅ User registered successfully', 'green');
          return registerResponse.data.token;
        }
      } catch (regError) {
        log(`❌ Registration also failed: ${regError.response?.data?.error || regError.message}`, 'red');
      }
    }
    
    return null;
  }
}

// Get current VA profile
async function getVAProfile(token) {
  try {
    const response = await axios.get(`${API_BASE}/vas/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      log('No VA profile found', 'yellow');
      return null;
    }
    throw error;
  }
}

// Test upload workflow
async function testUploadWorkflow(token) {
  logSection('Testing Upload Workflow');
  
  try {
    // Step 1: Check current VA profile
    log('\n📋 Step 1: Checking current VA profile...', 'cyan');
    let vaProfile = await getVAProfile(token);
    
    if (vaProfile) {
      log(`Found VA: ${vaProfile.name}`, 'white');
      log(`Current avatar: ${vaProfile.avatar || 'not set'}`, 'white');
      log(`Current cover: ${vaProfile.coverImage || 'not set'}`, 'white');
      log(`Current video: ${vaProfile.videoIntroduction || 'not set'}`, 'white');
    } else {
      log('No VA profile exists yet', 'yellow');
    }
    
    // Step 2: Upload an image
    log('\n📤 Step 2: Uploading test image...', 'cyan');
    const testImagePath = await createTestImage();
    
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    
    const uploadResponse = await axios.post(
      `${API_BASE}/vas/me/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (uploadResponse.data.success) {
      log(`✅ Image uploaded successfully`, 'green');
      log(`URL: ${uploadResponse.data.url}`, 'white');
      
      const uploadedUrl = uploadResponse.data.url;
      
      // Step 3: Update VA profile with the uploaded URL
      log('\n💾 Step 3: Updating VA profile with uploaded URL...', 'cyan');
      
      const updateData = {
        avatar: uploadedUrl,
        // Include required fields if creating new profile
        name: vaProfile?.name || 'Test User',
        bio: vaProfile?.bio || 'Test bio for upload testing'
      };
      
      const updateResponse = await axios.put(
        `${API_BASE}/vas/me`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (updateResponse.data.success) {
        log('✅ VA profile updated successfully', 'green');
        
        // Step 4: Verify the update persisted
        log('\n🔍 Step 4: Verifying update persisted...', 'cyan');
        const updatedProfile = await getVAProfile(token);
        
        if (updatedProfile && updatedProfile.avatar === uploadedUrl) {
          log('✅ UPLOAD WORKFLOW SUCCESSFUL!', 'green');
          log(`Avatar URL correctly saved: ${updatedProfile.avatar}`, 'white');
        } else {
          log('❌ URL was not saved to database', 'red');
          log(`Expected: ${uploadedUrl}`, 'white');
          log(`Actual: ${updatedProfile?.avatar || 'not set'}`, 'white');
        }
      } else {
        log('❌ Failed to update VA profile', 'red');
      }
    } else {
      log('❌ Upload failed', 'red');
    }
    
  } catch (error) {
    log(`❌ Workflow test failed: ${error.message}`, 'red');
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

// Test the complete workflow
async function testCompleteWorkflow(token) {
  logSection('Testing Complete Upload → Save Workflow');
  
  try {
    // Test image upload and save
    log('\n🖼️  Testing Avatar Upload...', 'cyan');
    await testSingleUpload(token, 'avatar', 'image');
    
    // Test cover image
    log('\n🏞️  Testing Cover Image Upload...', 'cyan');
    await testSingleUpload(token, 'coverImage', 'image');
    
    logSection('Workflow Test Complete');
    
  } catch (error) {
    log(`❌ Complete workflow test failed: ${error.message}`, 'red');
  }
}

async function testSingleUpload(token, fieldName, fileFieldName) {
  try {
    // Upload file
    const testImagePath = await createTestImage();
    const formData = new FormData();
    formData.append(fileFieldName, fs.createReadStream(testImagePath));
    
    log(`Uploading ${fieldName}...`, 'white');
    const uploadResponse = await axios.post(
      `${API_BASE}/vas/me/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (!uploadResponse.data.success) {
      throw new Error('Upload failed');
    }
    
    const uploadedUrl = uploadResponse.data.url;
    log(`  ✅ Uploaded: ${uploadedUrl}`, 'green');
    
    // Update VA profile
    log(`  Saving to VA profile...`, 'white');
    const updateData = {
      [fieldName]: uploadedUrl
    };
    
    const updateResponse = await axios.put(
      `${API_BASE}/vas/me`,
      updateData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!updateResponse.data.success) {
      throw new Error('Profile update failed');
    }
    
    // Verify
    const profile = await getVAProfile(token);
    if (profile[fieldName] === uploadedUrl) {
      log(`  ✅ ${fieldName} saved successfully!`, 'green');
    } else {
      log(`  ❌ ${fieldName} not saved to database`, 'red');
    }
    
  } catch (error) {
    log(`  ❌ ${fieldName} test failed: ${error.message}`, 'red');
  }
}

// Main function
async function main() {
  log('\n🔍 VA Upload Workflow Tester', 'bright');
  log('Testing the complete upload → save workflow', 'white');
  
  // Check if server is running
  try {
    await axios.get(`${API_BASE}/health`);
    log('✅ Server is running', 'green');
  } catch (error) {
    log('❌ Server is not running on port 8000', 'red');
    log('Please start the server with: npm start', 'yellow');
    process.exit(1);
  }
  
  // Login
  const token = await login();
  if (!token) {
    log('\n❌ Cannot proceed without authentication', 'red');
    log('Please update TEST_USER credentials in this script', 'yellow');
    process.exit(1);
  }
  
  // Run tests
  await testUploadWorkflow(token);
  await testCompleteWorkflow(token);
  
  logSection('Test Summary');
  log('📝 Key findings:', 'cyan');
  log('1. Check if uploads return success but URLs aren\'t saved', 'white');
  log('2. Verify PUT /api/vas/me is called after upload', 'white');
  log('3. Ensure frontend uses correct field names', 'white');
  log('4. Check for validation errors in server logs', 'white');
}

// Run the test
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});