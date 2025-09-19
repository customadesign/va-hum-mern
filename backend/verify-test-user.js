require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function verifyTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find the user and explicitly select the password field
    const user = await User.findOne({ email: 'pat@murphyconsulting.us' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found with email: pat@murphyconsulting.us');
      return;
    }
    
    console.log('✅ User found!');
    console.log('User ID:', user._id);
    console.log('Email:', user.email);
    console.log('First Name:', user.firstName);
    console.log('Last Name:', user.lastName);
    console.log('Role:', user.role);
    console.log('Admin:', user.admin);
    console.log('Email Verified:', user.isEmailVerified);
    console.log('Has Password:', !!user.password);
    console.log('Password Length:', user.password ? user.password.length : 0);
    
    // Test the password
    if (user.password) {
      const testPassword = 'B5tccpbx';
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log('\nPassword Test:');
      console.log('Testing password:', testPassword);
      console.log('Password matches:', isMatch);
      
      if (!isMatch) {
        console.log('\n⚠️  Password does not match! Let\'s reset it...');
        
        // Reset the password
        const newHashedPassword = await bcrypt.hash('B5tccpbx', 10);
        user.password = newHashedPassword;
        user.isEmailVerified = true;
        await user.save();
        
        // Verify again
        const updatedUser = await User.findOne({ email: 'pat@murphyconsulting.us' }).select('+password');
        const verifyMatch = await bcrypt.compare('B5tccpbx', updatedUser.password);
        console.log('✅ Password has been reset');
        console.log('New password verification:', verifyMatch);
      }
    } else {
      console.log('\n⚠️  User has no password set! Setting password now...');
      const hashedPassword = await bcrypt.hash('B5tccpbx', 10);
      user.password = hashedPassword;
      user.isEmailVerified = true;
      await user.save();
      console.log('✅ Password has been set');
    }
    
    console.log('\n📝 Final Login Credentials:');
    console.log('Email: pat@murphyconsulting.us');
    console.log('Password: B5tccpbx');
    console.log('Login URL: http://localhost:3000/login');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
verifyTestUser();