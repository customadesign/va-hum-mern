const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function updateSpecificPasswords() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Define the specific password updates
    const passwordUpdates = [
      { email: 'pat@murphyconsulting.us', password: 'B5tccpbx!' },
      { email: 'pat@esystemsmanagement.com', password: 'admin123' },
      { email: 'admin@linkage.ph', password: 'admin123' }
    ];

    // Update each user
    for (const update of passwordUpdates) {
      const hashedPassword = await bcrypt.hash(update.password, 10);
      
      const result = await User.findOneAndUpdate(
        { email: update.email },
        { password: hashedPassword },
        { new: true }
      );

      if (result) {
        console.log(`✅ Updated password for ${update.email}`);
      } else {
        console.log(`⚠️ User not found: ${update.email}`);
        
        // If admin@linkage.ph doesn't exist, create it
        if (update.email === 'admin@linkage.ph') {
          const newAdmin = new User({
            email: 'admin@linkage.ph',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            roleType: 'admin',
            isActive: true,
            emailVerified: true
          });
          await newAdmin.save();
          console.log(`✅ Created admin user: ${update.email}`);
        }
      }
    }

    console.log('\n✅ All password updates complete!');
    console.log('\n📝 Login credentials:');
    console.log('  Main app (http://localhost:3000/): pat@murphyconsulting.us / B5tccpbx!');
    console.log('  E-Systems (http://localhost:3002/): pat@esystemsmanagement.com / admin123');
    console.log('  Admin panel (http://localhost:4000/login): admin@linkage.ph / admin123');
    
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

updateSpecificPasswords();