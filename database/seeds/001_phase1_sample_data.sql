-- Phase 1 Sample Data
-- Sample data for testing and demonstration of Phase 1 features

-- Sample contracts
INSERT INTO contracts (id, project_id, vendor_id, contract_number, contract_name, contract_type, original_value, current_value, start_date, end_date, status, description, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440030', 'RDJ-2024-001', 'Red Deer Justice Centre - Main Construction', 'Construction', 15000000.00, 15500000.00, '2024-03-01', '2025-12-31', 'active', 'Main construction contract for Red Deer Justice Centre', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440031', 'RDJ-2024-002', 'Red Deer Justice Centre - IT Systems', 'Technology', 2000000.00, 2200000.00, '2024-06-01', '2025-08-31', 'active', 'IT systems and infrastructure for Red Deer Justice Centre', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440032', 'CCR-2024-001', 'Calgary Courthouse - Design Services', 'Design', 800000.00, 850000.00, '2024-01-15', '2024-12-15', 'active', 'Architectural and engineering design services', '550e8400-e29b-41d4-a716-446655440003');

-- Sample contract change orders
INSERT INTO contract_change_orders (id, contract_id, change_order_number, description, amount_change, time_change_days, reason, approved_by, approved_at, status, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440050', 'CO-001', 'Additional security features', 500000.00, 30, 'Enhanced security requirements identified during design review', '550e8400-e29b-41d4-a716-446655440004', '2024-05-15 14:30:00', 'approved', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440051', 'CO-001', 'Upgraded network infrastructure', 200000.00, 15, 'Technology upgrade to support future requirements', '550e8400-e29b-41d4-a716-446655440004', '2024-07-10 09:15:00', 'approved', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440052', 'CO-001', 'Additional design iterations', 50000.00, 20, 'Client requested design modifications', '550e8400-e29b-41d4-a716-446655440004', '2024-04-20 16:45:00', 'approved', '550e8400-e29b-41d4-a716-446655440003');

-- Sample contract payments
INSERT INTO contract_payments (id, contract_id, project_id, amount, payment_date, status, source_ref, payment_type, description, approved_by, approved_at, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', 1500000.00, '2024-04-01', 'paid', '1GX-2024-001234', 'progress', 'Progress payment #1 - Site preparation and foundation', '550e8400-e29b-41d4-a716-446655440004', '2024-03-28 10:00:00', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', 2000000.00, '2024-06-01', 'paid', '1GX-2024-002345', 'progress', 'Progress payment #2 - Structural work', '550e8400-e29b-41d4-a716-446655440004', '2024-05-29 14:30:00', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', 1800000.00, '2024-08-01', 'paid', '1GX-2024-003456', 'progress', 'Progress payment #3 - Building envelope', '550e8400-e29b-41d4-a716-446655440004', '2024-07-30 11:15:00', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440040', 400000.00, '2024-07-15', 'paid', '1GX-2024-004567', 'progress', 'Progress payment #1 - Network infrastructure', '550e8400-e29b-41d4-a716-446655440004', '2024-07-12 09:45:00', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440074', '550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440041', 200000.00, '2024-03-15', 'paid', '1GX-2024-005678', 'progress', 'Progress payment #1 - Preliminary design', '550e8400-e29b-41d4-a716-446655440004', '2024-03-12 13:20:00', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440075', '550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440041', 300000.00, '2024-06-15', 'paid', '1GX-2024-006789', 'progress', 'Progress payment #2 - Detailed design', '550e8400-e29b-41d4-a716-446655440004', '2024-06-12 15:10:00', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440076', '550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', 2200000.00, '2024-10-01', 'pending', '1GX-2024-007890', 'progress', 'Progress payment #4 - Interior systems', NULL, NULL, '550e8400-e29b-41d4-a716-446655440002');

-- Sample budget transfers
INSERT INTO budget_transfers (id, project_id, from_category, to_category, amount, transfer_date, rationale, approved_by, approved_at, status, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440040', 'Construction', 'Security Systems', 300000.00, '2024-05-10', 'Transfer funds to cover enhanced security requirements per change order CO-001', '550e8400-e29b-41d4-a716-446655440004', '2024-05-12 10:30:00', 'approved', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440040', 'Contingency', 'Technology', 150000.00, '2024-07-05', 'Transfer contingency funds to cover IT infrastructure upgrades', '550e8400-e29b-41d4-a716-446655440004', '2024-07-08 14:15:00', 'approved', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440041', 'Design', 'Project Management', 25000.00, '2024-04-18', 'Transfer funds to cover additional project management support', '550e8400-e29b-41d4-a716-446655440004', '2024-04-22 11:45:00', 'approved', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440083', '550e8400-e29b-41d4-a716-446655440040', 'Furniture & Equipment', 'Construction', 75000.00, '2024-09-15', 'Transfer funds to cover construction cost overruns', NULL, NULL, 'pending', '550e8400-e29b-41d4-a716-446655440002');

-- Sample vendor performance reviews
INSERT INTO vendor_performance_reviews (id, vendor_id, project_id, contract_id, overall_rating, quality_rating, schedule_rating, communication_rating, cost_rating, review_notes, review_date, reviewed_by) VALUES
('550e8400-e29b-41d4-a716-446655440090', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440050', 4.2, 4.5, 4.0, 4.0, 4.2, 'BuildCorp has performed well on the Red Deer Justice Centre project. Quality of work is excellent, though there have been some minor schedule delays due to weather. Communication has been good overall.', '2024-08-15', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440051', 4.6, 4.8, 4.5, 4.5, 4.5, 'TechServ has exceeded expectations on the IT systems implementation. High quality work delivered on schedule with excellent communication throughout the project.', '2024-08-20', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440052', 3.8, 4.0, 3.5, 4.0, 3.8, 'ConsultPro delivered good design work but required additional iterations beyond the original scope. Communication was good but schedule performance could be improved.', '2024-07-30', '550e8400-e29b-41d4-a716-446655440003');

-- Sample gate meetings with more detailed data
INSERT INTO gate_meetings (id, project_id, gate_type, scheduled_date, actual_date, status, attendees, agenda, minutes, decisions, action_items, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440040', 'Gate 1 - Project Initiation', '2024-02-15', '2024-02-15', 'completed', 
'[{"name": "Sarah Johnson", "role": "Project Manager", "email": "sarah.johnson@gov.ab.ca"}, {"name": "Lisa Rodriguez", "role": "Director", "email": "lisa.rodriguez@gov.ab.ca"}, {"name": "Michael Chen", "role": "Sr. Project Manager", "email": "michael.chen@gov.ab.ca"}]',
'1. Project overview and objectives\n2. Budget approval\n3. Team assignments\n4. Risk assessment\n5. Next steps',
'Meeting held to approve project initiation for Red Deer Justice Centre. All attendees present. Project objectives reviewed and approved. Budget of $17.5M approved. Team assignments confirmed. Risk register reviewed. Decision made to proceed to design phase.',
'[{"decision": "Approve project initiation", "rationale": "Project aligns with strategic objectives and budget is available"}, {"decision": "Approve project team", "rationale": "Team has appropriate skills and experience"}]',
'[{"action": "Finalize design contract", "assignee": "Sarah Johnson", "due_date": "2024-03-01", "status": "completed"}, {"action": "Complete environmental assessment", "assignee": "Michael Chen", "due_date": "2024-03-15", "status": "completed"}]',
'550e8400-e29b-41d4-a716-446655440002'),

('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440040', 'Gate 2 - Design Approval', '2024-05-20', '2024-05-22', 'completed',
'[{"name": "Sarah Johnson", "role": "Project Manager", "email": "sarah.johnson@gov.ab.ca"}, {"name": "Lisa Rodriguez", "role": "Director", "email": "lisa.rodriguez@gov.ab.ca"}, {"name": "BuildCorp Representative", "role": "Contractor", "email": "contact@buildcorp.com"}]',
'1. Design review and approval\n2. Construction contract award\n3. Schedule review\n4. Budget update\n5. Risk mitigation strategies',
'Design review completed. Minor modifications requested and incorporated. Construction contract awarded to BuildCorp Solutions. Schedule reviewed and approved with completion target of December 2025. Budget updated to reflect change orders.',
'[{"decision": "Approve final design", "rationale": "Design meets all requirements and stakeholder feedback incorporated"}, {"decision": "Award construction contract", "rationale": "BuildCorp submitted best value proposal"}]',
'[{"action": "Issue construction notice to proceed", "assignee": "Sarah Johnson", "due_date": "2024-06-01", "status": "completed"}, {"action": "Finalize construction schedule", "assignee": "BuildCorp Representative", "due_date": "2024-06-15", "status": "completed"}]',
'550e8400-e29b-41d4-a716-446655440002'),

('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440040', 'Gate 3 - Construction Progress Review', '2024-09-15', NULL, 'scheduled',
'[{"name": "Sarah Johnson", "role": "Project Manager", "email": "sarah.johnson@gov.ab.ca"}, {"name": "Lisa Rodriguez", "role": "Director", "email": "lisa.rodriguez@gov.ab.ca"}, {"name": "BuildCorp Representative", "role": "Contractor", "email": "contact@buildcorp.com"}]',
'1. Construction progress review\n2. Budget status update\n3. Schedule performance\n4. Quality assurance review\n5. Risk assessment update',
NULL, NULL, NULL,
'550e8400-e29b-41d4-a716-446655440002'),

('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440041', 'Gate 1 - Project Initiation', '2024-01-10', '2024-01-10', 'completed',
'[{"name": "Michael Chen", "role": "Sr. Project Manager", "email": "michael.chen@gov.ab.ca"}, {"name": "Lisa Rodriguez", "role": "Director", "email": "lisa.rodriguez@gov.ab.ca"}]',
'1. Project scope definition\n2. Budget allocation\n3. Design team selection\n4. Timeline establishment',
'Calgary Courthouse renovation project initiated. Scope includes modernization of courtrooms, security upgrades, and accessibility improvements. Budget of $5.2M approved. ConsultPro selected for design services.',
'[{"decision": "Approve project scope", "rationale": "Renovation is necessary for operational efficiency and compliance"}, {"decision": "Select ConsultPro for design", "rationale": "Best qualified team with courthouse experience"}]',
'[{"action": "Execute design contract", "assignee": "Michael Chen", "due_date": "2024-01-20", "status": "completed"}, {"action": "Conduct stakeholder meetings", "assignee": "Michael Chen", "due_date": "2024-02-01", "status": "completed"}]',
'550e8400-e29b-41d4-a716-446655440003');

-- Update project workflow states based on gate meeting progress
UPDATE projects SET 
    workflow_state = 'Gate 3 Pending',
    next_action = 'Prepare for Gate 3 construction progress review meeting scheduled for September 15, 2024'
WHERE id = '550e8400-e29b-41d4-a716-446655440040';

UPDATE projects SET 
    workflow_state = 'Design Phase',
    next_action = 'Complete detailed design and prepare for Gate 2 design approval'
WHERE id = '550e8400-e29b-41d4-a716-446655440041';

-- Update vendor average scores based on performance reviews
UPDATE vendors SET average_score = 4.2 WHERE id = '550e8400-e29b-41d4-a716-446655440030';
UPDATE vendors SET average_score = 4.6 WHERE id = '550e8400-e29b-41d4-a716-446655440031';
UPDATE vendors SET average_score = 3.8 WHERE id = '550e8400-e29b-41d4-a716-446655440032';

COMMIT;

