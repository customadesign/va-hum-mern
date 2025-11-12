# Messenger Backend Integration Guide

## Overview
The backend has been enhanced to support a Facebook Messenger-style UI with real-time features, rich messaging capabilities, and comprehensive user presence tracking.

## New/Enhanced Models

### 1. Message Model (`/models/Message.js`)
Enhanced with:
- **Read receipts**: Track who read messages and when
- **Message status**: `sending`, `sent`, `delivered`, `read`, `failed`
- **Message types**: `text`, `image`, `video`, `file`, `audio`, `link`, `emoji`, `sticker`, `system`
- **Reactions**: Users can react with emojis
- **Reply-to**: Messages can reply to specific messages
- **Edit history**: Track message edits
- **Soft delete**: Delete for self or everyone

### 2. Conversation Model (`/models/Conversation.js`)
Enhanced with:
- **Typing indicators**: Real-time typing status
- **Themes & emojis**: Customizable per conversation
- **Nicknames**: Set nicknames for participants
- **Mute settings**: Mute conversations with duration
- **Pin conversations**: Pin important conversations
- **Call history**: Track voice/video calls
- **Group support**: Ready for group conversations

### 3. UserStatus Model (`/models/UserStatus.js`) - NEW
Tracks:
- **Online status**: `online`, `away`, `busy`, `offline`
- **Last seen**: When user was last active
- **Custom status**: Emoji + text status messages
- **Typing status**: Currently typing indicator
- **Device info**: Platform, browser, OS
- **Privacy settings**: Control status visibility

## API Endpoints

### Enhanced Messages API (`/api/messages/enhanced`)

#### Get Messages with Full Data
```http
GET /api/messages/enhanced/:conversationId
Query params:
  - page: Page number (default: 1)
  - limit: Messages per page (default: 50)
  - before: Get messages before this messageId
  - after: Get messages after this messageId

Response includes:
  - messages: Array with sender info, reactions, read receipts
  - userStatuses: Online status of participants
  - typingIndicators: Who's currently typing
  - hasMore: Boolean for pagination
```

#### Send Message
```http
POST /api/messages/enhanced/:conversationId
Body:
  - body: Message text (required)
  - messageType: Type of message (default: 'text')
  - attachments: Array of attachment objects
  - replyTo: ID of message to reply to
```

#### Mark Messages as Read
```http
POST /api/messages/enhanced/:conversationId/read
Body:
  - messageIds: Array of message IDs to mark as read
```

#### Add/Remove Reactions
```http
POST /api/messages/enhanced/:messageId/reactions
Body:
  - emoji: Emoji to add

DELETE /api/messages/enhanced/:messageId/reactions
```

#### Edit Message
```http
PUT /api/messages/enhanced/:messageId
Body:
  - body: New message text
Note: Can only edit within 15 minutes
```

#### Delete Message
```http
DELETE /api/messages/enhanced/:messageId
Body:
  - forEveryone: Boolean (delete for all participants)
```

#### Typing Status
```http
POST /api/messages/enhanced/:conversationId/typing
Body:
  - isTyping: Boolean
```

### Enhanced Conversations API (`/api/conversations/enhanced`)

#### Get Conversations with Messenger Data
```http
GET /api/conversations/enhanced
Query params:
  - page: Page number
  - limit: Conversations per page
  - status: 'active', 'archived', 'all'
  - sortBy: 'lastMessageAt', 'unread', 'pinned'
  - search: Search term

Response includes:
  - Last message for each conversation
  - Online status of participants
  - Unread counts
  - Pin/mute status
  - Custom display info
```

#### Start/Get Conversation
```http
POST /api/conversations/enhanced/start
Body:
  - recipientId: Direct user ID
  - vaId: VA ID (for business users)
  - businessId: Business ID (for VAs)
  - message: Initial message (optional)
```

#### Update Conversation Settings
```http
PUT /api/conversations/enhanced/:conversationId/settings
Body:
  - theme: Conversation theme
  - emoji: Default reaction emoji
  - nickname: Nickname for other participant
  - mute: Boolean
  - muteUntil: ISO date string
  - pin: Boolean
```

#### Get Unread Counts
```http
GET /api/conversations/enhanced/unread/counts
Response:
  - totalUnread: Total unread messages
  - conversations: Array with per-conversation counts
```

### User Status API (`/api/user-status`)

#### Get User Statuses
```http
GET /api/user-status
Query params:
  - userIds: Comma-separated user IDs

Response: Map of userId to status info
```

#### Update My Status
```http
PUT /api/user-status/me
Body:
  - status: 'online', 'away', 'busy', 'offline'
  - customStatus: { emoji, text, duration }
```

#### Update Activity (Heartbeat)
```http
POST /api/user-status/heartbeat
Note: Call every 1-5 minutes to maintain online status
```

## Socket.io Events

### Connection
```javascript
socket = io(serverUrl, {
  auth: {
    token: authToken,
    userId: currentUserId
  }
});
```

### Events to Emit

#### Join Conversations
```javascript
socket.emit('join_conversations', [conversationId1, conversationId2]);
```

