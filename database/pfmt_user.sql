-- Create pfmt_user role and database initialization script
-- PGADMIN COMPATIBLE VERSION (no psql-specific commands)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pfmt_user role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pfmt_user') THEN
        CREATE ROLE pfmt_user WITH
            LOGIN
            PASSWORD 'pfmt_password'
            CREATEDB
            NOSUPERUSER
            INHERIT
            NOCREATEROLE
            NOREPLICATION;
        
        RAISE NOTICE 'Created pfmt_user role successfully';
    ELSE
        RAISE NOTICE 'pfmt_user role already exists';
    END IF;
END
$$;

-- Create pfmt_integrated database if it doesn't exist
-- (pgAdmin compatible version - no \gexec)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pfmt_integrated') THEN
        -- Note: CREATE DATABASE cannot be run inside a transaction block
        -- You may need to run this separately if it fails
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE pfmt_integrated OWNER pfmt_user');
    ELSE
        RAISE NOTICE 'pfmt_integrated database already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Database creation may need to be done manually. Error: %', SQLERRM;
        RAISE NOTICE 'Run this command separately: CREATE DATABASE pfmt_integrated OWNER pfmt_user;';
END
$$;

-- Grant necessary permissions on the database
GRANT ALL PRIVILEGES ON DATABASE pfmt_integrated TO pfmt_user;

-- Grant schema permissions (run this after connecting to pfmt_integrated)
GRANT ALL ON SCHEMA public TO pfmt_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pfmt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pfmt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO pfmt_user;

-- Log successful completion
SELECT 
    'pfmt_user setup completed successfully' as status,
    current_database() as database,
    current_user as current_user,
    now() as timestamp;


