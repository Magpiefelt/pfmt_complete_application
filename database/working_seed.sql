-- Working seed data for PFMT application
-- Uses correct role names that match the database constraints

-- Insert test users with correct roles
INSERT INTO users (id, username, email, first_name, last_name, role, is_active, password_hash, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'admin', 'admin@gov.ab.ca', 'Admin', 'User', 'admin', true, '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'testpm', 'test.pm@gov.ab.ca', 'Test', 'PM', 'pm', true, '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'testspm', 'test.spm@gov.ab.ca', 'Test', 'SPM', 'spm', true, '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'testpmi', 'test.pmi@gov.ab.ca', 'Test', 'PMI', 'pmi', true, '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', NOW(), NOW());

-- Insert test vendors
INSERT INTO vendors (id, name, contact_email, contact_phone, status, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Test Vendor 1', 'contact@vendor1.com', '555-0001', 'active', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'Test Vendor 2', 'contact@vendor2.com', '555-0002', 'active', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'Test Vendor 3', 'contact@vendor3.com', '555-0003', 'active', NOW(), NOW());

-- Insert a test project
INSERT INTO projects (id, name, description, status, lifecycle_status, created_by, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'Test Project 1', 'A test project for development', 'active', 'initiation', '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW());

-- Insert test project milestones
INSERT INTO project_milestones (id, project_id, title, description, due_date, status, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 'Project Initiation', 'Initial project setup and planning', NOW() + INTERVAL '30 days', 'pending', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440020', 'Requirements Gathering', 'Collect and document requirements', NOW() + INTERVAL '60 days', 'pending', NOW(), NOW());

SELECT 'Working seed data applied successfully!' as status;

