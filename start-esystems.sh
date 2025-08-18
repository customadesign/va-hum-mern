#!/bin/bash

echo "Starting E-Systems Management Hub..."
echo "========================================="

# Kill any processes running on ports 3001 and 5001
echo "Checking for existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

# Start E-Systems backend from backend dir (loads .env) on port 5001
echo "Starting E-Systems backend (backend dir, loads .env) on port 5001..."
cd backend
ESYSTEMS_MODE=true PORT=5001 npx nodemon server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start E-Systems frontend using main frontend with E-Systems theme (port 3001)
echo "Starting E-Systems frontend (main frontend with E-Systems theme) on port 3001..."
cd ../frontend
REACT_APP_BRAND=esystems REACT_APP_API_URL=http://localhost:5001/api PORT=3001 npm start &
FRONTEND_PID=$!

echo ""
echo "E-Systems Management Hub is starting up..."
echo "========================================="
echo "Backend (API): http://localhost:5001"
echo "Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both services"

# Function to clean up background processes
cleanup() {
    echo ""
    echo "Stopping E-Systems services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set up signal trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait