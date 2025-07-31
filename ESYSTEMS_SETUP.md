# E-Systems Management Hub Setup

This document explains how to run the E-Systems version of the Linkage VA Hub application.

## Overview

The E-Systems Management Hub is an employer-focused version of the platform that shares the same database with the main VA community site but provides a different user experience:

- **Linkage VA Hub** (VA Community): http://localhost:3000 - VA-focused marketplace
- **E-Systems Management Hub** (Employer Portal): http://localhost:3001 - Employer-focused dashboard

## Key Differences

### E-Systems Mode Features:
- **Branding**: "E Systems Management" instead of "Linkage VA Hub"
- **Logo**: Custom E-Systems logo
- **Navigation**: "Members" instead of "Virtual Assistants"
- **Registration**: Only business registration allowed
- **User Flow**: Automatically redirects new users to business profile setup
- **Dashboard**: Employer-focused view

### Shared Features:
- Same database of VAs/members
- Same conversation system
- Same user authentication

## Running E-Systems Mode

### Option 1: Using the Startup Script (Recommended)

```bash
./start-esystems.sh
```

This will start both backend and frontend in E-Systems mode.

### Option 2: Manual Setup

#### Backend (Port 5001):
```bash
cd backend
npm run esystems:dev
```

#### Frontend (Port 3001):
```bash
cd frontend
npm run esystems
```

## Environment Variables

The system detects E-Systems mode through:
- `ESYSTEMS_MODE=true` environment variable
- Running on port 3001 (frontend) / 5001 (backend)

## URLs

- **E-Systems Frontend**: http://localhost:3001
- **E-Systems Backend API**: http://localhost:5001
- **Main VA Hub**: http://localhost:3000 (default)
- **Main Backend API**: http://localhost:5000 (default)

## Deployment

For production deployment, set the following environment variables:

### Backend:
```env
ESYSTEMS_MODE=true
PORT=5001
```

### Frontend:
```env
REACT_APP_API_URL=https://your-esystems-api-domain.com
PORT=3001
```

## Technical Implementation

### Backend Changes:
- `utils/esystems.js` - E-Systems detection and branding logic
- Middleware checks for E-Systems mode
- API restrictions (no VA registration in E-Systems mode)
- System branding endpoint `/api/system/branding`

### Frontend Changes:
- `BrandingContext` - Dynamic branding based on system mode
- Conditional navigation and UI elements
- Auto-redirect to business profile setup
- Dynamic logos and titles

## Database

Both systems share the same MongoDB database. No separate database setup is required.