/**
 * Database Optimization Script for Messaging Features
 * This script adds necessary indexes to optimize query performance
 * for the enhanced messenger-style UI
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function createIndexes() {
  try {
    const db = mongoose.connection.db;
    
    console.log('Starting index optimization for messaging features...\n');
    
    // ============================================
    // Message Collection Indexes
    // ============================================
    console.log('Creating indexes for messages collection...');
    const messagesCollection = db.collection('messages');
    
    // Compound index for conversation messages with sorting
    await messagesCollection.createIndex(
      { conversation: 1, createdAt: -1 },
      { name: 'conversation_messages_sorted' }
    );
    console.log('✓ Created index: conversation_messages_sorted');
    
    // Index for sender lookup
    await messagesCollection.createIndex(
      { sender: 1 },
      { name: 'message_sender' }
    );
    console.log('✓ Created index: message_sender');
    
    // Index for unread messages
    await messagesCollection.createIndex(
      { conversation: 1, status: 1, 'readBy.user': 1 },
      { name: 'unread_messages' }
    );
    console.log('✓ Created index: unread_messages');
    
    // Index for deleted messages
    await messagesCollection.createIndex(
      { deletedAt: 1, deletedForEveryone: 1 },
      { 
        name: 'deleted_messages',
        partialFilterExpression: { deletedAt: { $exists: true } }
      }
    );
    console.log('✓ Created index: deleted_messages');
    
    // Text index for message search
    await messagesCollection.createIndex(
      { body: 'text' },
      { name: 'message_text_search' }
    );
    console.log('✓ Created index: message_text_search');
    
    // Index for admin moderation
    await messagesCollection.createIndex(
      { moderationStatus: 1, createdAt: -1 },
      { 
        name: 'moderation_queue',
        partialFilterExpression: { moderationStatus: { $ne: 'approved' } }
      }
    );
    console.log('✓ Created index: moderation_queue');
    
    // ============================================
    // Conversation Collection Indexes
    // ============================================
    console.log('\nCreating indexes for conversations collection...');
    const conversationsCollection = db.collection('conversations');
    
    // Index for user conversations
    await conversationsCollection.createIndex(
      { participants: 1, lastMessageAt: -1 },
      { name: 'user_conversations_sorted' }
    );
    console.log('✓ Created index: user_conversations_sorted');
    
    // Index for active conversations
    await conversationsCollection.createIndex(
      { status: 1, lastMessageAt: -1 },
      { name: 'active_conversations' }
    );
    console.log('✓ Created index: active_conversations');
    
    // Index for intercepted conversations (admin)
    await conversationsCollection.createIndex(
      { isIntercepted: 1, interceptedAt: -1 },
      { 
        name: 'intercepted_conversations',
        partialFilterExpression: { isIntercepted: true }
      }
    );
    console.log('✓ Created index: intercepted_conversations');
    
    // Index for pinned conversations
    await conversationsCollection.createIndex(
      { 'pinnedBy.user': 1, 'pinnedBy.pinnedAt': -1 },
      { 
        name: 'pinned_conversations',
        partialFilterExpression: { 'pinnedBy.0': { $exists: true } }
      }
    );
    console.log('✓ Created index: pinned_conversations');
    
    // Index for unread counts
    await conversationsCollection.createIndex(
      { 
        participants: 1,
        'unreadCount.va': 1,
        'unreadCount.business': 1,
        'unreadCount.admin': 1
      },
      { name: 'unread_counts' }
    );
    console.log('✓ Created index: unread_counts');
    
    // Index for typing indicators
    await conversationsCollection.createIndex(
      { 'typingIndicators.user': 1 },
      { 
        name: 'typing_indicators',
        partialFilterExpression: { 'typingIndicators.0': { $exists: true } }
      }
    );
    console.log('✓ Created index: typing_indicators');
    
    // ============================================
    // UserStatus Collection Indexes
    // ============================================
    console.log('\nCreating indexes for userstatuses collection...');
    const userStatusCollection = db.collection('userstatuses');
    
    // Index for user status lookup
    await userStatusCollection.createIndex(
      { user: 1 },
      { name: 'user_status', unique: true }
    );
    console.log('✓ Created index: user_status');
    
    // Index for online users
    await userStatusCollection.createIndex(
      { status: 1, lastSeen: -1 },
      { name: 'online_users' }
    );
    console.log('✓ Created index: online_users');
    
    // Index for typing status
    await userStatusCollection.createIndex(
      { isTyping: 1, typingIn: 1 },
      { 
        name: 'typing_status',
        partialFilterExpression: { isTyping: true }
      }
    );
    console.log('✓ Created index: typing_status');
    
    // Index for stale status cleanup
    await userStatusCollection.createIndex(
      { lastSeen: 1, status: 1 },
      { name: 'stale_status_cleanup' }
    );
    console.log('✓ Created index: stale_status_cleanup');
    
    // ============================================
    // Notification Collection Indexes
    // ============================================
    console.log('\nCreating indexes for notifications collection...');
    const notificationsCollection = db.collection('notifications');
    
    // Index for user notifications
    await notificationsCollection.createIndex(
      { recipient: 1, read: 1, createdAt: -1 },
      { name: 'user_notifications' }
    );
    console.log('✓ Created index: user_notifications');
    
    // Index for unread notifications
    await notificationsCollection.createIndex(
      { recipient: 1, read: 1 },
      { 
        name: 'unread_notifications',
        partialFilterExpression: { read: false }
      }
    );
    console.log('✓ Created index: unread_notifications');
    
    // ============================================
    // User Collection Indexes (enhancements)
    // ============================================
    console.log('\nCreating indexes for users collection...');
    const usersCollection = db.collection('users');
    
    // Text index for user search
    await usersCollection.createIndex(
      { name: 'text', email: 'text' },
      { name: 'user_search' }
    );
    console.log('✓ Created index: user_search');
    
    // Index for admin users
    await usersCollection.createIndex(
      { admin: 1 },
      { 
        name: 'admin_users',
        partialFilterExpression: { admin: true }
      }
    );
    console.log('✓ Created index: admin_users');
    
    // ============================================
    // VA Collection Indexes (enhancements)
    // ============================================
    console.log('\nCreating indexes for vas collection...');
    const vasCollection = db.collection('vas');
    
    // Text index for VA search
    await vasCollection.createIndex(
      { name: 'text', bio: 'text', skills: 'text' },
      { name: 'va_search' }
    );
    console.log('✓ Created index: va_search');
    
    // ============================================
    // Business Collection Indexes (enhancements)
    // ============================================
    console.log('\nCreating indexes for businesses collection...');
    const businessesCollection = db.collection('businesses');
    
    // Text index for business search
    await businessesCollection.createIndex(
      { company: 'text', industry: 'text' },
      { name: 'business_search' }
    );
    console.log('✓ Created index: business_search');
    
    console.log('\n✅ All indexes created successfully!');
    
    // Display index statistics
    console.log('\n📊 Index Statistics:');
    
    const collections = [
      'messages',
      'conversations',
      'userstatuses',
      'notifications',
      'users',
      'vas',
      'businesses'
    ];
    
    for (const collName of collections) {
      const coll = db.collection(collName);
      const indexes = await coll.indexes();
      console.log(`\n${collName}: ${indexes.length} indexes`);
      indexes.forEach(index => {
        if (index.name !== '_id_') {
          console.log(`  - ${index.name}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

// Run the optimization
createIndexes().then(() => {
  console.log('\n✨ Database optimization complete!');
  process.exit(0);
}).catch(err => {
  console.error('Optimization failed:', err);
  process.exit(1);
});