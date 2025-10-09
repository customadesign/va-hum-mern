const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function testLoginDebug() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Test accounts
    const testAccounts = [
      { email: 'pat@murphyconsulting.us', expectedPassword: 'B5tccpbx!' },
      { email: 'pat@esystemsmanagement.com', expectedPassword: 'admin123' },
      { email: 'admin@linkage.ph', expectedPassword: 'admin123' }
    ];

    console.log('\n=== Testing Login Credentials ===\n');

    for (const account of testAccounts) {
      const user = await User.findOne({ email: account.email });
      
      if (!user) {
        console.log(`❌ User not found: ${account.email}`);
        continue;
      }

      console.log(`\n📧 Testing: ${account.email}`);
      console.log(`  User found: ✅`);
      console.log(`  Has password: ${user.password ? '✅' : '❌'}`);
      console.log(`  Role: ${user.role || user.roleType}`);
      console.log(`  Admin: ${user.role === 'admin' || user.roleType === 'admin' ? '✅' : '❌'}`);
      
      // Test password
      const passwordMatch = await bcrypt.compare(account.expectedPassword, user.password);
      console.log(`  Password '${account.expectedPassword}' works: ${passwordMatch ? '✅' : '❌'}`);
      
      // If password doesn't match, update it
      if (!passwordMatch) {
        console.log(`  🔧 Updating password to: ${account.expectedPassword}`);
        user.password = await bcrypt.hash(account.expectedPassword, 10);
        await user.save();
        
        // Verify the update
        const updatedUser = await User.findOne({ email: account.email });
        const nowWorks = await bcrypt.compare(account.expectedPassword, updatedUser.password);
        console.log(`  Password now works: ${nowWorks ? '✅' : '❌'}`);
      }
    }

    console.log('\n=== Testing API Login Endpoints ===\n');
    
    // Test actual login endpoint
    const axios = require('axios');
    
    for (const account of testAccounts) {
      try {
        console.log(`\nTesting login API for ${account.email}:`);
        const response = await axios.post('http://localhost:8000/api/auth/login', {
          email: account.email,
          password: account.expectedPassword
        });
        
        if (response.data.token) {
          console.log(`  ✅ Login successful! Token received`);
          console.log(`  User role: ${response.data.user.role || response.data.user.roleType}`);
        }
      } catch (error) {
        console.log(`  ❌ Login failed: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n=== Login URLs ===');
    console.log('  Main app: http://localhost:3000/');
    console.log('    Email: pat@murphyconsulting.us');
    console.log('    Password: B5tccpbx!');
    console.log('');
    console.log('  E-Systems: http://localhost:3002/');
    console.log('    Email: pat@esystemsmanagement.com');
    console.log('    Password: admin123');
    console.log('');
    console.log('  Admin Panel: http://localhost:4000/login');
    console.log('    Email: admin@linkage.ph');
    console.log('    Password: admin123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testLoginDebug();