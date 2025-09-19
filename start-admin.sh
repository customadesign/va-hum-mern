#!/bin/bash

echo "Starting Admin Dashboard..."
echo "=========================="
echo ""
echo "Backend will run on:  http://localhost:8000"
echo "Admin UI will run on: http://localhost:4000"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Start backend (if not already running)
echo "Checking if backend is already running..."
if ! lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "Starting backend server..."
    cd backend && PORT=8000 npm run dev &
    BACKEND_PID=$!
    sleep 5
else
    echo "Backend is already running on port 8000"
    BACKEND_PID=0
fi

# Start admin frontend
echo "Starting admin frontend server..."
cd admin-frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "Services are starting..."
if [ $BACKEND_PID -ne 0 ]; then
    echo "Backend PID: $BACKEND_PID"
fi
echo "Admin Frontend PID: $FRONTEND_PID"
echo ""
echo "Access Admin Dashboard at: http://localhost:4000"
echo "Press Ctrl+C to stop the servers"

# Cleanup function
cleanup() {
    echo "Stopping servers..."
    kill $FRONTEND_PID 2>/dev/null
    if [ $BACKEND_PID -ne 0 ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    exit
}

trap cleanup INT TERM
wait