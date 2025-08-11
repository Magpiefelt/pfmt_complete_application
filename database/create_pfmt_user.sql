-- Create pfmt_user and grant necessary permissions
-- This fixes the "role pfmt_user does not exist" error

-- Create the pfmt_user role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pfmt_user') THEN
        CREATE ROLE pfmt_user WITH LOGIN PASSWORD 'pfmt_password';
        RAISE NOTICE 'Created pfmt_user role';
    ELSE
        RAISE NOTICE 'pfmt_user role already exists';
    END IF;
END
$$;

-- Grant necessary permissions to pfmt_user
GRANT CONNECT ON DATABASE pfmt_integrated TO pfmt_user;
GRANT USAGE ON SCHEMA public TO pfmt_user;
GRANT CREATE ON SCHEMA public TO pfmt_user;

-- Grant permissions on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pfmt_user;

-- Grant permissions on all existing sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pfmt_user;

-- Grant permissions on future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pfmt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO pfmt_user;

-- Verify the user was created successfully
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pfmt_user') THEN
        RAISE NOTICE 'SUCCESS: pfmt_user role is now available';
        RAISE NOTICE 'Database authentication should now work';
    ELSE
        RAISE EXCEPTION 'FAILED: pfmt_user role was not created';
    END IF;
END
$$;

