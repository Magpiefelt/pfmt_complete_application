#!/bin/bash

# PFMT Application Startup Script
# This script starts the complete PFMT application stack

echo "🚀 Starting PFMT Complete Application..."
echo "======================================="

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "📊 Starting PostgreSQL..."
    sudo systemctl start postgresql
    sleep 2
fi

# Check if database exists
DB_EXISTS=$(PGPASSWORD=pfmt_password psql -h localhost -U pfmt_user -d pfmt_integrated -c "SELECT 1;" 2>/dev/null | grep -c "1")

if [ "$DB_EXISTS" != "1" ]; then
    echo "🗄️  Setting up database..."
    sudo -u postgres psql -c "CREATE USER pfmt_user WITH PASSWORD 'pfmt_password';" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE DATABASE pfmt_integrated OWNER pfmt_user;" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pfmt_integrated TO pfmt_user;" 2>/dev/null || true
    
    echo "📋 Applying database schema..."
    PGPASSWORD=pfmt_password psql -h localhost -U pfmt_user -d pfmt_integrated -f database/fresh_schema.sql
    PGPASSWORD=pfmt_password psql -h localhost -U pfmt_user -d pfmt_integrated -f database/working_seed.sql
fi

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
DB_HOST=localhost DB_PORT=5432 DB_NAME=pfmt_integrated DB_USER=pfmt_user DB_PASSWORD=pfmt_password NODE_ENV=development PORT=3002 BYPASS_AUTH=true nohup node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend in background
echo "🎨 Starting frontend server..."
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for services to start
sleep 5

echo ""
echo "✅ PFMT Application Started Successfully!"
echo "======================================="
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3002"
echo "🏥 Health Check: http://localhost:3002/health"
echo ""
echo "📋 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "📄 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop the application:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🎯 Application is ready for use!"

# Test the application
echo "🧪 Testing application..."
sleep 2

HEALTH_CHECK=$(curl -s http://localhost:3002/health | grep -c "healthy" || echo "0")
if [ "$HEALTH_CHECK" = "1" ]; then
    echo "✅ Backend health check: PASSED"
else
    echo "❌ Backend health check: FAILED"
fi

DB_CHECK=$(curl -s http://localhost:3002/health/db | grep -c "connected" || echo "0")
if [ "$DB_CHECK" = "1" ]; then
    echo "✅ Database connectivity: PASSED"
else
    echo "❌ Database connectivity: FAILED"
fi

echo ""
echo "🎉 PFMT Application is running and ready!"
echo "   Open your browser to http://localhost:5173 to access the application"

