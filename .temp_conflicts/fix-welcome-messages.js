const mongoose = require('mongoose');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
require('dotenv').config();

async function fixWelcomeMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkage-va-hub', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // 1. Update system user name to "Linkage Admin"
    const userResult = await User.updateOne(
      { email: 'system@linkagevahub.com' },
      { $set: { name: 'Linkage Admin' } }
    );

    if (userResult.modifiedCount > 0) {
      console.log('✓ System user name updated to "Linkage Admin"');
    } else {
      console.log('System user already has correct name or not found');
    }

    // 2. Find and update messages that reference "E Systems" to say "Linkage VA Hub"
    const messageResult = await Message.updateMany(
      { content: { $regex: /E Systems|E-Systems/i } },
      [{
        $set: {
          content: {
            $replaceAll: {
              input: "$content",
              find: "E Systems",
              replacement: "Linkage VA Hub"
            }
          }
        }
      }]
    );

    console.log(`✓ Updated ${messageResult.modifiedCount} messages to reference "Linkage VA Hub"`);

    // 3. Update lastMessage in conversations that reference "E Systems"
    const convResult = await Conversation.updateMany(
      { lastMessage: { $regex: /E Systems|E-Systems/i } },
      [{
        $set: {
          lastMessage: {
            $replaceAll: {
              input: "$lastMessage",
              find: "E Systems",
              replacement: "Linkage VA Hub"
            }
          }
        }
      }]
    );

    console.log(`✓ Updated ${convResult.modifiedCount} conversations to reference "Linkage VA Hub"`);

    // 4. Show some sample messages to verify
    const systemUser = await User.findOne({ email: 'system@linkagevahub.com' });
    if (systemUser) {
      console.log(`\nSystem user: ${systemUser.name} (${systemUser.email})`);

      const sampleMessages = await Message.find({ sender: systemUser._id }).limit(3);
      console.log(`\nSample messages from ${systemUser.name}:`);
      sampleMessages.forEach((msg, idx) => {
        console.log(`${idx + 1}. ${msg.content.substring(0, 100)}...`);
      });
    }

  } catch (error) {
    console.error('Error fixing welcome messages:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixWelcomeMessages();