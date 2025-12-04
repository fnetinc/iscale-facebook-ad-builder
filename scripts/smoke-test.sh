#!/bin/bash
# Quick smoke test - run before commits

set -e

echo "========================================="
echo "BreadWinner Smoke Test"
echo "========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Backend syntax check
echo "[1/3] Checking backend syntax..."
cd backend
python -m py_compile app/main.py app/models.py app/database.py 2>/dev/null && echo "✓ Backend syntax OK" || echo "✗ Syntax errors found"
cd "$ROOT_DIR"

# Frontend lint
echo "[2/3] Linting frontend..."
cd frontend
npm run lint --silent 2>/dev/null && echo "✓ Frontend lint OK" || echo "⚠ Lint warnings"
cd "$ROOT_DIR"

# Quick unit tests
echo "[3/3] Running quick tests..."
cd backend
if source venv/bin/activate 2>/dev/null; then
    pytest tests/unit -x -q --tb=no 2>/dev/null && echo "✓ Unit tests OK" || echo "⚠ Tests failed"
fi
cd "$ROOT_DIR"

echo "========================================="
echo "Smoke test complete"
