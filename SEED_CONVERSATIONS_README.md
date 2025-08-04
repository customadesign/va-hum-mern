# Conversation Seeding Guide

This guide explains how to populate the VA Hub application with sample conversations and messages to showcase the UI/UX capabilities.

## Available Scripts

### 1. Basic Conversation Seeder (`npm run seed:conversations`)

Creates sample conversations using the embedded message structure within the Conversation model.

**Features:**
- Creates 3 VA users and 3 Business users
- Generates 6 different conversation scenarios
- Includes various message counts and unread states
- Creates an admin user for testing

**Usage:**
```bash
cd backend
npm run seed:conversations
```

### 2. Advanced Message Seeder (`npm run seed:messages`)

Creates rich conversations using the separate Message model with advanced features.

**Features:**
- File attachments (PDFs, Excel, ZIP files, etc.)
- Rich text formatting (bold, italic, line breaks)
- Hiring fee acknowledgment flags
- Realistic time-based message flow
- Various conversation types (negotiations, project updates, urgent tasks)
- Power user with multiple conversations

**Usage:**
```bash
cd backend
npm run seed:messages
```

### 3. API Population Script (`npm run populate:api`)

Uses the API endpoints directly to create conversations - useful for deployed instances.

**Features:**
- Works via API calls (no direct database access needed)
- Can be used on deployed environments
- Creates test accounts if they don't exist
- Generates realistic conversation flows

**Usage:**
```bash
cd backend
npm run populate:api

# For deployed instance:
API_URL=https://linkage-va-hub.onrender.com/api npm run populate:api
```

## Test Accounts Created

### Virtual Assistants
- `sarah.martinez.va@example.com` / `Test123!` - Social Media Expert
- `michael.chang.va@example.com` / `Test123!` - Executive Assistant
- `jessica.taylor.va@example.com` / `Test123!` - E-commerce Specialist

### Businesses
- `innovate.tech@example.com` / `Test123!` - Tech Startup
- `luxe.fashion@example.com` / `Test123!` - Fashion Brand
- `growth.marketing@example.com` / `Test123!` - Marketing Agency

### Special Accounts
- `admin@vahub.com` / `Admin123!` - Admin user (can see all conversations)
- `power.user@example.com` / `Test123!` - Business with multiple VA conversations

## Conversation Scenarios Demonstrated

1. **Contract Negotiation** - Shows file attachments and formal discussions
2. **Active Project** - Ongoing work with deliverables and feedback
3. **Initial Contact** - First-time outreach with unread messages
4. **Urgent Tasks** - Time-sensitive discussions with quick responses
5. **Long Conversations** - Extended threads showing pagination needs
6. **Archived Projects** - Completed work for historical reference

## UI/UX Features Showcased

- **Message States**: Read/unread indicators with counts
- **Rich Content**: Formatted text, emojis, bullet points
- **File Handling**: Various attachment types with metadata
- **Time Display**: Recent times (2 hours ago) vs dates
- **User Avatars**: Default avatars when not set
- **Status Badges**: Admin badges, online indicators
- **Conversation List**: Sorting by most recent, unread highlighting
- **Search/Filter**: Different conversation states and participants

## Running on Local Development

1. Ensure MongoDB is running locally
2. Set up your `.env` file with `MONGODB_URI`
3. Run one of the seed scripts
4. Start the application and login with test accounts

## Running on Deployed Instance

For Render deployment:
```bash
# SSH into your Render instance or use Render Shell
cd backend
node seeds/seedMessagesAdvanced.js

# Or use the API script from your local machine
API_URL=https://linkage-va-hub.onrender.com/api node scripts/populateConversations.js
```

## Cleaning Up Test Data

The seed scripts automatically clean up test accounts before creating new ones. To manually clean up:

```javascript
// In MongoDB shell or Compass
db.users.deleteMany({ email: { $regex: "@example.com$" } })
db.conversations.deleteMany({})
db.messages.deleteMany({})
```

## Troubleshooting

1. **"User not found" errors**: Run the seed script first to create test accounts
2. **Connection errors**: Check your MongoDB connection string
3. **API errors**: Ensure the backend server is running
4. **Missing conversations**: Check if you're logged in with the correct account

## Next Steps

After seeding:
1. Visit `/conversations` to see the message list
2. Click on conversations to view the detailed chat interface
3. Test sending new messages to see real-time updates
4. Try different accounts to see different perspectives (VA vs Business)
5. Use the admin account to see all conversations

Remember: These are test accounts and sample data. In production, real users will create organic conversations with actual business discussions.