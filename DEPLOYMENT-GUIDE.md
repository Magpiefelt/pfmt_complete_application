# PFMT Application - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm 10+
- PostgreSQL database (optional for basic functionality)
- Git (for version control)

### Installation Steps

1. **Extract and Navigate**
   ```bash
   # Extract the zip file
   unzip pfmt_complete_fixed.zip
   cd pfmt_complete_fixed
   ```

2. **Install Dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Backend environment
   cd ../backend
   cp .env.example .env
   # Edit .env with your database credentials if needed
   
   # Frontend environment (optional)
   cd ../frontend
   cp .env.example .env.local
   ```

4. **Start Development**
   ```bash
   # Option 1: Use the startup script (recommended)
   cd ..
   ./start-dev.sh
   
   # Option 2: Manual start
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

## 📁 Project Structure

```
pfmt_complete_fixed/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Database and route configuration
│   ├── controllers/        # API controllers
│   ├── middleware/         # Authentication, logging, validation
│   ├── routes/             # API route definitions
│   ├── uploads/            # File upload directory
│   ├── .env.example        # Environment template
│   ├── app.js              # Express application setup
│   ├── server.js           # Server entry point
│   └── package.json        # Backend dependencies
├── frontend/               # Vue.js frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── views/          # Page components
│   │   ├── stores/         # Pinia state management
│   │   ├── services/       # API service layer
│   │   └── router/         # Vue Router configuration
│   ├── .env.example        # Frontend environment template
│   ├── vite.config.ts      # Vite configuration
│   └── package.json        # Frontend dependencies
├── start-dev.sh            # Development startup script
├── README-FIXES.md         # Applied fixes documentation
└── DEPLOYMENT-GUIDE.md     # This file
```

## 🔧 Configuration Details

### Backend Configuration (.env)
```bash
# Server
PORT=3001
NODE_ENV=development
HOST=0.0.0.0

# Database (optional)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pfmt_integrated
DB_USER=pfmt_user
DB_PASSWORD=your_password

# Development
BYPASS_AUTH=true
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001,http://localhost:3000

# Security
JWT_SECRET=your_jwt_secret_here
```

### Frontend Configuration (.env.local)
```bash
# API Configuration
VITE_API_BASE_URL=/api

# Development
VITE_DEV_MODE=true
VITE_BYPASS_AUTH=true
```

## 🛠 Development Commands

### Backend
```bash
cd backend
npm start          # Production start
npm run dev        # Development with nodemon
npm run migrate    # Run database migrations
npm run seed       # Seed database with test data
```

### Frontend
```bash
cd frontend
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
npm run type-check # TypeScript checking
npm run lint       # ESLint checking
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3001
   
   # Kill the process
   kill <PID>
   
   # Or change port in .env
   PORT=3002
   ```

2. **Database Connection Issues**
   - Set `BYPASS_AUTH=true` in backend/.env for development
   - Application works without database for basic functionality
   - Install PostgreSQL if full database features needed

3. **CORS Errors**
   - Ensure frontend URL is in ALLOWED_ORIGINS
   - Check that both frontend and backend are running
   - Verify Vite proxy configuration

4. **Module Not Found Errors**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

### Health Checks
- Backend Health: http://localhost:3001/health
- Database Health: http://localhost:3001/health/db
- Route Status: http://localhost:3001/api/routes/status

## 🚀 Production Deployment

### Backend Production
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

### Frontend Production
```bash
cd frontend
npm run build
# Serve the dist/ folder with your web server
```

## 📋 Features Included

✅ **Security Hardening**
- Bearer token authentication
- CORS protection
- Input validation
- Error handling

✅ **Development Tools**
- Hot module replacement
- API proxy configuration
- Development startup script
- Comprehensive logging

✅ **API Features**
- RESTful API endpoints
- File upload support
- Health monitoring
- Route documentation

✅ **Frontend Features**
- Vue 3 with TypeScript
- Pinia state management
- Vue Router
- Responsive design
- Toast notifications

## 🔄 Integration with Git Repository

When merging with your main repository:

1. **Backup Current Work**
   ```bash
   git checkout -b backup-before-merge
   git add -A && git commit -m "Backup before applying fixes"
   ```

2. **Apply Changes**
   ```bash
   git checkout main
   # Copy files from this package
   # Review and commit changes
   ```

3. **Key Files to Review**
   - `backend/server.js` - Port configuration
   - `backend/app.js` - CORS settings
   - `frontend/vite.config.ts` - Proxy configuration
   - `*.env.example` - Environment templates

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the README-FIXES.md for applied changes
3. Ensure all dependencies are installed
4. Verify environment configuration

The application is production-ready with all critical bugs fixed and launch-blocking issues resolved.

