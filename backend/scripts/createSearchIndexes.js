/**
 * Script to create text indexes for universal search functionality
 * Run this once to set up the indexes in MongoDB
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const VA = require('../models/VA');
const Business = require('../models/Business');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Drop existing text indexes (if any) to avoid conflicts
    const collections = [
      { model: VA, name: 'VAs' },
      { model: Business, name: 'Businesses' },
      { model: User, name: 'Users' },
      { model: Message, name: 'Messages' },
      { model: Notification, name: 'Notifications' },
      { model: Conversation, name: 'Conversations' }
    ];

    for (const { model, name } of collections) {
      try {
        const indexes = await model.collection.getIndexes();
        // Find all text indexes (there should only be one per collection)
        const textIndexNames = Object.keys(indexes).filter(key => {
          const indexDef = indexes[key];
          if (Array.isArray(indexDef)) {
            return indexDef.some(field => Array.isArray(field) && field[1] === 'text');
          }
          return false;
        });
        
        for (const indexName of textIndexNames) {
          if (indexName !== '_id_') { // Don't drop the _id index
            await model.collection.dropIndex(indexName);
            console.log(`Dropped existing text index '${indexName}' for ${name}`);
          }
        }
      } catch (error) {
        console.log(`No existing text indexes for ${name} or error accessing indexes:`, error.message);
      }
    }

    // Create text indexes for VAs
    await VA.collection.createIndex(
      { 
        name: 'text', 
        email: 'text', 
        bio: 'text',
        skills: 'text',
        'experience.title': 'text',
        'experience.company': 'text'
      },
      {
        weights: {
          name: 10,
          email: 8,
          skills: 5,
          bio: 3,
          'experience.title': 2,
          'experience.company': 2
        },
        name: 'va_text_search'
      }
    );
    console.log('Created text index for VAs');

    // Create text indexes for Businesses
    await Business.collection.createIndex(
      { 
        name: 'text', 
        email: 'text', 
        industry: 'text',
        description: 'text',
        contactPerson: 'text'
      },
      {
        weights: {
          name: 10,
          email: 8,
          industry: 5,
          contactPerson: 5,
          description: 3
        },
        name: 'business_text_search'
      }
    );
    console.log('Created text index for Businesses');

    // Create text indexes for Users
    await User.collection.createIndex(
      { 
        name: 'text', 
        email: 'text', 
        firstName: 'text',
        lastName: 'text',
        displayName: 'text',
        bio: 'text'
      },
      {
        weights: {
          name: 10,
          email: 8,
          displayName: 8,
          firstName: 5,
          lastName: 5,
          bio: 2
        },
        name: 'user_text_search'
      }
    );
    console.log('Created text index for Users');

    // Create text indexes for Messages
    await Message.collection.createIndex(
      { 
        content: 'text' 
      },
      {
        name: 'message_text_search'
      }
    );
    console.log('Created text index for Messages');

    // Create text indexes for Notifications
    await Notification.collection.createIndex(
      { 
        title: 'text',
        message: 'text'
      },
      {
        weights: {
          title: 10,
          message: 5
        },
        name: 'notification_text_search'
      }
    );
    console.log('Created text index for Notifications');

    // Create text indexes for Conversations
    await Conversation.collection.createIndex(
      { 
        title: 'text',
        description: 'text'
      },
      {
        weights: {
          title: 10,
          description: 5
        },
        name: 'conversation_text_search'
      }
    );
    console.log('Created text index for Conversations');

    // Create additional compound indexes for better performance
    await VA.collection.createIndex({ status: 1, createdAt: -1 });
    await Business.collection.createIndex({ status: 1, createdAt: -1 });
    await User.collection.createIndex({ admin: 1, createdAt: -1 });
    await Message.collection.createIndex({ conversation: 1, createdAt: -1 });
    await Notification.collection.createIndex({ recipient: 1, read: 1, createdAt: -1 });
    await Conversation.collection.createIndex({ 'participants.user': 1, updatedAt: -1 });

    console.log('Created additional performance indexes');

    console.log('\n✅ All search indexes created successfully!');
    console.log('The universal search feature is now ready to use.');

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createIndexes();