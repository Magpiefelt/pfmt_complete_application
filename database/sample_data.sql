-- PFMT Sample Data
-- Created: 2025-01-18
-- Description: Synthetic test data for all roles and workflow scenarios
-- Includes users, projects, vendors, and test scenarios

-- Clear existing data (for clean reload)
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE project_vendors CASCADE;
TRUNCATE TABLE project_milestones CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE vendors CASCADE;
TRUNCATE TABLE users CASCADE;

-- Sample Users (All Canonical Roles)
INSERT INTO users (id, username, email, first_name, last_name, role, is_active, created_at) VALUES
-- Admin
('550e8400-e29b-41d4-a716-446655440001', 'admin.user', 'admin@gov.ab.ca', 'Admin', 'User', 'admin', true, NOW() - INTERVAL '30 days'),

-- PMI (Project Management & Infrastructure)
('550e8400-e29b-41d4-a716-446655440002', 'sarah.johnson', 'sarah.johnson@gov.ab.ca', 'Sarah', 'Johnson', 'pmi', true, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440003', 'mike.chen', 'mike.chen@gov.ab.ca', 'Mike', 'Chen', 'pmi', true, NOW() - INTERVAL '20 days'),

-- Directors
('550e8400-e29b-41d4-a716-446655440004', 'jennifer.williams', 'jennifer.williams@gov.ab.ca', 'Jennifer', 'Williams', 'director', true, NOW() - INTERVAL '28 days'),
('550e8400-e29b-41d4-a716-446655440005', 'robert.taylor', 'robert.taylor@gov.ab.ca', 'Robert', 'Taylor', 'director', true, NOW() - INTERVAL '22 days'),

-- Project Managers
('550e8400-e29b-41d4-a716-446655440006', 'lisa.anderson', 'lisa.anderson@gov.ab.ca', 'Lisa', 'Anderson', 'pm', true, NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-446655440007', 'david.brown', 'david.brown@gov.ab.ca', 'David', 'Brown', 'pm', true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440008', 'maria.garcia', 'maria.garcia@gov.ab.ca', 'Maria', 'Garcia', 'pm', true, NOW() - INTERVAL '12 days'),

-- Senior Project Managers
('550e8400-e29b-41d4-a716-446655440009', 'james.wilson', 'james.wilson@gov.ab.ca', 'James', 'Wilson', 'spm', true, NOW() - INTERVAL '26 days'),
('550e8400-e29b-41d4-a716-446655440010', 'patricia.davis', 'patricia.davis@gov.ab.ca', 'Patricia', 'Davis', 'spm', true, NOW() - INTERVAL '19 days'),

-- Analysts
('550e8400-e29b-41d4-a716-446655440011', 'thomas.miller', 'thomas.miller@gov.ab.ca', 'Thomas', 'Miller', 'analyst', true, NOW() - INTERVAL '16 days'),
('550e8400-e29b-41d4-a716-446655440012', 'susan.moore', 'susan.moore@gov.ab.ca', 'Susan', 'Moore', 'analyst', true, NOW() - INTERVAL '14 days'),

-- Executives
('550e8400-e29b-41d4-a716-446655440013', 'michael.jackson', 'michael.jackson@gov.ab.ca', 'Michael', 'Jackson', 'executive', true, NOW() - INTERVAL '24 days'),
('550e8400-e29b-41d4-a716-446655440014', 'elizabeth.white', 'elizabeth.white@gov.ab.ca', 'Elizabeth', 'White', 'executive', true, NOW() - INTERVAL '21 days'),

-- Vendors
('550e8400-e29b-41d4-a716-446655440015', 'vendor.contact1', 'contact@constructioncorp.com', 'John', 'Contractor', 'vendor', true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440016', 'vendor.contact2', 'info@designstudio.com', 'Jane', 'Designer', 'vendor', true, NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440017', 'vendor.contact3', 'sales@supplycorp.com', 'Bob', 'Supplier', 'vendor', true, NOW() - INTERVAL '6 days');

-- Sample Vendors
INSERT INTO vendors (id, name, description, category, status, contact_email, contact_phone, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Alberta Construction Corp', 'General construction and project management services', 'Construction', 'active', 'contact@constructioncorp.com', '(403) 555-0101', NOW() - INTERVAL '20 days'),
('660e8400-e29b-41d4-a716-446655440002', 'Prairie Design Studio', 'Architectural design and planning services', 'Design', 'active', 'info@designstudio.com', '(403) 555-0102', NOW() - INTERVAL '18 days'),
('660e8400-e29b-41d4-a716-446655440003', 'Northern Supply Corp', 'Construction materials and equipment supply', 'Supply', 'active', 'sales@supplycorp.com', '(403) 555-0103', NOW() - INTERVAL '16 days'),
('660e8400-e29b-41d4-a716-446655440004', 'Calgary Engineering Ltd', 'Structural and civil engineering services', 'Engineering', 'active', 'projects@calgaryeng.com', '(403) 555-0104', NOW() - INTERVAL '14 days'),
('660e8400-e29b-41d4-a716-446655440005', 'Edmonton Electrical', 'Electrical systems and installation', 'Electrical', 'active', 'service@edmontonelec.com', '(780) 555-0105', NOW() - INTERVAL '12 days'),
('660e8400-e29b-41d4-a716-446655440006', 'Red Deer Plumbing', 'Plumbing and HVAC services', 'Mechanical', 'active', 'info@reddeerplumb.com', '(403) 555-0106', NOW() - INTERVAL '10 days');

-- Sample Projects (Different Workflow States)

-- 1. INITIATED Projects (Created by PMI, awaiting Director assignment)
INSERT INTO projects (id, project_name, project_description, estimated_budget, start_date, end_date, 
                     project_type, delivery_method, project_category, geographic_region,
                     workflow_status, created_by, created_at, workflow_updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 
 'New Calgary Courthouse Expansion', 
 'Expansion of the existing courthouse facility to accommodate growing caseload and improve public services.',
 15000000.00, '2025-04-01', '2026-12-31',
 'new_construction', 'design_bid_build', 'justice', 'calgary',
 'initiated', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

('770e8400-e29b-41d4-a716-446655440002',
 'Edmonton Health Centre Renovation',
 'Major renovation of the downtown health centre to modernize facilities and improve patient care.',
 8500000.00, '2025-06-01', '2026-08-31',
 'renovation', 'design_build', 'health', 'edmonton',
 'initiated', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- 2. ASSIGNED Projects (Director assigned team, awaiting PM/SPM configuration)
INSERT INTO projects (id, project_name, project_description, estimated_budget, start_date, end_date,
                     project_type, delivery_method, project_category, geographic_region,
                     workflow_status, created_by, assigned_pm, assigned_spm, assigned_by,
                     created_at, workflow_updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440003',
 'Lethbridge School District Office',
 'New administrative building for the school district with modern office spaces and meeting facilities.',
 5200000.00, '2025-05-15', '2026-06-30',
 'new_construction', 'design_bid_build', 'education', 'lethbridge',
 'assigned', '550e8400-e29b-41d4-a716-446655440002', 
 '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440009',
 '550e8400-e29b-41d4-a716-446655440004',
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),

('770e8400-e29b-41d4-a716-446655440004',
 'Red Deer Transit Hub',
 'Multi-modal transit facility with bus bays, passenger amenities, and administrative offices.',
 12000000.00, '2025-07-01', '2027-03-31',
 'new_construction', 'design_build', 'transportation', 'red_deer',
 'assigned', '550e8400-e29b-41d4-a716-446655440003',
 '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440010',
 '550e8400-e29b-41d4-a716-446655440005',
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days');

-- 3. FINALIZED/ACTIVE Projects (Complete workflow, ready for execution)
INSERT INTO projects (id, project_name, project_description, estimated_budget, start_date, end_date,
                     project_type, delivery_method, project_category, geographic_region,
                     workflow_status, created_by, assigned_pm, assigned_spm, assigned_by, finalized_by,
                     detailed_description, risk_assessment, budget_breakdown, finalized_at,
                     created_at, workflow_updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440005',
 'Grande Prairie Fire Station #3',
 'New fire station to serve the growing northwest district with modern equipment bays and living quarters.',
 4800000.00, '2025-03-01', '2025-11-30',
 'new_construction', 'design_bid_build', 'public_safety', 'grande_prairie',
 'active', '550e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440009',
 '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008',
 'This project will construct a new 12,000 sq ft fire station featuring 4 apparatus bays, administrative offices, training facilities, and living quarters for 24/7 operations. The facility will meet all current fire safety standards and include sustainable design elements.',
 'Key risks include weather delays during construction season, potential soil conditions requiring additional foundation work, and coordination with existing emergency services during construction.',
 '{"construction": 3200000, "design": 480000, "equipment": 800000, "contingency": 320000}',
 NOW() - INTERVAL '7 days',
 NOW() - INTERVAL '15 days', NOW() - INTERVAL '7 days'),

('770e8400-e29b-41d4-a716-446655440006',
 'Medicine Hat Library Renovation',
 'Comprehensive renovation and expansion of the central library including new technology center and community spaces.',
 3200000.00, '2025-02-15', '2025-10-15',
 'renovation', 'design_build', 'culture', 'medicine_hat',
 'active', '550e8400-e29b-41d4-a716-446655440003',
 '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440010',
 '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006',
 'Renovation will modernize the 1970s library building with new HVAC systems, updated electrical, expanded computer lab, children''s area renovation, and addition of community meeting spaces. Project includes accessibility improvements throughout.',
 'Main risks include discovery of asbestos or other hazardous materials, maintaining library operations during construction, and potential delays in specialized equipment delivery.',
 '{"renovation": 2100000, "equipment": 640000, "design": 320000, "contingency": 140000}',
 NOW() - INTERVAL '10 days',
 NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days');

-- Sample Project Milestones (for active projects)
INSERT INTO project_milestones (id, project_id, title, type, planned_start, planned_finish, status, description, budget_allocated) VALUES
-- Grande Prairie Fire Station milestones
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440005', 
 'Design Development Complete', 'design', '2025-03-01', '2025-04-15', 'completed',
 'Complete architectural and engineering design drawings', 480000.00),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005',
 'Site Preparation and Foundation', 'construction', '2025-04-16', '2025-06-30', 'in_progress',
 'Site clearing, excavation, and foundation pour', 640000.00),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440005',
 'Structural Construction', 'construction', '2025-07-01', '2025-09-15', 'planned',
 'Steel frame and building envelope construction', 1280000.00),

-- Medicine Hat Library milestones
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440006',
 'Design and Permits', 'design', '2025-02-15', '2025-03-31', 'completed',
 'Final design approval and building permits', 320000.00),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440006',
 'Phase 1 Renovation', 'construction', '2025-04-01', '2025-07-15', 'in_progress',
 'HVAC, electrical, and structural improvements', 1400000.00);

-- Sample Project Vendors (for active projects)
INSERT INTO project_vendors (id, project_id, vendor_id, role, notes, status) VALUES
-- Grande Prairie Fire Station vendors
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440005', 
 '660e8400-e29b-41d4-a716-446655440001', 'general_contractor', 'Primary construction contractor', 'active'),
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005',
 '660e8400-e29b-41d4-a716-446655440002', 'architect', 'Lead design architect', 'active'),
