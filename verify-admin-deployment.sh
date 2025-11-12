#!/bin/bash

echo "Verifying Admin Frontend Deployment..."
echo "======================================="

# Admin deployment URL
ADMIN_URL="https://admin-3pxa.onrender.com"
API_URL="https://linkage-va-hub-api.onrender.com"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check admin frontend
echo -e "\n${YELLOW}Checking Admin Frontend:${NC}"
echo "URL: $ADMIN_URL"
ADMIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ADMIN_URL)
if [ $ADMIN_RESPONSE -eq 200 ]; then
    echo -e "${GREEN}✓ Admin Frontend is accessible (HTTP $ADMIN_RESPONSE)${NC}"
else
    echo -e "${RED}✗ Admin Frontend returned HTTP $ADMIN_RESPONSE${NC}"
fi

# Check API health
echo -e "\n${YELLOW}Checking API Backend:${NC}"
echo "URL: $API_URL/api/health"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/health)
if [ $API_RESPONSE -eq 200 ] || [ $API_RESPONSE -eq 503 ]; then
    echo -e "${GREEN}✓ API Backend is responding (HTTP $API_RESPONSE)${NC}"
    
    # Get detailed health info
    echo -e "\nAPI Health Details:"
    curl -s $API_URL/api/health | python3 -m json.tool 2>/dev/null || curl -s $API_URL/api/health
else
    echo -e "${RED}✗ API Backend returned HTTP $API_RESPONSE${NC}"
fi

# Check API auth endpoint
echo -e "\n${YELLOW}Checking Auth Endpoint:${NC}"
echo "URL: $API_URL/api/auth/health"
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/auth/health)
if [ $AUTH_RESPONSE -eq 200 ] || [ $AUTH_RESPONSE -eq 503 ]; then
    echo -e "${GREEN}✓ Auth system is responding (HTTP $AUTH_RESPONSE)${NC}"
else
    echo -e "${RED}✗ Auth system returned HTTP $AUTH_RESPONSE${NC}"
fi

echo -e "\n${YELLOW}Deployment URLs:${NC}"
echo "Admin Frontend: $ADMIN_URL"
echo "API Backend: $API_URL"
echo "Main Frontend: https://linkage-va-hub.onrender.com"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Visit $ADMIN_URL to access the admin panel"
echo "2. Use the login credentials you created"
echo "3. If you need to create an admin user, run:"
echo "   node create-admin-user.js"