/**
 * Database Validation Script for Tasks 45/46
 * Validates MongoDB structure, collections, and indexes required for messenger identity enrichment
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Business = require('../models/Business');
const VA = require('../models/VA');

async function validateDatabase() {
  try {
    console.log('=== Database Validation for Messenger Identity Enrichment ===\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('📊 MongoDB Connection:');
    console.log(`   URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

    // Extract database name from URI
    const dbNameMatch = mongoUri.match(/\/([^/?]+)(\?|$)/);
    const dbName = dbNameMatch ? dbNameMatch[1] : 'unknown';
    console.log(`   Database: ${dbName}\n`);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check collections exist
    console.log('📦 Collections Check:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const requiredCollections = ['messages', 'conversations', 'businesses', 'vas', 'users'];
    for (const col of requiredCollections) {
      const exists = collectionNames.includes(col);
      console.log(`   ${exists ? '✅' : '❌'} ${col}`);
    }
    console.log();

    // Check Message indexes
    console.log('🔍 Message Collection Indexes:');
    const messageIndexes = await Message.collection.getIndexes();
    console.log(`   Total indexes: ${Object.keys(messageIndexes).length}`);

    const requiredMessageIndexes = [
      'conversation_1_createdAt_-1',
      'senderType_1_senderId_1_createdAt_-1'
    ];

    for (const idx of requiredMessageIndexes) {
      const exists = messageIndexes[idx] !== undefined;
      console.log(`   ${exists ? '✅' : '⚠️ '} ${idx}`);
    }
    console.log();

    // Check Conversation indexes
    console.log('🔍 Conversation Collection Indexes:');
    const conversationIndexes = await Conversation.collection.getIndexes();
    console.log(`   Total indexes: ${Object.keys(conversationIndexes).length}`);
    Object.keys(conversationIndexes).forEach(idx => {
      console.log(`   ✅ ${idx}`);
    });
    console.log();

    // Sample data counts
    console.log('📈 Data Counts:');
    const messageCounts = {
      total: await Message.countDocuments(),
      withSenderType: await Message.countDocuments({ senderType: { $ne: null } }),
      withoutSenderType: await Message.countDocuments({ senderType: null }),
      withSenderId: await Message.countDocuments({ senderId: { $ne: null } }),
      withoutSenderId: await Message.countDocuments({ senderId: null })
    };

    console.log(`   Messages (total): ${messageCounts.total}`);
    console.log(`   Messages with senderType: ${messageCounts.withSenderType}`);
    console.log(`   Messages without senderType: ${messageCounts.withoutSenderType} ${messageCounts.withoutSenderType > 0 ? '⚠️  (needs backfill)' : '✅'}`);
    console.log(`   Messages with senderId: ${messageCounts.withSenderId}`);
    console.log(`   Messages without senderId: ${messageCounts.withoutSenderId} ${messageCounts.withoutSenderId > 0 ? '⚠️  (needs backfill)' : '✅'}`);
    console.log();

    const conversationCount = await Conversation.countDocuments();
    const businessCount = await Business.countDocuments();
    const vaCount = await VA.countDocuments();

    console.log(`   Conversations: ${conversationCount}`);
    console.log(`   Businesses: ${businessCount}`);
    console.log(`   VAs: ${vaCount}`);
    console.log();

    // Sample message structure
    console.log('📋 Sample Message Document:');
    const sampleMessage = await Message.findOne().lean();
    if (sampleMessage) {
      console.log('   Fields present:');
      console.log(`   - conversation: ${!!sampleMessage.conversation ? '✅' : '❌'}`);
      console.log(`   - sender: ${!!sampleMessage.sender ? '✅' : '❌'}`);
      console.log(`   - senderModel: ${!!sampleMessage.senderModel ? '✅' : '❌'} (${sampleMessage.senderModel || 'N/A'})`);
      console.log(`   - senderType: ${!!sampleMessage.senderType ? '✅' : '⚠️ '} (${sampleMessage.senderType || 'NULL'})`);
      console.log(`   - senderId: ${!!sampleMessage.senderId ? '✅' : '⚠️ '}`);
      console.log(`   - body: ${!!sampleMessage.body ? '✅' : '❌'}`);
      console.log(`   - createdAt: ${!!sampleMessage.createdAt ? '✅' : '❌'}`);
    } else {
      console.log('   ⚠️  No messages found in database');
    }
    console.log();

    // Sample conversation structure
    console.log('📋 Sample Conversation Document:');
    const sampleConversation = await Conversation.findOne().lean();
    if (sampleConversation) {
      console.log('   Fields present:');
      console.log(`   - business: ${!!sampleConversation.business ? '✅' : '❌'}`);
      console.log(`   - va: ${!!sampleConversation.va ? '✅' : '❌'}`);
      console.log(`   - participants: ${!!sampleConversation.participants ? '✅' : '❌'} (${sampleConversation.participants?.length || 0} participants)`);
      console.log(`   - lastMessageAt: ${!!sampleConversation.lastMessageAt ? '✅' : '❌'}`);
      console.log(`   - type: ${sampleConversation.type || 'N/A'}`);
    } else {
      console.log('   ⚠️  No conversations found in database');
    }
    console.log();

    // Summary
    console.log('=== Validation Summary ===');
    const needsBackfill = messageCounts.withoutSenderType > 0 || messageCounts.withoutSenderId > 0;
    const readyForAggregation = businessCount > 0 && vaCount > 0 && conversationCount > 0;

    if (needsBackfill) {
      console.log('⚠️  Database needs backfill: Run backfillMessageSenderFields.js');
    } else {
      console.log('✅ All messages have senderType and senderId populated');
    }

    if (readyForAggregation) {
      console.log('✅ Database ready for aggregation endpoints');
    } else {
      console.log('⚠️  Missing required data (businesses, vas, or conversations)');
    }

    console.log('\n✅ Validation complete\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Validation error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run validation
validateDatabase();