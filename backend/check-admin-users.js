const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://marketing:TaNN6bttM920rEjL@cadtools.dvvdsg1.mongodb.net/linkage-va-hub?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking for admin users...');
    
    // Find all admin users
    const adminUsers = await User.find({ admin: true }).select('email admin createdAt');
    
    console.log(`Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach(user => {
      console.log(`- Email: ${user.email}, Admin: ${user.admin}, Created: ${user.createdAt}`);
    });
    
    // Check if our specific user exists
    const specificUser = await User.findOne({ email: 'pat@linkage.ph' }).select('email admin password');
    
    if (specificUser) {
      console.log('\n✅ User pat@linkage.ph exists:');
      console.log(`- Admin: ${specificUser.admin}`);
      console.log(`- Has password: ${!!specificUser.password}`);
    } else {
      console.log('\n❌ User pat@linkage.ph does not exist');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkAdminUsers();
