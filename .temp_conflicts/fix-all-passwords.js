const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fixAllPasswords() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // First, check all users without passwords
    const usersWithoutPasswords = await User.find({ 
      $or: [
        { password: null },
        { password: '' },
        { password: { $exists: false } }
      ]
    });

    console.log(`\nFound ${usersWithoutPasswords.length} users without passwords`);
    
    if (usersWithoutPasswords.length > 0) {
      console.log('\nUsers without passwords:');
      for (const user of usersWithoutPasswords) {
        console.log(`  - ${user.email} (${user.role || user.roleType})`);
      }
    }

    // Fix specific accounts with their required passwords
    const specificAccounts = [
      { email: 'pat@murphyconsulting.us', password: 'B5tccpbx!' },
      { email: 'pat@esystemsmanagement.com', password: 'admin123' },
      { email: 'admin@linkage.ph', password: 'admin123' }
    ];

    console.log('\n=== Updating Specific Account Passwords ===');
    
    for (const account of specificAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      const result = await User.findOneAndUpdate(
        { email: account.email },
        { 
          password: hashedPassword,
          // Ensure admin roles are set correctly
          ...(account.email === 'admin@linkage.ph' && { role: 'admin', roleType: 'admin' }),
          ...(account.email === 'pat@murphyconsulting.us' && { role: 'business', roleType: 'business' }),
          ...(account.email === 'pat@esystemsmanagement.com' && { role: 'business', roleType: 'business' })
        },
        { new: true }
      );

      if (result) {
        console.log(`✅ Updated: ${account.email} with password: ${account.password}`);
        console.log(`   Role: ${result.role || result.roleType}`);
      } else {
        console.log(`⚠️ User not found: ${account.email} - Creating...`);
        
        // Create the user if it doesn't exist
        const newUser = new User({
          email: account.email,
          password: hashedPassword,
          firstName: account.email.split('@')[0].split('.')[0],
          lastName: account.email.split('@')[0].split('.')[1] || 'User',
          role: account.email === 'admin@linkage.ph' ? 'admin' : 'business',
          roleType: account.email === 'admin@linkage.ph' ? 'admin' : 'business',
          isActive: true,
          emailVerified: true
        });
        
        await newUser.save();
        console.log(`✅ Created: ${account.email} with password: ${account.password}`);
      }
    }

    // Update all other users without passwords to have 'password123'
    const defaultPassword = await bcrypt.hash('password123', 10);
    const updateResult = await User.updateMany(
      {
        $or: [
          { password: null },
          { password: '' },
          { password: { $exists: false } }
        ],
        email: { $nin: specificAccounts.map(a => a.email) }
      },
      { password: defaultPassword }
    );

    if (updateResult.modifiedCount > 0) {
      console.log(`\n✅ Updated ${updateResult.modifiedCount} other users with default password: password123`);
    }

    // Verify the updates
    console.log('\n=== Verifying Login Credentials ===');
    
    for (const account of specificAccounts) {
      const user = await User.findOne({ email: account.email });
      if (user && user.password) {
        const passwordWorks = await bcrypt.compare(account.password, user.password);
        console.log(`${account.email}: ${passwordWorks ? '✅ Password verified' : '❌ Password verification failed'}`);
      }
    }

    console.log('\n📋 Final Login Credentials:');
    console.log('=====================================');
    console.log('Main App (http://localhost:3000/):');
    console.log('  Email: pat@murphyconsulting.us');
    console.log('  Password: B5tccpbx!');
    console.log('');
    console.log('E-Systems (http://localhost:3002/):');
    console.log('  Email: pat@esystemsmanagement.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Admin Panel (http://localhost:4000/login):');
    console.log('  Email: admin@linkage.ph');
    console.log('  Password: admin123');
    console.log('=====================================');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixAllPasswords();