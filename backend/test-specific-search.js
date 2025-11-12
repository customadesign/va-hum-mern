const mongoose = require('mongoose');
const VA = require('./models/VA');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/linkagevahub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testSpecificSearch() {
  try {
    console.log('\n🔍 Testing specific prefix search functionality...\n');

    // Test 1: Search for names starting with 'mar' (should find Maria Clara Santos)
    console.log('Test 1: Searching for names starting with "mar"');
    const searchMar = await VA.find({
      searchStatus: { $in: ['actively_looking', 'open'] },
      $or: [
        { name: { $regex: '^mar', $options: 'i' } }
      ]
    }).select('name searchStatus');
    
    console.log(`Found ${searchMar.length} VAs with names starting with 'mar':`);
    searchMar.forEach(va => console.log(`  - ${va.name} (${va.searchStatus})`));

    // Test 2: Search for names starting with 'maria' (should find Maria Clara Santos)
    console.log('\nTest 2: Searching for names starting with "maria"');
    const searchMaria = await VA.find({
      searchStatus: { $in: ['actively_looking', 'open'] },
      $or: [
        { name: { $regex: '^maria', $options: 'i' } }
      ]
    }).select('name searchStatus');
    
    console.log(`Found ${searchMaria.length} VAs with names starting with 'maria':`);
    searchMaria.forEach(va => console.log(`  - ${va.name} (${va.searchStatus})`));

    // Test 3: API test for 'mar' search
    console.log('\nTest 3: Testing API endpoint with "mar"');
    const axios = require('axios');
    
    try {
      const response = await axios.get('http://localhost:5000/api/vas?search=mar', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`API Response - Status: ${response.status}`);
      console.log(`API Response - Data length: ${response.data.data?.length || 0}`);
      console.log('API Response - VAs found:');
      response.data.data?.forEach(va => console.log(`  - ${va.name}`));
      
    } catch (apiError) {
      console.error('❌ API Error:', apiError.message);
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', apiError.response.data);
      }
    }

    // Test 4: API test for 'maria' search
    console.log('\nTest 4: Testing API endpoint with "maria"');
    
    try {
      const response = await axios.get('http://localhost:5000/api/vas?search=maria', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`API Response - Status: ${response.status}`);
      console.log(`API Response - Data length: ${response.data.data?.length || 0}`);
      console.log('API Response - VAs found:');
      response.data.data?.forEach(va => console.log(`  - ${va.name}`));
      
    } catch (apiError) {
      console.error('❌ API Error:', apiError.message);
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', apiError.response.data);
      }
    }

    console.log('\n✅ Specific prefix search test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run test
testSpecificSearch();