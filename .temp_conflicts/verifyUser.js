#!/usr/bin/env node
/* 
  Usage:
    node scripts/verifyUser.js user@example.com

  This will set emailVerified=true for the user with the given email in the current backend database.
*/

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Try to load env from common locations
// 1) backend/.env.local
try { dotenv.config({ path: path.resolve(__dirname, '../.env.local') }); } catch (_) {}
// 2) backend/.env
try { dotenv.config({ path: path.resolve(__dirname, '../.env') }); } catch (_) {}
// 3) project root .env.local
try { dotenv.config({ path: path.resolve(__dirname, '../../.env.local') }); } catch (_) {}
// 4) default .env resolution
try { dotenv.config(); } catch (_) {}

const connectDB = require('../config/database');
const User = require('../models/User');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Error: email address is required\nUsage: node scripts/verifyUser.js user@example.com');
    process.exit(2);
  }

  if (!process.env.MONGODB_URI) {
    console.warn('Warning: MONGODB_URI is not set in environment variables. The DB connection may fail.');
  }

  try {
    await connectDB();

    const updated = await User.findOneAndUpdate(
      { email },
      { $set: { emailVerified: true } },
      { new: true }
    );

    if (!updated) {
      console.error(`User not found for email: ${email}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`Success: Marked ${email} as emailVerified=true`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Verification script error:', err?.message || err);
    try { await mongoose.connection.close(); } catch (_) {}
    process.exit(1);
  }
}

main();