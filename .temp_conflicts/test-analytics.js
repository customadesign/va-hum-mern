const axios = require('axios');

async function testAnalytics() {
  try {
    console.log('Testing analytics endpoint...');
    const startTime = Date.now();
    
    // You'll need to get a valid token from your browser's cookies or login first
    const response = await axios.get('http://localhost:8000/api/admin/analytics', {
      params: { timeRange: '7' },
      headers: {
        'Cookie': 'token=YOUR_TOKEN_HERE', // Replace with actual token
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Analytics request successful in ${duration}ms`);
    console.log('Response summary:');
    console.log('- Total Users:', response.data.data?.overview?.totalUsers);
    console.log('- Total VAs:', response.data.data?.overview?.totalVAs);
    console.log('- Total Businesses:', response.data.data?.overview?.totalBusinesses);
    console.log('- Growth data points:', response.data.data?.growth?.length);
    
  } catch (error) {
    console.error('❌ Analytics request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Instructions:
console.log(`
===========================================
ANALYTICS ENDPOINT TEST
===========================================
To test the analytics endpoint:

1. Open your browser and go to http://localhost:4000
2. Login as admin@linkage.ph
3. Open browser DevTools (F12)
4. Go to Application/Storage -> Cookies
5. Find the 'token' cookie and copy its value
6. Replace YOUR_TOKEN_HERE in this script with the actual token
7. Run: node test-analytics.js

The optimizations made:
- Replaced sequential database queries with parallel aggregations
- Added proper indexes for createdAt, status, location, skills fields
- Increased frontend timeout from 10s to 30s
- Reduced queries from 90+ (for 30 days) to just 3 aggregation pipelines
===========================================
`);

// Uncomment to run the test with a valid token
// testAnalytics();