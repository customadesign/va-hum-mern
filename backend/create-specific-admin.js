const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://marketing:TaNN6bttM920rEjL@cadtools.dvvdsg1.mongodb.net/linkage-va-hub?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');

async function createSpecificAdmin() {
  try {
    console.log('🔍 Creating admin user: pat@linkage.ph...');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'pat@linkage.ph' });
    
    if (existingUser) {
      console.log('✅ User already exists, updating to admin...');
      existingUser.admin = true;
      await existingUser.save();
      console.log('✅ User pat@linkage.ph is now an admin!');
    } else {
      console.log('🆕 Creating new admin user...');
      
      // Create new admin user
      const newAdmin = await User.create({
        email: 'pat@linkage.ph',
        password: 'admin123', // This will be hashed automatically by the pre-save middleware
        admin: true,
        isVerified: true,
        confirmedAt: new Date()
      });
      
      console.log('✅ Admin user created successfully!');
      console.log(`- Email: ${newAdmin.email}`);
      console.log(`- Admin: ${newAdmin.admin}`);
      console.log(`- ID: ${newAdmin._id}`);
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

createSpecificAdmin();
