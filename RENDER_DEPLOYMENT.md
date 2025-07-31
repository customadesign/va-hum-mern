# Deploying Linkage VA Hub and E-Systems on Render

This guide will walk you through deploying both the VA Hub and E-Systems Management Hub on Render.

## Prerequisites

1. A GitHub account with your code pushed to a repository
2. A Render account (sign up at https://render.com)
3. Your MongoDB Atlas connection string ready

## Step 1: Prepare Your Code

1. First, initialize git in your project if you haven't already:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub and push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/linkage-va-hub.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Using render.yaml (Recommended)

1. Update the `render.yaml` file in your project root:
   - Replace `YOUR_USERNAME` with your GitHub username
   - Commit and push the changes

2. Go to https://dashboard.render.com/blueprints
3. Click "New Blueprint Instance"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` file

## Step 3: Manual Deployment (Alternative)

If you prefer to deploy manually:

### Deploy Backend

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: linkage-va-hub-api
   - **Region**: Choose closest to your users
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

5. Add Environment Variables:
   - `NODE_ENV`: production
   - `MONGODB_URI`: (your MongoDB Atlas connection string)
   - `JWT_SECRET`: (click "Generate" for a secure random value)
   - `JWT_EXPIRE`: 30d
   - `CLIENT_URL`: (leave empty for now, update after frontend deploys)
   - `PORT`: 8000
   - `RATE_LIMIT_WINDOW`: 15
   - `RATE_LIMIT_MAX`: 100

6. Click "Create Web Service"

### Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: linkage-va-hub
   - **Branch**: main
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: build

4. Add Environment Variables:
   - `REACT_APP_API_URL`: https://linkage-va-hub-api.onrender.com/api

5. Under "Redirects/Rewrites", add:
   - **Source**: /*
   - **Destination**: /index.html
   - **Action**: Rewrite

6. Click "Create Static Site"

## Step 4: Update Environment Variables

After both services are deployed:

1. Go to your backend service settings
2. Update `CLIENT_URL` to your frontend URL (e.g., https://linkage-va-hub.onrender.com)
3. The backend will automatically redeploy

## Step 5: Configure MongoDB Atlas

Make sure your MongoDB Atlas cluster allows connections from Render:

1. Go to MongoDB Atlas → Network Access
2. Add IP Address: 0.0.0.0/0 (allows access from anywhere)
3. Or use Render's static IPs (available on paid plans)

## Environment Variables Reference

### Backend (.env)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secure-secret
JWT_EXPIRE=30d
CLIENT_URL=https://your-frontend.onrender.com
PORT=8000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Optional Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Linkage VA Hub

# Optional Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

## Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Verify API endpoints are working
- [ ] Check that images and uploads work correctly
- [ ] Test real-time features (WebSocket connections)
- [ ] Monitor logs for any errors

## Troubleshooting

### CORS Issues
- Make sure `CLIENT_URL` in backend matches your frontend URL exactly
- Check that your frontend is sending requests to the correct API URL

### MongoDB Connection Issues
- Verify your MongoDB URI is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure your database user has the correct permissions

### Build Failures
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### WebSocket Issues
- Render supports WebSockets on all plans
- Make sure your frontend WebSocket URL uses wss:// in production

## Monitoring

1. Use Render's built-in logging: Dashboard → Service → Logs
2. Set up alerts for service failures
3. Monitor your MongoDB Atlas metrics

## Cost Optimization

- Render's free tier includes:
  - 750 hours/month for web services
  - 100GB bandwidth
  - Automatic SSL certificates
- Services spin down after 15 minutes of inactivity on free tier
- Consider upgrading for:
  - Always-on services
  - Custom domains
  - More resources

## Deploying E-Systems Management Hub

After your main VA Hub is deployed, you can deploy the E-Systems version:

### E-Systems Backend Service

1. Create a new Web Service in Render
2. Connect to your GitHub repository: `customadesign/va-hum-mern`
3. Configure:
   - **Name**: `esystems-backend`
   - **Root Directory**: `esystems-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### E-Systems Backend Environment Variables:
```env
NODE_ENV=production
ESYSTEMS_MODE=true
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=30d
CLIENT_URL=https://linkage-va-hub.onrender.com
ESYSTEMS_CLIENT_URL=https://esystems-management.onrender.com
EMAIL_FROM=noreply@yourdomain.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### E-Systems Frontend Service

1. Create a new Static Site in Render
2. Connect to your GitHub repository
3. Configure:
   - **Name**: `esystems-frontend`
   - **Root Directory**: `esystems-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

#### E-Systems Frontend Environment Variables:
```env
REACT_APP_API_URL=https://esystems-backend.onrender.com/api
REACT_APP_SOCKET_URL=https://esystems-backend.onrender.com
```

### Update Existing VA Hub Backend

Add this environment variable to your existing VA Hub backend:
```env
ESYSTEMS_CLIENT_URL=https://esystems-management.onrender.com
```

## Final URLs

After deployment:
- **VA Hub**: `https://linkage-va-hub.onrender.com`
- **E-Systems**: `https://esystems-management.onrender.com`

Both systems share the same database but provide different user experiences.

## Next Steps

1. Set up custom domains for both systems
2. Configure automatic deployments from GitHub
3. Set up monitoring and alerts
4. Implement CI/CD pipeline
5. Add error tracking (Sentry, LogRocket)