# VA Hub MERN Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone and Setup Dependencies

```bash
git clone https://github.com/customadesign/va-hum-mern.git
cd va-hum-mern
./fix-dependencies.sh
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp backend/env.example backend/.env
```

**Required Environment Variables:**

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
```

### 3. Development Modes

#### Option A: Basic Development (Frontend + Backend)
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

#### Option B: Full Multi-Service Setup
```bash
./start-all-services.sh
```
- Linkage Frontend: http://localhost:3000
- E-Systems Frontend: http://localhost:3001  
- Admin Frontend: http://localhost:4000
- Main Backend: http://localhost:5000
- E-Systems Backend: http://localhost:5001

#### Option C: Individual Services
```bash
# Linkage mode
./start-linkage.sh

# E-Systems mode  
./start-esystems.sh

# Admin only
./start-admin.sh
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Dependency Resolution Errors
```bash
# Clean all dependencies and reinstall
./fix-dependencies.sh
```

#### 2. Port Already in Use
```bash
# Kill processes on ports
lsof -ti:3000,3001,4000,5000,5001 | xargs kill -9
```

#### 3. MongoDB Connection Issues
- Verify MongoDB URI format
- Check network access/IP whitelist
- Ensure database user has proper permissions

#### 4. Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Remove all node_modules
find . -name "node_modules" -type d -exec rm -rf {} +
find . -name "package-lock.json" -delete

# Reinstall
./fix-dependencies.sh
```

## 📁 Project Structure

```
va-hum-mern/
├── backend/              # Main API server
├── frontend/             # Linkage VA Hub frontend  
├── admin-frontend/       # Admin dashboard
├── esystems-frontend/    # E-Systems frontend
├── esystems-backend/     # E-Systems backend
├── render.yaml          # Render.com deployment
├── render-esystems.yaml # E-Systems deployment
├── render-admin.yaml    # Admin deployment
└── start-*.sh           # Development scripts
```

## 🌐 Deployment

### Render.com Deployment

1. **Backend API**: Deploys from `render.yaml`
2. **Frontend**: Builds and serves React app
3. **Admin**: Separate admin dashboard service

### Environment Variables for Production

Set these in your Render dashboard:

```
MONGODB_URI=<your_atlas_connection_string>
JWT_SECRET=<generate_secure_random_string>
SUPABASE_URL=<your_supabase_url>
SUPABASE_ANON_KEY=<your_supabase_key>
```

## 🔍 Application Features

### Core Components
- **User Authentication**: JWT + Clerk integration
- **Virtual Assistant Marketplace**: VA profiles and matching
- **Real-time Chat**: Socket.io messaging
- **File Uploads**: Supabase storage integration
- **Video Calls**: VideoSDK integration
- **Admin Dashboard**: User and content management
- **Dual Branding**: Linkage VA Hub + E-Systems modes

### API Endpoints
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/vas/*` - Virtual assistant profiles
- `/api/conversations/*` - Messaging
- `/api/admin/*` - Admin operations

## 🛠️ Development Tips

1. **Use the multi-service script** for full testing
2. **Check logs** in `./logs/` directory when using start-all-services.sh
3. **Environment switching** is handled via environment variables
4. **Database seeding** available via npm scripts in backend/

## 📞 Support

If you encounter issues:
1. Check the logs in `./logs/` directory
2. Verify all environment variables are set
3. Ensure MongoDB connection is working
4. Try the dependency fix script: `./fix-dependencies.sh`

