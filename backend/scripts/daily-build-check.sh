#!/bin/bash

# Daily Build Check Script for Agro-Trade Backend
# This script runs a TypeScript build check and reports any errors

echo "🔍 Starting daily build check..."
echo "📅 Date: $(date)"
echo "-----------------------------------"

# Run the build
npm run build

# Check exit code
if [ $? -eq 0 ]; then
    echo "-----------------------------------"
    echo "✅ BUILD SUCCESSFUL - No TypeScript errors!"
    echo "📅 $(date)"
    exit 0
else
    echo "-----------------------------------"
    echo "❌ BUILD FAILED - TypeScript errors detected!"
    echo "📅 $(date)"
    echo "🔧 Please fix the errors above"
    exit 1
fi
