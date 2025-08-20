#!/bin/bash

# PFMT Application Stop Script
# This script stops the PFMT application services

echo "🛑 Stopping PFMT Application..."
echo "==============================="

# Kill Node.js processes (backend and frontend)
echo "🔧 Stopping backend and frontend servers..."

# Find and kill backend process
BACKEND_PIDS=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "   Stopping backend processes: $BACKEND_PIDS"
    kill $BACKEND_PIDS 2>/dev/null || true
fi

# Find and kill frontend process (Vite dev server)
FRONTEND_PIDS=$(ps aux | grep "vite" | grep -v grep | awk '{print $2}')
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "   Stopping frontend processes: $FRONTEND_PIDS"
    kill $FRONTEND_PIDS 2>/dev/null || true
fi

# Kill any remaining npm processes
NPM_PIDS=$(ps aux | grep "npm run dev" | grep -v grep | awk '{print $2}')
if [ ! -z "$NPM_PIDS" ]; then
    echo "   Stopping npm processes: $NPM_PIDS"
    kill $NPM_PIDS 2>/dev/null || true
fi

# Wait a moment for graceful shutdown
sleep 2

# Force kill if still running
pkill -f "node server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo ""
echo "✅ PFMT Application Stopped Successfully!"
echo "======================================="
echo ""
echo "📄 Log files preserved:"
echo "   Backend log: backend.log"
echo "   Frontend log: frontend.log"
echo ""
echo "🚀 To restart the application:"
echo "   ./start_application.sh"

