require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check if admin user already exists
    const existingUser = await usersCollection.findOne({ email: 'admin@linkage.ph' });
    
    if (existingUser) {
      console.log('✅ Admin user exists. Updating password and settings...');
      
      // Generate new hashed password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Test the hash
      const testMatch = await bcrypt.compare('admin123', hashedPassword);
      console.log('Password hash test:', testMatch);
      
      // Update the user
      const updateResult = await usersCollection.updateOne(
        { email: 'admin@linkage.ph' },
        { 
          $set: { 
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'business',
            admin: true,
            isEmailVerified: true,
            accountType: 'business',
            updatedAt: new Date()
          }
        }
      );
      
      console.log('Update result:', updateResult.modifiedCount, 'document(s) modified');
      
    } else {
      console.log('Creating new admin user...');
      
      // Generate hashed password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Test the hash
      const testMatch = await bcrypt.compare('admin123', hashedPassword);
      console.log('Password hash test:', testMatch);
      
      // Create new admin user
      const newAdmin = {
        email: 'admin@linkage.ph',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'business',
        admin: true,
        isEmailVerified: true,
        accountType: 'business',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          notifications: {
            email: {
              enabled: true,
              messages: true,
              updates: true,
              marketing: false
            }
          }
        }
      };
      
      const result = await usersCollection.insertOne(newAdmin);
      console.log('✅ New admin user created with ID:', result.insertedId);
    }
    
    // Verify the final user
    const finalUser = await usersCollection.findOne({ email: 'admin@linkage.ph' });
    const finalVerification = await bcrypt.compare('admin123', finalUser.password);
    
    console.log('\n✅ Admin User Ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Dashboard URL: http://localhost:4000/login');
    console.log('Email: admin@linkage.ph');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User Details:');
    console.log('- Role:', finalUser.role);
    console.log('- Admin:', finalUser.admin);
    console.log('- Email Verified:', finalUser.isEmailVerified);
    console.log('- Password Verification:', finalVerification);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
createAdminUser();