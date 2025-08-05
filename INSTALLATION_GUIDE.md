# PFMT Enhanced - Complete Installation Guide

## 🎯 Repository Replacement Instructions

This package is designed to **completely replace your existing PFMT repository**. Follow these steps to deploy the integrated application.

## 📋 Prerequisites

### Required Software
- **PostgreSQL 12+** (database server)
- **Node.js 18+** (JavaScript runtime)
- **Git** (for version control)

### Check Prerequisites
```bash
# Check PostgreSQL
psql --version

# Check Node.js
node --version

# If missing, install:
# Ubuntu/Debian:
sudo apt update && sudo apt install -y postgresql postgresql-contrib nodejs npm

# macOS:
brew install postgresql node

# Windows:
# Download from postgresql.org and nodejs.org
```

## 🚀 Quick Installation (5 Minutes)

### Step 1: Extract and Setup
```bash
# Extract the package (replace with your actual file)
unzip pfmt_complete_application.zip
cd pfmt_complete_application

# Or if using tar.gz:
# tar -xzf pfmt_complete_application.tar.gz
# cd pfmt_complete_application
```

### Step 2: Database Setup
```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE pfmt_integrated;
CREATE USER pfmt_user WITH PASSWORD 'pfmt_password';
GRANT ALL PRIVILEGES ON DATABASE pfmt_integrated TO pfmt_user;
ALTER USER pfmt_user CREATEDB;
\q
EOF

# Apply database schema
PGPASSWORD=pfmt_password psql -h localhost -U pfmt_user -d pfmt_integrated -f database/schema.sql
```

### Step 3: Start Backend
```bash
# Navigate to backend directory
cd backend

# Dependencies are already included, but you can reinstall if needed:
# npm install

# Start the backend server
npm run dev
```

**✅ Backend should now be running on http://localhost:3002**

### Step 4: Start Frontend (New Terminal)
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Dependencies are already included, but you can reinstall if needed:
# npm install

# Start the frontend development server
npm run dev
```

**✅ Frontend should now be running on http://localhost:5173**

### Step 5: Access Application
- **Open browser**: http://localhost:5173
- **Login credentials**: 
  - Username: `admin`
  - Password: `password`

## 🔧 Detailed Configuration

### Environment Variables

#### Backend Configuration
The backend `.env` file is already configured for development:
```bash
# backend/.env
NODE_ENV=development
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pfmt_integrated
DB_USER=pfmt_user
DB_PASSWORD=pfmt_password
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:5173
```

#### Frontend Configuration
The frontend `.env` file is already configured:
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3002/api
VITE_APP_TITLE=PFMT Enhanced
```

### Custom Database Configuration
If you need to use different database settings:

1. **Update backend/.env**:
```bash
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
```

2. **Create the database**:
```bash
sudo -u postgres psql << EOF
CREATE DATABASE your-db-name;
CREATE USER your-db-user WITH PASSWORD 'your-db-password';
GRANT ALL PRIVILEGES ON DATABASE your-db-name TO your-db-user;
\q
EOF
```

3. **Apply schema**:
```bash
PGPASSWORD=your-db-password psql -h your-db-host -U your-db-user -d your-db-name -f database/schema.sql
```

## 🧪 Verification & Testing

### Test Database Connection
```bash
# Test database connectivity
PGPASSWORD=pfmt_password psql -h localhost -U pfmt_user -d pfmt_integrated -c "SELECT COUNT(*) FROM projects;"
```

### Test Backend API
```bash
# Test health endpoint
curl http://localhost:3002/health

# Test database health
curl http://localhost:3002/health/db

# Test authentication
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Test Frontend
1. Open http://localhost:5173
2. Login with admin/password
3. Navigate to different sections:
   - **My Projects** - Should show sample projects
   - **Vendor Management** - Should show vendor interface
   - **Workflow Management** - Should show workflow interface

## 🔄 Replacing Existing Repository

### If You Have an Existing PFMT Repository

1. **Backup your existing repository**:
```bash
cp -r your-existing-pfmt-repo your-existing-pfmt-repo-backup
```

2. **Replace with new application**:
```bash
# Remove old repository contents (keep .git if you want version history)
rm -rf your-existing-pfmt-repo/*
# Copy new application
cp -r pfmt_complete_application/* your-existing-pfmt-repo/
```

3. **Migrate existing data** (if applicable):
   - Export data from your existing system
   - Use the migration endpoints at `/api/migration`
   - Or manually import data through the UI

### Git Integration
```bash
# If you want to maintain git history
cd your-existing-pfmt-repo
git add .
git commit -m "Upgrade to PFMT Enhanced Integrated v2.0.0"
git push
```

## 🚀 Production Deployment

### Environment Setup
1. **Update environment variables** for production:

**Backend (.env)**:
```bash
NODE_ENV=production
PORT=3002
DB_HOST=your-production-db-host
DB_NAME=pfmt_production
DB_USER=pfmt_prod_user
DB_PASSWORD=secure-production-password
JWT_SECRET=very-secure-production-jwt-secret
CORS_ORIGIN=https://your-domain.com
```

**Frontend (.env)**:
```bash
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Build for Production
```bash
# Build frontend
cd frontend
npm run build
# This creates a 'dist' folder with production files

# Serve with nginx, apache, or any web server
```

### Process Management
```bash
# Install PM2 for backend process management
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start npm --name "pfmt-backend" -- run start
pm2 startup
pm2 save
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check if database exists
sudo -u postgres psql -l | grep pfmt_integrated

# Recreate database if needed
sudo -u postgres psql -c "DROP DATABASE IF EXISTS pfmt_integrated;"
sudo -u postgres psql -c "CREATE DATABASE pfmt_integrated;"
```

#### 2. Port Already in Use
```bash
# Check what's using port 3002
lsof -ti:3002

# Kill process if needed
lsof -ti:3002 | xargs kill -9

# Check what's using port 5173
lsof -ti:5173 | xargs kill -9
```

#### 3. Permission Errors
```bash
# Fix file permissions
chmod -R 755 pfmt_complete_application/
chown -R $USER:$USER pfmt_complete_application/
```

#### 4. Node Modules Issues
```bash
# If you encounter dependency issues, reinstall:
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Logs and Debugging

#### Backend Logs
```bash
# View backend logs
cd backend
npm run dev
# Logs will appear in console
```

#### Database Logs
```bash
# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Frontend Logs
- Open browser developer tools (F12)
- Check Console tab for errors
- Check Network tab for API call issues

## 📊 Performance Optimization

### Database Optimization
```sql
-- Add indexes for better performance (already included in schema)
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
```

### Frontend Optimization
```bash
# Analyze bundle size
cd frontend
npm run build
npx webpack-bundle-analyzer dist/assets/*.js
```

## 🔐 Security Configuration

### Production Security Checklist
- [ ] Change default JWT secret in backend/.env
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL in production
- [ ] Configure firewall rules
- [ ] Set up regular database backups
- [ ] Enable audit logging (already configured)
- [ ] Configure CORS for production domain
- [ ] Use environment variables for all secrets

### Backup Strategy
```bash
# Daily database backup
0 2 * * * pg_dump -h localhost -U pfmt_user pfmt_integrated > /backups/pfmt_$(date +\%Y\%m\%d).sql

# Weekly full application backup
0 3 * * 0 tar -czf /backups/pfmt_full_$(date +\%Y\%m\%d).tar.gz /path/to/pfmt_complete_application
```

## 📞 Getting Help

### If You Encounter Issues:
1. **Check this installation guide** for common solutions
2. **Review the main README.md** for feature information
3. **Check application logs** for specific error messages
4. **Verify prerequisites** are properly installed
5. **Test database connectivity** separately
6. **Check file permissions** and ownership

### Health Checks
```bash
# Backend health
curl http://localhost:3002/health

# Database health
curl http://localhost:3002/health/db

# Frontend accessibility
curl -I http://localhost:5173
```

## 🎉 Success!

Once everything is running:
- ✅ **Backend**: http://localhost:3002 (API server)
- ✅ **Frontend**: http://localhost:5173 (Web application)
- ✅ **Database**: PostgreSQL with sample data
- ✅ **Login**: admin / password

You now have a complete, integrated PFMT Enhanced application with:
- All original PFMT Enhanced functionality
- New vendor management system
- New workflow management system
- Enterprise PostgreSQL database
- Professional Alberta Government design

**Your application is ready for use and production deployment!**

