#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Audexis Code Signing Setup Helper   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}\n"

# Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Get Apple Developer information
echo -e "\n${GREEN}📝 Please provide your Apple Developer information:${NC}\n"

# List available signing identities
echo -e "${YELLOW}Available signing identities:${NC}"
security find-identity -v -p codesigning | grep "Developer ID Application"
echo

read -p "Enter your Developer ID Application identity (copy from above): " signing_identity
read -p "Enter your Apple ID (email): " apple_id
read -p "Enter your Team ID: " team_id

echo -e "\n${YELLOW}🔑 Generating app-specific password...${NC}"
echo -e "1. Go to: ${BLUE}https://appleid.apple.com/account/manage${NC}"
echo -e "2. Sign in with your Apple ID"
echo -e "3. Go to Security → App-Specific Passwords"
echo -e "4. Click '+' to generate a new password"
echo -e "5. Name it 'Audexis Notarization'"
echo -e "6. Copy the generated password (format: xxxx-xxxx-xxxx-xxxx)\n"

read -p "Enter your app-specific password: " apple_password

# Create .env file
cat > .env << EOF
# Apple Developer Code Signing & Notarization
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

APPLE_SIGNING_IDENTITY="$signing_identity"
APPLE_ID="$apple_id"
APPLE_PASSWORD="$apple_password"
APPLE_TEAM_ID="$team_id"
EOF

echo -e "\n${GREEN}✅ Configuration saved to .env${NC}"

# Add .env to .gitignore if not already there
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
    echo -e "${GREEN}✅ Added .env to .gitignore${NC}"
fi

# Make build script executable
if [ -f "scripts/build-and-notarize.sh" ]; then
    chmod +x scripts/build-and-notarize.sh
    echo -e "${GREEN}✅Made build-and-notarize.sh executable${NC}"
fi

echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Setup complete! ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Load environment variables: ${BLUE}source .env${NC}"
echo -e "2. Run the build script: ${BLUE}./scripts/build-and-notarize.sh${NC}\n"

echo -e "${YELLOW}Or set them for current session:${NC}"
echo -e "${BLUE}export APPLE_SIGNING_IDENTITY=\"$signing_identity\"${NC}"
echo -e "${BLUE}export APPLE_ID=\"$apple_id\"${NC}"
echo -e "${BLUE}export APPLE_PASSWORD=\"$apple_password\"${NC}"
echo -e "${BLUE}export APPLE_TEAM_ID=\"$team_id\"${NC}\n"