('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440005',
 '660e8400-e29b-41d4-a716-446655440004', 'structural_engineer', 'Structural engineering services', 'active'),

-- Medicine Hat Library vendors
('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440006',
 '660e8400-e29b-41d4-a716-446655440001', 'general_contractor', 'Renovation contractor', 'active'),
('990e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440006',
 '660e8400-e29b-41d4-a716-446655440005', 'electrical_contractor', 'Electrical system upgrades', 'active');

-- Sample Notifications (workflow handoffs)
INSERT INTO notifications (id, user_id, type, title, message, payload, created_at) VALUES
-- Notifications for Directors about initiated projects
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004',
 'project_submitted', 'New Project Awaiting Assignment',
 'Project "New Calgary Courthouse Expansion" has been submitted by PMI and requires team assignment.',
 '{"project_id": "770e8400-e29b-41d4-a716-446655440001", "project_name": "New Calgary Courthouse Expansion", "submitted_by": "Sarah Johnson"}',
 NOW() - INTERVAL '2 days'),

('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005',
 'project_submitted', 'New Project Awaiting Assignment',
 'Project "Edmonton Health Centre Renovation" has been submitted by PMI and requires team assignment.',
 '{"project_id": "770e8400-e29b-41d4-a716-446655440002", "project_name": "Edmonton Health Centre Renovation", "submitted_by": "Mike Chen"}',
 NOW() - INTERVAL '1 day'),

