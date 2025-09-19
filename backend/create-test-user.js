require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'pat@murphyconsulting.us' });
    
    if (existingUser) {
      console.log('User already exists. Updating password...');
      
      // Update the password
      const hashedPassword = await bcrypt.hash('B5tccpbx', 10);
      existingUser.password = hashedPassword;
      existingUser.isEmailVerified = true; // Ensure email is verified
      existingUser.role = 'business'; // Set as business user
      existingUser.admin = true; // Set admin flag to true
      await existingUser.save();
      
      console.log('✅ User password updated successfully!');
      console.log('Email:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('Admin:', existingUser.admin);
      console.log('Email Verified:', existingUser.isEmailVerified);
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash('B5tccpbx', 10);
      
      const newUser = new User({
        email: 'pat@murphyconsulting.us',
        password: hashedPassword,
        firstName: 'Pat',
        lastName: 'Murphy',
        role: 'business',
        admin: true,
        isEmailVerified: true,
        accountType: 'business',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newUser.save();
      
      console.log('✅ New test user created successfully!');
      console.log('Email: pat@murphyconsulting.us');
      console.log('Password: B5tccpbx');
      console.log('Role: business');
      console.log('Admin: true');
      console.log('Account Type: business');
      console.log('User ID:', newUser._id);
    }
    
    console.log('\n📝 Login credentials:');
    console.log('Email: pat@murphyconsulting.us');
    console.log('Password: B5tccpbx');
    console.log('\n🔗 Login at: http://localhost:3000/login');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
createTestUser();