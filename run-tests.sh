#!/bin/bash
# run-tests.sh - Script to run tests with different options

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Check command line arguments
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  echo -e "${GREEN}Test Runner Script${NC}"
  echo "Usage: ./run-tests.sh [option]"
  echo ""
  echo "Options:"
  echo "  --all, -a       Run all tests with coverage"
  echo "  --watch, -w     Run tests in watch mode"
  echo "  --api           Run only API service tests"
  echo "  --hooks         Run only hook tests"
  echo "  --components    Run only component tests"
  echo "  --utils         Run only utility tests"
  echo "  --help, -h      Show this help message"
  echo ""
  echo "If no option is provided, runs all tests without coverage."
  exit 0
fi

# Run tests based on arguments
case "$1" in
  --all|-a)
    print_header "Running all tests with coverage"
    npx jest --coverage
    ;;
  --watch|-w)
    print_header "Running tests in watch mode"
    npx jest --watch
    ;;
  --api)
    print_header "Running API service tests"
    npx jest src/__tests__/services
    ;;
  --hooks)
    print_header "Running hook tests"
    npx jest src/__tests__/hooks
    ;;
  --components)
    print_header "Running component tests"
    npx jest src/__tests__/components
    ;;
  --utils)
    print_header "Running utility tests"
    npx jest src/__tests__/utils
    ;;
  *)
    print_header "Running all tests"
    npx jest
    ;;
esac

# Exit with the status of the jest command
exit $?
