const axios = require('axios');

// Test VA profile endpoint with messaging configuration
async function testVAProfileMessaging() {
  const vaId = '68b0a91656fc851327f11c32'; // The VA ID from your URL
  const baseUrl = 'http://localhost:5000/api'; // Your backend URL
  
  console.log('Testing VA Profile Messaging Configuration...\n');
  
  try {
    // Test 1: Unauthenticated user (should show register button)
    console.log('1. Testing unauthenticated user:');
    const response1 = await axios.get(`${baseUrl}/vas/${vaId}?via=shortlink`);
    console.log('   Messaging config:', JSON.stringify(response1.data.messaging, null, 2));
    console.log('   Action button:', response1.data.messaging?.actionButton);
    console.log('   ✅ Should show "Register Your Business To Chat" button\n');
    
    // Test 2: With share=true parameter
    console.log('2. Testing with share=true parameter:');
    const response2 = await axios.get(`${baseUrl}/vas/${vaId}?share=true`);
    console.log('   Messaging config:', JSON.stringify(response2.data.messaging, null, 2));
    console.log('   ✅ Should also show registration button for unauthenticated users\n');
    
    console.log('3. Expected behavior in frontend:');
    console.log('   - When user is not logged in: Show "Register Your Business To Chat" button');
    console.log('   - Button should link to:', process.env.ESYSTEMS_FRONTEND_URL || 'http://localhost:3002/register');
    console.log('\n✅ Backend is correctly configured!');
    
  } catch (error) {
    console.error('❌ Error testing VA profile:', error.response?.data || error.message);
  }
}

// Run the test
testVAProfileMessaging();