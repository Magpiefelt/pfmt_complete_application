#!/usr/bin/env bash
# Start the PFMT production environment with Docker Compose

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

echo -e "${BLUE}🏭 Starting PFMT Production Environment${NC}"
echo "======================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available. Please install Docker Compose.${NC}"
    exit 1
fi

# Create .env from example if it doesn't exist
if [[ ! -f "${COMPOSE_DIR}/.env" ]]; then
    if [[ -f "${COMPOSE_DIR}/.env.example" ]]; then
        cp "${COMPOSE_DIR}/.env.example" "${COMPOSE_DIR}/.env"
        echo -e "${GREEN}✅ Created .env from .env.example${NC}"
        echo -e "${RED}⚠️  IMPORTANT: Update secrets in docker/.env for production!${NC}"
    else
        echo -e "${RED}❌ .env.example not found in docker/ directory${NC}"
        exit 1
    fi
fi

# Warn about production secrets
echo -e "${YELLOW}🔐 Security Check:${NC}"
if grep -q "change_in_production\|change_me" "${COMPOSE_DIR}/.env"; then
    echo -e "${RED}⚠️  WARNING: Default secrets detected in .env file!${NC}"
    echo -e "${RED}   Please update JWT_SECRET and database passwords before production use.${NC}"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Aborted. Please update secrets in docker/.env${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Custom secrets detected${NC}"
fi

cd "$COMPOSE_DIR"

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping any existing containers...${NC}"
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Build and start production services
echo -e "${BLUE}🔨 Building and starting production services...${NC}"
docker compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}🔍 Checking service health...${NC}"

# Check database
if docker compose -f docker-compose.prod.yml exec -T db pg_isready -U pfmt -d pfmt &>/dev/null; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Database is starting up...${NC}"
fi

# Check backend
for i in {1..15}; do
    if curl -f http://localhost:3000/api/health &>/dev/null; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        break
    elif [ $i -eq 15 ]; then
        echo -e "${YELLOW}⚠️  Backend is still starting up...${NC}"
    else
        sleep 2
    fi
done

# Check frontend
if curl -f http://localhost:8080/health &>/dev/null; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is starting up...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 PFMT Production Environment Started!${NC}"
echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo "   🌐 Frontend:  http://localhost:8080"
echo "   🔧 Backend:   http://localhost:3000/api"
echo "   🗄️  Database:  localhost:5432 (internal only)"
echo ""
echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo "   📜 View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "   🛑 Stop services: ./scripts/prod-down.sh"
echo "   📊 Monitor:       docker stats"
echo ""
echo -e "${YELLOW}💡 Production Notes:${NC}"
echo "   • Frontend served by Nginx on port 8080"
echo "   • Backend API available on port 3000"
echo "   • Database not exposed externally"
echo "   • All data persisted in Docker volumes"
echo ""
echo -e "${GREEN}Production deployment complete! 🚀${NC}"

