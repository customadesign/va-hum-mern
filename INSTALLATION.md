# Complete Installation Guide - Linkage VA Hub MERN Stack

## Prerequisites

Before starting, ensure you have the following installed:
- Node.js 16+ (check with `node --version`)
- MongoDB 4.4+ (check with `mongod --version`)
- npm 7+ (check with `npm --version`)

## Step 1: Clone/Download the Project

If you haven't already, navigate to your project directory:
```bash
cd "/Users/harrymurphy/Library/Mobile Documents/com~apple~CloudDocs/Coding Projects/Linkage VA Hub MERN Stack"
```

## Step 2: Install All Dependencies

Run this command from the root directory to install all dependencies for both frontend and backend:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

## Step 3: Environment Configuration

### Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create the .env file:
   ```bash
   cp .env.example .env
   ```

3. Edit the .env file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/linkage-va-hub

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=30d

   # Email Configuration (using Gmail as example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-specific-password
   EMAIL_FROM=noreply@linkagewebsolutions.com

   # Frontend URL
   CLIENT_URL=http://localhost:3000

   # Rate Limiting
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100

   # Session Secret
   SESSION_SECRET=your-session-secret-key-change-this
   ```

### Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Create the .env file:
   ```bash
   cp .env.example .env
   ```

3. Edit the .env file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   REACT_APP_NAME=Linkage VA Hub
   REACT_APP_DESCRIPTION=Connect with talented Filipino virtual assistants
   ```

## Step 4: Database Setup

1. Make sure MongoDB is running:
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community

   # On Linux
   sudo systemctl start mongod

   # On Windows
   # MongoDB should start automatically as a service
   ```

2. Verify MongoDB is running:
   ```bash
   mongosh
   ```
   Then exit with `exit`

## Step 5: Create Upload Directory

The backend needs an uploads directory for file storage:

```bash
cd ../backend
mkdir -p uploads
```

## Step 6: Run the Application

### Option 1: Run Both Servers Together (Recommended)

From the root directory:
```bash
cd ..
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend server on http://localhost:3000

### Option 2: Run Servers Separately

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

## Step 7: Verify Installation

1. Backend Health Check:
   Open http://localhost:5000/health
   You should see:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "environment": "development"
   }
   ```

2. Frontend:
   Open http://localhost:3000
   You should see the Linkage VA Hub homepage

## Step 8: Create Your First Account

1. Click "Get started" or go to http://localhost:3000/register
2. Enter your email and password
3. Choose whether you're a VA or Business
4. Complete your profile

## Common Issues and Solutions

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running (see Step 4)

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: 
- Kill the process using the port: `lsof -i :5000` then `kill -9 <PID>`
- Or change the PORT in .env file

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Make sure CLIENT_URL in backend .env matches your frontend URL

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution**: Run `npm install` in the appropriate directory

## Seed Data (Optional)

To add sample data for testing:

1. Create a seed script in backend/seeds/index.js
2. Run: `cd backend && node seeds/index.js`

## Production Deployment

For production deployment:

1. Backend:
   - Set NODE_ENV=production
   - Use a secure JWT_SECRET
   - Configure proper email service
   - Set up MongoDB Atlas or production MongoDB
   - Use PM2 or similar for process management

2. Frontend:
   - Run `npm run build`
   - Serve the build folder with a web server
   - Update REACT_APP_API_URL to production backend URL

## Additional Features

To match the Ruby on Rails version completely, you may want to add:

1. **Image Upload to Cloud**: 
   - Install Cloudinary: `npm install cloudinary multer-storage-cloudinary`
   - Configure Cloudinary in backend

2. **Email Templates**:
   - Create HTML email templates
   - Use a service like SendGrid for production

3. **Background Jobs**:
   - Install Bull: `npm install bull`
   - Set up Redis for job queue

4. **Testing**:
   - Backend: `npm test`
   - Frontend: `npm test`

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that MongoDB is running

The application is now ready to use on http://localhost:3000!