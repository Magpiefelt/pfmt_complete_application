#!/bin/bash
echo "🚀 Starting PFMT Development Environment"
echo "========================================"

# Start backend
echo "🔧 Starting backend on port 3001..."
cd backend
node server.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend on port 5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Development environment started!"
echo "   🔧 Backend:  http://localhost:3001"
echo "   🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait

