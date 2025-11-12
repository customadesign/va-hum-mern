const mongoose = require('mongoose');
const VA = require('./models/VA');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/linkagevahub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testSearchPrefix() {
  try {
    console.log('\n🔍 Testing prefix search functionality...\n');

    // Test 1: Search for names starting with 'M'
    console.log('Test 1: Searching for names starting with "M"');
    const searchM = await VA.find({
      $or: [
        { name: { $regex: '^M', $options: 'i' } }
      ]
    }).select('name');
    
    console.log(`Found ${searchM.length} VAs with names starting with 'M':`);
    searchM.forEach(va => console.log(`  - ${va.name}`));

    // Test 2: Search for names starting with 'Ma'
    console.log('\nTest 2: Searching for names starting with "Ma"');
    const searchMa = await VA.find({
      $or: [
        { name: { $regex: '^Ma', $options: 'i' } }
      ]
    }).select('name');
    
    console.log(`Found ${searchMa.length} VAs with names starting with 'Ma':`);
    searchMa.forEach(va => console.log(`  - ${va.name}`));

    // Test 3: Search for names starting with 'Mar'
    console.log('\nTest 3: Searching for names starting with "Mar"');
    const searchMar = await VA.find({
      $or: [
        { name: { $regex: '^Mar', $options: 'i' } }
      ]
    }).select('name');
    
    console.log(`Found ${searchMar.length} VAs with names starting with 'Mar':`);
    searchMar.forEach(va => console.log(`  - ${va.name}`));

    // Test 4: Old regex search (contains) for comparison
    console.log('\nTest 4: Old regex search (contains) for "Mar" - FOR COMPARISON');
    const oldSearch = await VA.find({
      $or: [
        { name: { $regex: 'Mar', $options: 'i' } }
      ]
    }).select('name');
    
    console.log(`Found ${oldSearch.length} VAs with names containing 'Mar' (old method):`);
    oldSearch.forEach(va => console.log(`  - ${va.name}`));

    // Test 5: Check if Maria would be found with 'Mar' prefix
    console.log('\nTest 5: Checking if "Maria" would be found with "Mar" prefix');
    const mariaTest = await VA.find({
      $or: [
        { name: { $regex: '^Mar', $options: 'i' } }
      ]
    }).select('name');
    
    const hasMaria = mariaTest.some(va => va.name.toLowerCase().includes('maria'));
    console.log(`Would "Maria" be found with "Mar" prefix? ${hasMaria ? '✅ YES' : '❌ NO'}`);

    console.log('\n✅ Search prefix test completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the test
testSearchPrefix();