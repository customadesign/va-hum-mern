// ... existing code ...
/* eslint-disable no-console */
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const EMAIL = 'pat@murphyconsulting.us';
const PASSWORD = 'B5tccpbx';

async function run() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not set in environment');
      process.exit(1);
    }
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET not set; setting a temporary default for development');
      process.env.JWT_SECRET = 'dev-temp-secret-change-me';
    }

    console.log('[seedPatUser] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[seedPatUser] Connected');

    let user = await User.findOne({ email: EMAIL }).select('+password');
    if (!user) {
      console.log(`[seedPatUser] Creating user ${EMAIL}`);
      user = new User({
        email: EMAIL,
        password: PASSWORD, // hashed by pre-save hook
        provider: 'local',
        isVerified: true,
        confirmedAt: new Date(),
        admin: false
      });
      await user.save();
      console.log('[seedPatUser] User created');
    } else {
      console.log('[seedPatUser] User exists; updating password to ensure known test credential');
      user.password = PASSWORD; // will be re-hashed by pre-save hook
      await user.save();
      console.log('[seedPatUser] Password updated');
    }

    // Verify password matches
    const verifyUser = await User.findOne({ email: EMAIL }).select('+password');
    const ok = await verifyUser.matchPassword(PASSWORD);
    console.log(`[seedPatUser] Password verification: ${ok ? 'OK' : 'FAILED'}`);

    console.log('[seedPatUser] Done');
    process.exit(ok ? 0 : 2);
  } catch (err) {
    console.error('[seedPatUser] Error:', err);
    process.exit(1);
  }
}

run();
// ... existing code ...