#!/bin/bash

echo "==================================="
echo "LinkedIn OAuth Setup Verification"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. Checking LinkedIn App Configuration..."
echo "========================================="
echo ""
echo -e "${YELLOW}In your LinkedIn Developer Console:${NC}"
echo "   Client ID: 862opndk5vhk47"
echo ""
echo -e "${YELLOW}Authorized redirect URLs should be:${NC}"
echo -e "${GREEN}✓${NC} https://linkage-va-hub.onrender.com/auth/linkedin/callback"
echo -e "${RED}✗${NC} https://linkage-va-hub.onrender.com/api/auth/linkedin/callback (REMOVE THIS)"
echo ""

echo "2. Required Render Environment Variables"
echo "========================================="
echo ""
echo "Go to: https://dashboard.render.com/web/srv-crpif1ggph6c73aem670/env"
echo ""
echo "Ensure these are set:"
echo "  - LINKEDIN_CLIENT_ID = 862opndk5vhk47"
echo "  - LINKEDIN_CLIENT_SECRET = [Your secret from LinkedIn]"
echo "  - LINKEDIN_REDIRECT_URI = https://linkage-va-hub.onrender.com/auth/linkedin/callback"
echo ""

echo "3. Action Items"
echo "==============="
echo ""
echo -e "${RED}IMPORTANT:${NC} The 'Invalid client ID or secret' error means:"
echo ""
echo "1. ${YELLOW}Regenerate your Client Secret in LinkedIn:${NC}"
echo "   - Go to your LinkedIn app"
echo "   - Click 'Generate a new Client Secret'"
echo "   - Copy the new secret immediately (it won't be shown again)"
echo ""
echo "2. ${YELLOW}Update the secret in Render:${NC}"
echo "   - Go to your Render dashboard"
echo "   - Update LINKEDIN_CLIENT_SECRET with the new value"
echo "   - Save and let it redeploy"
echo ""
echo "3. ${YELLOW}Remove the incorrect redirect URL from LinkedIn:${NC}"
echo "   - Remove: https://linkage-va-hub.onrender.com/api/auth/linkedin/callback"
echo "   - Keep only: https://linkage-va-hub.onrender.com/auth/linkedin/callback"
echo ""

echo "4. Testing the Configuration"
echo "============================="
echo ""
echo "After updating, test with:"
echo "curl https://linkage-va-hub-api.onrender.com/api/auth/linkedin/diagnostics"
echo ""

echo "==================================="
echo "Need more help? The error 'Invalid client ID or secret' is ALWAYS"
echo "caused by a mismatch between LinkedIn and your environment variables."
echo "==================================="