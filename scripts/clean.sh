#!/usr/bin/env bash
# Clean up PFMT Docker resources (containers, images, volumes)

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

echo -e "${BLUE}🧹 PFMT Docker Cleanup${NC}"
echo "====================="
echo ""
echo "This will remove:"
echo "  • All PFMT containers (dev and prod)"
echo "  • All PFMT Docker images"
echo "  • All PFMT Docker volumes (⚠️  DATA WILL BE LOST!)"
echo ""
echo -e "${RED}⚠️  WARNING: This will delete all database data and uploads!${NC}"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cleanup cancelled${NC}"
    exit 0
fi

cd "$COMPOSE_DIR"

# Stop all containers
echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
docker compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Remove PFMT images
echo -e "${YELLOW}🗑️  Removing PFMT images...${NC}"
docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "pfmt|pfmt_" | awk '{print $1}' | xargs -r docker rmi -f 2>/dev/null || true

# Remove PFMT volumes
echo -e "${YELLOW}🗑️  Removing PFMT volumes...${NC}"
docker volume ls --format "table {{.Name}}" | grep -E "pfmt" | xargs -r docker volume rm 2>/dev/null || true

# Clean up unused resources
echo -e "${YELLOW}🧹 Cleaning up unused Docker resources...${NC}"
docker system prune -f

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo -e "${BLUE}💡 Next steps:${NC}"
echo "   • Run ./scripts/dev-up.sh to start fresh development environment"
echo "   • Run ./scripts/prod-up.sh to start fresh production environment"

