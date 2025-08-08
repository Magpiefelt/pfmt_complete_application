-- Minimal working seed data for PFMT Integrated Application
-- Only includes essential data with correct column names

BEGIN;

-- Insert demo users
INSERT INTO users (id, username, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at) VALUES
(uuid_generate_v4(), 'admin', 'System', 'Administrator', 'admin@pfmt.com', '$2b$10$example_hash_admin', 'admin', true, NOW(), NOW()),
(uuid_generate_v4(), 'jsmith', 'John', 'Smith', 'john.smith@pfmt.com', '$2b$10$example_hash_john', 'user', true, NOW(), NOW()),
(uuid_generate_v4(), 'jdoe', 'Jane', 'Doe', 'jane.doe@pfmt.com', '$2b$10$example_hash_jane', 'user', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert demo vendors with correct columns
INSERT INTO vendors (id, name, description, contact_email, contact_phone, address, status, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Reliable Suppliers Inc', 'HVAC systems and components supplier', 'contact@reliablesuppliers.com', '+1-403-555-0400', '123 Industrial Ave, Calgary, AB', 'active', NOW(), NOW()),
(uuid_generate_v4(), 'Quality Services Corp', 'IT services and network solutions', 'info@qualityservices.com', '+1-780-555-0500', '456 Tech Park Dr, Edmonton, AB', 'active', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert demo projects with correct columns (no budget column)
INSERT INTO projects (id, project_name, project_status, project_phase, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Government Office Building Renovation', 'active', 'execution', NOW(), NOW()),
(uuid_generate_v4(), 'IT Infrastructure Modernization', 'active', 'planning', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert demo contracts
INSERT INTO contracts (id, project_id, vendor_id, contract_number, description, contract_value, start_date, status, created_at, updated_at) VALUES
(uuid_generate_v4(), 
 (SELECT id FROM projects WHERE project_name = 'Government Office Building Renovation' LIMIT 1),
 (SELECT id FROM vendors WHERE name = 'Reliable Suppliers Inc' LIMIT 1),
 'GOV-2025-001', 
 'HVAC system upgrade and installation',
 180000.00, 
 '2025-01-20', 
 'active', 
 NOW(), 
 NOW()),
(uuid_generate_v4(), 
 (SELECT id FROM projects WHERE project_name = 'IT Infrastructure Modernization' LIMIT 1),
 (SELECT id FROM vendors WHERE name = 'Quality Services Corp' LIMIT 1),
 'IT-2025-001', 
 'Network infrastructure upgrade',
 220000.00, 
 '2025-02-15', 
 'active', 
 NOW(), 
 NOW())
ON CONFLICT DO NOTHING;

-- Insert demo contract payments
INSERT INTO contract_payments (id, contract_id, payment_amount, payment_date, payment_type, description, status, created_at, updated_at) VALUES
(uuid_generate_v4(), 
 (SELECT id FROM contracts WHERE contract_number = 'GOV-2025-001' LIMIT 1),
 36000.00, 
 '2025-01-25', 
 'milestone', 
 'Initial payment - 20% for materials',
 'completed', 
 NOW(), 
 NOW()),
(uuid_generate_v4(), 
 (SELECT id FROM contracts WHERE contract_number = 'IT-2025-001' LIMIT 1),
 44000.00, 
 '2025-02-20', 
 'milestone', 
 'Initial payment - 20% for equipment',
 'completed', 
 NOW(), 
 NOW())
ON CONFLICT DO NOTHING;

-- Insert system configs
INSERT INTO system_configs (config_key, config_value, description) VALUES
('default_currency', 'CAD', 'Default currency for financial calculations'),
('max_budget_transfer', '50000', 'Maximum budget transfer without executive approval'),
('payment_approval_threshold', '25000', 'Payment threshold requiring additional approval')
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    description = EXCLUDED.description;

COMMIT;

-- Verify seed data
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'Projects', COUNT(*) FROM projects
UNION ALL
SELECT 'Contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'Contract Payments', COUNT(*) FROM contract_payments
UNION ALL
SELECT 'System Configs', COUNT(*) FROM system_configs
ORDER BY table_name;

