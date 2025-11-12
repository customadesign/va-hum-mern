# Real-Time Notification System Documentation

## Overview
The Linkage VA Hub backend now includes a comprehensive real-time notification system powered by Socket.io. This system enables instant notification delivery to users, with special support for admin notifications and broadcasting.

## Architecture

### Core Components

1. **Socket.io Server** (`server.js`)
   - Integrated with Express server
   - Handles WebSocket connections
   - Manages user and admin rooms

2. **Notification Model** (`models/Notification.js`)
   - MongoDB schema for persistent storage
   - Includes virtual properties for computed fields
   - Static methods for common operations

3. **Notification Helper** (`utils/notificationHelper.js`)
   - Core functions for creating and managing notifications
   - Automatic Socket.io event emission
   - Support for batch operations

4. **Notification Middleware** (`middleware/notificationMiddleware.js`)
   - Attaches helper functions to request objects
   - Tracks notification interactions
   - Provides convenience methods

5. **Admin Routes** (`routes/admin.js`)
   - RESTful endpoints for notification management
   - Pagination and filtering support
   - Real-time updates via Socket.io

## Socket.io Events

### Client → Server Events

#### `join`
Join a user's personal notification room
```javascript
socket.emit('join', userId);
```

#### `join-admin-room`
Join the admin notification room (admin users only)
```javascript
socket.emit('join-admin-room', adminId);
```

#### `leave`
Leave notification rooms
```javascript
socket.emit('leave', userId);
```

#### `notification-acknowledged`
Acknowledge receipt of a notification
```javascript
socket.emit('notification-acknowledged', {
  notificationId: 'notification_id',
  userId: 'user_id'
});
```

### Server → Client Events

#### `new-notification`
Emitted when a new notification is created
```javascript
socket.on('new-notification', (data) => {
  // data.notification - The notification object
  // data.unreadCount - Updated unread count
});
```

#### `notification-read`
Emitted when a notification is marked as read
```javascript
socket.on('notification-read', (data) => {
  // data.notificationIds - Array of notification IDs marked as read
  // data.unreadCount - Updated unread count
});
```

#### `all-notifications-read`
Emitted when all notifications are marked as read
```javascript
socket.on('all-notifications-read', (data) => {
  // data.notificationIds - Array of all notification IDs
  // data.unreadCount - Will be 0
});
```

#### `notification-deleted`
Emitted when a notification is deleted
```javascript
socket.on('notification-deleted', (data) => {
  // data.notificationId - ID of deleted notification
  // data.unreadCount - Updated unread count
});
```

## REST API Endpoints

### Admin Notification Endpoints

#### GET `/api/admin/notifications`
Get paginated notifications for the current admin user

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10) - Items per page
- `unreadOnly` (default: false) - Filter only unread notifications
- `type` - Filter by notification type
- `priority` - Filter by priority level

