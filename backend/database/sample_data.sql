-- PRS Application Sample Data
-- Comprehensive sample data for testing and demonstration

-- Insert sample users
INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, department, phone, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'System', 'Administrator', 'admin', 'IT Department', '780-555-0001', true),
('550e8400-e29b-41d4-a716-446655440002', 'john.smith', 'john.smith@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'John', 'Smith', 'pm', 'Project Management', '780-555-0002', true),
('550e8400-e29b-41d4-a716-446655440003', 'sarah.johnson', 'sarah.johnson@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'Sarah', 'Johnson', 'pmi', 'PMI Office', '780-555-0003', true),
('550e8400-e29b-41d4-a716-446655440004', 'michael.brown', 'michael.brown@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'Michael', 'Brown', 'director', 'Infrastructure', '780-555-0004', true),
('550e8400-e29b-41d4-a716-446655440005', 'lisa.wilson', 'lisa.wilson@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'Lisa', 'Wilson', 'analyst', 'Contract Services', '780-555-0005', true),
('550e8400-e29b-41d4-a716-446655440006', 'david.garcia', 'david.garcia@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'David', 'Garcia', 'pm', 'Health Facilities', '780-555-0006', true),
('550e8400-e29b-41d4-a716-446655440007', 'jennifer.lee', 'jennifer.lee@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'Jennifer', 'Lee', 'analyst', 'Program Integration', '780-555-0007', true),
('550e8400-e29b-41d4-a716-446655440008', 'robert.taylor', 'robert.taylor@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'Robert', 'Taylor', 'pm', 'Learning Facilities', '780-555-0008', true),
('550e8400-e29b-41d4-a716-446655440009', 'amanda.davis', 'amanda.davis@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'Amanda', 'Davis', 'director', 'Learning Facilities', '780-555-0009', true),
('550e8400-e29b-41d4-a716-446655440010', 'chris.martinez', 'chris.martinez@prs.gov.ab.ca', '$2b$10$rOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZJZJZJZOzJqQZJZJZJZJZ', 'Chris', 'Martinez', 'pm', 'Government Facilities', '780-555-0010', true);

-- Insert capital plan lines
INSERT INTO capital_plan_lines (id, code, name, description, is_active) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'HFB', 'Health Facilities', 'Health facilities and medical infrastructure projects', true),
('650e8400-e29b-41d4-a716-446655440002', 'LFB', 'Learning Facilities', 'Educational facilities and school infrastructure projects', true),
('650e8400-e29b-41d4-a716-446655440003', 'GFB', 'Government Facilities', 'Government buildings and administrative facilities', true),
('650e8400-e29b-41d4-a716-446655440004', 'TRN', 'Transportation', 'Transportation infrastructure and related projects', true),
('650e8400-e29b-41d4-a716-446655440005', 'WTR', 'Water Management', 'Water management and treatment facilities', true);

-- Insert client ministries
INSERT INTO client_ministries (id, code, name, description, is_active) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'AH', 'Alberta Health', 'Ministry responsible for health services and facilities', true),
('750e8400-e29b-41d4-a716-446655440002', 'AE', 'Alberta Education', 'Ministry responsible for education and learning facilities', true),
('750e8400-e29b-41d4-a716-446655440003', 'TB', 'Treasury Board', 'Treasury Board and Finance ministry', true),
('750e8400-e29b-41d4-a716-446655440004', 'INF', 'Infrastructure', 'Infrastructure and Transportation ministry', true),
('750e8400-e29b-41d4-a716-446655440005', 'JUS', 'Justice', 'Justice and Solicitor General ministry', true),
('750e8400-e29b-41d4-a716-446655440006', 'SH', 'Seniors Housing', 'Seniors and Housing ministry', true);

-- Insert school jurisdictions
INSERT INTO school_jurisdictions (id, code, name, region, is_active) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'CBE', 'Calgary Board of Education', 'Calgary', true),
('850e8400-e29b-41d4-a716-446655440002', 'EPS', 'Edmonton Public Schools', 'Edmonton', true),
('850e8400-e29b-41d4-a716-446655440003', 'ECS', 'Edmonton Catholic Schools', 'Edmonton', true),
('850e8400-e29b-41d4-a716-446655440004', 'RDP', 'Red Deer Public Schools', 'Central', true),
('850e8400-e29b-41d4-a716-446655440005', 'LSD', 'Lethbridge School District', 'South', true);

-- Insert PFMT files
INSERT INTO pfmt_files (id, project_name, project_id, file_path, status) VALUES
('950e8400-e29b-41d4-a716-446655440001', 'Calgary Hospital Expansion', 'H001', '/pfmt/calgary_hospital_expansion_h001.xlsx', 'active'),
('950e8400-e29b-41d4-a716-446655440002', 'Edmonton School Renovation', 'S002', '/pfmt/edmonton_school_renovation_s002.xlsx', 'active'),
('950e8400-e29b-41d4-a716-446655440003', 'Government Office Building', 'G003', '/pfmt/government_office_building_g003.xlsx', 'active'),
('950e8400-e29b-41d4-a716-446655440004', 'Red Deer Medical Center', 'H004', '/pfmt/red_deer_medical_center_h004.xlsx', 'active'),
('950e8400-e29b-41d4-a716-446655440005', 'Lethbridge High School', 'S005', '/pfmt/lethbridge_high_school_s005.xlsx', 'active'),
('950e8400-e29b-41d4-a716-446655440006', 'Medicine Hat Clinic', 'H006', '/pfmt/medicine_hat_clinic_h006.xlsx', 'active'),
('950e8400-e29b-41d4-a716-446655440007', 'Grande Prairie Elementary', 'S007', '/pfmt/grande_prairie_elementary_s007.xlsx', 'active'),
('950e8400-e29b-41d4-a716-446655440008', 'Fort McMurray Justice Center', 'G008', '/pfmt/fort_mcmurray_justice_center_g008.xlsx', 'active');

-- Insert sample projects
INSERT INTO projects (
    id, report_status, project_status, project_phase, modified_by, 
    project_name, capital_plan_line_id, approval_year, cpd_number, 
    project_category, funded_to_complete, client_ministry_id, 
    school_jurisdiction_id, pfmt_file_id, project_type, delivery_type,
    delivery_method, program, geographic_region, project_description,
    number_of_beds, total_opening_capacity, capacity_at_full_build_out,
    is_charter_school, square_meters, number_of_jobs
) VALUES
(
    '450e8400-e29b-41d4-a716-446655440001',
    'updated_by_team', 'underway', 'construction',
    '550e8400-e29b-41d4-a716-446655440002',
    'Calgary Hospital Expansion Phase 2',
    '650e8400-e29b-41d4-a716-446655440001',
    '2023-24', 'HFB-H001',
    'construction', 'construction',
    '750e8400-e29b-41d4-a716-446655440001',
    NULL,
    '950e8400-e29b-41d4-a716-446655440001',
    'expansion', 'design_build',
    'fast_track', 'health_facilities', 'calgary',
    'Major expansion of Calgary General Hospital including new emergency department, surgical suites, and patient care units. This project will add 150 beds and modernize existing facilities.',
    150, NULL, NULL, false, 25000.00, 137
),
(
    '450e8400-e29b-41d4-a716-446655440002',
    'reviewed_by_director', 'underway', 'design',
    '550e8400-e29b-41d4-a716-446655440008',
    'Edmonton School Renovation - Central High',
    '650e8400-e29b-41d4-a716-446655440002',
    '2024-25', 'LFB-S002',
    'construction', 'design_development',
    '750e8400-e29b-41d4-a716-446655440002',
    '850e8400-e29b-41d4-a716-446655440002',
    '950e8400-e29b-41d4-a716-446655440002',
    'renovation', 'design_bid_build',
    'traditional', 'learning_facilities', 'edmonton',
    'Complete renovation and modernization of Central High School including new science labs, library, gymnasium, and accessibility improvements.',
    NULL, 1200, 1500, false, 18000.00, 99
),
(
    '450e8400-e29b-41d4-a716-446655440003',
    'update_required', 'underway', 'planning',
    '550e8400-e29b-41d4-a716-446655440010',
    'Government Office Building - Downtown Calgary',
    '650e8400-e29b-41d4-a716-446655440003',
    '2024-25', 'GFB-G003',
    'construction', 'schematic_design',
    '750e8400-e29b-41d4-a716-446655440003',
    NULL,
    '950e8400-e29b-41d4-a716-446655440003',
    'new_construction', 'design_bid_build',
    'traditional', 'government_facilities', 'calgary',
    'New 12-story government office building in downtown Calgary to consolidate multiple government departments and improve service delivery.',
    NULL, NULL, NULL, false, 35000.00, 192
),
(
    '450e8400-e29b-41d4-a716-446655440004',
    'updated_by_team', 'underway', 'construction',
    '550e8400-e29b-41d4-a716-446655440006',
    'Red Deer Medical Center Upgrade',
    '650e8400-e29b-41d4-a716-446655440001',
    '2023-24', 'HFB-H004',
    'construction', 'construction',
    '750e8400-e29b-41d4-a716-446655440001',
    NULL,
    '950e8400-e29b-41d4-a716-446655440004',
    'renovation', 'cm_at_risk',
    'phased', 'health_facilities', 'central',
    'Comprehensive upgrade of Red Deer Medical Center including new MRI suite, expanded emergency department, and patient care improvements.',
    75, NULL, NULL, false, 12000.00, 66
),
(
    '450e8400-e29b-41d4-a716-446655440005',
    'reporting_not_required', 'complete', 'completed',
    '550e8400-e29b-41d4-a716-446655440008',
    'Lethbridge High School New Wing',
    '650e8400-e29b-41d4-a716-446655440002',
    '2022-23', 'LFB-S005',
    'construction', 'construction',
    '750e8400-e29b-41d4-a716-446655440002',
    '850e8400-e29b-41d4-a716-446655440005',
    '950e8400-e29b-41d4-a716-446655440005',
    'expansion', 'design_build',
    'fast_track', 'learning_facilities', 'south',
    'New wing addition to Lethbridge High School including modern classrooms, science labs, and student commons area.',
    NULL, 400, 400, false, 8000.00, 44
),
(
    '450e8400-e29b-41d4-a716-446655440006',
    'update_required', 'underway', 'design',
    '550e8400-e29b-41d4-a716-446655440006',
    'Medicine Hat Community Clinic',
    '650e8400-e29b-41d4-a716-446655440001',
    '2024-25', 'HFB-H006',
    'construction', 'design_development',
    '750e8400-e29b-41d4-a716-446655440001',
    NULL,
    '950e8400-e29b-41d4-a716-446655440006',
    'new_construction', 'design_bid_build',
    'traditional', 'health_facilities', 'south',
    'New community health clinic in Medicine Hat providing primary care, mental health services, and specialized clinics.',
    NULL, NULL, NULL, false, 5000.00, 27
),
(
    '450e8400-e29b-41d4-a716-446655440007',
    'reviewed_by_director', 'underway', 'planning',
    '550e8400-e29b-41d4-a716-446655440008',
    'Grande Prairie Elementary School',
    '650e8400-e29b-41d4-a716-446655440002',
    '2025-26', 'LFB-S007',
    'planning_only', 'functional_program',
    '750e8400-e29b-41d4-a716-446655440002',
    '850e8400-e29b-41d4-a716-446655440002',
    '950e8400-e29b-41d4-a716-446655440007',
    'new_construction', 'design_bid_build',
    'traditional', 'learning_facilities', 'north',
    'New elementary school in Grande Prairie to serve growing community needs with modern learning environments and community spaces.',
    NULL, 600, 750, false, 12000.00, 66
),
(
    '450e8400-e29b-41d4-a716-446655440008',
    'update_required', 'on_hold', 'planning',
    '550e8400-e29b-41d4-a716-446655440010',
    'Fort McMurray Justice Center',
    '650e8400-e29b-41d4-a716-446655440003',
    '2024-25', 'GFB-G008',
    'design_only', 'schematic_design',
    '750e8400-e29b-41d4-a716-446655440005',
    NULL,
    '950e8400-e29b-41d4-a716-446655440008',
    'new_construction', 'design_bid_build',
    'traditional', 'government_facilities', 'north',
    'New justice center in Fort McMurray including courthouse, RCMP detachment, and administrative offices.',
    NULL, NULL, NULL, false, 15000.00, 82
);

-- Insert project locations
INSERT INTO project_locations (
    id, project_id, location, municipality, urban_rural, project_address,
    constituency, building_name, building_type, building_id, building_owner,
    mla, plan, block, lot, latitude, longitude
) VALUES
(
    '350e8400-e29b-41d4-a716-446655440001',
    '450e8400-e29b-41d4-a716-446655440001',
    'calgary', 'Calgary', 'Urban',
    '1403 29 Street NW, Calgary, AB T2N 2T9',
    'calgary_centre', 'Calgary General Hospital', 'hospital',
    'CGH-001', 'Alberta Health Services',
    'Janet Brown', '8211063', '15', '1',
    51.0447, -114.0719
),
(
    '350e8400-e29b-41d4-a716-446655440002',
    '450e8400-e29b-41d4-a716-446655440002',
    'edmonton', 'Edmonton', 'Urban',
    '10010 108 Avenue NW, Edmonton, AB T5H 3A8',
    'edmonton_centre', 'Central High School', 'school',
    'CHS-002', 'Edmonton Public Schools',
    'David Shepherd', '7821842', '8', '12',
    53.5461, -113.4938
),
(
    '350e8400-e29b-41d4-a716-446655440003',
    '450e8400-e29b-41d4-a716-446655440003',
    'calgary', 'Calgary', 'Urban',
    '220 4 Avenue SE, Calgary, AB T2G 4X3',
    'calgary_centre', 'Government Office Tower', 'office',
    'GOT-003', 'Government of Alberta',
    'Janet Brown', '8010939', '2', '5',
    51.0486, -114.0708
),
(
    '350e8400-e29b-41d4-a716-446655440004',
    '450e8400-e29b-41d4-a716-446655440004',
    'red_deer', 'Red Deer', 'Urban',
    '3942 50A Avenue, Red Deer, AB T4N 4E7',
    'red_deer_north', 'Red Deer Medical Center', 'hospital',
    'RDMC-004', 'Alberta Health Services',
    'Adriana LaGrange', '0013374', '1', '3',
    52.2681, -113.8112
),
(
    '350e8400-e29b-41d4-a716-446655440005',
    '450e8400-e29b-41d4-a716-446655440005',
    'lethbridge', 'Lethbridge', 'Urban',
    '1202 2 Avenue S, Lethbridge, AB T1J 0E3',
    'lethbridge_west', 'Lethbridge High School', 'school',
    'LHS-005', 'Lethbridge School District',
    'Shannon Phillips', '7410684', '4', '8',
    49.6934, -112.8421
),
(
    '350e8400-e29b-41d4-a716-446655440006',
    '450e8400-e29b-41d4-a716-446655440006',
    'medicine_hat', 'Medicine Hat', 'Urban',
    '666 5 Street SW, Medicine Hat, AB T1A 4H6',
    'cypress_medicine_hat', 'Medicine Hat Community Clinic', 'clinic',
    'MHCC-006', 'Alberta Health Services',
    'Drew Barnes', '8211421', '6', '2',
    50.0355, -110.6764
),
(
    '350e8400-e29b-41d4-a716-446655440007',
    '450e8400-e29b-41d4-a716-446655440007',
    'grande_prairie', 'Grande Prairie', 'Urban',
    '9902 101 Avenue, Grande Prairie, AB T8V 0X8',
    'grande_prairie', 'Grande Prairie Elementary School', 'school',
    'GPES-007', 'Grande Prairie Public Schools',
    'Tracy Allard', '0830421', '3', '15',
    55.1708, -118.7947
),
(
    '350e8400-e29b-41d4-a716-446655440008',
    '450e8400-e29b-41d4-a716-446655440008',
    'fort_mcmurray', 'Regional Municipality of Wood Buffalo', 'Urban',
    '9909 Franklin Avenue, Fort McMurray, AB T9H 2K4',
    'fort_mcmurray_lac_la_biche', 'Fort McMurray Justice Center', 'office',
    'FMJC-008', 'Government of Alberta',
    'Laila Goodridge', '0520156', '7', '4',
    56.7267, -111.3790
);

-- Insert project teams
INSERT INTO project_teams (
    id, project_id, executive_director_id, director_id, sr_project_manager_id,
    project_manager_id, project_coordinator_id, contract_services_analyst_id,
    program_integration_analyst_id, additional_members, historical_members
) VALUES
(
    '250e8400-e29b-41d4-a716-446655440001',
    '450e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007',
    'Dr. Patricia Wong - Medical Director, James Thompson - Construction Manager',
    'Former PM: Mark Stevens (2022-2023)'
),
(
    '250e8400-e29b-41d4-a716-446655440002',
    '450e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007',
    'Principal Susan Miller, Facilities Manager Tom Wilson',
    'Former Coordinator: Lisa Chen (2023)'
),
(
    '250e8400-e29b-41d4-a716-446655440003',
    '450e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007',
    'Security Consultant: Mike Rodriguez, IT Manager: Karen Lee',
    NULL
),
(
    '250e8400-e29b-41d4-a716-446655440004',
    '450e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007',
    'Chief of Staff: Dr. Angela Roberts, Nursing Director: Mary Johnson',
    'Former Director: Dr. Richard Smith (2021-2023)'
),
(
    '250e8400-e29b-41d4-a716-446655440005',
    '450e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007',
    'Superintendent: Dr. Cheryl Gilmore, Maintenance: Bob Anderson',
    'Project completed - archived team records'
),
(
    '250e8400-e29b-41d4-a716-446655440006',
    '450e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007',
    'Community Representative: Janet Morrison, Local Physician: Dr. Paul Kim',
    NULL
),
(
    '250e8400-e29b-41d4-a716-446655440007',
    '450e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007',
    'School Board Chair: Margaret Thompson, Community Liaison: Steve Wilson',
    NULL
),
(
    '250e8400-e29b-41d4-a716-446655440008',
    '450e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440007',
    'RCMP Representative: Sergeant John MacLeod, Court Administrator: Helen Davis',
    NULL
);

-- Insert gate meetings
INSERT INTO gate_meetings (id, project_id, meeting_type, meeting_date, status, notes, created_by) VALUES
('150e8400-e29b-41d4-a716-446655440001', '450e8400-e29b-41d4-a716-446655440001', 'Gate 3 - Design Approval', '2024-06-15', 'approved', 'Design approved with minor modifications to emergency department layout', '550e8400-e29b-41d4-a716-446655440002'),
('150e8400-e29b-41d4-a716-446655440002', '450e8400-e29b-41d4-a716-446655440002', 'Gate 2 - Schematic Design', '2024-07-01', 'approved', 'Schematic design approved, proceed to design development', '550e8400-e29b-41d4-a716-446655440008'),
('150e8400-e29b-41d4-a716-446655440003', '450e8400-e29b-41d4-a716-446655440003', 'Gate 1 - Business Case', '2024-05-20', 'pending', 'Business case under review, awaiting Treasury Board approval', '550e8400-e29b-41d4-a716-446655440010'),
('150e8400-e29b-41d4-a716-446655440004', '450e8400-e29b-41d4-a716-446655440004', 'Gate 4 - Construction Start', '2024-03-10', 'approved', 'Construction approved to proceed, all permits in place', '550e8400-e29b-41d4-a716-446655440006'),
('150e8400-e29b-41d4-a716-446655440005', '450e8400-e29b-41d4-a716-446655440005', 'Gate 5 - Project Completion', '2024-01-15', 'approved', 'Project successfully completed and handed over to operations', '550e8400-e29b-41d4-a716-446655440008');

-- Insert monthly reports
INSERT INTO monthly_reports (id, project_id, report_month, status, submitted_by, reviewed_by, submitted_at, reviewed_at, notes) VALUES
('050e8400-e29b-41d4-a716-446655440001', '450e8400-e29b-41d4-a716-446655440001', '2024-06-01', 'approved', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '2024-07-05 09:00:00', '2024-07-08 14:30:00', 'Construction progressing on schedule'),
('050e8400-e29b-41d4-a716-446655440002', '450e8400-e29b-41d4-a716-446655440002', '2024-06-01', 'reviewed', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440009', '2024-07-03 11:15:00', '2024-07-07 16:45:00', 'Design development phase proceeding well'),
('050e8400-e29b-41d4-a716-446655440003', '450e8400-e29b-41d4-a716-446655440003', '2024-06-01', 'submitted', '550e8400-e29b-41d4-a716-446655440010', NULL, '2024-07-04 13:20:00', NULL, 'Planning phase activities on track'),
('050e8400-e29b-41d4-a716-446655440004', '450e8400-e29b-41d4-a716-446655440004', '2024-06-01', 'approved', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', '2024-07-02 08:45:00', '2024-07-06 10:15:00', 'Construction milestones achieved');

-- Insert project status updates
INSERT INTO project_status_updates (id, project_id, update_type, description, status, created_by) VALUES
('000e8400-e29b-41d4-a716-446655440001', '450e8400-e29b-41d4-a716-446655440001', 'Construction Milestone', 'Emergency department structural work completed', 'completed', '550e8400-e29b-41d4-a716-446655440002'),
('000e8400-e29b-41d4-a716-446655440002', '450e8400-e29b-41d4-a716-446655440002', 'Design Update', 'Science lab layouts finalized and approved', 'completed', '550e8400-e29b-41d4-a716-446655440008'),
('000e8400-e29b-41d4-a716-446655440003', '450e8400-e29b-41d4-a716-446655440003', 'Planning Update', 'Site survey and geotechnical assessment completed', 'completed', '550e8400-e29b-41d4-a716-446655440010'),
('000e8400-e29b-41d4-a716-446655440004', '450e8400-e29b-41d4-a716-446655440004', 'Construction Progress', 'MRI suite installation 75% complete', 'in_progress', '550e8400-e29b-41d4-a716-446655440006'),
('000e8400-e29b-41d4-a716-446655440005', '450e8400-e29b-41d4-a716-446655440005', 'Project Completion', 'Final inspections completed, ready for occupancy', 'completed', '550e8400-e29b-41d4-a716-446655440008');

