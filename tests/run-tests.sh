#!/bin/bash

#############################################
# Mobigen Test Runner
#
# Usage:
#   ./run-tests.sh           # Run all tests
#   ./run-tests.sh api       # Run API tests only
#   ./run-tests.sh services  # Run service tests only
#   ./run-tests.sh e2e       # Run E2E tests only
#   ./run-tests.sh ui        # Run UI tests only
#   ./run-tests.sh coverage  # Run with coverage
#
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Mobigen Test Suite                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if vitest is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is not installed. Please install Node.js.${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing test dependencies...${NC}"
    pnpm install
fi

# Parse command line argument
TEST_TYPE="${1:-all}"

case $TEST_TYPE in
    api)
        echo -e "${GREEN}Running API tests...${NC}"
        npx vitest run api/
        ;;
    services)
        echo -e "${GREEN}Running Service tests...${NC}"
        npx vitest run services/
        ;;
    e2e)
        echo -e "${GREEN}Running E2E tests...${NC}"
        echo -e "${YELLOW}Note: E2E tests require the generator service to be running.${NC}"
        echo -e "${YELLOW}Start with: cd ../services/generator && pnpm dev${NC}"
        echo ""
        npx vitest run e2e/
        ;;
    ui)
        echo -e "${GREEN}Running UI tests...${NC}"
        npx vitest run ui/
        ;;
    coverage)
        echo -e "${GREEN}Running all tests with coverage...${NC}"
        npx vitest run --coverage
        ;;
    watch)
        echo -e "${GREEN}Running tests in watch mode...${NC}"
        npx vitest
        ;;
    all)
        echo -e "${GREEN}Running all tests...${NC}"
        npx vitest run
        ;;
    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo ""
        echo "Usage: $0 [api|services|e2e|ui|coverage|watch|all]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Tests completed!                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
