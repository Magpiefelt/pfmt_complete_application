# PFMT Application Deployment Guide

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd pfmt_complete_application
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run migrate       # Apply database migrations
npm start            # Start the server
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Development server
# OR
npm run build        # Production build
```

## Environment Variables

### Backend (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pfmt_integrated
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Application Configuration
JWT_SECRET=your_jwt_secret_key
PORT=3002
NODE_ENV=production

# Auto-Submission Configuration
AUTO_SUBMISSION_ENABLED=true
AUTO_SUBMISSION_CRON=0 9 * * *
AUTO_SUBMISSION_MIN_AGE_DAYS=7

# Email Configuration (Optional)
NOTIFICATION_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3002
VITE_APP_TITLE=PFMT Application
```

## Database Setup

### PostgreSQL Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE pfmt_integrated;
CREATE USER pfmt_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE pfmt_integrated TO pfmt_user;
\q
```

### Run Migrations
```bash
cd backend
npm run migrate:status  # Check current status
npm run migrate         # Apply all pending migrations
```

## Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start ecosystem.config.js

# Start frontend (if serving with Node.js)
cd frontend
npm run build
pm2 serve dist 3000 --name "pfmt-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual containers
docker build -t pfmt-backend ./backend
docker build -t pfmt-frontend ./frontend

docker run -d --name pfmt-backend -p 3002:3002 pfmt-backend
docker run -d --name pfmt-frontend -p 3000:3000 pfmt-frontend
```

### Using Nginx (Frontend)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/pfmt_complete_application/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Health Checks

### Backend Health
```bash
curl http://localhost:3002/health
curl http://localhost:3002/health/db
```

### Frontend Health
```bash
curl http://localhost:3000
```

## Monitoring and Logs

### PM2 Monitoring
```bash
pm2 status           # Check process status
pm2 logs             # View logs
pm2 monit           # Real-time monitoring
```

### Log Files
- Backend logs: `backend/logs/`
- Auto-submission logs: Check console output or configure file logging
- Database logs: PostgreSQL log directory

## Backup and Recovery

### Database Backup
```bash
# Create backup
pg_dump -h localhost -U pfmt_user pfmt_integrated > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U pfmt_user pfmt_integrated < backup_20240101.sql
```

### Application Backup
```bash
# Backup uploaded files and configuration
tar -czf pfmt_backup_$(date +%Y%m%d).tar.gz \
    backend/uploads/ \
    backend/.env \
    frontend/.env
```

## Security Considerations

### SSL/TLS Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## Performance Optimization

### Database Optimization
```sql
-- Create additional indexes for performance
CREATE INDEX CONCURRENTLY idx_projects_status ON projects(project_status);
CREATE INDEX CONCURRENTLY idx_gate_meetings_date ON gate_meetings(planned_date);
CREATE INDEX CONCURRENTLY idx_versions_current ON project_versions(is_current, status);
```

### Frontend Optimization
```bash
# Build with optimization
npm run build

# Serve with compression
npm install -g serve
serve -s dist -l 3000
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   lsof -ti:3002 | xargs kill -9  # Kill process on port 3002
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   ```

3. **Permission Errors**
   ```bash
   # Fix file permissions
   chmod +x backend/server.js
   chown -R $USER:$USER pfmt_complete_application/
   ```

4. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

### Debug Mode
```bash
# Backend debug mode
DEBUG=* npm run dev

# Frontend debug mode
npm run dev -- --debug
```

## Maintenance Tasks

### Daily
- Monitor application logs
- Check system resource usage
- Verify auto-submission job execution

### Weekly
- Review database performance
- Check for failed scheduled tasks
- Update system packages

### Monthly
- Database maintenance and optimization
- Review and archive old logs
- Security updates and patches

## Support

### Log Analysis
```bash
# Check auto-submission logs
grep "auto-submission" backend/logs/app.log

# Monitor database connections
grep "database" backend/logs/app.log

# Check error patterns
grep "ERROR" backend/logs/app.log | tail -20
```

### Performance Monitoring
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
top -p $(pgrep -f "node.*server.js")
```

For additional support, refer to the IMPLEMENTATION_SUMMARY.md file for detailed technical information.

