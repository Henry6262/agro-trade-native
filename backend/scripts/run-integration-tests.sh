#!/bin/bash

###########################################
# Integration Test Runner Script
#
# Runs comprehensive integration tests for
# all admin dashboard features and generates
# detailed test reports
###########################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "=========================================="
echo "  AGRO-TRADE INTEGRATION TEST SUITE"
echo "=========================================="
echo -e "${NC}"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

# Check if backend is running
echo -e "${YELLOW}Checking backend status...${NC}"
if curl -s http://localhost:4001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo -e "${YELLOW}Starting backend...${NC}"
    npm run start:dev &
    BACKEND_PID=$!

    # Wait for backend to start
    echo "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:4001/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend is ready${NC}"
            break
        fi
        sleep 2
    done
fi

# Run tests
echo ""
echo -e "${BLUE}Running integration tests...${NC}"
echo ""

# Set test environment
export NODE_ENV=test
export SILENT_TESTS=false

# Run Jest with coverage
npm run test:e2e -- \
    --testPathPattern="admin-dashboard-features|happy-path-trade-operation" \
    --coverage \
    --coverageDirectory=./coverage/integration \
    --json \
    --outputFile=./test-results.json \
    --verbose

TEST_EXIT_CODE=$?

# Generate test report
echo ""
echo -e "${BLUE}Generating test report...${NC}"
node "$SCRIPT_DIR/generate-test-report.js"

# Display summary
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  ALL TESTS PASSED ✓"
    echo "==========================================${NC}"
    echo ""
    echo "Test report: $BACKEND_DIR/TEST_REPORT.json"
    echo "Coverage report: $BACKEND_DIR/coverage/integration"
else
    echo ""
    echo -e "${RED}=========================================="
    echo "  TESTS FAILED ✗"
    echo "==========================================${NC}"
    echo ""
    echo "Check test-results.json and TEST_REPORT.json for details"
fi

# Cleanup background processes if we started them
if [ ! -z "$BACKEND_PID" ]; then
    echo ""
    echo "Stopping backend process..."
    kill $BACKEND_PID 2>/dev/null || true
fi

exit $TEST_EXIT_CODE
