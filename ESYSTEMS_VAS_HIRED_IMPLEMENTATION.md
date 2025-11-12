# eSystems VAs Hired Widget Implementation

## Overview
Implemented a brand-specific dashboard change for the eSystems tenant that replaces the Profile Views section with a new "VAs Hired" widget, while preserving Profile Views for all other brands.

## Key Features
- ✅ Brand-specific conditional rendering based on `branding.isESystemsMode`
- ✅ VAs Hired widget with summary counts (Total, Active, Considering, Past)
- ✅ Filter tabs for status-based filtering
- ✅ Recent engagements list with VA details
- ✅ Responsive design matching existing dashboard cards
- ✅ Loading states, error handling, and empty states
- ✅ Analytics tracking for eSystems-specific events
- ✅ Full backend API with engagement model and routes
- ✅ React Query hooks for data management
- ✅ Unit tests for components and hooks
- ✅ Playwright tests for cross-brand verification

## Modified Files

### Frontend Changes
- **`frontend/src/pages/Dashboard.js`**
  - Added import for VAsHiredWidget
  - Updated conditional rendering logic to show VAsHiredWidget for eSystems and preserve ProfileViewsWidget for other brands

- **`frontend/src/App.js`**
  - Added import for Engagements page
  - Added route for `/engagements` page

### New Frontend Files
- **`frontend/src/components/vas/VAsHiredWidget.jsx`**
  - Main widget component with summary counts, filter tabs, and engagement list
  - Responsive design with loading, error, and empty states
  - Analytics tracking for user interactions
  - Status pills and VA profile links

- **`frontend/src/components/vas/VAsHiredWidget.test.jsx`**
  - Comprehensive unit tests for widget functionality
  - Tests for loading, error, empty, and populated states
  - Filter interaction and action button tests

- **`frontend/src/hooks/useVAEngagements.js`**
  - React Query hooks for engagement data fetching
  - `useEngagementSummary()` - fetches status counts
  - `useEngagementsList()` - fetches paginated engagements
  - `useVAEngagements()` - combined hook for dashboard widget
  - Cache management and error handling

- **`frontend/src/hooks/useVAEngagements.test.js`**
  - Unit tests for all hook functions
  - API mocking and error handling tests
  - Parameter validation tests

- **`frontend/src/pages/Engagements.js`**
  - Full engagements list page for "View all" navigation
  - Filtering, search, and pagination functionality
  - eSystems-only access control

- **`frontend/src/tests/vas-hired-widget.spec.js`**
  - Playwright tests for both eSystems (port 3002) and default Linkage (port 3000)
  - Cross-brand verification that eSystems shows VAs Hired and Linkage shows Profile Views
  - Widget functionality tests (filtering, navigation, error states)

### Backend Changes
- **`backend/server.js`**
  - Added route registration for `/api/v1/engagements`

### New Backend Files
- **`backend/models/Engagement.js`**
  - Mongoose model for engagement data
  - Fields: clientId, vaId, status, contract details, timestamps
  - Aggregation methods for status counts
  - Virtual fields for contract duration and status
  - Proper indexing for query performance

- **`backend/routes/engagements.js`**
  - GET `/api/v1/engagements/summary` - returns status counts for authenticated client
  - GET `/api/v1/engagements` - returns paginated engagements with filtering
  - GET `/api/v1/engagements/:id` - returns specific engagement details
  - POST `/api/v1/engagements` - creates new engagement
  - Proper authentication and authorization middleware
  - Input validation and error handling

- **`backend/seeds/seedEngagements.js`**
  - Sample data generation script
  - Creates realistic engagement data for testing
  - Multiple statuses and contract variations

## API Endpoints

### GET /api/v1/engagements/summary
Returns engagement counts by status for the authenticated client.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 12,
    "active": 5,
    "considering": 3,
    "past": 4
  }
}
```

### GET /api/v1/engagements
Returns paginated list of engagements with filtering options.

**Query Parameters:**
- `scope`: 'client' | 'va' (default: 'client')
- `status`: 'all' | 'active' | 'considering' | 'past' | 'paused' (default: 'all')
- `limit`: 1-100 (default: 5)
- `page`: positive integer (default: 1)
- `sort`: 'recent' | 'oldest' | 'status' | 'name' (default: 'recent')

**Response:**
```json
{
  "success": true,
  "data": {
    "engagements": [
      {
        "id": "engagement_id",
        "status": "active",
        "va": {
          "id": "va_id",
          "fullName": "John Doe",
          "avatarUrl": "avatar_url",
          "title": "Frontend Developer"
        },
        "contract": {
          "startDate": "2024-01-15",
          "endDate": null,
          "hoursPerWeek": 40,
          "rate": 25
        },
        "lastActivityAt": "2024-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 12,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Branding Logic
The widget uses `branding.isESystemsMode` to determine when to show:
- **eSystems (port 3002)**: Shows VAs Hired widget
- **Default Linkage (port 3000)**: Shows Profile Views widget for VAs, stats card for business users

## Analytics Events
All events are namespaced with `esystems_` prefix:
- `esystems_vas_hired_widget_impression` - Widget view
- `esystems_vas_hired_filter_change` - Filter tab changes
- `esystems_vas_hired_view_all_click` - "View all" link clicks
- `esystems_engagement_details_click` - Engagement details button clicks
- `esystems_engagement_message_click` - Message button clicks

## Testing
- ✅ Unit tests with Jest and React Testing Library
- ✅ Playwright e2e tests for both brands
- ✅ Sample data seeded for testing

## Deployment Notes
1. Ensure eSystems instance sets `branding.isESystemsMode = true`
2. Run engagement seeding script for sample data: `node backend/seeds/seedEngagements.js`
3. Verify ports: eSystems on 3002, Linkage on 3000
4. Test both dashboards to confirm widget swap functionality

## Definition of Done ✅
- [x] eSystems at http://localhost:3002/dashboard shows VAs Hired widget instead of Profile Views
- [x] Other brands continue to show Profile Views widget
- [x] Widget displays real data with summary counts and recent engagements list
- [x] Supports filtering and navigation to full list page
- [x] Adheres to branding, accessibility, and performance requirements
- [x] Includes passing unit and Playwright tests
- [x] Complete backend API with proper authentication and data models
- [x] Analytics tracking for user interactions
- [x] Responsive design and error handling
