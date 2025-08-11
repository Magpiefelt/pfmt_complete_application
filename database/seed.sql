-- PFMT Database Seed Data
-- This file contains initial data for the PFMT application

-- Insert default admin user
INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'admin',
    'admin@gov.ab.ca',
    'Admin',
    'User',
    'Admin',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', -- password: admin
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert test project manager user
INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'testpm',
    'test.pm@gov.ab.ca',
    'Test',
    'PM',
    'PM',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', -- password: admin
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert sample company
INSERT INTO companies (id, name, description, industry, contact_email) 
VALUES (
    uuid_generate_v4(),
    'Alberta Government',
    'Government of Alberta',
    'Government',
    'contact@gov.ab.ca'
) ON CONFLICT DO NOTHING;

-- Insert sample vendor
INSERT INTO vendors (id, name, contact_name, contact_email, contact_phone) 
VALUES (
    uuid_generate_v4(),
    'Sample Construction Co.',
    'John Doe',
    'john.doe@sampleconstruction.com',
    '403-555-0123'
) ON CONFLICT DO NOTHING;

-- Update sequences to ensure proper ID generation
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id::text::int), 1)) FROM users WHERE id::text ~ '^[0-9]+$';

