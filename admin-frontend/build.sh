#!/bin/bash

echo "Building Admin Frontend for Production..."
echo "========================================"

# Set production environment variables
export NODE_ENV=production
export REACT_APP_API_URL=https://linkage-va-hub-api.onrender.com/api
export REACT_APP_SOCKET_URL=https://linkage-va-hub-api.onrender.com
export REACT_APP_BRAND=admin
export REACT_APP_NAME="Linkage VA Hub Admin"

echo "Environment Variables Set:"
echo "NODE_ENV: $NODE_ENV"
echo "REACT_APP_API_URL: $REACT_APP_API_URL"
echo "REACT_APP_SOCKET_URL: $REACT_APP_SOCKET_URL"
echo "REACT_APP_BRAND: $REACT_APP_BRAND"
echo "REACT_APP_NAME: $REACT_APP_NAME"

# Build the application
echo ""
echo "Running build..."
npm run build

echo ""
echo "Build complete! Deploy the 'build' folder to Render."
echo "Make sure to use: npx serve -s build -p \$PORT --no-clipboard"