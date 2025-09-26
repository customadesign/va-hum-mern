#!/bin/bash

echo "🔧 VA Hub MERN - Dependency Fix Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "Node.js version: $NODE_VERSION"
    
    # Extract major version
    NODE_MAJOR=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${RED}⚠️  Node.js 18+ required. Current: $NODE_VERSION${NC}"
        echo "Please update Node.js: https://nodejs.org"
        exit 1
    fi
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Set npm configuration
echo -e "${YELLOW}Setting npm configuration...${NC}"
npm config set legacy-peer-deps true
npm config set fund false
npm config set audit-level moderate

# Clean and install root dependencies
echo -e "${YELLOW}Installing root dependencies...${NC}"
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Function to clean and install dependencies
clean_install() {
    local dir=$1
    local name=$2
    
    echo -e "${YELLOW}Cleaning and installing $name dependencies...${NC}"
    cd "$dir" || exit 1
    
    # Remove existing node_modules and lock files
    rm -rf node_modules package-lock.json
    
    # Install with legacy peer deps
    npm install --legacy-peer-deps
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $name dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install $name dependencies${NC}"
        exit 1
    fi
    
    cd ..
}

# Install backend dependencies
clean_install "backend" "Backend"

# Install frontend dependencies  
clean_install "frontend" "Frontend"

# Install admin frontend dependencies
clean_install "admin-frontend" "Admin Frontend"

# Install esystems frontend dependencies
clean_install "esystems-frontend" "E-Systems Frontend"

# Install esystems backend dependencies
clean_install "esystems-backend" "E-Systems Backend"

echo ""
echo -e "${GREEN}🎉 All dependencies installed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy backend/env.example to backend/.env and configure"
echo "2. Set up MongoDB connection string"
echo "3. Configure other environment variables as needed"
echo "4. Run: npm run dev (for basic setup)"
echo "   Or: ./start-all-services.sh (for full multi-service setup)"
echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"

