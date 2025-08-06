# PFMT Launcher Fixes Todo

## Issues Identified
- [x] Fix health check path in scripts/dev-up.sh (change /api/health to /health)
- [x] Fix health check path in docker/docker-compose.dev.yml (change /api/health to /health)
- [x] Fix health check path in backend/Dockerfile (change /api/health to /health)
- [x] Fix health check path in docker/backend.Dockerfile (change /api/health to /health)
- [x] Add missing schema files to Docker compose configurations
- [x] Increase wait time in dev-up.sh script for slower machines
- [x] Add docker compose command compatibility check
- [x] Add unhandled rejection handler for development
- [x] Improve database pool error handling for development
- [x] Add environment variable validation and logging
- [x] Make server startup more resilient in development mode

## Files to Modify
1. scripts/dev-up.sh - MODIFIED ✅
2. docker/docker-compose.dev.yml - MODIFIED ✅
3. backend/Dockerfile - MODIFIED ✅
4. docker/backend.Dockerfile - MODIFIED ✅
5. docker/docker-compose.prod.yml - MODIFIED ✅
6. backend/server.js - MODIFIED ✅ (additional improvements)
7. backend/config/database.js - MODIFIED ✅ (additional improvements)

## Additional Schema Files Found
- database/approval_audit_schema.sql
- database/financial_management_schema.sql
- database/vendor_management_schema.sql
- database/wizard_schema.sql

