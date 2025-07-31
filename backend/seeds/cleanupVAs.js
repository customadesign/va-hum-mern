const mongoose = require('mongoose');
const User = require('../models/User');
const VA = require('../models/VA');
const Location = require('../models/Location');
const RoleType = require('../models/RoleType');
const RoleLevel = require('../models/RoleLevel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// List of test email domains to clean up
const testEmails = [
  'maria.santos@example.com',
  'ana.reyes@example.com',
  'jose.cruz@example.com',
  'kristine.delacruz@example.com',
  'juan.garcia@example.com',
  'carmela.mendoza@example.com',
  'rafael.ramos@example.com',
  'sophia.villanueva@example.com',
  'marco.fernandez@example.com',
  'patricia.lim@example.com',
  'carlos.castillo@example.com',
  'rachel.gonzales@example.com',
  'antonio.bautista@example.com',
  'isabella.torres@example.com',
  'francis.aquino@example.com',
  'gabriela.pascual@example.com',
  'kenneth.salvador@example.com',
  'angelica.domingo@example.com',
  'daniel.ocampo@example.com',
  'grace.mercado@example.com',
  'alexander.rivera@example.com',
  'natalie.flores@example.com',
  'ryan.dizon@example.com',
  'michelle.panganiban@example.com',
  'hannah.soriano@example.com',
  // Old names to clean up
  'sarah.johnson@example.com',
  'david.chen@example.com',
  'jennifer.lopez@example.com',
  'michael.rodriguez@example.com',
  'lisa.wang@example.com',
  'robert.anderson@example.com',
  'emily.davis@example.com',
  'james.wilson@example.com',
  'amanda.thompson@example.com',
  'carlos.mendoza@example.com',
  'rachel.green@example.com',
  'antonio.silva@example.com',
  'sophie.turner@example.com',
  'thomas.kim@example.com',
  'isabella.martinez@example.com',
  'kevin.brown@example.com',
  'olivia.johnson@example.com',
  'daniel.lee@example.com',
  'grace.taylor@example.com',
  'alex.rivera@example.com',
  'natalie.foster@example.com',
  'ryan.cooper@example.com',
  'maya.patel@example.com',
  'harper.wilson@example.com'
];

async function cleanupVAs() {
  try {
    console.log('🧹 Starting VA cleanup process...');
    
    // Find all test users
    const testUsers = await User.find({ 
      email: { $in: testEmails }
    });
    
    if (testUsers.length === 0) {
      console.log('✨ No test VAs found to clean up');
      return;
    }
    
    console.log(`Found ${testUsers.length} test users to clean up`);
    
    const userIds = testUsers.map(u => u._id);
    
    // Find all VAs for these users
    const testVAs = await VA.find({ user: { $in: userIds } });
    const vaIds = testVAs.map(v => v._id);
    
    console.log(`Found ${testVAs.length} VA profiles to clean up`);
    
    // Delete related records
    console.log('Deleting role types...');
    await RoleType.deleteMany({ va: { $in: vaIds } });
    
    console.log('Deleting role levels...');
    await RoleLevel.deleteMany({ va: { $in: vaIds } });
    
    console.log('Deleting VA profiles...');
    await VA.deleteMany({ _id: { $in: vaIds } });
    
    console.log('Deleting users...');
    await User.deleteMany({ _id: { $in: userIds } });
    
    // Clean up orphaned locations (optional)
    console.log('Cleaning up orphaned locations...');
    const allVAs = await VA.find({});
    const usedLocationIds = allVAs.map(v => v.location).filter(Boolean);
    await Location.deleteMany({ _id: { $nin: usedLocationIds } });
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log(`Removed ${testUsers.length} test users and their associated data`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the cleanup function
cleanupVAs();