# E Systems Onboarding Conversation System

## Overview

The E Systems onboarding conversation system automatically creates a welcome conversation for new users when they first access the Messages section with an empty inbox. This ensures all users receive consistent onboarding information tailored to their role (VA or Business).

## Features

### System User
- **E Systems Admin**: A dedicated system account that sends onboarding messages
- Marked with `isSystem: true` flag
- Has a stable identifier across deployments
- Cannot receive regular messages (`inboxEnabled: false`)
- All notifications disabled to prevent spam

### Onboarding Conversations
- Created automatically when a user with no conversations accesses the Messages section
- Idempotent - only creates once per user account
- Persists per account, not per session
- Contains two messages:
  1. Welcome message (same for all users)
  2. Role-specific message (different for VAs and Businesses)

### Message Content

#### Message 1 - Welcome (All Users)
```
Welcome to Messages. This is your private inbox for conversations on E Systems.
To start a chat, open any profile and select Message. Keep all hiring discussions
on-platform so everything stays secure and organized. You'll see new replies here
and get notified when someone responds.
```

#### Message 2 - For VAs
```
Complete your profile to get matched and hired faster. Profiles with a photo, skills,
experience, availability, and a clear bio appear higher in search and receive more
messages from businesses. Finish your profile now in your Dashboard.
```
*Note: "Dashboard" links to `/dashboard`*

#### Message 2 - For Businesses
```
Complete your company profile to attract the right VAs and improve response rates.
Adding your company details, role requirements, and preferences builds trust and
leads to better matches. Finish your profile now in your Dashboard.
```
*Note: "Dashboard" links to `/dashboard`*

## Implementation Details

### Database Schema Updates

#### User Model
- Added `isSystem` (Boolean) - Marks system accounts
- Added `systemName` (String) - Name of system account (e.g., "E Systems Admin")

#### Conversation Model
- Added `isSystemConversation` (Boolean) - Marks system-generated conversations
- Added `systemConversationType` (String) - Type of system conversation ('onboarding', 'announcement', 'support')
- Added `isOnboardingConversation` (Boolean) - Specifically marks onboarding conversations
- Message subdocument includes:
  - `systemCategory` (String) - Category of system message ('onboarding', 'announcement', 'notification')
  - `skipNotification` (Boolean) - Prevents external email/push notifications

#### Message Model (standalone)
- Added `systemCategory` (String) - Category of system message
- Added `skipNotification` (Boolean) - Prevents external notifications

### Service Layer

The `OnboardingService` (`/backend/services/onboardingService.js`) handles:
- Creating/retrieving the E Systems Admin system user
- Checking if a user has already received onboarding
- Creating onboarding conversations with role-appropriate messages
- Automatic onboarding check on conversation access
- Backfilling onboarding for existing users

### API Integration

The onboarding check is integrated into the conversations route (`GET /api/conversations`):
- Automatically called when users access their conversations
- Only creates onboarding for users with empty inboxes
- Idempotent - safe to call multiple times

### Key Features

1. **Idempotency**: Multiple calls to create onboarding for the same user will only create one conversation
2. **Role Detection**: Automatically detects if user is VA or Business based on:
   - User's `role` field
   - Associated VA or Business profile
   - Defaults to Business if no profile exists
3. **No External Notifications**: All onboarding messages have `skipNotification: true`
4. **Unread Counts**: Properly sets unread counts based on user role

## Scripts

### Backfill Existing Users
```bash
node backend/scripts/backfillOnboarding.js
```
Creates onboarding conversations for all existing users who have no conversations.

### Create Onboarding for Specific User
```bash
node backend/scripts/createOnboardingForUser.js <userEmail>
```
Example:
```bash
node backend/scripts/createOnboardingForUser.js john@example.com
```

## Testing

Comprehensive test suite in `/backend/tests/onboarding.test.js` covers:
- System admin creation and idempotency
- Onboarding conversation creation for VAs and Businesses
- Idempotency of onboarding creation
- Role-specific message content
- Automatic onboarding check logic
- Backfill process
- Message content validation

Run tests:
```bash
npm test -- onboarding.test.js
```

## Frontend Considerations

The frontend should:
1. Display "E Systems Admin" with appropriate branding/styling
2. Render HTML links in messages (e.g., Dashboard link)
3. Show system conversations with special styling if desired
4. Not show "Reply" options for system admin conversations (optional)

## Maintenance

### Adding New System Messages

To add new types of system messages:
1. Update the `systemConversationType` enum in Conversation model
2. Update the `systemCategory` enum in Message/Conversation models
3. Create new methods in OnboardingService for the new message type
4. Ensure `skipNotification: true` for automated messages

### Changing Onboarding Content

To update onboarding message content:
1. Edit the message strings in `OnboardingService.createOnboardingConversation()`
2. The change will only affect new users
3. To update existing users, you would need a migration script

## Security Considerations

- System admin password is randomly generated and unguessable
- System accounts have `inboxEnabled: false` to prevent receiving messages
- All system messages skip external notifications to prevent spam
- System admin is marked with `isSystem: true` for easy identification