# PFMT Deployment Guide

## 🎯 Complete Setup Instructions

This guide provides step-by-step instructions for deploying the PFMT application using Docker.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Linux, macOS, or Windows with WSL2
- **RAM**: Minimum 4GB available for containers
- **Disk Space**: Minimum 10GB available
- **Network**: Internet connection for downloading Docker images

### Required Software
- **Docker Engine** 20.10 or later
- **Docker Compose** 2.0 or later

### Installing Docker

**Ubuntu/Debian:**
```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then test
docker --version
docker compose version
```

**macOS:**
```bash
# Install Docker Desktop from https://docker.com/products/docker-desktop
# Or using Homebrew:
brew install --cask docker
```

**Windows:**
```bash
# Install Docker Desktop from https://docker.com/products/docker-desktop
# Ensure WSL2 is enabled
```

## 🚀 Deployment Steps

### Step 1: Prepare the Repository

```bash
# Navigate to your PFMT directory
cd pfmt_complete_application

# Verify directory structure
ls -la
# Should see: backend/, frontend/, database/, docker/, scripts/
```

### Step 2: Configure Environment

```bash
# The environment will be automatically created on first run
# Or manually create it:
cd docker
cp .env.example .env

# Edit environment variables (optional for development)
nano .env
```

### Step 3: Start Development Environment

```bash
# Return to project root
cd ..

# Start all services
./scripts/dev-up.sh
```

**Expected Output:**
```
🚀 Starting PFMT Development Environment
========================================
✅ Created .env from .env.example
⚠️  Please review and update secrets in docker/.env before production use!
✅ Using existing .env configuration
🛑 Stopping any existing containers...
🔨 Building and starting services...
⏳ Waiting for services to be ready...
🔍 Checking service health...
✅ Database is healthy
✅ Backend is healthy
✅ Frontend is healthy

🎉 PFMT Development Environment Started!

📋 Service URLs:
   🌐 Frontend:  http://localhost:5173
   🔧 Backend:   http://localhost:3000/api
   🗄️  Database:  localhost:5432 (pfmt/pfmt_secure_password_change_me)
   📊 pgAdmin:   http://localhost:8081 (admin@pfmt.local/admin123)
```

### Step 4: Verify Deployment

1. **Frontend**: Open http://localhost:5173
   - Should show the PFMT login page
   - Interface should be responsive and load properly

2. **Backend API**: Test http://localhost:3000/api/health
   - Should return: `{"status":"ok","timestamp":"..."}`

3. **Database**: Access pgAdmin at http://localhost:8081
   - Login: admin@pfmt.local / admin123
   - Add server: Host=db, Port=5432, User=pfmt, Password=pfmt_secure_password_change_me

## 🏭 Production Deployment

### Step 1: Update Security Settings

```bash
cd docker
nano .env
```

**Update these critical values:**
```bash
# Generate secure secrets (32+ characters)
JWT_SECRET=your_super_secure_jwt_secret_here_32_chars_minimum
POSTGRES_PASSWORD=your_super_secure_database_password_here

# Update for production
NODE_ENV=production
LOG_LEVEL=warn
```

### Step 2: Start Production Environment

```bash
cd ..
./scripts/prod-up.sh
```

**Production URLs:**
- **Frontend**: http://localhost:8080 (Nginx-served)
- **Backend API**: http://localhost:3000/api
- **Database**: Internal only (not exposed)

## 🛠️ Management Commands

### Development Commands

```bash
# Start development environment
./scripts/dev-up.sh

# View logs (all services)
./scripts/dev-logs.sh

# Stop development environment
./scripts/dev-down.sh
```

### Production Commands

```bash
# Start production environment
./scripts/prod-up.sh

# Stop production environment
./scripts/prod-down.sh

# View production logs
cd docker
docker compose -f docker-compose.prod.yml logs -f
```

### Maintenance Commands

```bash
# Clean all Docker resources (⚠️ deletes data!)
./scripts/clean.sh

# Check service status
cd docker
docker compose -f docker-compose.dev.yml ps

# Monitor resource usage
docker stats
```

## 🔧 Configuration Options

### Environment Variables

**Application Settings:**
```bash
NODE_ENV=development          # development | production
PORT=3000                    # Backend port
LOG_LEVEL=debug              # debug | info | warn | error
```

