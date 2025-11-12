const mongoose = require('mongoose');
const VA = require('./models/VA');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/linkagevahub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testSingleLetterSearch() {
  try {
    console.log('\n🔍 Testing single letter search functionality...\n');

    // Test 1: Search for names starting with 'a'
    console.log('Test 1: Searching for names starting with "a"');
    const searchA = await VA.find({
      searchStatus: { $in: ['actively_looking', 'open'] },
      $or: [
        { name: { $regex: '^a', $options: 'i' } }
      ]
    }).select('name searchStatus');
    
    console.log(`Found ${searchA.length} VAs with names starting with 'a':`);
    searchA.forEach(va => console.log(`  - ${va.name} (${va.searchStatus})`));

    // Test 2: Search for names starting with 'A'
    console.log('\nTest 2: Searching for names starting with "A"');
    const searchA2 = await VA.find({
      searchStatus: { $in: ['actively_looking', 'open'] },
      $or: [
        { name: { $regex: '^A', $options: 'i' } }
      ]
    }).select('name searchStatus');
    
    console.log(`Found ${searchA2.length} VAs with names starting with 'A':`);
    searchA2.forEach(va => console.log(`  - ${va.name} (${va.searchStatus})`));

    // Test 3: Get all VAs to see what names we have
    console.log('\nTest 3: All available VAs (first 10):');
    const allVAs = await VA.find({
      searchStatus: { $in: ['actively_looking', 'open'] }
    }).select('name searchStatus').limit(10);
    
    console.log(`Total available VAs: ${allVAs.length}`);
    allVAs.forEach(va => console.log(`  - ${va.name} (${va.searchStatus})`));

    // Test 4: Test the actual API endpoint
    console.log('\nTest 4: Testing API endpoint with single letter');
    const axios = require('axios');
    
    try {
      const response = await axios.get('http://localhost:5000/api/vas?search=a', {
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

    console.log('\n✅ Single letter search test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test
testSingleLetterSearch();