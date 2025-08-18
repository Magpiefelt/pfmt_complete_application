#!/bin/bash

echo "🚀 PFMT Enhanced Application Installation Script"
echo "=============================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 14+ first."
    exit 1
fi

echo "✅ PostgreSQL found"

# Database setup
echo ""
echo "🗄️ Setting up database..."
echo "Please enter your PostgreSQL superuser password when prompted:"

sudo -u postgres psql -c "CREATE DATABASE pfmt_db;" 2>/dev/null || echo "Database pfmt_db already exists"
sudo -u postgres psql -c "CREATE USER pfmt_user WITH PASSWORD 'pfmt_password';" 2>/dev/null || echo "User pfmt_user already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pfmt_db TO pfmt_user;" 2>/dev/null
sudo -u postgres psql -c "ALTER USER pfmt_user CREATEDB;" 2>/dev/null

echo "✅ Database setup complete"

# Backend setup
echo ""
echo "⚙️ Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'ENVEOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pfmt_db
DB_USER=pfmt_user
DB_PASSWORD=pfmt_password

# Application Configuration
NODE_ENV=development
PORT=3002

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Logging Configuration
LOG_LEVEL=debug

# Development Configuration
BYPASS_AUTH=true
ENVEOF
fi

echo "Installing backend dependencies..."
npm install

echo "Running database migrations..."
node database/migrate.js migrate

echo "✅ Backend setup complete"

# Frontend setup
echo ""
echo "🎨 Setting up frontend..."
cd ../frontend

echo "Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete"

echo ""
echo "🎉 Installation complete!"
echo ""
echo "To start the application:"
echo "1. Backend:  cd backend && npm start"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Then visit: http://localhost:5173"
echo "Backend API: http://localhost:3002"
echo ""
echo "Health checks:"
echo "- curl http://localhost:3002/health"
echo "- curl http://localhost:3002/health/db"
