# VA Profile Admin Editing API Documentation

## Overview
This document describes the comprehensive VA (Virtual Assistant) profile editing functionality available to administrators. The system allows admins to edit ALL fields that VAs can edit on the frontend, plus additional admin-only fields.

## API Endpoints

### 1. Get Complete VA Profile
**Endpoint:** `GET /api/admin/vas/:id/full`  
**Authentication:** Required (Admin only)  
**Description:** Retrieves the complete VA profile with all editable fields.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "whatsapp": "+1234567890",
    "viber": "+1234567890",
    "hero": "Professional Full-Stack Developer",
    "bio": "Experienced developer with 5+ years...",
    "yearsOfExperience": 5,
    "industry": "digital_marketing",
    "skills": ["JavaScript", "React", "Node.js"],
    "certifications": ["AWS Certified", "Google Analytics"],
    "languages": [
      {
        "language": "English",
        "proficiency": "native"
      },
      {
        "language": "Spanish", 
        "proficiency": "conversational"
      }
    ],
    "preferredMinHourlyRate": 25,
    "preferredMaxHourlyRate": 50,
    "preferredMinSalary": 3000,
    "preferredMaxSalary": 5000,
    "availability": "immediately",
    "workingHours": {
      "timezone": "EST",
      "preferredHours": "9AM-5PM EST"
    },
    "location": {
      "_id": "location_id",
      "city": "New York",
      "state": "NY",
      "country": "USA"
    },
    "specialties": [/* populated specialty objects */],
    "roleLevel": {/* populated role level */},
    "roleType": {/* populated role type */},
    "website": "https://johndoe.com",
    "github": "https://github.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "avatar": "https://storage.url/avatar.jpg",
    "coverImage": "https://storage.url/cover.jpg",
    "videoIntroduction": "https://storage.url/intro.mp4",
    "portfolio": [
      {
        "title": "E-commerce Platform",
        "description": "Built a full-stack e-commerce solution",
        "url": "https://project.com",
        "image": "https://project.com/screenshot.jpg"
      }
    ],
    "searchStatus": "actively_looking",
    "status": "approved",
    "featuredAt": "2024-01-15T10:00:00Z",
    "searchScore": 85,
    "responseRate": 95,
    "conversationsCount": 42,
    "publicProfileKey": "abc123xyz",
    "discAssessment": {
      "isCompleted": true,
      "primaryType": "D",
      "scores": {
        "dominance": 75,
        "influence": 60,
        "steadiness": 45,
        "conscientiousness": 55
      },
      "completedAt": "2024-01-10T08:00:00Z"
    },
    "completionPercentage": 85,
    "profileUpdatedAt": "2024-01-15T10:00:00Z",
    "createdAt": "2023-12-01T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### 2. Update Complete VA Profile
**Endpoint:** `PUT /api/admin/vas/:id/full`  
**Authentication:** Required (Admin only)  
**Description:** Update any/all VA profile fields. Only send fields that need to be updated.

**Request Body Example:**
```json
{
  "name": "John Doe Updated",
  "bio": "Updated bio text...",
  "skills": ["JavaScript", "TypeScript", "React", "Node.js"],
  "preferredMinHourlyRate": 30,
  "status": "approved",
  "searchStatus": "actively_looking",
  "featuredAt": "2024-01-20T10:00:00Z",
  "languages": [
    {
      "language": "English",
      "proficiency": "native"
    },
    {
      "language": "Filipino",
      "proficiency": "fluent"
    }
  ],
  "portfolio": [
    {
      "title": "New Project",
      "description": "Description of the project",
      "url": "https://newproject.com",
      "image": "https://newproject.com/image.jpg"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "VA profile updated successfully",
  "data": {/* Updated VA object */},
  "changes": 5,
  "modifiedFields": ["name", "bio", "skills", "preferredMinHourlyRate", "status"]
}
```

### 3. Bulk Update VAs
**Endpoint:** `POST /api/admin/vas/bulk-update`  
**Authentication:** Required (Admin only)  
**Description:** Update multiple VAs with the same changes.

**Request Body:**
```json
{
  "vaIds": ["va_id_1", "va_id_2", "va_id_3"],
  "updates": {
    "status": "approved",
    "searchStatus": "actively_looking",
    "productAnnouncementNotifications": true
  }
}
```

**Allowed Bulk Update Fields:**
- `status`
- `searchStatus`
- `featured`
- `productAnnouncementNotifications`
- `profileReminderNotifications`

### 4. Update VA Media
**Endpoint:** `POST /api/admin/vas/:id/media`  
**Authentication:** Required (Admin only)  
**Description:** Update VA media files (avatar, cover image, video).

**Request:** Multipart form data with files OR JSON with URLs
```json
{
  "avatar": "https://new-avatar-url.jpg",
  "coverImage": "https://new-cover-url.jpg",
  "videoIntroduction": "https://new-video-url.mp4"
}
```

### 5. Get VA Edit History
**Endpoint:** `GET /api/admin/vas/:id/history`  
**Authentication:** Required (Admin only)  
**Description:** Get audit log of VA profile edits.

### 6. Toggle Featured Status
**Endpoint:** `POST /api/admin/vas/:id/toggle-featured`  
**Authentication:** Required (Admin only)  
**Description:** Toggle VA featured status.

## Editable Fields

### Basic Information
- `name` - VA's full name
- `email` - Contact email
- `phone` - Phone number
- `whatsapp` - WhatsApp number
- `viber` - Viber number
- `hero` - Tagline/hero text
- `bio` - Full biography

### Professional Information
- `yearsOfExperience` - Years of professional experience
- `industry` - Industry specialization
- `skills` - Array of skills
- `certifications` - Array of certifications
- `languages` - Array of language objects with proficiency

### Rates & Availability
- `preferredMinHourlyRate` - Minimum hourly rate in USD
- `preferredMaxHourlyRate` - Maximum hourly rate in USD
- `preferredMinSalary` - Minimum monthly salary in USD
- `preferredMaxSalary` - Maximum monthly salary in USD
- `availability` - Availability status (immediately/within_week/within_month/not_available)
- `workingHours` - Object with timezone and preferredHours

### Location & References
- `location` - Location ID or object
- `specialties` - Array of specialty IDs
- `roleLevel` - Role level ID
- `roleType` - Role type ID

### Social & Links
- `website` - Personal website URL
- `github` - GitHub profile URL
- `gitlab` - GitLab profile URL
- `linkedin` - LinkedIn profile URL
- `twitter` - Twitter profile URL
- `meta` - Meta profile URL
- `instagram` - Instagram profile URL
- `mastodon` - Mastodon profile URL
- `stackoverflow` - Stack Overflow profile URL
- `schedulingLink` - Calendly or similar scheduling link

### Media
- `avatar` - Profile picture URL
- `coverImage` - Cover image URL
- `videoIntroduction` - Introduction video URL
- `videoTranscription` - Transcribed text from video
- `portfolio` - Array of portfolio items

### Status & Settings (Admin-only)
- `searchStatus` - Search visibility status
- `status` - Profile approval status (approved/rejected/suspended)
- `sourceContributor` - Boolean flag for source contributors
- `productAnnouncementNotifications` - Email notification preference
- `profileReminderNotifications` - Profile reminder preference
- `featuredAt` - Date when VA was featured
- `searchScore` - Search ranking score (0-100)
- `responseRate` - Response rate percentage (0-100)
- `conversationsCount` - Number of conversations

### DISC Assessment
- `discAssessment` - Complete DISC personality assessment object

## Frontend Implementation

The admin panel includes a comprehensive VA editing modal with the following tabs:

1. **Basic Info** - Name, contact details, bio
2. **Professional** - Skills, experience, certifications, languages
3. **Rates & Availability** - Hourly rates, salary, availability, working hours
4. **Social & Links** - All social media and professional links
5. **Media** - Avatar, cover image, video introduction
6. **Admin Settings** - Status, search settings, featured status, metrics

## Security Considerations

1. **Authentication**: All endpoints require admin authentication
2. **Validation**: Input validation for email formats, URLs, and data types
3. **Audit Trail**: All changes are logged with admin ID and timestamp
4. **Media Security**: File uploads are validated for type and size
5. **Rate Limiting**: Media upload endpoints have rate limiting

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (development only)"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - VA not found
- `500` - Server error

## Usage Examples

### Example 1: Update VA Professional Info
```javascript
const response = await adminAPI.updateVAFullProfile(vaId, {
  yearsOfExperience: 6,
  skills: ['JavaScript', 'TypeScript', 'React', 'Vue.js', 'Node.js'],
  certifications: ['AWS Solutions Architect', 'MongoDB Certified'],
  industry: 'saas'
});
```

### Example 2: Feature a VA
```javascript
await adminAPI.toggleVAFeatured(vaId);
```

### Example 3: Bulk Approve VAs
```javascript
await adminAPI.bulkUpdateVAs({
  vaIds: ['id1', 'id2', 'id3'],
  updates: {
    status: 'approved',
    searchStatus: 'actively_looking'
  }
});
```

## Notes

- Changes trigger profile update timestamp
- Completion percentage is automatically calculated
- Some fields may trigger additional actions (e.g., video upload triggers transcription)
- Location can be passed as ID or as object for creation
- Skills and certifications are automatically cleaned and trimmed