**Response:**
```json
{
  "success": true,
  "data": [...notifications],
  "unreadCount": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### PUT `/api/admin/notifications/read`
Mark a single notification as read

**Request Body:**
```json
{
  "notificationId": "notification_id"
}
```

#### PUT `/api/admin/notifications/read-all`
Mark all notifications as read for the current user

#### DELETE `/api/admin/notifications/:id`
Delete a specific notification

#### GET `/api/admin/notifications/unread-count`
Get only the unread notification count (efficient for polling)

### Admin Notification Control Endpoints

#### POST `/api/admin/notifications/send-targeted`
Send notifications to specific users

**Request Body:**
```json
{
  "userIds": ["user1", "user2"],
  "title": "Notification Title",
  "message": "Notification message",
  "type": "system_announcement",
  "priority": "high",
  "sendEmailNotification": false
}
```

#### POST `/api/admin/notifications/send-broadcast`
Broadcast notifications to user groups

**Request Body:**
```json
{
  "targetGroup": "all", // all, vas, businesses, admins
  "title": "Broadcast Title",
  "message": "Broadcast message",
  "type": "system_announcement",
  "priority": "medium",
  "filters": {
    "searchStatus": "actively_looking" // For VAs
  }
}
```

## Usage Examples

### Frontend Integration (React)

```javascript
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to Socket.io server
    const newSocket = io(process.env.REACT_APP_SERVER_URL);
    
    // Join user's notification room
    newSocket.emit('join', userId);
    
    // If user is admin, join admin room
    if (userRole === 'admin') {
      newSocket.emit('join-admin-room', userId);
    }
    
    // Listen for new notifications
    newSocket.on('new-notification', (data) => {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(data.unreadCount);
      
      // Show toast or alert
      showNotificationToast(data.notification);
    });
    
    // Listen for read events
    newSocket.on('notification-read', (data) => {
      setUnreadCount(data.unreadCount);
      // Update local notification state
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      newSocket.emit('leave', userId);
      newSocket.disconnect();
    };
  }, [userId]);
  
  return { notifications, unreadCount, socket };
}
```

### Backend Usage in Routes

```javascript
// In any route after notification middleware
router.post('/api/vas/apply', protect, async (req, res) => {
  try {
    const application = await Application.create(req.body);
    
    // Notify the business about the application
    await req.createNotification({
      recipient: application.businessId,
      type: 'va_application',
      params: {
        title: 'New VA Application',
        message: `${req.user.name} has applied for your position`,
        vaId: req.user.va,
        applicationId: application._id
      },
      actionUrl: `/applications/${application._id}`
    });
    
    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Creating Admin Notifications

```javascript
// Notify all admins about a critical event
router.post('/api/report-abuse', protect, async (req, res) => {
  try {
    const report = await AbuseReport.create(req.body);
    
    // Notify all admins
    await req.createAdminNotification(
      'Abuse Report Filed',
      `User ${req.user.email} reported: ${report.reason}`,
      'admin_notification',
      'critical' // High priority
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Notification Types

The system supports the following notification types:

- `new_message` - New message received
- `new_conversation` - New conversation started
- `profile_view` - Profile viewed by someone
- `profile_reminder` - Reminder to complete profile
- `va_added` - New VA joined the platform
- `business_added` - New business joined
- `admin_notification` - Admin-specific notification
- `system_announcement` - System-wide announcement
- `referral_joined` - A referred user joined
- `celebration_package` - Celebration package requested
- `hiring_invoice` - Hiring invoice requested

## Priority Levels

Notifications can have the following priority levels:

- `low` - Non-urgent, informational
- `medium` - Standard notifications
- `high` - Important, should be highlighted
- `critical` - Urgent, requires immediate attention

## Testing

### Running the Test Script

```bash
# Install test dependencies if not already installed
npm install socket.io-client

# Run the test script
node test-realtime-notifications.js
```

The test script will:
1. Login as admin
2. Connect to Socket.io
3. Create test notifications
4. Test CRUD operations
5. Verify real-time events

### Manual Testing with Frontend

1. Open the admin dashboard
2. Open browser developer console
3. Monitor WebSocket frames in Network tab
4. Create notifications via admin panel
5. Verify real-time updates

## Performance Considerations

1. **Pagination**: Always use pagination for notification lists
2. **Unread Count**: Use the dedicated endpoint for efficiency
3. **Batch Operations**: Use broadcast methods for multiple recipients
4. **Socket Rooms**: Users automatically join appropriate rooms
5. **Event Throttling**: Consider implementing client-side throttling for high-frequency events

## Security

1. **Authentication**: All notification endpoints require authentication
2. **Authorization**: Admin endpoints require admin role
3. **User Isolation**: Users can only access their own notifications
4. **Input Validation**: All inputs are validated and sanitized
5. **Rate Limiting**: Notification creation is rate-limited

## Error Handling

The system includes comprehensive error handling:

1. **Fallback Mechanism**: If Socket.io fails, notifications are still saved to database
2. **Retry Logic**: Failed email notifications are logged but don't block the operation
3. **Validation Errors**: Clear error messages for invalid requests
4. **Connection Recovery**: Socket.io automatically reconnects on disconnection

## Monitoring

Monitor the notification system health by:

1. Checking Socket.io connection counts
2. Monitoring notification creation rates
3. Tracking delivery success rates
4. Analyzing user engagement metrics

## Future Enhancements

Potential improvements for the notification system:

1. **Push Notifications**: Add web push and mobile push support
2. **Notification Templates**: More sophisticated template system
3. **Scheduling**: Enhanced scheduled notification support
4. **Analytics**: Detailed notification analytics and reports
5. **Preferences**: More granular user preference controls
6. **Grouping**: Group similar notifications together
7. **Actions**: Add actionable buttons within notifications
8. **Sound/Vibration**: Client-side sound and vibration support

## Support

For issues or questions about the notification system:
1. Check server logs for Socket.io connection issues
2. Verify MongoDB indexes for performance
3. Test with the provided test script
4. Review client-side Socket.io implementation