-- Notifications for assigned PMs about projects ready for configuration
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006',
 'team_assigned', 'You Have Been Assigned to a Project',
 'You have been assigned as Project Manager for "Lethbridge School District Office". Please complete the project configuration.',
 '{"project_id": "770e8400-e29b-41d4-a716-446655440003", "project_name": "Lethbridge School District Office", "assigned_by": "Jennifer Williams"}',
 NOW() - INTERVAL '3 days'),

('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007',
 'team_assigned', 'You Have Been Assigned to a Project',
 'You have been assigned as Project Manager for "Red Deer Transit Hub". Please complete the project configuration.',
 '{"project_id": "770e8400-e29b-41d4-a716-446655440004", "project_name": "Red Deer Transit Hub", "assigned_by": "Robert Taylor"}',
 NOW() - INTERVAL '2 days');

-- Sample Audit Log entries
INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, details, created_at) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002',
 'project_created', 'project', '770e8400-e29b-41d4-a716-446655440001',
 '{"project_name": "New Calgary Courthouse Expansion", "workflow_status": "initiated"}',
 NOW() - INTERVAL '2 days'),

('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004',
 'team_assigned', 'project', '770e8400-e29b-41d4-a716-446655440003',
 '{"project_name": "Lethbridge School District Office", "assigned_pm": "Lisa Anderson", "assigned_spm": "James Wilson"}',
 NOW() - INTERVAL '3 days'),

('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008',
 'project_finalized', 'project', '770e8400-e29b-41d4-a716-446655440005',
 '{"project_name": "Grande Prairie Fire Station #3", "workflow_status": "active"}',
 NOW() - INTERVAL '7 days');

-- Success message
SELECT 'PFMT Sample Data Loaded Successfully!' as status,
       COUNT(*) as total_users FROM users
UNION ALL
SELECT 'Projects loaded:', COUNT(*)::text FROM projects
UNION ALL
SELECT 'Vendors loaded:', COUNT(*)::text FROM vendors
UNION ALL
SELECT 'Milestones loaded:', COUNT(*)::text FROM project_milestones
UNION ALL
SELECT 'Notifications loaded:', COUNT(*)::text FROM notifications;

