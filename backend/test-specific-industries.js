const mongoose = require('mongoose');
const VA = require('./models/VA');

async function testSpecificIndustries() {
  try {
    console.log('🔍 Testing specific industries that exist...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkagevahub');
    console.log('✅ Connected to MongoDB\n');

    // Test with industries that actually exist
    const existingIndustries = ['digital_marketing', 'ecommerce', 'customer_service', 'graphic_design'];
    
    for (const industry of existingIndustries) {
      console.log(`\n📊 Testing industry: ${industry}`);
      const vas = await VA.find({ 
        searchStatus: { $in: ['actively_looking', 'open'] },
        industry: industry
      });
      
      console.log(`Found ${vas.length} VAs in ${industry}:`);
      vas.forEach(va => {
        console.log(`  - ${va.name} (${vas.yearsOfExperience} years exp)`);
      });
    }

    // Test combined filters
    console.log('\n🔍 Testing combined filters...');
    const combinedVAs = await VA.find({ 
      searchStatus: { $in: ['actively_looking', 'open'] },
      industry: 'digital_marketing',
      yearsOfExperience: { $gte: 3 },
      availability: 'immediately'
    });
    
    console.log(`Found ${combinedVAs.length} VAs with digital_marketing + 3+ years exp + immediately available:`);
    combinedVAs.forEach(va => {
      console.log(`  - ${va.name} (${vas.yearsOfExperience} years exp, ${vas.availability})`);
    });

    console.log('\n✅ Specific industry test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testSpecificIndustries();