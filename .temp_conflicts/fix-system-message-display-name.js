// One-off migration: ensure system messages show "E Systems Admin" and carry safe HTML
// Usage: node backend/scripts/fix-system-message-display-name.js
/* eslint-disable no-console */
const mongoose = require('mongoose')
require('dotenv').config()

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub'
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  console.log('Connected to MongoDB:', uri)

  const Message = require('../models/Message')

  // Target: isSystem true and disguisedAs admin, but missing/empty displayedSenderName
  const filter = {
    isSystem: true,
    disguisedAs: 'admin',
    $or: [
      { displayedSenderName: { $exists: false } },
      { displayedSenderName: null },
      { displayedSenderName: '' }
    ]
  }

  // Update: set the canonical display name; if bodyHtml missing, mirror body
  const update = [
    {
      $set: {
        displayedSenderName: 'E Systems Admin',
        messageType: 'system',
        bodyHtml: {
          $cond: [{ $ifNull: ['$bodyHtml', false] }, '$bodyHtml', '$body']
        }
      }
    }
  ]

  // MongoDB <4.2 fallback (no pipeline updates)
  const fallbackUpdate = {
    $set: {
      displayedSenderName: 'E Systems Admin',
      messageType: 'system'
    }
  }

  try {
    let res
    try {
      // Attempt aggregation pipeline updates (MongoDB 4.2+)
      res = await Message.updateMany(filter, update)
    } catch {
      // Fallback: standard update; then backfill bodyHtml in a second pass
      console.warn('Pipeline update not supported; applying fallback updates')
      res = await Message.updateMany(filter, fallbackUpdate)
      await Message.updateMany({ ...filter, $or: [{ bodyHtml: { $exists: false } }, { bodyHtml: null }, { bodyHtml: '' }] }, [
        { $set: { bodyHtml: '$body' } }
      ])
    }

    console.log(`Matched: ${res.matchedCount ?? res.n}, Modified: ${res.modifiedCount ?? res.nModified}`)

    // Verify a few docs
    const sample = await Message.find({ isSystem: true, disguisedAs: 'admin' }).limit(5).lean()
    console.log('Sample after update:', sample.map(m => ({
      id: m._id,
      displayedSenderName: m.displayedSenderName,
      hasHtml: !!m.bodyHtml,
      messageType: m.messageType
    })))
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    await mongoose.connection.close()
    process.exit(0)
  }
}

run()