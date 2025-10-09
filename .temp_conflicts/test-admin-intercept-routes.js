const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

// Test admin token (you'll need to replace with a valid admin token)
const ADMIN_TOKEN = 'your-admin-token-here';

const testAdminInterceptRoutes = async () => {
  console.log('Testing Admin Intercept Routes...\n');

  try {
    // Test 1: Get all intercepted conversations
    console.log('1. Testing GET /api/admin/intercept/conversations');
    try {
      const response = await axios.get(`${API_BASE}/admin/intercept/conversations`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        params: {
          status: 'all',
          page: 1,
          limit: 10
        }
      });
      console.log('✅ Success: Retrieved conversations');
      console.log(`   - Total conversations: ${response.data.data.pagination.total}`);
      console.log(`   - Unread count: ${response.data.data.unreadCount}`);
      console.log(`   - Status counts:`, response.data.data.statusCounts);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.error || error.message);
    }

    // Test 2: Get statistics
    console.log('\n2. Testing GET /api/admin/intercept/stats');
    try {
      const response = await axios.get(`${API_BASE}/admin/intercept/stats`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ Success: Retrieved statistics');
      console.log('   - Overview:', response.data.data.overview);
      console.log('   - Completion ranges:', response.data.data.completionRanges);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.error || error.message);
    }

    // Test 3: Check messaging eligibility (public endpoint)
    console.log('\n3. Testing GET /api/admin/intercept/check-messaging-eligibility/:vaId');
    try {
      // Using a dummy VA ID - replace with actual
      const response = await axios.get(`${API_BASE}/admin/intercept/check-messaging-eligibility/123456789012345678901234`);
      console.log('✅ Success: Checked eligibility');
      console.log('   - Can message:', response.data.canMessage);
      console.log('   - Action required:', response.data.actionRequired);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️  Expected: VA not found (using dummy ID)');
      } else {
        console.log('❌ Failed:', error.response?.data?.error || error.message);
      }
    }

    // Test 4: Get profile completion requirements (public endpoint)
    console.log('\n4. Testing GET /api/admin/intercept/profile-completion-requirements');
    try {
      const response = await axios.get(`${API_BASE}/admin/intercept/profile-completion-requirements`);
      console.log('✅ Success: Retrieved requirements');
      console.log('   - Minimum percentage:', response.data.requirements.minimumPercentage);
      console.log('   - Field categories:', Object.keys(response.data.requirements.requiredFields));
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.error || error.message);
    }

    // Test 5: Test a specific conversation (if exists)
    console.log('\n5. Testing GET /api/admin/intercept/conversations/:id');
    try {
      // First get a conversation ID
      const listResponse = await axios.get(`${API_BASE}/admin/intercept/conversations`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        params: { limit: 1 }
      });
      
      if (listResponse.data.data.conversations.length > 0) {
        const conversationId = listResponse.data.data.conversations[0]._id;
        const response = await axios.get(`${API_BASE}/admin/intercept/conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        console.log('✅ Success: Retrieved conversation details');
        console.log('   - Conversation ID:', response.data.data._id);
        console.log('   - Status:', response.data.data.adminStatus);
        console.log('   - Messages count:', response.data.data.messages?.length || 0);
      } else {
        console.log('⚠️  No conversations to test');
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.error || error.message);
    }

    console.log('\n✅ All route tests completed!');
    console.log('\nNote: Some routes require actual conversation data to test fully.');
    console.log('Routes available for admin Messages tab:');
    console.log('  - GET    /api/admin/intercept/conversations');
    console.log('  - GET    /api/admin/intercept/conversations/:id');
    console.log('  - POST   /api/admin/intercept/forward/:conversationId');
    console.log('  - POST   /api/admin/intercept/reply/:conversationId');
    console.log('  - PUT    /api/admin/intercept/notes/:conversationId');
    console.log('  - PUT    /api/admin/intercept/status/:conversationId');
    console.log('  - POST   /api/admin/intercept/batch');
    console.log('  - GET    /api/admin/intercept/stats');

  } catch (error) {
    console.error('Test suite error:', error.message);
  }
};

// Instructions for getting admin token
console.log('===========================================');
console.log('Admin Intercept Routes Test Script');
console.log('===========================================\n');
console.log('To test these routes, you need an admin token.');
console.log('You can get one by:');
console.log('1. Login as admin user');
console.log('2. Check browser DevTools Network tab');
console.log('3. Find any API request and copy the Authorization header token');
console.log('4. Replace ADMIN_TOKEN in this script\n');
console.log('Or run this test with a token as argument:');
console.log('node test-admin-intercept-routes.js <your-token>\n');
console.log('===========================================\n');

// Check if token provided as command line argument
if (process.argv[2]) {
  const token = process.argv[2];
  console.log('Using provided token...\n');
  // Override the token
  const testWithToken = async () => {
    const axios = require('axios');
    const API_BASE = 'http://localhost:8000/api';
    const ADMIN_TOKEN = token;
    
    // Run the same tests with provided token
    await testAdminInterceptRoutes();
  };
  testWithToken();
} else {
  console.log('No token provided. Please edit the script or provide token as argument.\n');
  // Still run tests to show what's available
  testAdminInterceptRoutes();
}

module.exports = { testAdminInterceptRoutes };