const mongoose = require('mongoose');
const User = require('./models/User');
const Business = require('./models/Business');
require('dotenv').config();

const fixBrianAccount = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find brian's account
    const brian = await User.findOne({ email: 'brian@esystemsmanagement.com' });

    if (!brian) {
      console.log('❌ User brian@esystemsmanagement.com not found');
      process.exit(1);
    }

    console.log('Found brian:', {
      id: brian._id,
      email: brian.email,
      currentRole: brian.role,
      hasBusiness: !!brian.business,
      va: brian.va
    });

    // Update brian to have business role
    brian.role = 'business';
    brian.brand = 'esystems';

    // Check if brian already has a business profile
    let business = await Business.findOne({ user: brian._id });

    if (!business) {
      console.log('Creating business profile for brian...');
      business = await Business.create({
        user: brian._id,
        company: 'E-Systems Management',
        contactName: 'Brian',
        bio: 'E-Systems Management - Business solutions and services',
        email: 'brian@esystemsmanagement.com',
        phone: '555-0100',
        status: 'approved'
      });
      brian.business = business._id;
    } else {
      console.log('Business profile already exists:', business._id);
      brian.business = business._id;
    }

    await brian.save();

    console.log('✅ Successfully updated brian@esystemsmanagement.com:');
    console.log('  - Role set to: business');
    console.log('  - Business profile:', business._id);
    console.log('  - Brand set to: esystems');

    // Also update all other E-Systems users to have business role
    console.log('\n🔄 Updating all E-Systems users to business role...');

    const esystemsUsers = await User.find({
      email: { $regex: '@esystemsmanagement.com$', $options: 'i' }
    });

    console.log(`Found ${esystemsUsers.length} E-Systems users`);

    for (const user of esystemsUsers) {
      if (user.role !== 'business' && user.role !== 'admin') {
        user.role = 'business';
        user.brand = 'esystems';

        // Create business profile if doesn't exist
        let userBusiness = await Business.findOne({ user: user._id });
        if (!userBusiness) {
          userBusiness = await Business.create({
            user: user._id,
            company: `Business - ${user.email}`,
            contactName: user.email.split('@')[0],
            bio: 'E-Systems Management team member',
            email: user.email,
            phone: '555-0000',
            status: 'approved'
          });
          user.business = userBusiness._id;
        } else {
          user.business = userBusiness._id;
        }

        await user.save();
        console.log(`  ✅ Updated ${user.email} to business role`);
      }
    }

    console.log('\n✅ All E-Systems users have been updated to business role');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixBrianAccount();