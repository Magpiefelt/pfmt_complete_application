#!/bin/bash

# PFMT Database Reset Script
# Created: 2025-01-18
# Description: Completely resets the PFMT database with fresh schema and sample data
# Usage: ./scripts/reset_database.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-pfmt_db}"
DB_USER="${DB_USER:-pfmt_user}"
DB_PASSWORD="${DB_PASSWORD:-pfmt_password}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PFMT Database Reset Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL status...${NC}"
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
    echo -e "${RED}Error: PostgreSQL is not running or not accessible${NC}"
    echo "Please ensure PostgreSQL is running and accessible at $DB_HOST:$DB_PORT"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Check if database files exist
SCHEMA_FILE="$PROJECT_ROOT/database/fresh_schema.sql"
SAMPLE_DATA_FILE="$PROJECT_ROOT/database/sample_data.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}Error: Schema file not found at $SCHEMA_FILE${NC}"
    exit 1
fi

if [ ! -f "$SAMPLE_DATA_FILE" ]; then
    echo -e "${RED}Error: Sample data file not found at $SAMPLE_DATA_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Database files found${NC}"

# Confirm reset (unless --force flag is used)
if [ "$1" != "--force" ]; then
    echo ""
    echo -e "${YELLOW}WARNING: This will completely destroy and recreate the database!${NC}"
    echo -e "${YELLOW}All existing data will be lost.${NC}"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Database reset cancelled."
        exit 0
    fi
fi

echo ""
echo -e "${YELLOW}Starting database reset...${NC}"

# Step 1: Drop existing database
echo -e "${BLUE}Step 1: Dropping existing database...${NC}"
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || {
    echo -e "${YELLOW}Note: Database $DB_NAME may not have existed${NC}"
}

# Step 2: Create fresh database
echo -e "${BLUE}Step 2: Creating fresh database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || {
    echo -e "${RED}Error: Failed to create database $DB_NAME${NC}"
    exit 1
}

# Step 3: Ensure user exists and has permissions
echo -e "${BLUE}Step 3: Setting up database user...${NC}"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || {
    echo -e "${YELLOW}Note: User $DB_USER already exists${NC}"
}
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || {
    echo -e "${RED}Error: Failed to grant privileges to $DB_USER${NC}"
    exit 1
}

# Step 4: Apply fresh schema
echo -e "${BLUE}Step 4: Applying fresh schema...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE" || {
    echo -e "${RED}Error: Failed to apply schema${NC}"
    exit 1
}

# Step 5: Load sample data
echo -e "${BLUE}Step 5: Loading sample data...${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SAMPLE_DATA_FILE" || {
    echo -e "${RED}Error: Failed to load sample data${NC}"
    exit 1
}

# Step 6: Verify database
echo -e "${BLUE}Step 6: Verifying database...${NC}"
USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" | xargs)
PROJECT_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM projects;" | xargs)
VENDOR_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM vendors;" | xargs)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Database Reset Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Database: $DB_NAME${NC}"
echo -e "${GREEN}Users loaded: $USER_COUNT${NC}"
echo -e "${GREEN}Projects loaded: $PROJECT_COUNT${NC}"
echo -e "${GREEN}Vendors loaded: $VENDOR_COUNT${NC}"
echo ""

# Display sample users by role
echo -e "${BLUE}Sample Users by Role:${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    role,
    COUNT(*) as count,
    STRING_AGG(first_name || ' ' || last_name, ', ') as users
FROM users 
WHERE is_active = true 
GROUP BY role 
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1
        WHEN 'pmi' THEN 2
        WHEN 'director' THEN 3
        WHEN 'pm' THEN 4
        WHEN 'spm' THEN 5
        WHEN 'analyst' THEN 6
        WHEN 'executive' THEN 7
        WHEN 'vendor' THEN 8
    END;
"

echo ""
echo -e "${BLUE}Sample Projects by Workflow Status:${NC}"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    workflow_status,
    COUNT(*) as count,
    STRING_AGG(project_name, ', ') as projects
FROM projects 
GROUP BY workflow_status 
ORDER BY 
    CASE workflow_status
        WHEN 'initiated' THEN 1
        WHEN 'assigned' THEN 2
        WHEN 'finalized' THEN 3
        WHEN 'active' THEN 4
        WHEN 'on_hold' THEN 5
        WHEN 'complete' THEN 6
        WHEN 'archived' THEN 7
    END;
"

echo ""
echo -e "${GREEN}Ready for development and testing!${NC}"
echo -e "${YELLOW}Note: Use these credentials in your .env file:${NC}"
echo "DB_NAME=$DB_NAME"
echo "DB_USER=$DB_USER"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "DB_HOST=$DB_HOST"
echo "DB_PORT=$DB_PORT"
echo ""

