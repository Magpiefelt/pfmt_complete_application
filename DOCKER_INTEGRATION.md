# PFMT Docker Integration - Complete Setup

## Overview

Your PFMT application now has a comprehensive Docker setup with both development and production configurations. The setup includes:

- **Organized structure** with `/docker` and `/scripts` directories
- **One-command launchers** for both development and production modes
- **Hot-reload development** environment with source code mounting
- **Production-optimized** builds with Nginx serving static assets
- **Database initialization** with your existing schema
- **Optional pgAdmin** for database management in development

## Directory Structure

```
pfmt_complete_application/
├── docker/
│   ├── .env.example              # Environment template
│   ├── .env                      # Your environment config (created)
│   ├── backend.Dockerfile        # Backend container definition
│   ├── frontend.Dockerfile       # Frontend container definition
│   ├── docker-compose.dev.yml    # Development orchestration
│   └── docker-compose.prod.yml   # Production orchestration
├── scripts/
│   ├── dev-up.sh                 # Start development stack
│   ├── dev-down.sh               # Stop development stack
│   ├── dev-logs.sh               # View development logs
│   ├── prod-up.sh                # Start production stack
│   ├── prod-down.sh              # Stop production stack
│   ├── ps-dev-up.ps1             # PowerShell dev start (Windows)
│   └── ps-dev-down.ps1           # PowerShell dev stop (Windows)
└── [existing application files]
```

## Quick Start

### Development Mode (Recommended for Development)

```bash
# Start the full development stack
./scripts/dev-up.sh

# View logs
./scripts/dev-logs.sh

# Stop the stack
./scripts/dev-down.sh
```

**Development URLs:**
- **Frontend**: http://localhost:5173 (Vite dev server with hot reload)
- **Backend API**: http://localhost:3000/api
- **Database**: localhost:5432
- **pgAdmin**: http://localhost:8081 (admin@example.com / admin)

### Production Mode (Testing Production Build)

```bash
# Start the production stack
./scripts/prod-up.sh

# Stop the stack
./scripts/prod-down.sh
```

**Production URLs:**
- **Frontend**: http://localhost:8080 (Nginx-served static files)
- **Backend API**: http://localhost:3000/api
- **Database**: localhost:5432

## Key Features

### Development Environment
- **Hot Reload**: Frontend and backend automatically reload when you edit files
- **Source Mounting**: Your local source code is mounted into containers
- **Database Persistence**: Data persists between container restarts
- **pgAdmin**: Web-based database administration tool
- **Live Debugging**: Full development tools available

### Production Environment
- **Optimized Builds**: Frontend compiled to static assets
- **Nginx Serving**: Production-grade web server for frontend
- **Multi-stage Builds**: Smaller, more secure container images
- **Production Node**: Backend runs in production mode
- **Client-side Routing**: Nginx configured for Vue.js routing

## Configuration

### Environment Variables

The `.env` file in the `docker/` directory contains all configuration:

```bash
# Application
NODE_ENV=development
JWT_SECRET=change-me
VITE_API_BASE_URL=http://localhost:3000/api
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Database
POSTGRES_USER=pfmt
POSTGRES_PASSWORD=pfmt
POSTGRES_DB=pfmt
DB_HOST=db
DB_PORT=5432

# pgAdmin (development only)
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin
```

**Important**: Change `JWT_SECRET` and database passwords for production use!

### Database Initialization

The database is automatically initialized with your existing schema:
- Schema file: `database/schema.sql`
- Mounted as: `/docker-entrypoint-initdb.d/00_schema.sql`
- Runs automatically on first database startup

## Container Architecture

### Backend Container (`pfmt/backend-dev`)
- **Base**: Node.js 20 Alpine Linux
- **Build**: Multi-stage build for optimization
- **Development**: Source code mounted, nodemon for hot reload
- **Production**: Compiled code, production npm start
- **Health Check**: Built-in PostgreSQL connectivity check

### Frontend Container (`pfmt/frontend-dev`)
- **Development**: Vite dev server with hot module replacement
- **Production**: Multi-stage build → Nginx static file serving
- **Routing**: Nginx configured for client-side routing
- **Assets**: Optimized build output in `/usr/share/nginx/html`

### Database Container (`postgres:16-alpine`)
- **Version**: PostgreSQL 16 on Alpine Linux
- **Persistence**: Named volume `pfmt_db_data`
- **Initialization**: Automatic schema loading
- **Health Check**: `pg_isready` monitoring

## Development Workflow

### Making Changes

1. **Frontend Changes**: Edit files in `frontend/` - Vite will hot reload
2. **Backend Changes**: Edit files in `backend/` - nodemon will restart
3. **Database Changes**: Update `database/schema.sql` and restart containers

### Debugging

```bash
# View all logs
./scripts/dev-logs.sh

# View specific service logs
cd docker
docker compose -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.dev.yml logs frontend
docker compose -f docker-compose.dev.yml logs db

# Execute commands in containers
docker compose -f docker-compose.dev.yml exec backend sh
docker compose -f docker-compose.dev.yml exec frontend sh
```

### Database Management

**Using pgAdmin (Development):**
1. Open http://localhost:8081
2. Login: admin@example.com / admin
3. Add server: Host=db, Port=5432, User=pfmt, Password=pfmt

**Using Command Line:**
```bash
# Connect to database
cd docker
docker compose -f docker-compose.dev.yml exec db psql -U pfmt -d pfmt

# Backup database
docker compose -f docker-compose.dev.yml exec db pg_dump -U pfmt pfmt > backup.sql

# Restore database
docker compose -f docker-compose.dev.yml exec -T db psql -U pfmt pfmt < backup.sql
```

## Production Deployment

### Security Considerations

1. **Change Secrets**: Update `JWT_SECRET` and database passwords
2. **Environment Variables**: Use secure secret management
3. **Network Security**: Consider using Docker networks without exposed ports
4. **SSL/TLS**: Add reverse proxy with SSL termination

### Scaling

```bash
# Scale backend instances
cd docker
docker compose -f docker-compose.prod.yml up --scale backend=3 -d
```

### Monitoring

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Monitor resource usage
docker stats

# View production logs
docker compose -f docker-compose.prod.yml logs -f
```

## Troubleshooting

### Common Issues

**Port Conflicts:**
- Check if ports 3000, 5173, 5432, 8080, 8081 are available
- Modify port mappings in docker-compose files if needed

**Database Connection:**
```bash
# Test database connectivity
cd docker
docker compose -f docker-compose.dev.yml exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'pfmt',
  user: 'pfmt',
  password: 'pfmt'
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
"
```

**Build Issues:**
```bash
# Clean rebuild
cd docker
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up
```

**Permission Issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

## Windows Users

Use the PowerShell scripts for Windows:

```powershell
# Start development
.\scripts\ps-dev-up.ps1

# Stop development
.\scripts\ps-dev-down.ps1
```

## Integration with Existing Setup

This Docker setup is designed to work alongside your existing development setup:

- **Existing files**: All your application files remain unchanged
- **Environment compatibility**: Uses the same database schema and API structure
- **Development flexibility**: You can still run frontend/backend locally if preferred
- **Production ready**: Optimized for deployment scenarios

## Next Steps

1. **Test Development**: Run `./scripts/dev-up.sh` and verify all services start
2. **Test Production**: Run `./scripts/prod-up.sh` and verify production build
3. **Customize Environment**: Update `docker/.env` with your specific configuration
4. **Deploy**: Use the production setup for your deployment environment

The Docker setup is now fully integrated and ready for use! 🚀

