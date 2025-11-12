#!/bin/bash

echo "Starting Linkage VA Hub MERN Stack..."
echo "=================================="
echo ""
echo "Backend will run on: http://localhost:8000"
echo "Frontend will run on: http://localhost:3000"
echo ""
echo "Note: Make sure MongoDB is running!"
echo ""

# Start backend
echo "Starting backend server..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 5

# Start frontend
echo "Starting frontend server..."
(cd frontend && npm start) &
FRONTEND_PID=$!

echo ""
echo "Both servers are starting..."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait