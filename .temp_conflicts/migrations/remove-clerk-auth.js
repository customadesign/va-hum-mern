/**
 * Migration: Remove deprecated Clerk authentication fields
 * Usage:
 *   NODE_ENV=production MONGODB_URI="mongodb+srv://..." \
 *     node backend/scripts/migrations/remove-clerk-auth.js
 */

const mongoose = require('mongoose');

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/linkagevahub';

  try {
    console.log('[migration] Connecting to MongoDB:', (uri || '').replace(/\/\/.*@/, '//****:****@'));

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000
    });

    const Users = mongoose.connection.collection('users');

    console.log('[migration] Normalizing users with provider="clerk"...');
    const providerResult = await Users.updateMany(
      { provider: 'clerk' },
      {
        $set: { provider: 'local' },
        $unset: { clerkUserId: '' }
      }
    );
    console.log('[migration] Users updated:', providerResult?.modifiedCount || 0);

    console.log('[migration] Removing stray clerkUserId fields...');
    const clerkIdResult = await Users.updateMany(
      { clerkUserId: { $exists: true } },
      { $unset: { clerkUserId: '' } }
    );
    console.log('[migration] Users cleaned:', clerkIdResult?.modifiedCount || 0);

    console.log('[migration] Completed successfully.');
  } catch (error) {
    console.error('[migration] Fatal error:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.error('[migration] Disconnect error:', e.message);
    }
    process.exit();
  }
}

main();
