const { body, validationResult } = require('express-validator');

// Test the validation logic
async function testValidation() {
  console.log('🧪 Testing express-validator logic...');
  
  const testEmail = 'pat@murphyconsulting.us';
  const testPassword = 'B5tccpbx';
  
  // Simulate validation
  const emailValidator = body('email').isEmail().normalizeEmail();
  const passwordValidator = body('password').exists();
  
  // Create mock request
  const mockReq = {
    body: {
      email: testEmail,
      password: testPassword
    }
  };
  
  console.log('Original data:', mockReq.body);
  
  // Test the email validation manually
  try {
    const validator = require('validator');
    
    console.log('Email validation tests:');
    console.log('- isEmail():', validator.isEmail(testEmail));
    console.log('- normalizeEmail():', validator.normalizeEmail(testEmail));
    
    // Test what express-validator would do
    const normalizedEmail = validator.normalizeEmail(testEmail);
    console.log('- Normalized result:', normalizedEmail);
    
    if (normalizedEmail !== testEmail) {
      console.log('⚠️  Email normalization changed the email!');
      console.log('  Original:', testEmail);
      console.log('  Normalized:', normalizedEmail);
    }
    
  } catch (error) {
    console.error('❌ Validation test failed:', error);
  }
  
  // Test direct API call to see exact error
  console.log('\n🌐 Testing direct API call...');
  const axios = require('axios');
  
  try {
    const response = await axios.post('http://localhost:8000/api/auth/login', {
      email: testEmail,
      password: testPassword
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Direct API call successful');
  } catch (error) {
    console.log('❌ Direct API call failed:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    
    if (error.response?.status === 400 && error.response?.data?.errors) {
      console.log('Validation errors:');
      error.response.data.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.msg} (field: ${err.param})`);
      });
    }
  }
}

testValidation();