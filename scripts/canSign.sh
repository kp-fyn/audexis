#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Audexis Notarization Readiness     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}\n"

all_good=true

echo -n "Checking Xcode Command Line Tools... "
if xcode-select -p &>/dev/null; then
    echo -e "${GREEN}${NC}"
else
    echo -e "${RED}${NC}"
    echo -e "${YELLOW}  Run: xcode-select --install${NC}"
    all_good=false
fi

echo -n "Checking for Developer ID Application certificate... "
if security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
    echo -e "${GREEN}${NC}"
    security find-identity -v -p codesigning | grep "Developer ID Application" | sed 's/^/  /'
else
    echo -e "${RED}${NC}"
    echo -e "${YELLOW}  Download from: https://developer.apple.com/account/resources/certificates${NC}"
    all_good=false
fi

echo -e "\nChecking environment variables:"

check_env_var() {
    local var_name=$1
    local alt_var_name=$2
    echo -n "  $var_name"
    if [ -n "$alt_var_name" ]; then
        echo -n " (or $alt_var_name)"
    fi
    echo -n "... "
    
    if [ -n "${!var_name}" ] || [ -n "${!alt_var_name}" ]; then
        echo -e "${GREEN}${NC}"
    else
        echo -e "${RED} Not set${NC}"
        all_good=false
    fi
}

check_env_var "APPLE_SIGNING_IDENTITY" "APPLE_IDENTITY"
check_env_var "APPLE_ID" ""
check_env_var "APPLE_PASSWORD" ""
check_env_var "APPLE_TEAM_ID" ""

echo -e "\n${BLUE}Note: Variables should be set in your bash profile (~/.bash_profile or ~/.zshrc)${NC}"

echo -e "\nChecking build scripts:"
if [ -x "scripts/notarize.sh" ]; then
    echo -e "  notarize.sh... ${GREEN}${NC}"
else
    echo -e "  notarize.sh... ${RED} Not executable${NC}"
    echo -e "  Run: ${BLUE}chmod +x scripts/notarize.sh${NC}"
    all_good=false
fi

if [ -x "scripts/setup-signing.sh" ]; then
    echo -e "  setup-signing.sh... ${GREEN}${NC}"
else
    echo -e "  setup-signing.sh... ${RED} Not executable${NC}"
    echo -e "  Run: ${BLUE}chmod +x scripts/setup-signing.sh${NC}"
    all_good=false
fi

echo -e "\nChecking dependencies:"
echo -n "  npm packages... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}${NC}"
else
    echo -e "${RED}${NC}"
    echo -e "  Run: ${BLUE}npm install${NC}"
    all_good=false
fi

echo -n "  tauri.conf.json... "
if [ -f "src-tauri/tauri.conf.json" ]; then
    echo -e "${GREEN}${NC}"
    
    if grep -q '"macOS"' src-tauri/tauri.conf.json; then
        echo -e "    macOS config... ${GREEN}${NC}"
    else
        echo -e "    macOS config... ${YELLOW}  Not configured${NC}"
    fi
else
    echo -e "${RED}${NC}"
    all_good=false
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
if $all_good && { [ -n "$APPLE_SIGNING_IDENTITY" ] || [ -n "$APPLE_IDENTITY" ]; }; then
    echo -e "${GREEN}🎉 All checks passed! You're ready to build and notarize.${NC}"
    echo -e "\n${YELLOW}Next step:${NC}"
    echo -e "  ${BLUE}./scripts/notarize.sh${NC}"
elif $all_good; then
    echo -e "${YELLOW}  Setup is almost complete.${NC}"
    echo -e "\n${YELLOW}Make sure your environment variables are loaded:${NC}"
    echo -e "  ${BLUE}# Check if variables are set${NC}"
    echo -e "  ${BLUE}echo \$APPLE_IDENTITY${NC}"
    echo -e "  ${BLUE}echo \$APPLE_ID${NC}"
    echo -e "\n${YELLOW}If not set, reload your bash profile:${NC}"
    echo -e "  ${BLUE}source ~/.bash_profile${NC}"
    echo -e "  ${BLUE}# OR${NC}"
    echo -e "  ${BLUE}source ~/.zshrc${NC}"
else
    echo -e "${RED} Some checks failed. Please fix the issues above.${NC}"
    echo -e "\n${YELLOW}Need help?${NC} See:"
    echo -e "  • ${BLUE}SIGNING_QUICKSTART.md${NC} - Quick start guide"
    echo -e "  • ${BLUE}NOTARIZATION_GUIDE.md${NC} - Detailed documentation"
fi
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
