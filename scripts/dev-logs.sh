#!/usr/bin/env bash
# View logs for PFMT development services

set -e

# Colors for output
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Determine script directory and project root
SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
COMPOSE_DIR="${PROJECT_ROOT}/docker"

echo -e "${BLUE}📜 PFMT Development Logs${NC}"
echo "========================"
echo "Press Ctrl+C to exit"
echo ""

cd "$COMPOSE_DIR"

# Follow logs for all services
docker compose -f docker-compose.dev.yml logs -f --tail=50