# Quick Start: Profile Views Analytics

Get the Profile Views Analytics feature up and running in 5 minutes.

## Step 1: Add Environment Variables

Add these lines to your `.env` file:

```bash
ANALYTICS_PROFILE_VIEWS_ENABLED=true
PROFILE_VIEWS_DEDUP_MINUTES=30
IP_HASH_SALT=change-this-to-a-secure-random-string-in-production
```

**⚠️ Security Note**: In production, generate a secure random string for `IP_HASH_SALT`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Verify Integration

Run the integration test to ensure everything loads correctly:

```bash
node test-analytics-integration.js
```

You should see: `✓ All integration tests passed!`

## Step 3: Create Test Users

Run the seed script to create test accounts:

```bash
node scripts/seedTestUsers.js
```

This creates:
- **VA User**: `va.test@example.com` / `Test1234!`
- **Client User**: `client.test@example.com` / `Test1234!`

## Step 4: Start the Server

```bash
npm start
```

The server should start on port 8000. Look for analytics routes in the startup logs.

## Step 5: Test the API

### Get an auth token:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "va.test@example.com",
    "password": "Test1234!"
  }'
```

Save the `token` from the response.

### Track a profile view:

```bash
curl -X POST http://localhost:8000/api/analytics/profile-views/track \
  -H "Content-Type: application/json" \
  -d '{
    "vaId": "YOUR_VA_USER_ID_FROM_SEED_OUTPUT",
    "referrer": "https://google.com"
  }'
```

### Get analytics summary:

```bash
curl -X GET "http://localhost:8000/api/analytics/profile-views/summary?vaId=me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 6: Run Tests (Optional)

```bash
npm test tests/analytics.test.js
```

## That's It! 🎉

Your Profile Views Analytics feature is now running.

## What's Next?

- Read the full documentation: `PROFILE_VIEWS_ANALYTICS.md`
- Review the implementation: `IMPLEMENTATION_SUMMARY.md`
- Integrate with your frontend
- Monitor performance and adjust cache settings if needed

## Troubleshooting

### "VA ID is required" error
Make sure to include `vaId` in the request body for tracking, or use `?vaId=me` for summary endpoints.

### 401 Unauthorized
Verify your JWT token is valid and included in the `Authorization: Bearer TOKEN` header.

### 403 Forbidden
Non-admin users can only view their own analytics. Make sure `vaId=me` or matches the authenticated user.

### Views not tracking
1. Check `ANALYTICS_PROFILE_VIEWS_ENABLED=true` in `.env`
2. Verify VA profile is public (not invisible)
3. Check you're not tracking your own profile (self-views are rejected)
4. Ensure user agent is not a bot

## Quick Reference

**Track View**: `POST /api/analytics/profile-views/track`
**Summary**: `GET /api/analytics/profile-views/summary?vaId=me`
**Series**: `GET /api/analytics/profile-views/series?vaId=me&interval=day`
**Referrers**: `GET /api/analytics/profile-views/referrers?vaId=me`

For detailed API documentation, see `PROFILE_VIEWS_ANALYTICS.md`.