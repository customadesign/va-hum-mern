const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = 'mongodb+srv://marketing:TaNN6bttM920rEjL@linkagevahub.0g6dji.mongodb.net/linkagevahub';
console.log('Connecting to MongoDB...');
mongoose.connect(mongoUri);

const User = require('./backend/models/User');

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking for admin users...');
    
    // Find all admin users
    const adminUsers = await User.find({ admin: true }).select('email admin createdAt');
    
    console.log(`Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach(user => {
      console.log(`- Email: ${user.email}, Admin: ${user.admin}, Created: ${user.createdAt}`);
    });
    
    // Check if our specific users exist
    const emails = ['admin@linkageva.com', 'pat@linkage.ph', 'pat@esystemsmanagement.com'];
    
    for (const email of emails) {
      const user = await User.findOne({ email }).select('email admin password');
      if (user) {
        console.log(`\n✅ User ${email} exists:`);
        console.log(`- Admin: ${user.admin}`);
        console.log(`- Has password: ${!!user.password}`);
      } else {
        console.log(`\n❌ User ${email} does not exist`);
      }
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkAdminUsers();
