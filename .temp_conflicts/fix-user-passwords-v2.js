const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fixUserPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('Generated password hash for "password123"');
    
    // Get all users WITH password field (normally excluded)
    const allUsers = await User.find({}).select('+password');
    console.log(`Total users found: ${allUsers.length}`);
    
    let updatedCount = 0;
    
    for (const user of allUsers) {
      if (!user.password || user.password === '') {
        // Set provider to 'local' if not set
        if (!user.provider) {
          user.provider = 'local';
        }
        
        // Set the password directly
        user.password = hashedPassword;
        user.isEmailVerified = true;
        
        // Save without triggering password hashing middleware
        await user.save({ validateBeforeSave: false });
        
        updatedCount++;
        console.log(`✅ Updated: ${user.email} (${user.role || 'no role'})`);
      }
    }
    
    console.log(`\nUpdated ${updatedCount} users`);
    
    // Verify the fix
    console.log('\nVerifying passwords...');
    const testEmails = [
      'maria.santos@example.com',
      'pat@murphyconsulting.us',
      'ana.reyes@example.com'
    ];
    
    for (const email of testEmails) {
      const user = await User.findOne({ email }).select('+password');
      if (user && user.password) {
        const isValid = await bcrypt.compare('password123', user.password);
        console.log(`${email}: Password valid = ${isValid}`);
      } else if (user) {
        console.log(`${email}: No password found`);
      } else {
        console.log(`${email}: User not found`);
      }
    }
    
    console.log('\n✅ Password fix complete!');
    console.log('You can now login with any user email and password: "password123"');
    
    // Test actual login
    console.log('\nTesting login...');
    const testUser = await User.findOne({ email: 'maria.santos@example.com' }).select('+password');
    if (testUser) {
      const methods = testUser.schema.methods;
      if (methods && methods.matchPassword) {
        const matches = await testUser.matchPassword('password123');
        console.log('Login test with matchPassword method:', matches);
      } else {
        const matches = await bcrypt.compare('password123', testUser.password);
        console.log('Login test with direct bcrypt:', matches);
      }
    }
    
  } catch (error) {
    console.error('Error fixing passwords:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixUserPasswords();