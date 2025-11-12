/**
 * Test script for universal search functionality
 */

const axios = require('axios');

const API_URL = 'http://localhost:8000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

async function testSearch() {
  try {
    console.log('Testing Universal Search API...\n');

    // Test different search queries
    const searchQueries = [
      'john',      // Search for users named John
      'admin',     // Search for admin users
      'business',  // Search for businesses
      'test',      // General test search
      'hello',     // Search in messages
    ];

    for (const query of searchQueries) {
      console.log(`\nSearching for: "${query}"`);
      console.log('-'.repeat(50));

      try {
        const response = await axios.get(`${API_URL}/api/admin/search/universal`, {
          params: { query, limit: 3 },
          headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          const results = response.data.data;
          console.log(`Total results: ${results.totalResults || 0}`);

          // Display results by category
          const categories = ['vas', 'businesses', 'users', 'messages', 'notifications', 'conversations'];
          
          categories.forEach(category => {
            if (results[category] && results[category].length > 0) {
              console.log(`\n  ${category.toUpperCase()} (${results[category].length} results):`);
              results[category].forEach((item, index) => {
                console.log(`    ${index + 1}. ${item.title}`);
                console.log(`       ${item.description}`);
                if (item.link) {
                  console.log(`       Link: ${item.link}`);
                }
              });
            }
          });
        } else {
          console.log('Search failed:', response.data.error);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('Authentication failed. Please provide a valid admin token.');
          console.log('Set the ADMIN_TOKEN environment variable or update the script.');
        } else {
          console.log('Error:', error.response?.data?.error || error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Search API test completed!');

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSearch();