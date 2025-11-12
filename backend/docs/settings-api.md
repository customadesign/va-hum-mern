# Settings API Documentation

## Overview

The Settings API provides a unified interface for managing system configuration and admin invitations in the Linkage VA Hub platform. It consolidates system settings management with invitation tracking for the admin panel.

## Authentication

All endpoints require admin authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

## Endpoints

### 1. Get All Settings

**Endpoint:** `GET /api/admin/settings`

**Description:** Retrieves all system configurations organized by category, along with invitation statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "configs": {
      "general": {
        "site_name": {
          "value": "Linkage VA Hub",
          "description": "The name of your platform",
          "valueType": "text",
          "isPublic": true,
          "isEditable": true
        }
        // ... more general configs
      },
      "email": { /* email configs */ },
      "security": { /* security configs */ },
      "features": { /* feature toggles */ },
      "limits": { /* system limits */ }
    },
    "invitations": {
      "stats": {
        "total": 10,
        "pending": 3,
        "accepted": 5,
        "expired": 1,
        "cancelled": 1
      },
      "recent": [ /* array of recent invitations */ ]
    },
    "metadata": {
      "totalConfigs": 45,
      "categories": ["general", "email", "security", "features", "limits"]
    }
  }
}
```

### 2. Get Specific Configuration

**Endpoint:** `GET /api/admin/settings/:key`

**Description:** Retrieves a specific configuration value by its key.

**Parameters:**
- `key` (path parameter): The configuration key (e.g., "site_name")

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "site_name",
    "value": "Linkage VA Hub",
    "description": "The name of your platform",
    "valueType": "text",
    "category": "general",
    "isPublic": true,
    "isEditable": true
  }
}
```

### 3. Update Settings

**Endpoint:** `PUT /api/admin/settings`

**Description:** Updates multiple system settings at once.

**Request Body:**
```json
{
  "configs": {
    "site_name": "My Platform",
    "registration_enabled": true,
    "max_vas_per_page": 25,
    "smtp_host": "smtp.example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "configs": { /* updated configs by category */ },
    "updated": [
      { "key": "site_name", "value": "My Platform" },
      { "key": "registration_enabled", "value": true }
    ]
  }
}
```

### 4. Update Category Settings

**Endpoint:** `PUT /api/admin/settings/category/:category`

**Description:** Updates settings for a specific category only.

**Parameters:**
- `category` (path parameter): One of: "general", "email", "security", "features", "limits"

**Request Body:**
```json
{
  "configs": {
    "registration_enabled": true,
    "messaging_enabled": true,
    "video_calls_enabled": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "features settings updated successfully",
  "data": {
    "category": "features",
    "configs": { /* updated configs for this category */ },
    "updated": [ /* array of updated configs */ ],
    "errors": [ /* array of any errors, if present */ ]
  }
}
```

### 5. Reset Category to Defaults

**Endpoint:** `POST /api/admin/settings/reset/:category`

**Description:** Resets all settings in a category to their default values.

**Parameters:**
- `category` (path parameter): One of: "general", "email", "security", "features", "limits"

**Response:**
```json
{
  "success": true,
  "message": "limits settings reset to defaults",
  "data": {
    "category": "limits",
    "configs": { /* reset configs for this category */ },
    "resetCount": 9,
    "errors": [ /* array of any errors, if present */ ]
  }
}
```

## Configuration Categories

### General
- Site name, URL, admin email
- Support email, timezone
- Maintenance mode settings

### Email
- SMTP configuration
- Email templates
- Sender information

### Security
- Password policies
- Session management
- Authentication settings
- 2FA configuration

### Features
- Registration toggles
- Module enablement
- Approval workflows

### Limits
- Pagination limits
- File size restrictions
- Rate limiting
- Content length limits

## Value Types

Configurations support the following value types:

- `text`: Short text input
- `textarea`: Multi-line text
- `email`: Email address
- `url`: URL/web address
- `number`: Numeric value
- `boolean`: True/false toggle
- `json`: JSON object
- `array`: Array of values

## Admin Invitation Management

The settings API also provides invitation statistics integrated with the settings response. For full invitation management, use the dedicated invitation endpoints:

- `GET /api/admin/invitations` - List all invitations
- `POST /api/admin/invitations` - Send new invitation
- `DELETE /api/admin/invitations/:id` - Cancel invitation
- `POST /api/admin/invitations/:id/resend` - Resend invitation

## Error Handling

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `207` - Multi-Status (partial success)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Legacy Support

The following legacy endpoints are maintained for backward compatibility:

- `GET /api/admin/config` - Get configuration (deprecated, use `/settings`)
- `PUT /api/admin/config` - Update configuration (deprecated, use `/settings`)

These endpoints will continue to work but new implementations should use the `/settings` endpoints.

## Migration Guide

To migrate from the old config endpoints to the new settings API:

1. Replace `GET /api/admin/config` with `GET /api/admin/settings`
2. The response structure has changed - configs are now organized by category
3. Update endpoints now support batch updates by category
4. New reset functionality available for restoring defaults
5. Invitation statistics are included in the main settings response

## Examples

### Initialize Settings on First Run
```javascript
// Automatically happens on first GET request
const response = await fetch('/api/admin/settings', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Update Multiple Settings
```javascript
const response = await fetch('/api/admin/settings', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    configs: {
      site_name: 'My VA Platform',
      registration_enabled: true,
      max_file_size: 20971520 // 20MB
    }
  })
});
```

### Reset Security Settings to Defaults
```javascript
const response = await fetch('/api/admin/settings/reset/security', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```