#!/bin/bash

echo "========================================="
echo "Android Debug Logger for Agro-Trade App"
echo "========================================="
echo ""
echo "Instructions:"
echo "1. This script will monitor Android logs"
echo "2. Open your app in the emulator"
echo "3. When it crashes, you'll see the error here"
echo ""
echo "Clearing old logs..."
adb logcat -c

echo "Waiting for crash logs..."
echo "NOW OPEN YOUR APP IN THE EMULATOR"
echo ""
echo "========================================="

# Monitor for crashes and React Native errors
adb logcat | grep -E --line-buffered "AndroidRuntime|ReactNative|ReactNativeJS|FATAL EXCEPTION|com.agrotrade|front-end|Bundle|Metro|Error|ERROR|crash|died"