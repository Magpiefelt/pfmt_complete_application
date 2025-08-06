# PFMT - Project Financial Management Tool

A comprehensive project financial management system with complete Docker deployment setup.

## 🚀 Quick Start

### Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+
- **4GB RAM** and **10GB disk space** available

### One-Command Setup

```bash
# Start development environment
./scripts/dev-up.sh
```

**That's it!** The application will be available at:
- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:3000/api
- 📊 **pgAdmin**: http://localhost:8081

## 🐳 Docker Deployment

### Development Mode (Recommended)

```bash
# Start with hot reload
./scripts/dev-up.sh

# View logs
./scripts/dev-logs.sh

# Stop services
./scripts/dev-down.sh
```

### Production Mode

```bash
# Start production build
./scripts/prod-up.sh

# Stop production
./scripts/prod-down.sh
```

### Cleanup

```bash
# Remove all Docker resources (⚠️ deletes data!)
./scripts/clean.sh
```

## 🛠️ Configuration

### Environment Setup

The first time you run `./scripts/dev-up.sh`, it will automatically create a `.env` file from `.env.example` in the `docker/` directory.

**Important**: For production use, update these values in `docker/.env`:

```bash
# Security (CHANGE IN PRODUCTION!)
JWT_SECRET=your_secure_jwt_secret_here
POSTGRES_PASSWORD=your_secure_db_password

# Database
POSTGRES_USER=pfmt
POSTGRES_DB=pfmt
```

## 📋 Features

- ✅ **Complete Project Management** with 15+ database fields
- ✅ **Team Management** with role-based access
- ✅ **Vendor Management** with contract tracking
- ✅ **Milestone Tracking** across 4 project phases
- ✅ **Version Control** with monthly updates and approval workflow
- ✅ **Dashboard Analytics** with project portfolio overview
- ✅ **File Upload Management** with persistent storage

## 🔧 Architecture

- **Frontend**: Vue.js 3 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js with comprehensive API
- **Database**: PostgreSQL with automatic schema initialization
- **Deployment**: Complete Docker setup with development and production modes

## 📊 Service URLs

### Development Mode
- **Frontend**: http://localhost:5173 (Vite dev server with hot reload)
- **Backend API**: http://localhost:3000/api
- **Database**: localhost:5432 (pfmt/pfmt_secure_password_change_me)
- **pgAdmin**: http://localhost:8081 (admin@pfmt.local/admin123)

### Production Mode
- **Frontend**: http://localhost:8080 (Nginx-served static files)
- **Backend API**: http://localhost:3000/api
- **Database**: localhost:5432 (internal only)

## 🐛 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
./scripts/dev-logs.sh

# Clean restart
./scripts/clean.sh
./scripts/dev-up.sh
```

**Port conflicts:**
- Ensure ports 3000, 5173, 5432, 8080, 8081 are available
- Modify port mappings in `docker/docker-compose.*.yml` if needed

**Database issues:**
```bash
# Reset database
./scripts/clean.sh
./scripts/dev-up.sh
```

### Getting Help

1. **Check Logs**: `./scripts/dev-logs.sh`
2. **Verify Status**: `cd docker && docker compose -f docker-compose.dev.yml ps`
3. **Clean Start**: `./scripts/clean.sh && ./scripts/dev-up.sh`

## 🚀 Ready to Deploy

This repository is a complete, production-ready PFMT application with:
- ✅ All features fully implemented
- ✅ Complete Docker configuration
- ✅ One-command deployment scripts
- ✅ Development and production modes
- ✅ Comprehensive documentation

**Get started now:** `./scripts/dev-up.sh` 🚀

