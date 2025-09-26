const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function forceUpdatePasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('Generated password hash for "password123"');
    
    // Directly update in database to bypass any model validations
    const result = await mongoose.connection.db.collection('users').updateMany(
      {}, // Update all users
      { 
        $set: { 
          password: hashedPassword,
          provider: 'local',
          isEmailVerified: true
        } 
      }
    );
    
    console.log(`Updated ${result.modifiedCount} users directly in database`);
    
    // Verify the fix
    console.log('\nVerifying passwords...');
    const User = require('./models/User');
    
    const testEmails = [
      'maria.santos@example.com',
      'pat@murphyconsulting.us',
      'ana.reyes@example.com'
    ];
    
    for (const email of testEmails) {
      const user = await User.findOne({ email }).select('+password');
      if (user && user.password) {
        const isValid = await bcrypt.compare('password123', user.password);
        console.log(`${email}: Password valid = ${isValid}, Role: ${user.role}`);
      } else {
        console.log(`${email}: User not found or no password`);
      }
    }
    
    console.log('\n✅ Password update complete!');
    console.log('\nTest credentials:');
    console.log('VA User: maria.santos@example.com / password123');
    console.log('Business User: pat@murphyconsulting.us / password123');
    console.log('\nAll users now have password: password123');
    
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await mongoose.connection.close();
  }
}

forceUpdatePasswords();