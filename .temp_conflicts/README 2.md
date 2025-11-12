# Linkage VA Hub Admin Panel

A comprehensive admin interface for managing the Linkage VA Hub platform, including VAs from Linkage VA Hub and businesses from E-Systems.

## Features

- **Dashboard**: Real-time platform statistics and analytics
- **VA Management**: Complete control over virtual assistant profiles
- **Business Management**: Manage businesses from both platforms
- **User Management**: User roles, permissions, and account control
- **Authentication**: Secure admin access with JWT sessions and LinkedIn SSO
- **Responsive Design**: Mobile-friendly admin interface

## Tech Stack

- **Frontend**: React 18.2, Tailwind CSS, React Query
- **Authentication**: JWT session tokens + LinkedIn OAuth
- **Charts**: Chart.js with React ChartJS 2
- **Icons**: Heroicons
- **Notifications**: React Toastify
- **Deployment**: Render.com

## Getting Started

### Prerequisites

- Node.js 16+
- Access to the backend API
- Admin credentials on the backend API (JWT/LinkedIn enabled)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Update environment variables:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_SOCKET_URL=http://localhost:8000
   REACT_APP_BRAND=admin
   REACT_APP_NAME=Linkage VA Hub Admin
   ```

4. Start development server:
   ```bash
   npm start
   ```

The admin panel will be available at `http://localhost:3000`

## Deployment

### Render.com Deployment

1. Connect your repository to Render
2. Use the `render-admin.yaml` configuration
3. Set environment variables in Render dashboard
4. Deploy to `admin.linkagevahub.com`

### Environment Variables (Production)

```env
NODE_ENV=production
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
REACT_APP_SOCKET_URL=https://linkage-va-hub-api.onrender.com
REACT_APP_BRAND=admin
REACT_APP_NAME=Linkage VA Hub Admin
```

## Admin Features

### Dashboard
- Platform statistics (VAs, businesses, users)
- Real-time activity feed
- Registration trends chart
- Quick action buttons

### VA Management
- View all virtual assistants
- Search and filter by skills, location, status
- Approve/suspend/delete VAs
- Bulk actions for multiple VAs
- Detailed VA profile modal

### Business Management
- Manage businesses from both platforms
- Filter by company size, industry, platform
- View detailed business information
- Approve/suspend business accounts
- LinkedIn profile integration

### User Management
- All platform users overview
- Role management (Admin, VA, Business)
- Account suspension controls
- User search and filtering

## Authentication & Security

### Admin Access Control
- JWT-based authentication
- Role-based access (admin flag required)
- Automatic redirect for unauthorized users
- Session management

### API Security
- JWT token authentication
- Request interceptors for auth headers
- Error handling for 401/403 responses
- Automatic logout on auth failure

## API Integration

### Admin Endpoints
```javascript
// Dashboard
GET /api/admin/stats
GET /api/admin/dashboard

// User Management
GET /api/admin/users
PUT /api/admin/users/:id/suspend
PUT /api/admin/users/:id/admin

// VA Management (via existing endpoints)
GET /api/vas
PUT /api/vas/:id
DELETE /api/vas/:id

// Business Management (via existing endpoints)
GET /api/businesses
PUT /api/businesses/:id
DELETE /api/businesses/:id
```

## UI Components

### Custom CSS Classes
- `admin-card`: Standard card component
- `admin-button-*`: Button variants (primary, secondary, danger, success)
- `admin-input`: Form input styling
- `admin-table`: Table components
- `admin-badge-*`: Status badges
- `admin-modal-*`: Modal components

### Color Scheme
- **Primary**: Blue (#3b82f6)
- **Admin**: Slate gray (#64748b)
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f59e0b)
- **Danger**: Red (#ef4444)

## Development

### Project Structure
```
admin-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   └── layout/
│   ├── pages/
│   ├── services/
│   └── styles/
├── package.json
├── tailwind.config.js
└── render-admin.yaml
```

### Available Scripts
- `npm start`: Development server
- `npm run build`: Production build
- `npm test`: Run tests
- `npm run serve`: Serve production build

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Confirm admin account exists with `admin: true`
   - Ensure JWT token/refresh endpoints are reachable
   - Verify LinkedIn OAuth credentials in the backend

2. **API Connection Issues**
   - Verify REACT_APP_API_URL is correct
   - Check backend server is running
   - Confirm CORS settings allow admin domain

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check for TypeScript errors
   - Verify all dependencies are compatible

### Support

For technical support or questions about the admin panel:
1. Check the backend API documentation
2. Review backend authentication configuration
3. Review browser console for errors
4. Check network requests in developer tools

## Security Notes

- Admin panel requires the `admin` flag on the user record
- All API requests include authentication headers
- Sensitive operations require confirmation
- Session timeout and automatic logout
- HTTPS required in production

## Future Enhancements

- Advanced analytics dashboard
- Bulk operations for all entities
- Export functionality for data
- Real-time notifications
- Advanced filtering options
- Audit log tracking
