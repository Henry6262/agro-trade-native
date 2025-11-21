#!/bin/bash

echo "🚀 AgroTrade TestFlight Deployment"
echo "=================================="
echo ""
echo "✅ EAS Project Created: https://expo.dev/accounts/web3h3nry/projects/agrotrade"
echo "✅ Project ID: 7e73f1f7-e26b-4109-ae53-3d06b542d146"
echo ""

# Step 1: Configure iOS credentials
echo "📱 Step 1: Configuring iOS credentials..."
echo "You will be prompted to:"
echo "  - Log in with your Apple ID"
echo "  - Create/select a Distribution Certificate"
echo "  - Create/select a Provisioning Profile"
echo ""
read -p "Press ENTER to continue with credential setup..."

npx eas credentials

echo ""
echo "✅ Credentials configured!"
echo ""

# Step 2: Build for TestFlight
echo "🔨 Step 2: Building iOS app for TestFlight..."
echo "This will take approximately 15-20 minutes"
echo ""
read -p "Press ENTER to start the build..."

npx eas build --platform ios --profile testflight

echo ""
echo "✅ Build complete!"
echo ""

# Step 3: Submit to TestFlight
echo "📤 Step 3: Submitting to TestFlight..."
echo ""
read -p "Press ENTER to submit to TestFlight..."

npx eas submit --platform ios --latest

echo ""
echo "✅ TestFlight Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Go to App Store Connect: https://appstoreconnect.apple.com"
echo "2. Navigate to your app 'AgroTrade'"
echo "3. Go to TestFlight tab"
echo "4. Add internal testers"
echo "5. The build will be available for testing in a few minutes"
echo ""
echo "Tester installation:"
echo "1. Testers download TestFlight app from App Store"
echo "2. They'll receive an invitation email"
echo "3. Open invite link on their iPhone/iPad"
echo "4. Install AgroTrade from TestFlight"
