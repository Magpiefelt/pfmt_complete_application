-- Database initialization script to create pfmt_user automatically
-- This file should be placed at: database/init-user.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pfmt_user role with all necessary permissions
CREATE ROLE pfmt_user WITH
    LOGIN
    PASSWORD 'pfmt_password'
    CREATEDB
    NOSUPERUSER
    INHERIT
    NOCREATEROLE
    NOREPLICATION;

-- Grant all privileges on the pfmt_integrated database
GRANT ALL PRIVILEGES ON DATABASE pfmt_integrated TO pfmt_user;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO pfmt_user;

-- Set default privileges for future objects created by any user
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pfmt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pfmt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO pfmt_user;

-- Log successful creation
SELECT 'pfmt_user created successfully during database initialization' AS status;

