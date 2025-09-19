const User = require('../models/User');

async function ensureAdminUser() {
  try {
    const adminEmail = 'admin@linkage.ph';
    const adminPassword = 'admin123';
    
    // Check if admin exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      console.log('Creating default admin user...');
      
      // Create admin user
      adminUser = new User({
        email: adminEmail,
        password: adminPassword, // Will be hashed by pre-save hook
        admin: true,
        emailVerified: true,
        suspended: false,
        profile: {
          name: 'System Administrator',
          company: 'Linkage VA Hub'
        }
      });
      
      await adminUser.save();
      console.log('✅ Default admin user created:', adminEmail);
    } else {
      // Ensure admin flag is set
      if (!adminUser.admin) {
        adminUser.admin = true;
        await adminUser.save();
        console.log('✅ Updated user to admin:', adminEmail);
      }
    }
    
    return adminUser;
  } catch (error) {
    console.error('Error ensuring admin user:', error);
    // Don't crash the server if admin creation fails
    return null;
  }
}

module.exports = ensureAdminUser;