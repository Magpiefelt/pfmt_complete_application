#!/usr/bin/env bash
# Stop the PFMT development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Determine script directory and project root
SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
COMPOSE_DIR="${PROJECT_ROOT}/docker"

echo -e "${BLUE}🛑 Stopping PFMT Development Environment${NC}"
echo "======================================="

cd "$COMPOSE_DIR"

# Stop and remove containers
echo -e "${YELLOW}⏳ Stopping containers...${NC}"
docker compose -f docker-compose.dev.yml down --remove-orphans

echo -e "${GREEN}✅ Development environment stopped${NC}"
echo ""
echo -e "${BLUE}💡 Note:${NC}"
echo "   • Database data is preserved in Docker volumes"
echo "   • To remove all data: docker volume prune"
echo "   • To restart: ./scripts/dev-up.sh"