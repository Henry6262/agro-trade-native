#!/bin/bash

echo "🎨 Starting Visual UI Parity Tests"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if both apps are running
check_app() {
    local url=$1
    local name=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|304"; then
        echo -e "${GREEN}✓${NC} $name is running at $url"
        return 0
    else
        echo -e "${RED}✗${NC} $name is not running at $url"
        return 1
    fi
}

# Start React app if not running
start_react_app() {
    echo -e "${YELLOW}Starting React dashboard...${NC}"
    cd fe-dashboar/v0-agro-trade-dashboard
    npm run dev &
    REACT_PID=$!
    sleep 5
    cd ../..
}

# Start React Native app if not running
start_rn_app() {
    echo -e "${YELLOW}Starting React Native app...${NC}"
    cd front-end
    npx expo start --web &
    RN_PID=$!
    sleep 10
    cd ..
}

# Check if apps are running
echo "Checking application status..."

REACT_RUNNING=false
RN_RUNNING=false

if check_app "http://localhost:3000" "React Dashboard"; then
    REACT_RUNNING=true
fi

if check_app "http://localhost:8081" "React Native Web"; then
    RN_RUNNING=true
fi

# Start apps if needed
if [ "$REACT_RUNNING" = false ]; then
    start_react_app
fi

if [ "$RN_RUNNING" = false ]; then
    start_rn_app
fi

# Wait for apps to be ready
echo -e "\n${YELLOW}Waiting for applications to be ready...${NC}"
sleep 5

# Create screenshots directory
mkdir -p tests/screenshots

# Run Playwright tests
echo -e "\n${GREEN}Running visual comparison tests...${NC}"
npx playwright test tests/visual-comparison.spec.ts --reporter=html

# Generate comparison report
echo -e "\n${GREEN}Generating comparison report...${NC}"
npx playwright show-report

# Cleanup (optional - comment out if you want to keep apps running)
# if [ ! -z "$REACT_PID" ]; then
#     kill $REACT_PID
# fi
# if [ ! -z "$RN_PID" ]; then
#     kill $RN_PID
# fi

echo -e "\n${GREEN}✅ Visual testing complete!${NC}"
echo "Check the HTML report for detailed comparisons"