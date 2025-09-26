#!/bin/bash

echo "Starting Linkage VA Hub (Main Application)..."
echo "============================================"
echo ""
echo "Backend will run on:  http://localhost:5000"
echo "Frontend will run on: http://localhost:3000"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Start backend
echo "Starting backend server..."
cd backend && PORT=5000 npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend server..."
cd ../frontend && REACT_APP_API_URL=http://localhost:5000 PORT=3000 npm start &
FRONTEND_PID=$!

echo ""
echo "Services are starting..."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Access the application at: http://localhost:3000"
echo "Press Ctrl+C to stop both servers"

# Cleanup function
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT TERM
wait