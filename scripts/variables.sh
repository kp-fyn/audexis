#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Bash Profile Configuration Helper  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}\n"

# Detect which shell profile to use
if [ -n "$ZSH_VERSION" ]; then
    PROFILE_FILE="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [ -n "$BASH_VERSION" ]; then
    PROFILE_FILE="$HOME/.bash_profile"
    SHELL_NAME="bash"
else
    PROFILE_FILE="$HOME/.bash_profile"
    SHELL_NAME="bash"
fi

echo -e "${GREEN}Detected shell: ${SHELL_NAME}${NC}"
echo -e "${GREEN}Profile file: ${PROFILE_FILE}${NC}\n"

# Check if variables are already set
if [ -n "$APPLE_IDENTITY" ] && [ -n "$APPLE_ID" ]; then
    echo -e "${GREEN}Environment variables are already loaded!${NC}\n"
    echo -e "${YELLOW}Current values:${NC}"
    echo -e "  APPLE_IDENTITY: ${APPLE_IDENTITY}"
    echo -e "  APPLE_ID: ${APPLE_ID}"
    echo -e "  APPLE_PASSWORD: $([ -n "$APPLE_PASSWORD" ] && echo '***set***' || echo 'not set')"
    echo -e "  APPLE_TEAM_ID: ${APPLE_TEAM_ID}"
    echo -e "\n${GREEN}You're ready to build!${NC}"
    echo -e "Run: ${BLUE}./scripts/build-and-notarize.sh${NC}\n"
    exit 0
fi

echo -e "${YELLOW} Environment variables not found in current session${NC}\n"
echo -e "${YELLOW}Add these lines to your ${PROFILE_FILE}:${NC}\n"

cat << 'EOF'
# Apple Developer Code Signing & Notarization
export APPLE_ID="your.email@example.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
export APPLE_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
EOF

echo -e "\n${YELLOW}Based on your certificate, it should be:${NC}\n"

# Try to get the certificate info
CERT_INFO=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1)
if [ -n "$CERT_INFO" ]; then
    CERT_NAME=$(echo "$CERT_INFO" | sed 's/.*"\(.*\)".*/\1/')
    TEAM_ID=$(echo "$CERT_NAME" | sed 's/.*(\(.*\)).*/\1/')
    
    cat << EOF
export APPLE_ID="your.email@example.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="${TEAM_ID}"
export APPLE_IDENTITY="${CERT_NAME}"
EOF
fi

echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}Next steps:${NC}\n"
echo -e "1. Edit your profile file:"
echo -e "   ${BLUE}nano ${PROFILE_FILE}${NC}"
echo -e "\n2. Add the export lines above"
echo -e "\n3. Save and reload:"
echo -e "   ${BLUE}source ${PROFILE_FILE}${NC}"
echo -e "\n4. Verify variables are set:"
echo -e "   ${BLUE}./scripts/variables.sh${NC}"
echo -e "\n5. Build and notarize:"
echo -e "   ${BLUE}./scripts/notarize.sh${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Need your app-specific password?${NC}"
echo -e "Visit: ${BLUE}https://appleid.apple.com/account/manage${NC}"
echo -e "Go to: Security → App-Specific Passwords → Generate\n"
