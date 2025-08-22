# Admin Frontend Deployment

## Production URLs
- **Admin Frontend**: https://admin-3pxa.onrender.com
- **API Backend**: https://linkage-va-hub-api.onrender.com
- **Main Frontend**: https://linkage-va-hub.onrender.com

## Deployment Configuration

### Render Service Details
- **Service Name**: admin
- **Service URL**: https://admin-3pxa.onrender.com
- **Repository**: https://github.com/customadesign/va-hum-mern
- **Branch**: main
- **Root Directory**: admin-frontend

### Build Settings
```bash
# Build Command
cd admin-frontend && npm install && npm run build

# Start Command  
cd admin-frontend && npx serve -s build -l $PORT
```

### Environment Variables (Set in Render Dashboard)
```
NODE_ENV=production
REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
REACT_APP_SOCKET_URL=https://linkage-va-hub-api.onrender.com
REACT_APP_BRAND=admin
REACT_APP_NAME=Linkage VA Hub Admin
```

Optional (if using Clerk):
```
REACT_APP_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
```

## Creating Admin Users

### Option 1: Direct Database Creation
```bash
# Run locally with production MongoDB URI
node create-admin-user.js
```

### Option 2: Using Admin Invitation System
1. An existing admin can invite new admins from the Settings page
2. New admin receives invitation link via email
3. They complete registration through the invitation flow

## Testing the Deployment

Run the verification script:
```bash
./verify-admin-deployment.sh
```

Or manually check:
1. Visit https://admin-3pxa.onrender.com
2. You should see the login page
3. Login with your admin credentials

## Features Available

### Admin Dashboard
- User management (view, edit, delete users)
- VA management (approve/reject applications, manage VAs)
- Business management (manage business accounts)
- Analytics (user statistics, growth metrics)
- Admin invitation system

### Security Features
- Role-based access control
- Admin-only routes
- Secure invitation system
- Session management

## Troubleshooting

### If login fails:
1. Check that the API is running: https://linkage-va-hub-api.onrender.com/api/health
2. Verify environment variables in Render dashboard
3. Check browser console for errors
4. Ensure your user has admin role in database

### If page doesn't load:
1. Check Render logs for build errors
2. Verify all dependencies are installed
3. Check that the build command succeeded
4. Ensure PORT environment variable is available

### Common Issues:
- **CORS errors**: Verify REACT_APP_API_URL is set correctly
- **404 on refresh**: The serve command should handle client-side routing
- **Authentication issues**: Check JWT_SECRET matches between frontend and backend

## Monitoring

Check deployment status:
- Render Dashboard: https://dashboard.render.com
- Service Logs: Available in Render dashboard
- Health Check: https://admin-3pxa.onrender.com

## Updates and Maintenance

To deploy updates:
1. Push changes to GitHub main branch
2. Render will automatically rebuild and deploy
3. Monitor deployment in Render dashboard

## Support

For issues:
1. Check Render service logs
2. Run verification script
3. Review environment variables
4. Check API health endpoint