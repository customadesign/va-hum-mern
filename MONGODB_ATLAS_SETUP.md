# 🚀 MongoDB Atlas Setup Guide for Linkage VA Hub

This guide will help you connect your MERN stack application to MongoDB Atlas using your provided credentials.

## 📋 Your MongoDB Atlas Credentials

- **Cluster**: LinkageVAhub
- **Project ID**: 688a9f6ecb134566970a7765
- **Username**: marketing
- **Password**: TaNN6bttM920rEjL

## 🔧 Quick Setup (Recommended)

### Step 1: Run the Setup Script

```bash
npm run setup-mongodb
```

This script will:
- Guide you through getting your cluster URL
- Generate the complete connection string
- Create the `.env` file with all necessary variables
- Generate a secure JWT secret

### Step 2: Test the Connection

```bash
npm run test-mongodb
```

This will verify that your MongoDB Atlas connection is working properly.

## 🔧 Manual Setup

If you prefer to set up manually, follow these steps:

### Step 1: Get Your Cluster URL

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Sign in to your account
3. Click on your "LinkageVAhub" cluster
4. Click the "Connect" button
5. Choose "Connect your application"
6. Copy the connection string

### Step 2: Create Environment File

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

### Step 3: Add Environment Variables

Add the following to your `.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://marketing:TaNN6bttM920rEjL@YOUR_CLUSTER_URL/linkagevahub?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=30d

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=Linkage VA Hub

# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Replace `YOUR_CLUSTER_URL` with your actual cluster URL from Step 1.**

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Error
```
MongoServerError: Authentication failed
```
**Solution**: Verify your username and password are correct.

#### 2. Network Error
```
MongoNetworkError: getaddrinfo ENOTFOUND
```
**Solution**: Check your cluster URL format.

#### 3. Connection Refused
```
MongoNetworkError: connect ECONNREFUSED
```
**Solution**: 
- Check if your IP address is whitelisted in Atlas
- Go to Network Access in Atlas and add your IP (or 0.0.0.0/0 for all IPs)

#### 4. Environment Variables Not Found
```
MONGODB_URI is not defined
```
**Solution**: Make sure the `.env` file is in the `backend` directory.

### IP Whitelist Setup

1. Go to MongoDB Atlas Dashboard
2. Click "Network Access" in the left sidebar
3. Click "Add IP Address"
4. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
5. For production: Add specific IP addresses

## 🧪 Testing Your Setup

### Test Connection
```bash
npm run test-mongodb
```

### Test API Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## 🚀 Starting Your Application

### Install Dependencies
```bash
npm run install-all
```

### Start Development Server
```bash
npm run dev
```

This will start both:
- Backend server on http://localhost:5000
- Frontend React app on http://localhost:3000

## 📊 Database Collections

Your application will create these collections automatically:
- `users` - User accounts and authentication
- `vas` - Virtual Assistant profiles
- `businesses` - Business profiles
- `conversations` - Chat conversations
- `messages` - Individual messages
- `notifications` - User notifications
- `specialties` - VA specialties/skills
- `locations` - Geographic locations

## 🔐 Security Notes

1. **Never commit your `.env` file** - it's already in `.gitignore`
2. **Use strong JWT secrets** - the setup script generates secure ones
3. **Whitelist IP addresses** - especially for production
4. **Use environment-specific configurations** - different settings for dev/prod

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your MongoDB Atlas cluster is running
3. Test your connection string format
4. Ensure all environment variables are set correctly

## 🎉 Success!

Once everything is working, you should see:
- ✅ MongoDB connection successful
- ✅ Database operations working
- ✅ API health endpoint responding
- ✅ Frontend connecting to backend

Your Linkage VA Hub MERN stack is now ready for development! 🚀 