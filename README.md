# PFMT Enhanced Application

**Professional Financial Management Tool - Enhanced Edition with Dual-Wizard System**

A comprehensive project management application with dual-wizard workflow system, role-based access control, and advanced project lifecycle management.

## 🚀 Features

### Core Functionality
- **Dual-Wizard System**: Role-based wizard steps for different user types
- **Project Lifecycle Management**: Comprehensive project status tracking with dual status system
- **Role-Based Access Control**: 8 canonical roles with hierarchical permissions
- **Advanced Workflow Management**: Sophisticated project workflow with status transitions
- **Data Persistence**: Robust data storage with PostgreSQL backend
- **Real-time Updates**: Live project status updates and notifications

### Wizard System
- **PMI Users**: Project initiation workflow
- **Directors**: Team assignment and project oversight
- **PM/SPM**: Project configuration and finalization
- **Legacy Support**: Backward compatibility for existing workflows

### Technical Features
- **Modern Tech Stack**: Node.js/Express backend, Vue.js 3 frontend with TypeScript
- **Database**: PostgreSQL with comprehensive schema and migrations
- **Security**: JWT authentication, role-based authorization, audit logging
- **Performance**: Optimized queries, caching, and efficient data loading
- **Responsive Design**: Mobile-friendly UI with modern styling

## 📋 Requirements

### System Requirements
- Node.js 16.x or higher
- PostgreSQL 12.x or higher
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Development Requirements
- Git for version control
- Code editor (VS Code recommended)
- PostgreSQL client (pgAdmin or similar)

## 🛠 Installation

### 1. Database Setup

```bash
# Create database
createdb pfmt_enhanced

# Connect to database
psql -d pfmt_enhanced

# Run schema setup
\i database/schema-COMPLETE.sql

# Run lifecycle status migration
\i database/add_lifecycle_status_migration.sql
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Environment Variables:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pfmt_enhanced
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:8080
```

```bash
# Start the backend server
npm start

# For development with auto-reload
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run serve

# Build for production
npm run build
```

## 🏗 Architecture

### Dual Status System
- **workflow_status**: Tracks wizard progress (initiated → assigned → finalized)
- **lifecycle_status**: Tracks project lifecycle (active → completed → archived)

### Role Hierarchy
1. **VENDOR** - External vendor access
2. **ANALYST** - Data analysis and reporting
3. **PMI** - Project initiation and management
4. **PM** - Project management
5. **SPM** - Senior project management
6. **DIRECTOR** - Department oversight
7. **ADMIN** - System administration
8. **SUPER_ADMIN** - Full system access

### Workflow Steps
1. **Initiation** (PMI) → Status: initiated
2. **Assignment** (Director) → Status: assigned  
3. **Configuration** (PM/SPM) → Status: finalized, lifecycle: active
4. **Management** → Various lifecycle statuses

## 🔐 Security

### Authentication
- JWT-based authentication with secure token handling
- Password hashing using bcrypt
- Session management with token refresh

### Authorization
- Role-based access control (RBAC) with 8 canonical roles
- Route-level permission checking
- API endpoint authorization middleware

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh

### Project Workflow Endpoints
- `POST /api/project-workflow/initiate` - Create project (PMI)
- `POST /api/project-workflow/:id/assign` - Assign team (Director)
- `POST /api/project-workflow/:id/finalize` - Finalize project (PM/SPM)
- `GET /api/project-workflow/:id/status` - Get project status
- `GET /api/project-workflow/:id/details` - Get enhanced project details

### Dual-Wizard Support Endpoints
- `GET /api/project-workflow/users/available` - Get available users
- `GET /api/project-workflow/vendors/available` - Get available vendors

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                # Run all tests
npm run test:coverage  # Coverage report
```

### Frontend Testing
```bash
cd frontend
npm run test:unit      # Unit tests
npm run test:e2e       # End-to-end tests
```

### Manual Testing Checklist
1. **Database Migration**: Verify lifecycle_status column creation
2. **API Endpoints**: Test all new dual-wizard endpoints
3. **Wizard Flow**: Test complete workflow from initiation to finalization
4. **Role Access**: Verify role-based access controls
5. **Data Persistence**: Confirm form data saves correctly to store

## 🚀 Deployment

### Production Deployment
1. **Database**: Set up production PostgreSQL instance
2. **Backend**: Deploy to production server (PM2 recommended)
3. **Frontend**: Build and deploy to web server (Nginx recommended)
4. **Environment**: Configure production environment variables
5. **SSL**: Set up HTTPS certificates

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Verify connection settings
psql -h localhost -U postgres -d pfmt_enhanced
```

**Wizard Store Issues**
```bash
# Clear browser cache and localStorage
# Check Vue DevTools for store state
# Verify API responses in Network tab
```

### Debug Mode
```bash
# Backend debug mode
DEBUG=* npm run dev

# Frontend debug mode
npm run serve
```

## 🔄 Key Enhancements in v2.0

### Critical Fixes
- **P0 Fix**: Configuration Step now properly binds to wizard store fields
- **Store Contract**: Fixed data persistence issues in project finalization
- **Status System**: Implemented dual status tracking (workflow + lifecycle)

### New Features
- **Dual-Wizard System**: Role-based wizard steps
- **Legacy Support**: Backward compatibility for Directors/SPMs/Admins
- **Enhanced APIs**: New endpoints for users and vendors
- **Improved UX**: Better form validation and error handling

### Performance Improvements
- **Database Indexing**: Added indexes for lifecycle_status queries
- **API Optimization**: Fallback mechanisms for data availability
- **Frontend Optimization**: Computed properties for efficient reactivity

## 📚 Documentation

- **User Guide**: Complete workflow documentation
- **Developer Guide**: Technical implementation details
- **API Reference**: Comprehensive endpoint documentation
- **Deployment Guide**: Production deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**PFMT Enhanced Application v2.0** - Professional Financial Management Tool with Dual-Wizard System

**Release Date:** August 18, 2025  
**Author:** Manus AI Development Team
