#!/bin/bash

# Render Deployment Fix Script
# This script commits the fixes and provides instructions for Render configuration

echo "🔧 Render Deployment Fix Script"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the Linkage VA Hub MERN Stack directory"
    exit 1
fi

echo "✅ Step 1: Committing fixes to repository..."
echo ""

# Stage the changes
git add esystems-backend/package.json
git add render-esystems-backend.yaml
git add RENDER_DEPLOYMENT_FIX_OCT_2025.md

# Commit the changes
git commit -m "fix(render): fix esystems-backend configuration and deployment issues

- Add postinstall script to esystems-backend/package.json to install backend deps
- Update start command to use the wrapper server.js
- Add comprehensive render-esystems-backend.yaml with correct configuration
- Document all fixes in RENDER_DEPLOYMENT_FIX_OCT_2025.md

This fixes the build failures caused by incorrect rootDir and build commands.

Closes deployment issues for:
- esystems-backend (srv-d25c4r7fte5s73c49v30)
- esystems-management-hub (srv-d25cvrs9c44c73d6lto0)
- admin-frontend (srv-d3b5f27diees73ae1j60)
- linkage-va-hub (srv-d25arrripnbc73dpeqsg)
- linkage-va-hub-api (srv-d25arrripnbc73dpeqs0)"

echo "✅ Changes committed!"
echo ""

# Push to main
read -p "Push to GitHub main branch? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo "✅ Pushed to GitHub!"
    echo ""
else
    echo "⚠️  Skipped push. Run 'git push origin main' manually when ready."
    echo ""
fi

echo "📋 MANUAL STEPS REQUIRED:"
echo "========================="
echo ""
echo "The code fixes have been committed, but you MUST also update the Render"
echo "service configuration manually. The postinstall script helps, but the"
echo "rootDir and commands still need correction."
echo ""
echo "🔧 Fix esystems-backend service configuration:"
echo ""
echo "1. Go to: https://dashboard.render.com/web/srv-d25c4r7fte5s73c49v30/settings"
echo ""
echo "2. Update these settings:"
echo "   - Root Directory: CHANGE FROM 'esystems-backend' TO '' (empty/blank)"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo ""
echo "3. Click 'Save Changes'"
echo ""
echo "4. Click 'Manual Deploy' → 'Clear build cache & deploy'"
echo ""
echo "5. Wait for deployment to complete (~5 minutes)"
echo ""
echo "6. Verify: https://esystems-backend.onrender.com/health"
echo ""
echo "📦 The postinstall script will now automatically install backend dependencies!"
echo ""
echo "🚀 After esystems-backend is deployed, the other services should auto-deploy"
echo "   from the Git push. If they don't, manually trigger deploys for:"
echo ""
echo "   - linkage-va-hub-api: https://dashboard.render.com/web/srv-d25arrripnbc73dpeqs0"
echo "   - admin-frontend: https://dashboard.render.com/static/srv-d3b5f27diees73ae1j60"
echo "   - esystems-management-hub: https://dashboard.render.com/static/srv-d25cvrs9c44c73d6lto0"
echo "   - linkage-va-hub: https://dashboard.render.com/static/srv-d25arrripnbc73dpeqsg"
echo ""
echo "✅ All set! Follow the manual steps above to complete the fix."

