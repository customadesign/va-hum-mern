const UserStatus = require('../models/UserStatus');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Store socket-to-user mappings
const socketUserMap = new Map();
const userSocketMap = new Map();

// Initialize Socket.io handlers
exports.initializeSocketHandlers = (io) => {
  
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      
      // Verify token and get user (implement based on your auth system)
      // For now, we'll assume the token contains the user ID
      socket.userId = socket.handshake.auth.userId;
      
      if (!socket.userId) {
        return next(new Error('Invalid authentication'));
      }
      
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected with socket ${socket.id}`);
    
    // Store socket mapping
    socketUserMap.set(socket.id, socket.userId);
    
    // Store user-to-socket mapping (user can have multiple connections)
    if (!userSocketMap.has(socket.userId)) {
      userSocketMap.set(socket.userId, new Set());
    }
    userSocketMap.get(socket.userId).add(socket.id);

    // Join user's personal room
    socket.join(socket.userId);
    
    // Set user online status
    try {
      let userStatus = await UserStatus.findOne({ user: socket.userId });
      if (!userStatus) {
        userStatus = new UserStatus({ user: socket.userId });
      }
      await userStatus.setOnline(socket.id);
      
      // Notify contacts that user is online
      await notifyContactsOfStatusChange(io, socket.userId, 'online');
      
      // Check if user is admin and join admin room
      const user = await User.findById(socket.userId);
      if (user && user.admin) {
        socket.join('admin-notifications');
        console.log(`Admin ${socket.userId} joined admin notification room`);
      }
    } catch (error) {
      console.error('Error setting user online:', error);
    }

    // Join conversation rooms
    socket.on('join_conversations', async (conversationIds) => {
      try {
        // Verify user has access to these conversations
        const conversations = await Conversation.find({
          _id: { $in: conversationIds },
          participants: socket.userId
        });
        
        conversations.forEach(conv => {
          socket.join(`conversation:${conv._id}`);
        });
        
        socket.emit('joined_conversations', {
          joined: conversations.map(c => c._id)
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversations' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', async ({ conversationId }) => {
      try {
        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }
        
        // Add typing indicator
        await conversation.addTypingIndicator(socket.userId);
        
        // Update user status
        const userStatus = await UserStatus.findOne({ user: socket.userId });
        if (userStatus) {
          await userStatus.setTyping(conversationId, true);
        }
        
        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId: socket.userId,
          isTyping: true
        });
      } catch (error) {
        console.error('Typing start error:', error);
      }
    });

    socket.on('typing_stop', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(socket.userId)) {
          return;
        }
        
        // Remove typing indicator
        await conversation.removeTypingIndicator(socket.userId);
        
        // Update user status
        const userStatus = await UserStatus.findOne({ user: socket.userId });
        if (userStatus) {
          await userStatus.setTyping(conversationId, false);
        }
        
        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId: socket.userId,
          isTyping: false
        });
      } catch (error) {
        console.error('Typing stop error:', error);
      }
    });

    // Handle message sending via socket (alternative to REST)
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, body, messageType = 'text', attachments, replyTo } = data;
        
        // Verify user is participant
        const conversation = await Conversation.findById(conversationId)
          .populate('participants', 'name email avatar');
        
        if (!conversation || !conversation.participants.some(p => p._id.toString() === socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }
        
        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          senderModel: 'User',
          body,
          bodyHtml: body,
          messageType,
          attachments,
          replyTo,
          status: 'sent'
        });
        
        // Populate message data
        await message.populate([
          { path: 'sender', select: 'name email avatar' },
          { path: 'replyTo', select: 'body sender' }
        ]);
        
        // Update conversation
        conversation.updateLastMessage(message);
        await conversation.save();
        
        // Send confirmation to sender
        socket.emit('message_sent', {
          tempId: data.tempId,
          message
        });
        
        // Send to other participants
        socket.to(`conversation:${conversationId}`).emit('new_message', {
          conversationId,
          message
        });
        
        // Mark as delivered for online recipients
        const onlineParticipants = [];
        conversation.participants.forEach(p => {
          if (p._id.toString() !== socket.userId && userSocketMap.has(p._id.toString())) {
            onlineParticipants.push(p._id.toString());
          }
        });
        
        if (onlineParticipants.length > 0) {
          message.status = 'delivered';
          message.deliveredAt = new Date();
          await message.save();
          
          socket.emit('message_delivered', {
            messageId: message._id,
            deliveredAt: message.deliveredAt
          });
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle read receipts
    socket.on('mark_read', async ({ conversationId, messageIds }) => {
      try {
        const messages = await Message.find({
          _id: { $in: messageIds },
          conversation: conversationId
        });
        
        for (const message of messages) {
          await message.markAsRead(socket.userId);
        }
        
        // Update conversation unread count
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          await conversation.markAsRead(socket.userId);
          await conversation.save();
        }
        
        // Notify senders of read receipts
        const senderIds = [...new Set(messages.map(m => m.sender.toString()))];
        senderIds.forEach(senderId => {
          if (userSocketMap.has(senderId)) {
            userSocketMap.get(senderId).forEach(socketId => {
              io.to(socketId).emit('messages_read', {
                conversationId,
                messageIds,
                readBy: socket.userId,
                readAt: new Date()
              });
            });
          }
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Handle reactions
    socket.on('add_reaction', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        
        await message.addReaction(socket.userId, emoji);
        
        // Notify participants
        const conversation = await Conversation.findById(message.conversation);
        socket.to(`conversation:${conversation._id}`).emit('reaction_added', {
          messageId,
          userId: socket.userId,
          emoji
        });
      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    socket.on('remove_reaction', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        
        await message.removeReaction(socket.userId);
        
        // Notify participants
        const conversation = await Conversation.findById(message.conversation);
        socket.to(`conversation:${conversation._id}`).emit('reaction_removed', {
          messageId,
          userId: socket.userId
        });
      } catch (error) {
        console.error('Remove reaction error:', error);
      }
    });

    // Handle status updates
    socket.on('update_status', async ({ status, customStatus }) => {
      try {
        let userStatus = await UserStatus.findOne({ user: socket.userId });
        if (!userStatus) {
          userStatus = new UserStatus({ user: socket.userId });
        }
        
        if (status) {
          userStatus.status = status;
        }
        
        if (customStatus !== undefined) {
          userStatus.customStatus = customStatus;
        }
        
        await userStatus.save();
        
        // Notify contacts
        await notifyContactsOfStatusChange(io, socket.userId, status, customStatus);
      } catch (error) {
        console.error('Update status error:', error);
      }
    });

    // Handle heartbeat for activity tracking
    socket.on('heartbeat', async () => {
      try {
        const userStatus = await UserStatus.findOne({ user: socket.userId });
        if (userStatus) {
          await userStatus.updateActivity();
        }
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    });

    // Handle call initiation
    socket.on('initiate_call', async ({ conversationId, callType }) => {
      try {
        const conversation = await Conversation.findById(conversationId)
          .populate('participants', 'name email avatar');
        
        if (!conversation || !conversation.participants.some(p => p._id.toString() === socket.userId)) {
          return socket.emit('error', { message: 'Not authorized' });
        }
        
        // Create call record
        const call = {
          type: callType,
          initiator: socket.userId,
          participants: [],
          startedAt: new Date(),
          status: 'ringing'
        };
        
        conversation.calls.push(call);
        await conversation.save();
        
        // Notify other participants
        conversation.participants.forEach(participant => {
          if (participant._id.toString() !== socket.userId) {
            if (userSocketMap.has(participant._id.toString())) {
              userSocketMap.get(participant._id.toString()).forEach(socketId => {
                io.to(socketId).emit('incoming_call', {
                  conversationId,
                  callId: call._id,
                  callType,
                  caller: {
                    _id: socket.userId,
                    name: conversation.participants.find(p => p._id.toString() === socket.userId)?.name
                  }
                });
              });
            }
          }
        });
      } catch (error) {
        console.error('Initiate call error:', error);
        socket.emit('error', { message: 'Failed to initiate call' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Remove socket from mapping
      socketUserMap.delete(socket.id);
      
      // Remove from user's socket set
      const userSockets = userSocketMap.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        // If user has no more active sockets, set them offline
        if (userSockets.size === 0) {
          userSocketMap.delete(socket.userId);
          
          try {
            const userStatus = await UserStatus.findOne({ user: socket.userId });
            if (userStatus) {
              await userStatus.setOffline();
              
              // Notify contacts that user is offline
              await notifyContactsOfStatusChange(io, socket.userId, 'offline');
            }
          } catch (error) {
            console.error('Error setting user offline:', error);
          }
        }
      }
    });
  });

  // Periodic cleanup of stale statuses
  setInterval(async () => {
    try {
      await UserStatus.cleanupStaleStatuses();
    } catch (error) {
      console.error('Status cleanup error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
};

// Helper function to notify contacts of status change
async function notifyContactsOfStatusChange(io, userId, status, customStatus = null) {
  try {
    // Get all conversations this user is part of
    const conversations = await Conversation.find({
      participants: userId
    }).select('participants');
    
    // Collect unique participant IDs
    const contactIds = new Set();
    conversations.forEach(conv => {
      conv.participants.forEach(p => {
        const pId = p.toString();
        if (pId !== userId) {
          contactIds.add(pId);
        }
      });
    });
    
    // Notify each contact
    contactIds.forEach(contactId => {
      io.to(contactId).emit('contact_status_changed', {
        userId,
        status,
        customStatus,
        lastSeen: new Date()
      });
    });
  } catch (error) {
    console.error('Error notifying contacts:', error);
  }
}

// Export helper functions
exports.getOnlineUsers = () => {
  return Array.from(userSocketMap.keys());
};

exports.isUserOnline = (userId) => {
  return userSocketMap.has(userId);
};

exports.getUserSockets = (userId) => {
  return userSocketMap.get(userId) || new Set();
};