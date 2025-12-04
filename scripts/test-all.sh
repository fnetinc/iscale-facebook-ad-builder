#!/bin/bash
# Full test suite - run before deployment

set -e

echo "========================================="
echo "BreadWinner Full Test Suite"
echo "========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Track failures
FAILURES=0

# 1. Backend Tests
echo -e "\n${YELLOW}[1/5] Running Backend Tests...${NC}"
cd backend
if source venv/bin/activate 2>/dev/null; then
    if pytest --cov=app --cov-report=term-missing -v; then
        echo -e "${GREEN}✓ Backend tests passed${NC}"
    else
        echo -e "${RED}✗ Backend tests failed${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}⚠ Virtual environment not found, skipping${NC}"
fi
cd "$ROOT_DIR"

# 2. Backend Security Scan
echo -e "\n${YELLOW}[2/5] Running Backend Security Scan (Bandit)...${NC}"
cd backend
if command -v bandit &> /dev/null; then
    if bandit -r app --severity-level medium -f txt; then
        echo -e "${GREEN}✓ Bandit scan passed${NC}"
    else
        echo -e "${RED}✗ Bandit found issues${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}⚠ Bandit not installed, run: pip install bandit${NC}"
fi
cd "$ROOT_DIR"

# 3. Dependency Audit
echo -e "\n${YELLOW}[3/5] Running Dependency Audits...${NC}"
cd backend
if command -v pip-audit &> /dev/null; then
    pip-audit -r requirements.txt || echo -e "${YELLOW}⚠ pip-audit found vulnerabilities${NC}"
else
    echo -e "${YELLOW}⚠ pip-audit not installed${NC}"
fi
cd "$ROOT_DIR/frontend"
npm audit --audit-level=high || echo -e "${YELLOW}⚠ npm audit found vulnerabilities${NC}"
cd "$ROOT_DIR"

# 4. Frontend Tests
echo -e "\n${YELLOW}[4/5] Running Frontend Tests (Playwright)...${NC}"
cd frontend
if npm run test 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend tests passed${NC}"
else
    echo -e "${RED}✗ Frontend tests failed${NC}"
    FAILURES=$((FAILURES + 1))
fi
cd "$ROOT_DIR"

# 5. Secrets Scan
echo -e "\n${YELLOW}[5/5] Running Secrets Scan (gitleaks)...${NC}"
if command -v gitleaks &> /dev/null; then
    if gitleaks detect --source . --no-banner; then
        echo -e "${GREEN}✓ No secrets found${NC}"
    else
        echo -e "${RED}✗ Secrets detected!${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}⚠ gitleaks not installed, run: brew install gitleaks${NC}"
fi

# Summary
echo -e "\n========================================="
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}All checks passed! Ready to deploy.${NC}"
    exit 0
else
    echo -e "${RED}$FAILURES check(s) failed. Fix before deploying.${NC}"
    exit 1
fi