**Database Settings:**
```bash
POSTGRES_USER=pfmt           # Database username
POSTGRES_PASSWORD=...        # Database password (CHANGE!)
POSTGRES_DB=pfmt            # Database name
DB_HOST=db                  # Database host (container name)
DB_PORT=5432                # Database port
```

**Security Settings:**
```bash
JWT_SECRET=...              # JWT signing secret (CHANGE!)
CORS_ORIGIN=http://localhost:5173  # Allowed frontend origin
```

**Frontend Settings:**
```bash
VITE_API_BASE_URL=http://localhost:3000/api  # API endpoint
VITE_APP_TITLE=PFMT Integrated               # App title
VITE_DEV_MODE=true                          # Development mode
```

### Port Configuration

**Default Ports:**
- Frontend (dev): 5173
- Frontend (prod): 8080
- Backend: 3000
- Database: 5432
- pgAdmin: 8081

**To change ports**, edit the `docker-compose.*.yml` files:
```yaml
services:
  frontend:
    ports:
      - "3001:5173"  # Change 3001 to your desired port
```

## 📊 Monitoring & Maintenance

### Health Checks

All services include automatic health checks:

```bash
# Check overall status
cd docker
docker compose -f docker-compose.dev.yml ps

# Detailed health information
docker inspect pfmt_backend_dev | grep -A 10 Health
```

### Log Management

```bash
# Follow all logs
./scripts/dev-logs.sh

# View specific service logs
cd docker
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend
docker compose -f docker-compose.dev.yml logs db
```

### Database Management

**Backup Database:**
```bash
cd docker
docker compose -f docker-compose.dev.yml exec db pg_dump -U pfmt pfmt > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore Database:**
```bash
cd docker
docker compose -f docker-compose.dev.yml exec -T db psql -U pfmt pfmt < backup_file.sql
```

**Reset Database:**
```bash
./scripts/clean.sh
./scripts/dev-up.sh
```

### File Upload Management

**View uploaded files:**
```bash
cd docker
docker compose -f docker-compose.dev.yml exec backend ls -la /app/uploads
```

**Backup uploads:**
```bash
cd docker
docker cp pfmt_backend_dev:/app/uploads ./uploads_backup
```

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :5173

# Kill the process or change ports in docker-compose files
```

**2. Docker Permission Denied**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

**3. Services Won't Start**
```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
./scripts/dev-logs.sh

# Clean restart
./scripts/clean.sh
./scripts/dev-up.sh
```

**4. Database Connection Issues**
```bash
# Test database connectivity
cd docker
docker compose -f docker-compose.dev.yml exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'db', port: 5432, database: 'pfmt',
  user: 'pfmt', password: process.env.POSTGRES_PASSWORD
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
"
```

**5. Frontend Build Issues**
```bash
# Rebuild frontend
cd docker
docker compose -f docker-compose.dev.yml build frontend --no-cache
docker compose -f docker-compose.dev.yml up frontend -d
```

### Performance Issues

**1. Slow Startup**
- Increase Docker memory allocation (Docker Desktop settings)
- Ensure SSD storage for Docker volumes
- Close unnecessary applications

**2. High Resource Usage**
```bash
# Monitor container resources
docker stats

# Limit container resources (add to docker-compose.yml)
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Getting Help

**1. Check Service Status:**
```bash
cd docker
docker compose -f docker-compose.dev.yml ps
```

**2. View Detailed Logs:**
```bash
./scripts/dev-logs.sh
```

**3. Test Individual Components:**
```bash
# Test database
docker compose -f docker-compose.dev.yml exec db pg_isready -U pfmt

# Test backend
curl http://localhost:3000/api/health

# Test frontend
curl http://localhost:5173
```

**4. Clean Restart:**
```bash
./scripts/clean.sh
./scripts/dev-up.sh
```

## 🚀 Success Indicators

Your deployment is successful when:

✅ All containers show "Up (healthy)" status  
✅ Frontend loads at http://localhost:5173  
✅ Backend API responds at http://localhost:3000/api/health  
✅ pgAdmin connects to database at http://localhost:8081  
✅ No error messages in logs  
✅ Hot reload works when editing files  

## 🎉 Next Steps

Once deployed successfully:

1. **Explore the Application**: Navigate through all features
2. **Test Hot Reload**: Edit files in `frontend/` or `backend/`
3. **Review Database**: Use pgAdmin to explore the schema
4. **Customize Configuration**: Update `docker/.env` as needed
5. **Plan Production**: Consider security updates for production deployment

**Congratulations! Your PFMT application is now running! 🚀**

