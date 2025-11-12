#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}Starting Linkage VA Hub - All Services${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Service Information
echo -e "${YELLOW}Services will run on the following ports:${NC}"
echo -e "${GREEN}✓${NC} Linkage Frontend:   http://localhost:3000"
echo -e "${GREEN}✓${NC} E-Systems Frontend: http://localhost:3001"
echo -e "${GREEN}✓${NC} Admin Frontend:     http://localhost:4000"
echo -e "${GREEN}✓${NC} Main Backend API:   http://localhost:5000"
echo -e "${GREEN}✓${NC} E-Systems Backend:  http://localhost:5001"
echo ""

# Check if MongoDB is running
echo -e "${YELLOW}Checking MongoDB status...${NC}"
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${RED}✗ MongoDB is not running${NC}"
    echo -e "${YELLOW}Starting MongoDB...${NC}"
    
    # Try to start MongoDB
    if command -v mongod &> /dev/null; then
        mongod --fork --logpath /tmp/mongodb.log --dbpath /usr/local/var/mongodb &> /dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ MongoDB started successfully${NC}"
        else
            echo -e "${RED}Failed to start MongoDB. Please start it manually.${NC}"
            echo -e "${YELLOW}You can start MongoDB with: brew services start mongodb-community${NC}"
        fi
    else
        echo -e "${RED}MongoDB is not installed.${NC}"
        echo -e "${YELLOW}Please install MongoDB first: brew install mongodb-community${NC}"
        exit 1
    fi
fi
echo ""

# Function to kill processes on specific ports
cleanup_ports() {
    echo -e "${YELLOW}Cleaning up any existing services...${NC}"
    
    # Kill processes on our ports
    for port in 3000 3001 4000 5000 5001; do
        lsof -ti:$port | xargs kill -9 2>/dev/null
    done
    
    sleep 2
    echo -e "${GREEN}✓ Ports cleaned${NC}"
}

# Cleanup existing services
cleanup_ports

# Array to store PIDs
declare -a PIDS=()

# Start Main Backend (Port 5000)
echo ""
echo -e "${YELLOW}Starting Main Backend API (Port 5000)...${NC}"
cd backend
PORT=5000 npm run dev > ../logs/backend-main.log 2>&1 &
PIDS+=($!)
cd ..
sleep 3

# Start E-Systems Backend (Port 5001)
echo -e "${YELLOW}Starting E-Systems Backend API (Port 5001)...${NC}"
cd backend
ESYSTEMS_MODE=true PORT=5001 npm run dev > ../logs/backend-esystems.log 2>&1 &
PIDS+=($!)
cd ..
sleep 3

# Start Linkage Frontend (Port 3000)
echo -e "${YELLOW}Starting Linkage Frontend (Port 3000)...${NC}"
cd frontend
REACT_APP_API_URL=http://localhost:5000 PORT=3000 npm start > ../logs/frontend-linkage.log 2>&1 &
PIDS+=($!)
cd ..

# Start E-Systems Frontend (Port 3001)
echo -e "${YELLOW}Starting E-Systems Frontend (Port 3001)...${NC}"
cd esystems-frontend
npm start > ../logs/frontend-esystems.log 2>&1 &
PIDS+=($!)
cd ..

# Start Admin Frontend (Port 4000)
echo -e "${YELLOW}Starting Admin Frontend (Port 4000)...${NC}"
cd admin-frontend
REACT_APP_API_URL=http://localhost:5000 npm start > ../logs/frontend-admin.log 2>&1 &
PIDS+=($!)
cd ..

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}All services are starting up...${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "${YELLOW}Process IDs:${NC}"
echo "Main Backend:        PID ${PIDS[0]}"
echo "E-Systems Backend:   PID ${PIDS[1]}"
echo "Linkage Frontend:    PID ${PIDS[2]}"
echo "E-Systems Frontend:  PID ${PIDS[3]}"
echo "Admin Frontend:      PID ${PIDS[4]}"
echo ""
echo -e "${YELLOW}Logs are being written to the ./logs directory${NC}"
echo ""
echo -e "${BLUE}Services are starting. Please wait 10-15 seconds for all services to be ready.${NC}"
echo ""
echo -e "${GREEN}Access the applications at:${NC}"
echo "• Linkage:   http://localhost:3000"
echo "• E-Systems: http://localhost:3001"
echo "• Admin:     http://localhost:4000"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    
    # Kill all stored PIDs
    for pid in "${PIDS[@]}"; do
        kill $pid 2>/dev/null
    done
    
    # Also cleanup any remaining processes on our ports
    cleanup_ports
    
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Set trap for Ctrl+C
trap cleanup INT TERM

# Wait for all background processes
wait