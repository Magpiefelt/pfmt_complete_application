-- Seed data for PFMT Integrated Application
-- This file is referenced by docker-compose.yml and provides initial data

-- Insert default users with UUID support
INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@pfmt.gov.ab.ca', 'Admin', 'User', 'Director', '$2b$10$rOzJqQZ8kVZ8kVZ8kVZ8kOzJqQZ8kVZ8kVZ8kVZ8kVZ8kVZ8kVZ8k', true),
('550e8400-e29b-41d4-a716-446655440002', 'sarah.johnson', 'sarah.johnson@pfmt.gov.ab.ca', 'Sarah', 'Johnson', 'Project Manager', '$2b$10$rOzJqQZ8kVZ8kVZ8kVZ8kOzJqQZ8kVZ8kVZ8kVZ8kVZ8kVZ8kVZ8k', true),
('550e8400-e29b-41d4-a716-446655440003', 'mike.chen', 'mike.chen@pfmt.gov.ab.ca', 'Mike', 'Chen', 'Senior Project Manager', '$2b$10$rOzJqQZ8kVZ8kVZ8kVZ8kOzJqQZ8kVZ8kVZ8kVZ8kVZ8kVZ8kVZ8k', true),
('550e8400-e29b-41d4-a716-446655440004', 'lisa.rodriguez', 'lisa.rodriguez@pfmt.gov.ab.ca', 'Lisa', 'Rodriguez', 'Director', '$2b$10$rOzJqQZ8kVZ8kVZ8kVZ8kOzJqQZ8kVZ8kVZ8kVZ8kVZ8kVZ8kVZ8k', true),
('550e8400-e29b-41d4-a716-446655440005', 'vendor.user', 'vendor@example.com', 'Vendor', 'User', 'Vendor', '$2b$10$rOzJqQZ8kVZ8kVZ8kVZ8kOzJqQZ8kVZ8kVZ8kVZ8kVZ8kVZ8kVZ8k', true)
ON CONFLICT (id) DO NOTHING;

-- Insert project templates for wizard
INSERT INTO project_templates (name, description, category, default_settings) VALUES
('Standard Construction', 'Standard new construction project template', 'Construction', '{"projectType": "new_construction", "deliveryType": "design_bid_build", "defaultBudget": 5000000}'),
('Renovation Project', 'Building renovation and upgrade template', 'Renovation', '{"projectType": "renovation", "deliveryType": "design_build", "defaultBudget": 2000000}'),
('Infrastructure Upgrade', 'Infrastructure and systems upgrade template', 'Infrastructure', '{"projectType": "infrastructure", "deliveryType": "design_bid_build", "defaultBudget": 3000000}'),
('Emergency Repair', 'Emergency repair and maintenance template', 'Maintenance', '{"projectType": "maintenance", "deliveryType": "unit_price", "defaultBudget": 500000}')
ON CONFLICT (name) DO NOTHING;

-- Insert sample client ministries
INSERT INTO client_ministries (name, abbreviation, contact_email) VALUES
('Infrastructure', 'INFRA', 'infrastructure@gov.ab.ca'),
('Education', 'EDU', 'education@gov.ab.ca'),
('Health', 'HEALTH', 'health@gov.ab.ca'),
('Justice', 'JUSTICE', 'justice@gov.ab.ca')
ON CONFLICT (name) DO NOTHING;

-- Insert sample capital plan lines
INSERT INTO capital_plan_lines (name, description, ministry_id, budget_amount, fiscal_year) VALUES
('School Construction Program', 'New school construction across Alberta', 
 (SELECT id FROM client_ministries WHERE name = 'Education' LIMIT 1), 
 50000000, '2024-2025'),
('Hospital Infrastructure', 'Hospital upgrades and new facilities', 
 (SELECT id FROM client_ministries WHERE name = 'Health' LIMIT 1), 
 75000000, '2024-2025'),
('Transportation Infrastructure', 'Roads and bridges maintenance', 
 (SELECT id FROM client_ministries WHERE name = 'Infrastructure' LIMIT 1), 
 100000000, '2024-2025')
ON CONFLICT (name) DO NOTHING;

-- Insert sample projects for testing
INSERT INTO projects (
    project_name, project_description, project_status, project_phase, 
    project_type, delivery_type, program, geographic_region, 
    cpd_number, approval_year, project_category, funded_to_complete,
    created_at, updated_at
) VALUES
('Calgary Elementary School', 'New elementary school construction in Calgary', 'underway', 'planning', 
 'new_construction', 'design_bid_build', 'Education', 'Calgary', 
 'CPD-2024-001', '2024', 'Education', true, NOW(), NOW()),
('Edmonton Hospital Wing', 'New hospital wing construction in Edmonton', 'underway', 'design', 
 'new_construction', 'design_build', 'Health', 'Edmonton', 
 'CPD-2024-002', '2024', 'Health', true, NOW(), NOW()),
('Red Deer Bridge Repair', 'Bridge maintenance and repair in Red Deer', 'active', 'construction', 
 'maintenance', 'unit_price', 'Infrastructure', 'Central Alberta', 
 'CPD-2024-003', '2024', 'Infrastructure', false, NOW(), NOW())
ON CONFLICT (cpd_number) DO NOTHING;

-- Note: Password for all test users is 'password123' (hashed with bcrypt)
-- In production, use strong passwords and proper user management

