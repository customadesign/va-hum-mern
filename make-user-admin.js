const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://marketing:TaNN6bttM920rEjL@linkagevahub.0g6dji.mongodb.net/linkagevahub';
console.log('Connecting to MongoDB...');

mongoose.connect(mongoUri).then(async () => {
  console.log('Connected to MongoDB');
  
  const User = require('./backend/models/User');
  
  try {
    // Update pat@esystemsmanagement.com to be admin
    const user = await User.findOne({ email: 'pat@esystemsmanagement.com' });
    
    if (user) {
      user.admin = true;
      await user.save();
      console.log('✅ User pat@esystemsmanagement.com is now an admin');
      console.log('You can now login with:');
      console.log('Email: pat@esystemsmanagement.com');
      console.log('Password: B5tccpbx');
    } else {
      console.log('❌ User pat@esystemsmanagement.com not found');
      
      // Create a new admin user
      console.log('Creating new admin user...');
      const newUser = await User.create({
        email: 'admin@linkageva.com',
        password: 'admin123',
        admin: true
      });
      console.log('✅ Created new admin user:');
      console.log('Email: admin@linkageva.com');
      console.log('Password: admin123');
    }
    
    // List all admin users
    console.log('\n📋 All admin users:');
    const adminUsers = await User.find({ admin: true }).select('email createdAt');
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (created: ${user.createdAt})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});