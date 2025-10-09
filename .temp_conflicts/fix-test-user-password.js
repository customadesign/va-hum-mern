require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function fixTestUserPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'pat@murphyconsulting.us' });
    
    if (!user) {
      console.log('❌ User not found with email: pat@murphyconsulting.us');
      return;
    }
    
    console.log('✅ User found!');
    console.log('User ID:', user._id);
    console.log('Email:', user.email);
    
    // Hash the password manually and update directly in database
    const hashedPassword = await bcrypt.hash('B5tccpbx', 10);
    
    // Update directly in database to avoid pre-save hooks
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          isVerified: true,
          confirmedAt: new Date()
        }
      }
    );
    
    console.log('✅ Password updated directly in database');
    
    // Verify the password works
    const updatedUser = await User.findOne({ email: 'pat@murphyconsulting.us' }).select('+password');
    const isMatch = await bcrypt.compare('B5tccpbx', updatedUser.password);
    
    console.log('\nPassword Verification:');
    console.log('Password matches:', isMatch);
    console.log('Email verified:', updatedUser.isVerified);
    console.log('Confirmed at:', updatedUser.confirmedAt);
    
    if (isMatch) {
      console.log('\n🎉 SUCCESS! Login credentials are working:');
      console.log('Email: pat@murphyconsulting.us');
      console.log('Password: B5tccpbx');
      console.log('Login URL: http://localhost:3000/login');
    } else {
      console.log('\n❌ Password verification still failed');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
fixTestUserPassword();