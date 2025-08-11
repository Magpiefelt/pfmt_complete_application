-- Complete Database Setup Script for PFMT
-- Run this as postgres user in pgAdmin connected to pfmt_integrated database

-- 1. Create pfmt_user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pfmt_user') THEN
        CREATE USER pfmt_user WITH PASSWORD 'pfmt_password';
        RAISE NOTICE 'Created user pfmt_user';
    ELSE
        RAISE NOTICE 'User pfmt_user already exists';
    END IF;
END $$;

-- 2. Grant database privileges
ALTER USER pfmt_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE pfmt_integrated TO pfmt_user;

-- 3. Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO pfmt_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pfmt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pfmt_user;

-- 4. Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pfmt_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pfmt_user;

-- 5. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 6. Test UUID generation
SELECT uuid_generate_v4() as test_uuid;

-- 7. Create basic tables if they don't exist (from your schema)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'User',
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    industry VARCHAR(50),
    contact_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(100),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Insert sample data
INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'admin',
    'admin@gov.ab.ca',
    'Admin',
    'User',
    'Admin',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'testpm',
    'test.pm@gov.ab.ca',
    'Test',
    'PM',
    'PM',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO companies (id, name, description, industry, contact_email) 
VALUES (
    uuid_generate_v4(),
    'Alberta Government',
    'Government of Alberta',
    'Government',
    'contact@gov.ab.ca'
) ON CONFLICT DO NOTHING;

INSERT INTO vendors (id, name, contact_name, contact_email, contact_phone) 
VALUES (
    uuid_generate_v4(),
    'Sample Construction Co.',
    'John Doe',
    'john.doe@sampleconstruction.com',
    '403-555-0123'
) ON CONFLICT DO NOTHING;

-- 9. Verify everything was created
SELECT 'Setup completed successfully!' as status;
SELECT 'Users created: ' || count(*) as user_count FROM users;
SELECT 'Companies created: ' || count(*) as company_count FROM companies;
SELECT 'Vendors created: ' || count(*) as vendor_count FROM vendors;

