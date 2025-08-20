-- Demo seed data for PFMT wizard functionality
-- This provides realistic test data for wizard demonstrations

-- Insert demo users if they don't exist
INSERT INTO users (id, username, email, first_name, last_name, role, is_active, created_at, updated_at) 
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'demo.pm', 'demo.pm@gov.ab.ca', 'Demo', 'Project Manager', 'PM', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'demo.spm', 'demo.spm@gov.ab.ca', 'Demo', 'Senior PM', 'SPM', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', 'demo.director', 'demo.director@gov.ab.ca', 'Demo', 'Director', 'DIRECTOR', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', 'demo.pmi', 'demo.pmi@gov.ab.ca', 'Demo', 'PMI', 'PMI', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440005', 'demo.admin', 'demo.admin@gov.ab.ca', 'Demo', 'Admin', 'ADMIN', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo companies if they don't exist
INSERT INTO companies (id, company_name, company_type, contact_email, contact_phone, address, city, province, postal_code, is_active, created_at, updated_at)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', 'Alberta Construction Corp', 'General Contractor', 'contact@albertaconstruction.ca', '403-555-0101', '123 Construction Ave', 'Calgary', 'AB', 'T2P 1A1', true, NOW(), NOW()),
    ('660e8400-e29b-41d4-a716-446655440002', 'Prairie Engineering Ltd', 'Engineering Consultant', 'info@prairieeng.ca', '780-555-0102', '456 Engineering Blvd', 'Edmonton', 'AB', 'T5K 2B2', true, NOW(), NOW()),
    ('660e8400-e29b-41d4-a716-446655440003', 'Mountain View Architects', 'Architectural Services', 'design@mountainview.ca', '403-555-0103', '789 Design Street', 'Calgary', 'AB', 'T2R 3C3', true, NOW(), NOW()),
    ('660e8400-e29b-41d4-a716-446655440004', 'Northern Electrical Systems', 'Electrical Contractor', 'service@northernelectrical.ca', '780-555-0104', '321 Power Lane', 'Edmonton', 'AB', 'T6G 4D4', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo vendors if they don't exist
INSERT INTO vendors (id, name, vendor_name, description, contact_email, contact_phone, website, specialties, performance_rating, status, is_active, created_at, updated_at)
VALUES 
    ('770e8400-e29b-41d4-a716-446655440001', 'Alberta Construction Corp', 'Alberta Construction Corp', 'Full-service general contractor specializing in government facilities', 'contact@albertaconstruction.ca', '403-555-0101', 'https://albertaconstruction.ca', ARRAY['General Construction', 'Government Projects', 'LEED Certified'], 4.5, 'active', true, NOW(), NOW()),
    ('770e8400-e29b-41d4-a716-446655440002', 'Prairie Engineering Ltd', 'Prairie Engineering Ltd', 'Structural and civil engineering consultancy', 'info@prairieeng.ca', '780-555-0102', 'https://prairieeng.ca', ARRAY['Structural Engineering', 'Civil Engineering', 'Project Management'], 4.8, 'active', true, NOW(), NOW()),
    ('770e8400-e29b-41d4-a716-446655440003', 'Mountain View Architects', 'Mountain View Architects', 'Award-winning architectural design firm', 'design@mountainview.ca', '403-555-0103', 'https://mountainview.ca', ARRAY['Architectural Design', 'Interior Design', 'Sustainable Design'], 4.7, 'active', true, NOW(), NOW()),
    ('770e8400-e29b-41d4-a716-446655440004', 'Northern Electrical Systems', 'Northern Electrical Systems', 'Commercial and industrial electrical contractor', 'service@northernelectrical.ca', '780-555-0104', 'https://northernelectrical.ca', ARRAY['Electrical Systems', 'Smart Building Technology', 'Maintenance'], 4.3, 'active', true, NOW(), NOW()),
    ('770e8400-e29b-41d4-a716-446655440005', 'Foothills HVAC Solutions', 'Foothills HVAC Solutions', 'Heating, ventilation, and air conditioning specialists', 'hvac@foothillssolutions.ca', '403-555-0105', 'https://foothillshvac.ca', ARRAY['HVAC Systems', 'Energy Efficiency', 'Building Automation'], 4.6, 'active', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo project templates if they don't exist
INSERT INTO project_templates (id, name, description, category, default_budget, estimated_duration, required_roles, template_data, is_active, created_at, updated_at)
VALUES 
    ('880e8400-e29b-41d4-a716-446655440001', 'Government Office Building', 'Standard template for new government office construction', 'construction', 15000000, 24, ARRAY['PM', 'SPM', 'DIRECTOR'], '{"phases": ["Planning", "Design", "Procurement", "Construction", "Commissioning"], "milestones": ["Design Approval", "Construction Start", "Substantial Completion"]}', true, NOW(), NOW()),
    ('880e8400-e29b-41d4-a716-446655440002', 'School Renovation', 'Template for K-12 school renovation projects', 'renovation', 8000000, 18, ARRAY['PM', 'SPM'], '{"phases": ["Assessment", "Design", "Procurement", "Construction"], "considerations": ["Student Safety", "Minimal Disruption", "Code Compliance"]}', true, NOW(), NOW()),
    ('880e8400-e29b-41d4-a716-446655440003', 'Healthcare Facility', 'Template for healthcare facility construction', 'construction', 25000000, 36, ARRAY['PM', 'SPM', 'DIRECTOR'], '{"phases": ["Programming", "Design", "Procurement", "Construction", "Commissioning"], "specialRequirements": ["Medical Equipment", "Infection Control", "Regulatory Compliance"]}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo projects created through wizard
INSERT INTO projects (id, project_name, project_description, project_status, project_phase, project_category, project_type, delivery_type, program, geographic_region, cpd_number, approval_year, budget_total, amount_spent, funded_to_complete, created_at, updated_at, modified_by)
VALUES 
    ('proj_1703001234_demo1', 'Central Alberta Health Centre', 'New 200-bed healthcare facility in Red Deer serving central Alberta region', 'underway', 'design', 'construction', 'new_construction', 'design_build', 'health_facilities', 'central', 'CPD-2024-CAHC-001', '2024', 45000000, 2500000, true, NOW(), NOW(), '550e8400-e29b-41d4-a716-446655440001'),
    ('proj_1703001235_demo2', 'Edmonton North High School Renovation', 'Complete renovation and modernization of 50-year-old high school facility', 'underway', 'procurement', 'renovation', 'renovation', 'design_bid_build', 'education_facilities', 'north', 'CPD-2024-ENHS-002', '2024', 12000000, 800000, true, NOW(), NOW(), '550e8400-e29b-41d4-a716-446655440002'),
    ('proj_1703001236_demo3', 'Calgary Government Services Building', 'New 15-story office building for consolidated government services', 'planning', 'planning', 'construction', 'new_construction', 'design_bid_build', 'government_facilities', 'south', 'CPD-2024-CGSB-003', '2024', 35000000, 500000, false, NOW(), NOW(), '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO NOTHING;

-- Insert project team assignments
INSERT INTO project_teams (project_id, user_id, role, assigned_date, is_active)
VALUES 
    ('proj_1703001234_demo1', '550e8400-e29b-41d4-a716-446655440001', 'PM', NOW(), true),
    ('proj_1703001234_demo1', '550e8400-e29b-41d4-a716-446655440002', 'SPM', NOW(), true),
    ('proj_1703001234_demo1', '550e8400-e29b-41d4-a716-446655440003', 'DIRECTOR', NOW(), true),
    ('proj_1703001235_demo2', '550e8400-e29b-41d4-a716-446655440002', 'PM', NOW(), true),
    ('proj_1703001235_demo2', '550e8400-e29b-41d4-a716-446655440003', 'SPM', NOW(), true),
    ('proj_1703001236_demo3', '550e8400-e29b-41d4-a716-446655440003', 'PM', NOW(), true),
    ('proj_1703001236_demo3', '550e8400-e29b-41d4-a716-446655440005', 'DIRECTOR', NOW(), true)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Insert project vendor assignments
INSERT INTO project_vendors (project_id, vendor_id, role, contract_value, status, assigned_date, is_active)
VALUES 
    ('proj_1703001234_demo1', '770e8400-e29b-41d4-a716-446655440001', 'General Contractor', 35000000, 'contracted', NOW(), true),
    ('proj_1703001234_demo1', '770e8400-e29b-41d4-a716-446655440003', 'Architect', 3500000, 'contracted', NOW(), true),
    ('proj_1703001234_demo1', '770e8400-e29b-41d4-a716-446655440002', 'Structural Engineer', 1200000, 'contracted', NOW(), true),
    ('proj_1703001235_demo2', '770e8400-e29b-41d4-a716-446655440001', 'General Contractor', 9500000, 'contracted', NOW(), true),
    ('proj_1703001235_demo2', '770e8400-e29b-41d4-a716-446655440003', 'Architect', 800000, 'contracted', NOW(), true),
    ('proj_1703001236_demo3', '770e8400-e29b-41d4-a716-446655440003', 'Architect', 2800000, 'under_negotiation', NOW(), true)
ON CONFLICT (project_id, vendor_id) DO NOTHING;

-- Insert wizard session data for demonstration
INSERT INTO project_wizard_sessions (session_id, user_id, current_step, template_id, session_data, created_at, updated_at, is_active)
VALUES 
    ('wizard_550e8400-e29b-41d4-a716-446655440001_1703001240', '550e8400-e29b-41d4-a716-446655440001', 5, '880e8400-e29b-41d4-a716-446655440001', '{"step1": {"projectName": "Demo Project Alpha", "description": "Demonstration project for wizard functionality"}, "step2": {"category": "construction", "type": "new_construction"}, "step3": {"budget": 20000000, "timeline": 30}, "step4": {"pm": "550e8400-e29b-41d4-a716-446655440001"}, "step5": {"vendors": ["770e8400-e29b-41d4-a716-446655440001"]}}', NOW(), NOW(), true),
    ('wizard_550e8400-e29b-41d4-a716-446655440002_1703001241', '550e8400-e29b-41d4-a716-446655440002', 3, '880e8400-e29b-41d4-a716-446655440002', '{"step1": {"projectName": "Demo Renovation Beta", "description": "School renovation demonstration"}, "step2": {"category": "renovation", "type": "renovation"}, "step3": {"budget": 15000000, "timeline": 24}}', NOW(), NOW(), true)
ON CONFLICT (session_id) DO NOTHING;

-- Insert some milestone data
INSERT INTO project_milestones (id, project_id, milestone_name, milestone_type, target_date, actual_date, status, description, created_at, updated_at)
VALUES 
    ('990e8400-e29b-41d4-a716-446655440001', 'proj_1703001234_demo1', 'Design Development Complete', 'design', '2024-12-15', NULL, 'in_progress', 'Complete design development phase', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440002', 'proj_1703001234_demo1', 'Construction Start', 'construction', '2025-03-01', NULL, 'planned', 'Begin construction phase', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440003', 'proj_1703001235_demo2', 'Procurement Complete', 'procurement', '2024-11-30', '2024-11-28', 'completed', 'All major contracts awarded', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440004', 'proj_1703001236_demo3', 'Site Selection', 'planning', '2024-10-15', '2024-10-10', 'completed', 'Final site selected and approved', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update statistics for better query performance
ANALYZE users;
ANALYZE companies;
ANALYZE vendors;
ANALYZE projects;
ANALYZE project_teams;
ANALYZE project_vendors;
ANALYZE project_wizard_sessions;
ANALYZE project_milestones;

