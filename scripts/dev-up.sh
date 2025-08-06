#!/usr/bin/env bash
# Start the PFMT development environment with Docker Compose
#
# This script:
# - Creates .env from .env.example if it doesn't exist
# - Builds and starts all development services
# - Shows service URLs and useful commands

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

echo -e "${BLUE}🚀 Starting PFMT Development Environment${NC}"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
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
        echo -e "${YELLOW}⚠️  Please review and update secrets in docker/.env before production use!${NC}"
    else
        echo -e "${RED}❌ .env.example not found in docker/ directory${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Using existing .env configuration${NC}"
fi

# Change to docker directory
cd "$COMPOSE_DIR"

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping any existing containers...${NC}"
docker compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Build and start services
echo -e "${BLUE}🔨 Building and starting services...${NC}"
docker compose -f docker-compose.dev.yml up --build -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check service health
echo -e "${BLUE}🔍 Checking service health...${NC}"

# Check database
if docker compose -f docker-compose.dev.yml exec -T db pg_isready -U pfmt -d pfmt &>/dev/null; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Database is starting up...${NC}"
fi

# Check backend (with retry)
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health &>/dev/null; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        break
    elif [ $i -eq 10 ]; then
        echo -e "${YELLOW}⚠️  Backend is still starting up...${NC}"
    else
        sleep 2
    fi
done

# Check frontend
if curl -f http://localhost:5173 &>/dev/null; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is starting up...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 PFMT Development Environment Started!${NC}"
echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo "   🌐 Frontend:  http://localhost:5173"
echo "   🔧 Backend:   http://localhost:3000/api"
echo "   🗄️  Database:  localhost:5432 (pfmt/pfmt_secure_password_change_me)"
echo "   📊 pgAdmin:   http://localhost:8081 (admin@pfmt.local/admin123)"
echo ""
echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo "   📜 View logs:     ./scripts/dev-logs.sh"
echo "   🛑 Stop services: ./scripts/dev-down.sh"
echo "   🔄 Restart:       ./scripts/dev-up.sh"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "   • Edit files in frontend/ or backend/ for hot reload"
echo "   • Use pgAdmin to inspect the database"
echo "   • Check logs if services aren't responding"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

