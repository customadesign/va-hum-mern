const mongoose = require('mongoose');
const User = require('./models/User');
const Business = require('./models/Business');
require('dotenv').config();

const debugBrianAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check the database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}`);

    // Find Brian's account - try both exact and lowercase
    console.log('\n🔍 Searching for Brian\'s account...');
    let brian = await User.findOne({ email: 'brian@esystemsmanagement.com' });

    if (!brian) {
      console.log('Trying lowercase search...');
      brian = await User.findOne({ email: { $regex: /^brian@esystemsmanagement\.com$/i } });
    }

    if (!brian) {
      console.log('❌ User not found with email brian@esystemsmanagement.com');

      // List all users with esystems domain
      const esystemsUsers = await User.find({
        email: { $regex: /@esystemsmanagement\.com$/i }
      }, 'email role emailVerified business');

      console.log('\n📋 All E-Systems users:');
      esystemsUsers.forEach(u => {
        console.log(`  - ${u.email}: role=${u.role}, emailVerified=${u.emailVerified}, business=${u.business}`);
      });

      process.exit(1);
    }

    console.log('\n✅ Found Brian\'s account:');
    console.log({
      _id: brian._id,
      email: brian.email,
      role: brian.role,
      emailVerified: brian.emailVerified,
      business: brian.business,
      va: brian.va,
      admin: brian.admin,
      brand: brian.brand,
      createdAt: brian.createdAt,
      isProfileComplete: brian.isProfileComplete
    });

    // Check if business profile exists
    if (brian.business) {
      const businessProfile = await Business.findById(brian.business);
      console.log('\n🏢 Business Profile:');
      console.log({
        _id: businessProfile._id,
        company: businessProfile.company,
        contactName: businessProfile.contactName,
        status: businessProfile.status,
        email: businessProfile.email
      });
    } else {
      console.log('\n⚠️  No business profile linked');
    }

    // Check what the backend savedVA controller expects
    console.log('\n🔐 Authorization Check Simulation:');
    console.log(`  - Has user object: ${!!brian}`);
    console.log(`  - user.business: ${brian.business}`);
    console.log(`  - user.role === 'business': ${brian.role === 'business'}`);
    console.log(`  - user.emailVerified: ${brian.emailVerified}`);
    console.log(`  - user.email includes @esystemsmanagement.com: ${brian.email.includes('@esystemsmanagement.com')}`);

    // Check if user passes the canSaveVAs check
    const isBusinessUser = brian && (
      brian.role === 'business' ||
      brian.business ||
      (brian.email && brian.email.includes('@esystemsmanagement.com'))
    );
    console.log(`  - Would pass frontend canSaveVAs check: ${isBusinessUser}`);

    // Check backend requirements
    const passesBackendCheck = brian.role === 'business' || brian.business;
    console.log(`  - Would pass backend business check: ${passesBackendCheck}`);

    if (!brian.emailVerified) {
      console.log('\n⚠️  WARNING: Email not verified! This may block features.');
    }

    if (!passesBackendCheck) {
      console.log('\n❌ ISSUE FOUND: User does not meet backend business requirements');
      console.log('   Need to ensure: role="business" OR business field is set');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

debugBrianAccount();