#!/usr/bin/env bash
# ==============================================================================
# EduTech Compiler - Install Languages into Piston Container
# ==============================================================================

set -e

echo "=== Installing Essential Languages into Piston ==="

# Languages list
LANGUAGES=("python" "node" "gcc" "typescript" "java" "sqlite3" "bash" "go" "rust")

for LANG in "${LANGUAGES[@]}"; do
  echo "Installing $LANG..."
  docker exec piston_api node /piston/cli/index.js ppman install "$LANG" || \
  curl -s -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" -d "{\"language\":\"$LANG\"}" || true
done

echo ""
echo "=== Installed Languages Check ==="
curl -s http://localhost:2000/api/v2/runtimes
echo ""
