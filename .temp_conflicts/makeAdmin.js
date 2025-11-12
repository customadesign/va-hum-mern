const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config({ path: '../.env' });

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function makeAdmin(email) {
  try {
    if (!email) {
      console.error('Please provide an email address');
      console.log('Usage: node makeAdmin.js <email>');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    user.admin = true;
    await user.save();

    console.log(`✅ Successfully made ${email} an admin`);
    console.log(`User can now access the admin panel at /admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
makeAdmin(email);