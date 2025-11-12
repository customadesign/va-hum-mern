# Profile Views Analytics Feature

## Overview

The Profile Views Analytics feature provides comprehensive tracking and reporting of VA profile views with deduplication, bot filtering, and detailed analytics.

## Features

- **View Tracking**: Track both authenticated and anonymous profile views
- **Deduplication**: Prevents counting the same viewer multiple times within a 30-minute window
- **Bot Filtering**: Automatically filters out bot/crawler views
- **Self-View Rejection**: Prevents VAs from inflating their own view counts
- **Privacy Protection**: IP addresses are hashed with salt, never stored raw
- **Analytics Endpoints**: Summary, time-series, and referrer data
- **Caching**: Built-in 60-second cache for improved performance
- **Authorization**: VAs can only see their own data; admins can see all data

## Environment Variables

Add these to your `.env` file:

```bash
ANALYTICS_PROFILE_VIEWS_ENABLED=true
PROFILE_VIEWS_DEDUP_MINUTES=30
IP_HASH_SALT=your-secure-random-salt-here
```

**Important**: Change `IP_HASH_SALT` to a secure random value in production.

## API Endpoints

### 1. Track Profile View

Track a profile view (supports both authenticated and anonymous users).

**Endpoint**: `POST /api/analytics/profile-views/track`

**Authentication**: Optional

**Rate Limiting**: Yes (general API rate limit)

**Request Body**:
```json
{
  "vaId": "user_id_here",
  "referrer": "https://google.com",
  "sessionId": "optional_session_id"
}
```

**Response**:
```json
{
  "success": true,
  "tracked": true,
  "duplicate": false
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/api/analytics/profile-views/track \
  -H "Content-Type: application/json" \
  -d '{
    "vaId": "6789...",
    "referrer": "https://google.com"
  }'
```

### 2. Get Summary Statistics

Get summary statistics for profile views.

**Endpoint**: `GET /api/analytics/profile-views/summary`

**Authentication**: Required

**Query Parameters**:
- `vaId` (required): User ID of VA, or "me" for current user
- `from` (optional): Start date (ISO 8601 format). Default: 30 days ago
- `to` (optional): End date (ISO 8601 format). Default: now
- `unique` (optional): Count unique viewers only. Default: false

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 245,
    "uniqueTotal": 187,
    "firstViewAt": "2025-01-01T12:00:00.000Z",
    "lastViewAt": "2025-01-30T18:30:00.000Z",
    "trend": 15.3,
    "period": {
      "from": "2025-01-01T00:00:00.000Z",
      "to": "2025-01-30T23:59:59.999Z"
    },
    "cached": false
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:8000/api/analytics/profile-views/summary?vaId=me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Time Series Data

Get time-series data for profile views.

**Endpoint**: `GET /api/analytics/profile-views/series`

**Authentication**: Required

**Query Parameters**:
- `vaId` (required): User ID of VA, or "me" for current user
- `from` (optional): Start date. Default: 30 days ago
- `to` (optional): End date. Default: now
- `interval` (optional): Time interval - "hour", "day", "week", "month". Default: "day"
- `unique` (optional): Count unique viewers only. Default: false

**Response**:
```json
{
  "success": true,
  "data": {
    "series": [
      {
        "period": {
          "year": 2025,
          "month": 1,
          "day": 27
        },
        "count": 12
      },
      {
        "period": {
          "year": 2025,
          "month": 1,
          "day": 28
        },
        "count": 15
      }
    ],
    "interval": "day",
    "period": {
      "from": "2025-01-01T00:00:00.000Z",
      "to": "2025-01-30T23:59:59.999Z"
    },
    "cached": false
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:8000/api/analytics/profile-views/series?vaId=me&interval=day" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Top Referrers

Get top referrers for profile views.

**Endpoint**: `GET /api/analytics/profile-views/referrers`

**Authentication**: Required

**Query Parameters**:
- `vaId` (required): User ID of VA, or "me" for current user
- `from` (optional): Start date. Default: 30 days ago
- `to` (optional): End date. Default: now
- `limit` (optional): Maximum referrers to return (1-100). Default: 10

**Response**:
```json
{
  "success": true,
  "data": {
    "referrers": [
      {
        "referrer": "https://google.com",
        "count": 45
      },
      {
        "referrer": "https://linkedin.com",
        "count": 32
      }
    ],
    "directTraffic": 78,
    "period": {
      "from": "2025-01-01T00:00:00.000Z",
      "to": "2025-01-30T23:59:59.999Z"
    },
    "cached": false
  }
}
```

**Example**:
```bash
curl -X GET "http://localhost:8000/api/analytics/profile-views/referrers?vaId=me&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Schema

