// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');

// Test the new database configuration
async function testConnection() {
  console.log('🧪 Testing MongoDB Connection Fix...\n');
  
  // Test 1: Check if MONGODB_URI is available
  if (!process.env.MONGODB_URI) {
    console.log('❌ MONGODB_URI not found in environment variables');
    console.log('Please set MONGODB_URI in your .env file or Render environment');
    return false;
  }
  
  console.log('✅ MONGODB_URI found');
  
  // Test 2: Try connection with new configuration
  const options = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000
  };
  
  try {
    console.log('🔗 Attempting to connect with new configuration...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`✅ SUCCESS: Connected to MongoDB at ${conn.connection.host}`);
    console.log(`📊 Connection state: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    // Test 3: Basic database operation
    console.log('🧪 Testing basic database operation...');
    await mongoose.connection.db.admin().ping();
    console.log('✅ SUCCESS: Database ping successful');
    
    // Test 4: List collections
    console.log('📋 Testing collection access...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ SUCCESS: Found ${collections.length} collections`);
    
    // Cleanup
    await mongoose.disconnect();
    console.log('🔌 Disconnected successfully');
    
    console.log('\n🎉 ALL TESTS PASSED - MongoDB connection fix is working!');
    return true;
    
  } catch (error) {
    console.error('❌ CONNECTION FAILED:', error.message);
    
    if (error.message.includes('buffermaxentries')) {
      console.error('\n🚨 CRITICAL: Still using deprecated buffermaxentries option!');
      console.error('Please check all database configuration files and remove this option.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔧 Connection refused - Check MongoDB URI and network access');
    } else if (error.message.includes('authentication')) {
      console.error('\n🔐 Authentication failed - Check username/password');
    } else if (error.message.includes('timeout')) {
      console.error('\n⏰ Connection timeout - Check network and firewall settings');
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test failed with error:', error);
      process.exit(1);
    });
}

module.exports = testConnection;