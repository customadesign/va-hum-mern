#!/bin/bash

echo "Starting E-Systems Management Hub..."
echo "========================================="

# Kill any processes running on ports 3001 and 5001
echo "Checking for existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

# Start backend in E-Systems mode (port 5001)
echo "Starting E-Systems backend on port 5001..."
cd backend
npm run esystems:dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend in E-Systems mode (port 3001)
echo "Starting E-Systems frontend on port 3001..."
cd ../frontend
npm run esystems &
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