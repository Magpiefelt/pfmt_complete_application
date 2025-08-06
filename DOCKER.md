# PFMT Docker Deployment Guide

This guide explains how to deploy the PFMT (Project Financial Management Tool) application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for containers
- At least 10GB disk space

## Quick Start

### Automated Setup

The easiest way to get started is using the automated setup script:

```bash
./docker-setup.sh
```

This script will:
- Create a `.env` file with secure random secrets
- Ask you to choose between development or production deployment
- Build and start all services
- Perform health checks
- Display service URLs and useful commands

### Manual Setup

1. **Create environment file:**
   ```bash
   cp .env.docker .env
   # Edit .env file with your configuration
   ```

2. **For Development:**
   ```bash
   docker-compose up -d
   ```

3. **For Production:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Architecture

The Docker setup includes three main services:

### 1. PostgreSQL Database (`postgres`)
- **Image:** `postgres:15-alpine`
- **Port:** 5432 (exposed in development only)
- **Volume:** `postgres_data` for data persistence
- **Health Check:** Built-in PostgreSQL health check

### 2. Backend API (`backend`)
- **Build:** Custom Node.js 20 Alpine image
- **Port:** 3002
- **Volume:** `uploads_data` for file uploads
- **Health Check:** HTTP check on `/api/health`

### 3. Frontend Web App (`frontend`)
- **Build:** Multi-stage build with Node.js + Nginx
- **Port:** 3000
- **Health Check:** HTTP check on `/health`

## Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Database
DB_NAME=pfmt_integrated
DB_USER=pfmt_user
DB_PASSWORD=your_secure_password

# Security (change in production!)
JWT_SECRET=your_jwt_secret_32_chars_min
SESSION_SECRET=your_session_secret_32_chars_min

# API Configuration
API_BASE_URL=http://localhost:3002/api
```

### Development vs Production

**Development Mode:**
- Hot reload enabled for backend
- Debug logging
- Database port exposed
- Source code mounted as volumes

**Production Mode:**
- Optimized builds
- Minimal logging
- No exposed database port
- Optional reverse proxy setup

## Service Management

### Starting Services
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Stopping Services
```bash
docker-compose down
```

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Restarting Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Updating Services
```bash
# Rebuild and restart
docker-compose build
docker-compose up -d
```

## Data Management

### Database Initialization

The database is automatically initialized with:
- Schema from `database/schema.sql`
- Seed data from `database/seed.sql`

### Backups

**Create Backup:**
```bash
docker-compose exec postgres pg_dump -U pfmt_user pfmt_integrated > backup.sql
```

**Restore Backup:**
```bash
docker-compose exec -T postgres psql -U pfmt_user pfmt_integrated < backup.sql
```

### File Uploads

File uploads are stored in the `uploads_data` Docker volume. To access uploaded files:

```bash
# List uploaded files
docker-compose exec backend ls -la /app/uploads

# Copy files from container
docker cp pfmt-backend:/app/uploads ./local-uploads
```

## Networking

All services communicate through the `pfmt-network` Docker network:

- Frontend → Backend: `http://backend:3002`
- Backend → Database: `postgres:5432`
- External → Frontend: `http://localhost:3000`
- External → Backend: `http://localhost:3002` (development only)

## Security Considerations

### Production Security

1. **Change Default Secrets:**
   - Generate strong JWT and session secrets
   - Use a secure database password

2. **Network Security:**
   - Database port not exposed externally
   - Backend port not exposed externally (use reverse proxy)

3. **Container Security:**
   - Services run as non-root users
   - Minimal Alpine Linux base images
   - Security headers in Nginx configuration

### Reverse Proxy Setup

For production, consider using a reverse proxy:

```yaml
# Add to docker-compose.prod.yml
nginx-proxy:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
```

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs

# Check service status
docker-compose ps
```

**Database connection issues:**
```bash
# Test database connectivity
docker-compose exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'pfmt_integrated',
  user: 'pfmt_user',
  password: process.env.DB_PASSWORD
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
"
```

**Frontend build issues:**
```bash
# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Health Checks

All services include health checks. Check status:

```bash
docker-compose ps
```

Healthy services show `Up (healthy)` status.

### Performance Tuning

**Database Performance:**
- Adjust PostgreSQL settings in `docker-compose.prod.yml`
- Monitor with `docker stats`

**Memory Usage:**
```bash
# Monitor container resource usage
docker stats
```

## Development Workflow

### Hot Reload Development

For active development with hot reload:

1. Start only database:
   ```bash
   docker-compose up -d postgres
   ```

2. Run backend locally:
   ```bash
   cd backend
   npm run dev
   ```

3. Run frontend locally:
   ```bash
   cd frontend
   npm run dev
   ```

### Testing

Run tests in containers:

```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test
```

## Monitoring

### Log Management

Logs are configured with rotation in production:
- Max size: 10MB per file
- Max files: 3 files per service

### Health Monitoring

Services expose health endpoints:
- Frontend: `http://localhost:3000/health`
- Backend: `http://localhost:3002/api/health`
- Database: Built-in PostgreSQL health check

## Scaling

### Horizontal Scaling

Scale specific services:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

Note: Database and frontend typically don't need scaling in this setup.

### Resource Limits

Add resource limits in production:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## Support

For issues with Docker deployment:

1. Check this documentation
2. Review logs: `docker-compose logs`
3. Check service health: `docker-compose ps`
4. Verify environment configuration
5. Consult the main README.md for application-specific issues