### ProfileView Model

```javascript
{
  va: ObjectId,              // Reference to User (VA)
  viewerUser: ObjectId,      // Optional: authenticated viewer
  anonId: String,            // Optional: anonymous viewer ID
  sessionId: String,         // Optional: session ID
  referrer: String,          // Optional: referrer URL
  userAgent: String,         // Optional: user agent
  ipHash: String,            // Hashed IP address
  dedupHash: String,         // Deduplication hash (unique)
  createdAt: Date            // When view occurred
}
```

**Indexes**:
- `{ va: 1, createdAt: -1 }`
- `{ va: 1, viewerUser: 1, createdAt: -1 }`
- `{ va: 1, anonId: 1, createdAt: -1 }`
- `{ dedupHash: 1 }` (unique)

## Setup & Testing

### 1. Create Test Users

Run the seed script to create test users:

```bash
node scripts/seedTestUsers.js
```

This creates:
- **VA Test User**: `va.test@example.com` / `Test1234!`
- **Client Test User**: `client.test@example.com` / `Test1234!`

### 2. Run Tests

```bash
npm test tests/analytics.test.js
```

### 3. Manual Testing

#### Track a view (anonymous):
```bash
curl -X POST http://localhost:8000/api/analytics/profile-views/track \
  -H "Content-Type: application/json" \
  -d '{
    "vaId": "YOUR_VA_USER_ID",
    "referrer": "https://google.com"
  }'
```

#### Track a view (authenticated):
```bash
curl -X POST http://localhost:8000/api/analytics/profile-views/track \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "vaId": "YOUR_VA_USER_ID"
  }'
```

#### Get summary:
```bash
curl -X GET "http://localhost:8000/api/analytics/profile-views/summary?vaId=me" \
  -H "Authorization: Bearer YOUR_VA_TOKEN"
```

## Security Features

1. **IP Hashing**: Raw IP addresses are never stored. They're hashed with a salt before storage.

2. **Self-View Rejection**: VAs cannot inflate their own view counts.

3. **Bot Filtering**: Common bot user agents are automatically filtered.

4. **Deduplication**: Same viewer counted only once per time window (default: 30 minutes).

5. **Authorization**: VAs can only access their own analytics. Admins can access all.

6. **Rate Limiting**: Track endpoint is rate-limited to prevent abuse.

7. **Privacy Settings**: Views are only tracked for public VA profiles (searchStatus !== 'invisible').

## Performance Optimizations

1. **Caching**: Query results cached for 60 seconds
2. **Indexes**: MongoDB indexes for efficient queries
3. **Aggregation**: Uses MongoDB aggregation pipelines for complex queries
4. **Deduplication**: Prevents unnecessary database growth

## Troubleshooting

### Views not being tracked

1. Check that `ANALYTICS_PROFILE_VIEWS_ENABLED=true` in `.env`
2. Verify VA profile exists and is public
3. Check for bot user agent
4. Verify not a self-view
5. Check if within deduplication window

### Authorization errors

1. Ensure valid JWT token in Authorization header
2. For `vaId=me`, user must be authenticated
3. Non-admin users can only view their own data

### Performance issues

1. Check MongoDB indexes are created
2. Verify cache is working (check `cached: true` in responses)
3. Consider adjusting date ranges for large datasets
4. Use `unique=false` for faster queries when exact uniqueness isn't required

## Future Enhancements

- [ ] Geographic location tracking
- [ ] Device/browser analytics
- [ ] Conversion tracking (view → message)
- [ ] Export analytics data (CSV, PDF)
- [ ] Real-time view notifications
- [ ] Viewer demographics (for authenticated viewers)
- [ ] Comparison with similar VAs
- [ ] Custom date range presets

## Migration Notes

If you have existing VA users:

1. Profile views will start at 0 for all VAs
2. The `stats.profileViews` field in User model is incremented with each new view
3. Historical views before this feature are not available
4. Consider running a backfill script if you have historical view data

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Test with the provided seed users
4. Run the test suite to ensure everything is working