require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 MongoDB Authentication Diagnostic Tool\n');

// Parse MongoDB URI to extract components
function parseMongoURI(uri) {
  try {
    const url = new URL(uri);
    return {
      protocol: url.protocol,
      username: url.username,
      password: url.password ? '***' : 'MISSING',
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search,
      hasAuth: !!(url.username && url.password),
      isSRV: url.protocol === 'mongodb+srv:'
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function diagnoseConnection() {
  const uri = process.env.MONGODB_URI;
  
  console.log('📋 Environment Check:');
  console.log(`   MONGODB_URI exists: ${!!uri}`);
  
  if (!uri) {
    console.log('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  console.log(`   MONGODB_URI length: ${uri.length} characters`);
  
  const parsed = parseMongoURI(uri);
  console.log('\n🔗 URI Analysis:');
  
  if (parsed.error) {
    console.log(`❌ Invalid URI format: ${parsed.error}`);
    return;
  }
  
  console.log(`   Protocol: ${parsed.protocol}`);
  console.log(`   Username: ${parsed.username || 'MISSING'}`);
  console.log(`   Password: ${parsed.password}`);
  console.log(`   Hostname: ${parsed.hostname}`);
  console.log(`   Database: ${parsed.pathname || 'DEFAULT'}`);
  console.log(`   SRV Record: ${parsed.isSRV ? 'YES' : 'NO'}`);
  console.log(`   Has Auth: ${parsed.hasAuth ? 'YES' : 'NO'}`);
  
  // Check for common issues
  console.log('\n🚨 Common Issues Check:');
  
  if (!parsed.username) {
    console.log('❌ No username in URI');
  }
  
  if (parsed.password === 'MISSING') {
    console.log('❌ No password in URI');
  }
  
  if (parsed.password === '***' && uri.includes('<db_password>')) {
    console.log('❌ Placeholder password detected: <db_password>');
  }
  
  if (parsed.password === '***' && uri.includes('password')) {
    console.log('⚠️  Password might be literal "password"');
  }
  
  // Test connection
  console.log('\n🧪 Connection Test:');
  
  try {
    console.log('   Attempting connection...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    
    console.log('✅ Connection successful!');
    console.log(`   Connected to: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    
    // Test basic operation
    try {
      await mongoose.connection.db.admin().ping();
      console.log('✅ Database ping successful');
    } catch (pingError) {
      console.log('⚠️  Database ping failed:', pingError.message);
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.log('❌ Connection failed');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 18) {
      console.log('   Code 18: Authentication failed');
      console.log('   🔧 Fix: Check username/password in MongoDB Atlas');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   DNS lookup failed');
      console.log('   🔧 Fix: Check hostname and network connection');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   Connection timeout');
      console.log('   🔧 Fix: Check network and firewall settings');
    }
    
    console.log('\n📝 Full Error Details:');
    console.log(JSON.stringify(error, null, 2));
  }
}

// Run diagnostic
diagnoseConnection().catch(console.error);