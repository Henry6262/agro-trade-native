#!/bin/bash

set -e

echo "🚀 AgroTrade - First Interactive Build Setup"
echo "============================================="
echo ""
echo "This script will:"
echo "  1. Authenticate with your Apple Developer account"
echo "  2. Generate iOS certificates and provisioning profiles"
echo "  3. Submit the first build to TestFlight"
echo ""
echo "After this completes, all future builds can run automatically!"
echo ""
read -p "Press ENTER to begin..."

cd "$(dirname "$0")"

# Run the first build - this will prompt for Apple credentials
echo ""
echo "📱 Starting iOS build (this will take ~15-20 minutes)..."
echo "You'll be prompted to log in with your Apple Developer account."
echo ""

npx eas build --platform ios --profile testflight --auto-submit

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "  • Check build status: https://expo.dev/accounts/henry6262/projects/agro-trade/builds"
echo "  • Monitor TestFlight: https://appstoreconnect.apple.com"
echo "  • Future builds can now run with: npx eas build --platform ios --profile testflight --non-interactive"
echo ""
