#!/bin/bash

echo "Starting E-Systems Management Hub..."
echo "===================================="
echo ""
echo "Backend will run on:  http://localhost:5001"
echo "Frontend will run on: http://localhost:3001"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Start E-Systems backend
echo "Starting E-Systems backend server..."
cd backend && ESYSTEMS_MODE=true PORT=5001 npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start E-Systems frontend
echo "Starting E-Systems frontend server..."
cd ../esystems-frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "Services are starting..."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Access E-Systems at: http://localhost:3001"
echo "Press Ctrl+C to stop both servers"

# Cleanup function
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT TERM
wait