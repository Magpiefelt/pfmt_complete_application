#!/bin/bash

# PFMT Docker Setup Script
# This script helps set up the PFMT application using Docker

set -e

echo "🚀 PFMT Docker Setup Script"
echo "=========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to generate random secret
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.docker .env
    
    # Generate secure secrets
    JWT_SECRET=$(generate_secret)
    SESSION_SECRET=$(generate_secret)
    DB_PASSWORD=$(generate_secret)
    
    # Replace placeholders with generated secrets
    sed -i "s/your_secure_database_password_here/$DB_PASSWORD/g" .env
    sed -i "s/your_jwt_secret_key_here_minimum_32_characters/$JWT_SECRET/g" .env
    sed -i "s/your_session_secret_here_minimum_32_characters/$SESSION_SECRET/g" .env
    
    echo "✅ .env file created with secure random secrets"
else
    echo "ℹ️  .env file already exists, skipping creation"
fi

# Ask user for deployment type
echo ""
echo "Select deployment type:"
echo "1) Development (with hot reload and debugging)"
echo "2) Production (optimized for production use)"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🔧 Setting up development environment..."
        docker-compose down --remove-orphans
        docker-compose build
        docker-compose up -d
        COMPOSE_FILE="docker-compose.yml"
        ;;
    2)
        echo "🏭 Setting up production environment..."
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        COMPOSE_FILE="docker-compose.yml -f docker-compose.prod.yml"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check database
if docker-compose exec postgres pg_isready -U pfmt_user -d pfmt_integrated > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database is not responding"
fi

# Check backend
if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
fi

# Check frontend
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 PFMT Docker setup complete!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3002/api"
echo "   Database: localhost:5432"
echo ""
echo "🛠️  Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "📖 For more information, see the README.md file"

