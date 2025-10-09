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
    
    // Update all users without valid passwords
    const allUsers = await User.find({});
    const usersToFix = [];
    
    for (const user of allUsers) {
      if (!user.password || user.password === '') {
        usersToFix.push(user);
      }
    }
    
    const usersWithoutPasswords = usersToFix;
    
    console.log(`Found ${usersWithoutPasswords.length} users without passwords`);
    
    for (const user of usersWithoutPasswords) {
      user.password = hashedPassword;
      user.isEmailVerified = true; // Also ensure email is verified for testing
      await user.save();
      console.log(`✅ Updated password for: ${user.email} (${user.role})`);
    }
    
    // Verify the fix
    console.log('\nVerifying passwords...');
    const testEmails = [
      'maria.santos@example.com',
      'pat@murphyconsulting.us',
      'ana.reyes@example.com'
    ];
    
    for (const email of testEmails) {
      const user = await User.findOne({ email });
      if (user && user.password) {
        const isValid = await bcrypt.compare('password123', user.password);
        console.log(`${email}: Password valid = ${isValid}`);
      } else if (user) {
        console.log(`${email}: No password found`);
      }
    }
    
    console.log('\n✅ Password fix complete!');
    console.log('You can now login with any user email and password: "password123"');
    
  } catch (error) {
    console.error('Error fixing passwords:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixUserPasswords();