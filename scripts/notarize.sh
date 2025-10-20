#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color


if [ -n "$APPLE_IDENTITY" ]; then
    APPLE_SIGNING_IDENTITY="$APPLE_IDENTITY"
fi

if [ -z "$APPLE_SIGNING_IDENTITY" ]; then
    echo -e "${RED} Error: APPLE_SIGNING_IDENTITY or APPLE_IDENTITY is not set${NC}"
    echo "Please set: export APPLE_IDENTITY=\"Developer ID Application: Your Name (TEAM_ID)\""
    echo "Or: export APPLE_SIGNING_IDENTITY=\"Developer ID Application: Your Name (TEAM_ID)\""
    exit 1
fi

if [ -z "$APPLE_ID" ]; then
    echo -e "${RED} Error: APPLE_ID is not set${NC}"
    echo "Please set: export APPLE_ID=\"your.email@example.com\""
    exit 1
fi

if [ -z "$APPLE_PASSWORD" ]; then
    echo -e "${RED} Error: APPLE_PASSWORD is not set${NC}"
    echo "Please set: export APPLE_PASSWORD=\"your-app-specific-password\""
    exit 1
fi

if [ -z "$APPLE_TEAM_ID" ]; then
    echo -e "${RED} Error: APPLE_TEAM_ID is not set${NC}"
    echo "Please set: export APPLE_TEAM_ID=\"YOUR_TEAM_ID\""
    exit 1
fi

echo -e "${BLUE}🚀 Starting Audexis build and notarization process...${NC}\n"

echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf src-tauri/target/release/bundle/macos/*.dmg
rm -rf src-tauri/target/release/bundle/macos/audexis.app

echo -e "${YELLOW}🔨 Building Audexis...${NC}"
npm run tauri build

if [ ! -d "src-tauri/target/release/bundle/macos/audexis.app" ]; then
    echo -e "${RED} Build failed - audexis.app not found${NC}"
    exit 1
fi

echo -e "${GREEN} Build successful${NC}\n"

echo -e "${YELLOW}🔐 Signing the application...${NC}"
codesign --deep --force --verify --verbose \
  --sign "$APPLE_SIGNING_IDENTITY" \
  --options runtime \
  src-tauri/target/release/bundle/macos/audexis.app

codesign --verify --deep --strict --verbose=2 \
  src-tauri/target/release/bundle/macos/audexis.app

echo -e "${GREEN} Application signed successfully${NC}\n"

echo -e "${YELLOW}📦 Creating DMG installer...${NC}"
cd src-tauri/target/release/bundle/macos

VERSION=$(grep '"version"' ../../../../tauri.conf.json | sed 's/.*: "\(.*\)".*/\1/')
DMG_NAME="audexis-${VERSION}.dmg"

hdiutil create -volname "Audexis" \
  -srcfolder audexis.app \
  -ov -format UDZO \
  "$DMG_NAME"

echo -e "${GREEN} DMG created: ${DMG_NAME}${NC}\n"

echo -e "${YELLOW} Signing DMG...${NC}"
codesign --sign "$APPLE_SIGNING_IDENTITY" "$DMG_NAME"


codesign --verify --verbose "$DMG_NAME"

echo -e "${GREEN} DMG signed successfully${NC}\n"

echo -e "${YELLOW} Submitting to Apple for notarization...${NC}"
echo -e "${BLUE}This may take 5-15 minutes. Please be patient...${NC}\n"

if ! security find-generic-password -s "audexis-notarization" &>/dev/null; then
    echo -e "${YELLOW}Storing credentials in keychain...${NC}"
    xcrun notarytool store-credentials "audexis-notarization" \
      --apple-id "$APPLE_ID" \
      --team-id "$APPLE_TEAM_ID" \
      --password "$APPLE_PASSWORD"
fi

SUBMISSION_OUTPUT=$(xcrun notarytool submit "$DMG_NAME" \
  --keychain-profile "audexis-notarization" \
  --wait 2>&1)

echo "$SUBMISSION_OUTPUT"

if echo "$SUBMISSION_OUTPUT" | grep -q "status: Accepted"; then
    echo -e "${GREEN} Notarization successful!${NC}\n"
    
    echo -e "${YELLOW} Stapling notarization ticket...${NC}"
    xcrun stapler staple "$DMG_NAME"
    
    echo -e "${GREEN} Notarization ticket stapled${NC}\n"
    
    echo -e "${YELLOW} Running final verification...${NC}"
    
    xcrun stapler validate "$DMG_NAME"
    
    spctl -a -t open --context context:primary-signature -v "$DMG_NAME"
    
    echo -e "\n${GREEN} Success! Your app is ready for distribution.${NC}"
    echo -e "${GREEN} Location: $(pwd)/${DMG_NAME}${NC}"
    echo -e "${BLUE}File size: $(du -h "$DMG_NAME" | cut -f1)${NC}\n"
    
else
    echo -e "${RED} Notarization failed${NC}"
    
    SUBMISSION_ID=$(echo "$SUBMISSION_OUTPUT" | grep "id:" | head -1 | awk '{print $2}')
    
    if [ -n "$SUBMISSION_ID" ]; then
        echo -e "${YELLOW}Fetching notarization log...${NC}\n"
        xcrun notarytool log "$SUBMISSION_ID" --keychain-profile "audexis-notarization"
    fi
    
    exit 1
fi

cd ../../../../..

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}All done! ${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
