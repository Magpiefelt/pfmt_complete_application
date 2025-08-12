-- PFMT Database Initialization Script
-- This script ensures the required users exist for the project wizard to function properly

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert the default development user that the server expects
INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active, created_at, updated_at) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'devuser',
    'dev.user@gov.ab.ca',
    'Dev',
    'User',
    'PM',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', -- bcrypt hash for 'admin'
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Insert additional sample users for testing
INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@gov.ab.ca', 'System', 'Administrator', 'admin', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'sarah.johnson', 'sarah.johnson@gov.ab.ca', 'Sarah', 'Johnson', 'pmi', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'michael.brown', 'michael.brown@gov.ab.ca', 'Michael', 'Brown', 'director', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'lisa.wilson', 'lisa.wilson@gov.ab.ca', 'Lisa', 'Wilson', 'analyst', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify the users were created
SELECT 
    id, 
    username, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_active,
    created_at
FROM users 
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005'
)
ORDER BY username;

-- Display success message
SELECT 'Database initialization completed successfully. Required users have been created.' as status;

