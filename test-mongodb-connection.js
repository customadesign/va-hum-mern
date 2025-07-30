#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * 
 * This script tests the MongoDB Atlas connection to ensure everything is working.
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

console.log('🧪 Testing MongoDB Atlas Connection');
console.log('==================================\n');

// Test connection function
async function testConnection() {
  try {
    console.log('🔗 Attempting to connect to MongoDB Atlas...');
    console.log('📡 Connection string:', process.env.MONGODB_URI ? '✅ Found' : '❌ Missing');
    
    if (!process.env.MONGODB_URI) {
      console.log('\n❌ MONGODB_URI not found in environment variables');
      console.log('💡 Make sure you have created the .env file in the backend directory');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database operations
    console.log('\n📊 Testing database operations...');
    
    // Get database info
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📁 Available collections:', collections.length);
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ 
      test: String, 
      timestamp: { type: Date, default: Date.now } 
    });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ test: 'Connection test' });
    await testDoc.save();
    console.log('✅ Successfully created test document');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Successfully cleaned up test document');
    
    console.log('\n🎉 All tests passed! MongoDB Atlas is working correctly.');
    console.log('\n📝 Your database is ready for the Linkage VA Hub application.');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify your MongoDB Atlas credentials');
    console.log('3. Make sure your IP address is whitelisted in Atlas');
    console.log('4. Check if the cluster is running');
    console.log('5. Verify the connection string format');
    
    if (error.message.includes('authentication')) {
      console.log('\n🔐 Authentication error - check username/password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 Network error - check cluster URL');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🚫 Connection refused - check firewall/whitelist');
    }
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Connection closed');
    }
    process.exit(0);
  }
}

// Run the test
testConnection(); 