#### Typing Indicators
```javascript
socket.emit('typing_start', { conversationId });
socket.emit('typing_stop', { conversationId });
```

#### Send Message (Alternative to REST)
```javascript
socket.emit('send_message', {
  conversationId,
  body: messageText,
  messageType: 'text',
  tempId: temporaryId // For optimistic UI
});
```

#### Mark as Read
```javascript
socket.emit('mark_read', {
  conversationId,
  messageIds: [id1, id2]
});
```

#### Reactions
```javascript
socket.emit('add_reaction', { messageId, emoji });
socket.emit('remove_reaction', { messageId });
```

#### Status Updates
```javascript
socket.emit('update_status', {
  status: 'online',
  customStatus: { emoji: '🎮', text: 'Gaming' }
});
```

#### Heartbeat
```javascript
// Send every 1-5 minutes
socket.emit('heartbeat');
```

### Events to Listen For

#### Message Events
```javascript
socket.on('new_message', ({ conversationId, message }) => {
  // New message received
});

socket.on('message_sent', ({ tempId, message }) => {
  // Replace temp message with server message
});

socket.on('message_delivered', ({ messageId, deliveredAt }) => {
  // Message was delivered
});

socket.on('messages_read', ({ conversationId, messageIds, readBy, readAt }) => {
  // Messages were read by someone
});

socket.on('message_edited', ({ messageId, conversationId, newBody, editedAt }) => {
  // Message was edited
});

socket.on('message_deleted', ({ messageId, conversationId, deletedBy }) => {
  // Message was deleted
});
```

#### Typing Events
```javascript
socket.on('user_typing', ({ conversationId, userId, isTyping }) => {
  // Someone started/stopped typing
});
```

#### Reaction Events
```javascript
socket.on('reaction_added', ({ messageId, userId, emoji }) => {
  // Reaction added to message
});

socket.on('reaction_removed', ({ messageId, userId }) => {
  // Reaction removed from message
});
```

#### Status Events
```javascript
socket.on('contact_status_changed', ({ userId, status, customStatus, lastSeen }) => {
  // Contact's status changed
});

socket.on('user_came_online', ({ userId }) => {
  // User came online
});

socket.on('user_went_offline', ({ userId, lastSeen }) => {
  // User went offline
});
```

#### Call Events
```javascript
socket.on('incoming_call', ({ conversationId, callId, callType, caller }) => {
  // Incoming call notification
});
```

## Admin Moderation Features

### Forward Message (Admin Only)
```http
POST /api/messages/enhanced/:messageId/forward
Body:
  - toConversationId: Target conversation
  - note: Admin note
```

### Add Admin Note
```http
POST /api/messages/enhanced/:messageId/admin-note
Body:
  - note: Note text
```

### Block Conversation (Admin Only)
```http
PUT /api/conversations/enhanced/:conversationId/block
Body:
  - reason: Block reason
```

## Implementation Tips

### 1. Optimistic UI Updates
- Send messages optimistically with temp IDs
- Replace with server message when `message_sent` event received
- Show sending/sent/delivered/read status indicators

### 2. Real-time Presence
- Send heartbeat every 1-5 minutes
- Update UI immediately when status changes received
- Show "last seen" when user goes offline

### 3. Typing Indicators
- Start typing when user begins typing (with debounce)
- Stop typing after 3-5 seconds of inactivity
- Clear typing indicator if message sent

### 4. Read Receipts
- Mark messages as read when conversation opened
- Batch read receipts to reduce API calls
- Show read status with user avatars

### 5. Message Reactions
- Allow quick emoji reactions
- Show reaction counts and users on hover
- Animate reaction additions/removals

### 6. Performance Optimization
- Lazy load older messages on scroll
- Cache user status data with TTL
- Debounce typing indicators
- Use pagination for conversation list

## Database Indexes
Run the optimization script to create necessary indexes:
```bash
node backend/scripts/optimizeMessagingIndexes.js
```

## Testing Checklist

### Basic Messaging
- [ ] Send/receive text messages
- [ ] Send/receive media (images, videos, files)
- [ ] Edit messages (within 15 minutes)
- [ ] Delete messages (for self/everyone)
- [ ] Reply to specific messages

### Real-time Features
- [ ] Typing indicators work across users
- [ ] Online/offline status updates immediately
- [ ] Read receipts show correctly
- [ ] Message delivery status updates

### Advanced Features
- [ ] Reactions add/remove properly
- [ ] Conversation muting works
- [ ] Pinned conversations stay at top
- [ ] Search finds messages/conversations
- [ ] Custom themes apply correctly

### Admin Features
- [ ] Can forward messages between conversations
- [ ] Can add notes to messages
- [ ] Can block conversations
- [ ] Intercepted conversations work correctly

## Migration Notes

1. The enhanced endpoints are at `/api/messages/enhanced` and `/api/conversations/enhanced`
2. Original endpoints remain unchanged for backward compatibility
3. New UserStatus model needs to be created for existing users
4. Run index optimization script for better performance

## Support

For any issues or questions about the backend integration:
1. Check server logs for errors
2. Verify Socket.io connection is established
3. Ensure proper authentication tokens are sent
4. Check network tab for API response errors