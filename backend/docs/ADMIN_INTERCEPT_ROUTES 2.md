# Admin Intercept Routes Documentation

## Overview
The Admin Intercept system manages business-to-VA messaging where businesses with less than 80% profile completion have their messages intercepted and reviewed by admins before reaching VAs.

## Base URL
```
/api/admin/intercept
```

## Authentication
All routes except public endpoints require admin authentication via JWT token in the Authorization header:
```
Authorization: Bearer <admin-token>
```

## Endpoints

### 1. Get Intercepted Conversations
**GET** `/api/admin/intercept/conversations`

Retrieves all intercepted conversations with filtering, search, and pagination.

**Query Parameters:**
- `status` (string): Filter by status - 'all', 'pending', 'forwarded', 'replied' (default: 'all')
- `search` (string): Search in business/VA names, emails, or message content
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 20)
- `sortBy` (string): Sort field (default: 'lastMessageAt')
- `order` (string): Sort order - 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "_id": "conversationId",
        "va": { /* VA user details */ },
        "business": { /* Business user details */ },
        "messages": [ /* Message array */ ],
        "adminStatus": "pending",
        "isIntercepted": true,
        "unreadCount": { "admin": 2, "va": 0, "business": 0 }
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "pages": 3
    },
    "unreadCount": 5,
    "statusCounts": {
      "all": 50,
      "pending": 30,
      "forwarded": 15,
      "replied": 5
    }
  }
}
```

### 2. Get Specific Conversation
**GET** `/api/admin/intercept/conversations/:id`

Retrieves detailed information about a specific intercepted conversation.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "conversationId",
    "va": { /* Full VA details with specialties */ },
    "business": { /* Full business details */ },
    "messages": [ /* All messages */ ],
    "adminStatus": "pending",
    "adminNotes": "Notes about this conversation",
    "adminActions": [
      {
        "action": "forwarded",
        "performedBy": { /* Admin user */ },
        "performedAt": "2024-01-20T10:00:00Z",
        "details": {}
      }
    ]
  }
}
```

### 3. Forward Conversation to VA
**POST** `/api/admin/intercept/forward/:conversationId`

Forwards an intercepted conversation to the VA with optional message.

**Request Body:**
```json
{
  "message": "Optional admin message to include",
  "includeHistory": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalConversation": { /* Updated conversation */ },
    "vaConversation": { /* New/updated admin-to-VA conversation */ }
  }
}
```

### 4. Reply to Business
**POST** `/api/admin/intercept/reply/:conversationId`

Admin replies to the business, either as themselves or posing as the VA.

**Request Body:**
```json
{
  "message": "Reply message content",
  "asVA": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": { /* New message object */ },
    "conversation": { /* Updated conversation */ }
  }
}
```

### 5. Update Admin Notes
**PUT** `/api/admin/intercept/notes/:conversationId`

Add or update admin notes for a conversation.

**Request Body:**
```json
{
  "notes": "Admin notes about this conversation"
}
```

### 6. Update Conversation Status
**PUT** `/api/admin/intercept/status/:conversationId`

Update the admin status of a conversation.

**Request Body:**
```json
{
  "status": "pending|forwarded|replied|resolved|spam"
}
```

### 7. Batch Operations
**POST** `/api/admin/intercept/batch`

Perform batch operations on multiple conversations.

**Request Body:**
```json
{
  "conversationIds": ["id1", "id2", "id3"],
  "action": "markAsRead|updateStatus|archive",
  "data": {
    "status": "resolved"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": ["id1", "id2"],
    "failed": [
      { "id": "id3", "error": "Not found" }
    ]
  }
}
```

### 8. Get Statistics
**GET** `/api/admin/intercept/stats`

Get comprehensive statistics about intercepted conversations.

**Query Parameters:**
- `startDate` (string): Start date for filtering (ISO format)
- `endDate` (string): End date for filtering (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalIntercepted": 150,
      "pendingCount": 45,
      "forwardedCount": 80,
      "repliedCount": 25,
      "totalBusinesses": 200,
      "businessesCanMessage": 120,
      "businessesCannotMessage": 80,
      "averageProfileCompletion": 72
    },
    "responseTime": {
      "avgResponseTime": 3600000,
      "minResponseTime": 600000,
      "maxResponseTime": 86400000
    },
    "activityByHour": {
      "0": 5, "1": 2, "9": 25, "10": 30
    },
    "topBusinesses": [
      {
        "businessId": "id",
        "email": "business@example.com",
        "messageCount": 25,
        "conversationCount": 5
      }
    ],
    "completionRanges": {
      "0-20": 10,
      "21-40": 20,
      "41-60": 30,
      "61-80": 80,
      "81-100": 60
    }
  }
}
```

### 9. Check Messaging Eligibility (Public)
**GET** `/api/admin/intercept/check-messaging-eligibility/:vaId`

Check if the current user can message a specific VA.

**Response:**
```json
{
  "success": true,
  "canMessage": false,
  "isAuthenticated": true,
  "userType": "business",
  "profileCompletion": 65,
  "actionRequired": {
    "type": "complete_profile",
    "text": "Complete Your Profile To Chat (65% complete)",
    "url": "http://localhost:3002/profile"
  }
}
```

### 10. Profile Completion Requirements (Public)
**GET** `/api/admin/intercept/profile-completion-requirements`

Get the requirements for profile completion.

**Response:**
```json
{
  "success": true,
  "requirements": {
    "minimumPercentage": 80,
    "requiredFields": {
      "basic": [ /* Field definitions */ ],
      "professional": [ /* Field definitions */ ],
      "location": [ /* Field definitions */ ],
      "social": [ /* Field definitions */ ]
    },
    "tips": [
      "Complete all required basic information fields for 60% completion"
    ]
  }
}
```

## Message Flow

1. **Business initiates contact** with VA
2. System checks business profile completion
3. If < 80% complete, conversation is **intercepted**
4. Admin sees message in dashboard with **unread notification**
5. Admin can:
   - **Forward** to VA with optional message
   - **Reply** to business (as admin or as VA)
   - **Add notes** for future reference
   - **Update status** (pending → forwarded/replied/resolved)
6. All actions are **logged** with timestamp and admin ID

## Status Definitions

- **pending**: New intercepted message awaiting admin action
- **forwarded**: Admin has forwarded to VA
- **replied**: Admin has replied to business
- **resolved**: Conversation resolved/closed
- **spam**: Marked as spam/inappropriate

## Frontend Integration

The admin frontend should:

1. Poll `/api/admin/intercept/conversations` for new messages
2. Show unread count badge
3. Allow filtering by status
4. Enable search functionality
5. Support conversation view with message history
6. Provide quick actions (forward, reply, notes)
7. Display statistics dashboard

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- **200**: Success
- **400**: Bad request (invalid parameters)
- **401**: Unauthorized (not logged in)
- **403**: Forbidden (not admin)
- **404**: Resource not found
- **500**: Server error