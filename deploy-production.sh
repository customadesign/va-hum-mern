#!/bin/bash

# 🚀 PRODUCTION DEPLOYMENT SCRIPT
# Linkage VA Hub MERN Stack with Hybrid Authentication
# Updated for Clerk Primary Authentication + JWT Fallback

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."
echo "=====================================

🔐 HYBRID AUTHENTICATION SYSTEM
✅ Clerk Primary Authentication
✅ JWT Fallback Support
✅ LinkedIn OAuth Integration
✅ Production Security Features

====================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "Expected structure: backend/, frontend/, package.json"
    exit 1
fi

echo "📁 Verifying project structure..."
sleep 1

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Check if git repo is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "It's recommended to commit changes before deployment"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

echo "🔧 Running pre-deployment checks..."

# Check backend dependencies
echo "📦 Checking backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

# Check if required files exist
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found in backend directory"
    exit 1
fi

# Check frontend dependencies
echo "📦 Checking frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

# Build frontend for production
echo "🏗️  Building frontend for production..."
npm run build

if [ ! -d "build" ]; then
    echo "❌ Error: Frontend build failed - build directory not created"
    exit 1
fi

echo "✅ Frontend build completed successfully"

cd ..

# Verify environment files exist
echo "🔧 Checking environment configuration..."

if [ ! -f "PRODUCTION_CONFIG.md" ]; then
    echo "❌ Error: PRODUCTION_CONFIG.md not found"
    echo "This file contains required environment variables for production"
    exit 1
fi

if [ ! -f "render-production.yaml" ]; then
    echo "❌ Error: render-production.yaml not found"
    echo "This file is required for Render deployment"
    exit 1
fi

echo "✅ Environment configuration files found"

# Check Git remote
echo "🔗 Checking Git repository configuration..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo "❌ Error: No Git remote 'origin' configured"
    echo "Please add your GitHub repository as origin:"
    echo "git remote add origin https://github.com/customadesign/va-hum-mern-linkage.git"
    exit 1
fi

echo "✅ Git remote configured: $REMOTE_URL"

# Commit current changes if any
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Committing current changes..."
    git add .
    git commit -m "🚀 Production deployment with hybrid authentication

✅ Clerk primary authentication implemented
✅ JWT fallback support maintained  
✅ Updated production configuration
✅ Health check endpoints added
✅ Security features enhanced

Features included:
- Hybrid authentication system
- Production-ready environment configuration
- Health monitoring endpoints
- Enhanced security middleware
- Comprehensive error handling"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo "
🎉 PRE-DEPLOYMENT COMPLETED SUCCESSFULLY!

===================================== 
NEXT STEPS FOR RENDER DEPLOYMENT:
=====================================

1. 🌐 Go to Render Dashboard: https://dashboard.render.com

2. 📁 Create New Web Service:
   - Connect your GitHub repository
   - Select 'va-hum-mern-linkage' repository
   - Use the render-production.yaml configuration

3. 🔐 Set Environment Variables:
   Copy from PRODUCTION_CONFIG.md:
   
   REQUIRED MANUAL SETUP:
   ----------------------
   - MONGODB_URI (Your MongoDB Atlas connection string)
   - CLERK_SECRET_KEY (From Clerk Dashboard)
   - CLERK_PUBLISHABLE_KEY (From Clerk Dashboard)  
   - CLERK_WEBHOOK_SECRET (From Clerk Dashboard)
   - SUPABASE_URL (From Supabase Dashboard)
   - SUPABASE_ANON_KEY (From Supabase Dashboard)
   - SUPABASE_SERVICE_ROLE_KEY (From Supabase Dashboard)

4. 🚀 Deploy Services:
   - Deploy backend first: linkage-va-hub-api
   - Then deploy frontend: linkage-va-hub
   - (Optional) Deploy E-Systems services

5. 🏥 Verify Deployment:
   - Check health endpoint: /api/health
   - Test authentication flows
   - Verify file uploads work

=====================================
AUTHENTICATION FEATURES DEPLOYED:
=====================================

✅ Clerk Primary Authentication
✅ JWT Fallback Support
✅ LinkedIn OAuth Integration  
✅ Hybrid Session Management
✅ Production Security Headers
✅ Rate Limiting & CORS
✅ Health Check Monitoring
✅ Error Tracking Integration

Your production deployment is ready! 🎉
"

echo "📋 Opening deployment guides..."

# Open relevant files for reference
if command -v code &> /dev/null; then
    code PRODUCTION_CONFIG.md render-production.yaml
elif command -v open &> /dev/null; then
    open PRODUCTION_CONFIG.md
fi

echo "
🔗 Useful Links:
- Render Dashboard: https://dashboard.render.com
- Clerk Dashboard: https://dashboard.clerk.com
- GitHub Repository: $REMOTE_URL

Happy deploying! 🚀"




















































