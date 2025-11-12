/**
 * Backfill Script for Tasks 45/46
 * Populates senderType and senderId fields for historical messages
 *
 * Usage:
 *   node backend/scripts/backfillMessageSenderFields.js [--dry-run]
 *
 * Options:
 *   --dry-run: Preview changes without persisting
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const BATCH_SIZE = 1000;
const isDryRun = process.argv.includes('--dry-run');

async function backfillMessages() {
  try {
    console.log('=== Message Sender Fields Backfill (Tasks 45/46) ===\n');
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be persisted)' : 'LIVE (changes will be persisted)'}\n`);

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find messages that need backfill
    const query = {
      $or: [
        { senderType: null },
        { senderType: { $exists: false } },
        { senderId: null },
        { senderId: { $exists: false } }
      ]
    };

    const totalMessages = await Message.countDocuments(query);
    console.log(`📊 Found ${totalMessages} messages needing backfill\n`);

    if (totalMessages === 0) {
      console.log('✅ No messages need backfill. All done!');
      await mongoose.connection.close();
      process.exit(0);
    }

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let anomalyCount = 0;
    const anomalies = [];

    // Process in batches
    console.log(`Processing in batches of ${BATCH_SIZE}...\n`);

    let hasMore = true;
    while (hasMore) {
      // Fetch batch
      const messages = await Message.find(query)
        .limit(BATCH_SIZE)
        .lean()
        .exec();

      if (messages.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Processing batch: ${processedCount + 1} to ${processedCount + messages.length}`);

      const bulkOps = [];

      for (const message of messages) {
        processedCount++;

        try {
          // Load conversation to get businessId and vaId
          const conversation = await Conversation.findById(message.conversation)
            .select('business va')
            .lean();

          if (!conversation) {
            anomalyCount++;
            anomalies.push({
              messageId: message._id,
              reason: 'Conversation not found',
              conversationId: message.conversation
            });
            skippedCount++;
            continue;
          }

          // Determine sender type and ID based on existing senderModel
          let senderType = null;
          let senderId = null;

          if (message.senderModel === 'VA') {
            senderType = 'va';
            senderId = conversation.va;
          } else if (message.senderModel === 'Business') {
            senderType = 'business';
            senderId = conversation.business;
          } else if (message.senderModel === 'User') {
            // For 'User' senderModel, we need to determine if it's a VA or Business
            // Check if sender matches conversation.va or conversation.business
            const senderStr = message.sender?.toString();
            const vaStr = conversation.va?.toString();
            const businessStr = conversation.business?.toString();

            if (senderStr === vaStr) {
              senderType = 'va';
              senderId = conversation.va;
            } else if (senderStr === businessStr) {
              senderType = 'business';
              senderId = conversation.business;
            } else {
              // Could be admin or unknown
              anomalyCount++;
              anomalies.push({
                messageId: message._id,
                reason: 'Cannot determine sender type for User model',
                sender: message.sender,
                senderModel: message.senderModel,
                conversationVa: conversation.va,
                conversationBusiness: conversation.business
              });
              skippedCount++;
              continue;
            }
          } else {
            anomalyCount++;
            anomalies.push({
              messageId: message._id,
              reason: 'Unknown senderModel',
              senderModel: message.senderModel
            });
            skippedCount++;
            continue;
          }

          // Validate we have both fields
          if (!senderType || !senderId) {
            anomalyCount++;
            anomalies.push({
              messageId: message._id,
              reason: 'Missing senderType or senderId after processing',
              senderType,
              senderId
            });
            skippedCount++;
            continue;
          }

          // Add to bulk operations
          bulkOps.push({
            updateOne: {
              filter: { _id: message._id },
              update: {
                $set: {
                  senderType,
                  senderId
                }
              }
            }
          });

          updatedCount++;

        } catch (error) {
          anomalyCount++;
          anomalies.push({
            messageId: message._id,
            reason: 'Error processing message',
            error: error.message
          });
          skippedCount++;
        }
      }

      // Execute bulk operations
      if (bulkOps.length > 0 && !isDryRun) {
        try {
          const result = await Message.bulkWrite(bulkOps, { ordered: false });
          console.log(`  ✅ Updated ${result.modifiedCount} messages`);
        } catch (error) {
          console.error(`  ❌ Bulk write error:`, error.message);
        }
      } else if (isDryRun && bulkOps.length > 0) {
        console.log(`  [DRY RUN] Would update ${bulkOps.length} messages`);
      }

      // Progress update
      const progress = ((processedCount / totalMessages) * 100).toFixed(1);
      console.log(`  Progress: ${progress}% (${processedCount}/${totalMessages})\n`);
    }

    // Summary
    console.log('\n=== Backfill Summary ===');
    console.log(`Total processed: ${processedCount}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Anomalies: ${anomalyCount}\n`);

    if (isDryRun) {
      console.log('⚠️  DRY RUN: No changes were persisted to the database');
      console.log('   Run without --dry-run to apply changes\n');
    } else {
      console.log('✅ Backfill complete! Changes have been persisted.\n');
    }

    // Show anomalies if any
    if (anomalies.length > 0) {
      console.log('\n⚠️  Anomalies detected:');
      console.log(`Showing first ${Math.min(10, anomalies.length)} of ${anomalies.length} anomalies:\n`);

      anomalies.slice(0, 10).forEach((anomaly, index) => {
        console.log(`${index + 1}. Message ID: ${anomaly.messageId}`);
        console.log(`   Reason: ${anomaly.reason}`);
        if (anomaly.error) console.log(`   Error: ${anomaly.error}`);
        if (anomaly.senderModel) console.log(`   SenderModel: ${anomaly.senderModel}`);
        console.log('');
      });

      if (anomalies.length > 10) {
        console.log(`... and ${anomalies.length - 10} more anomalies\n`);
      }
    }

    // Verification
    if (!isDryRun) {
      console.log('\n=== Verification ===');
      const remainingCount = await Message.countDocuments(query);
      console.log(`Messages still needing backfill: ${remainingCount}`);

      if (remainingCount === 0) {
        console.log('✅ All messages have been backfilled successfully!');
      } else if (remainingCount === anomalyCount) {
        console.log('⚠️  Remaining messages are anomalies that could not be automatically backfilled');
      } else {
        console.log('⚠️  Some messages may need additional backfill runs');
      }
    }

    console.log('\n✅ Script complete\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Backfill error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run backfill
backfillMessages();