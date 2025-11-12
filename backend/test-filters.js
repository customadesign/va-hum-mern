const mongoose = require('mongoose');
const VA = require('./models/VA');

async function testFilters() {
  try {
    console.log('🔍 Testing filter functionality...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkagevahub');
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Get all VAs first
    console.log('Test 1: Getting all VAs...');
    const allVAs = await VA.find({ searchStatus: { $in: ['actively_looking', 'open'] } });
    console.log(`Found ${allVAs.length} total VAs\n`);

    // Test 2: Industry filter
    console.log('Test 2: Testing industry filter...');
    const industryVAs = await VA.find({ 
      searchStatus: { $in: ['actively_looking', 'open'] },
      industry: { $in: ['technology'] }
    });
    console.log(`Found ${industryVAs.length} VAs in technology industry\n`);

    // Test 3: Years of experience filter
    console.log('Test 3: Testing years of experience filter...');
    const expVAs = await VA.find({ 
      searchStatus: { $in: ['actively_looking', 'open'] },
      yearsOfExperience: { $gte: 3 }
    });
    console.log(`Found ${expVAs.length} VAs with 3+ years experience\n`);

    // Test 4: Availability filter
    console.log('Test 4: Testing availability filter...');
    const availVAs = await VA.find({ 
      searchStatus: { $in: ['actively_looking', 'open'] },
      availability: 'immediately'
    });
    console.log(`Found ${availVAs.length} VAs available immediately\n`);

    // Test 5: Combined filters
    console.log('Test 5: Testing combined filters...');
    const combinedVAs = await VA.find({ 
      searchStatus: { $in: ['actively_looking', 'open'] },
      industry: { $in: ['technology'] },
      yearsOfExperience: { $gte: 3 },
      availability: 'immediately'
    });
    console.log(`Found ${combinedVAs.length} VAs with all filters combined\n`);

    // Show sample data
    console.log('\n📋 Sample VA data:');
    if (allVAs.length > 0) {
      const sample = allVAs[0];
      console.log('Sample VA:', {
        name: sample.name,
        industry: sample.industry,
        yearsOfExperience: sample.yearsOfExperience,
        availability: sample.availability,
        searchStatus: sample.searchStatus
      });
    }

    console.log('\n✅ Filter test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testFilters();