-- This file adds missing tables for project details functionality

-- Create project_vendors table for managing vendors assigned to projects
CREATE TABLE IF NOT EXISTS project_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'contractor',
    contract_value DECIMAL(15,2),
    contract_start_date DATE,
    contract_end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    assigned_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, vendor_id, role)
);

-- Create project_milestones table for managing project milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    completed_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    milestone_type VARCHAR(100) DEFAULT 'general',
    assigned_to UUID REFERENCES users(id),
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_expenses table for budget tracking
CREATE TABLE IF NOT EXISTS project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    vendor_id UUID REFERENCES vendors(id),
    invoice_number VARCHAR(100),
    approved_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_vendors_project_id ON project_vendors(project_id);
CREATE INDEX IF NOT EXISTS idx_project_vendors_vendor_id ON project_vendors(vendor_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_target_date ON project_milestones(target_date);
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_category ON project_expenses(category);

-- Insert sample data for testing

-- Sample project vendors (assuming we have some vendors in the vendors table)
INSERT INTO project_vendors (project_id, vendor_id, role, contract_value, contract_start_date, contract_end_date, status, notes)
SELECT 
    p.id as project_id,
    v.id as vendor_id,
    'Primary Contractor' as role,
    5000000.00 as contract_value,
    CURRENT_DATE as contract_start_date,
    CURRENT_DATE + INTERVAL '18 months' as contract_end_date,
    'active' as status,
    'Main construction contractor for the project' as notes
FROM projects p
CROSS JOIN vendors v
WHERE p.project_name LIKE '%University Science Building%'
AND v.name LIKE '%Construction%'
LIMIT 1
ON CONFLICT (project_id, vendor_id, role) DO NOTHING;

-- Sample project milestones
INSERT INTO project_milestones (project_id, title, description, target_date, status, milestone_type, completion_percentage, notes)
SELECT 
    p.id as project_id,
    milestone.title,
    milestone.description,
    milestone.target_date,
    milestone.status,
    milestone.milestone_type,
    milestone.completion_percentage,
    milestone.notes
FROM projects p
CROSS JOIN (
    VALUES 
    ('Project Initiation', 'Project officially started and team assembled', CURRENT_DATE - INTERVAL '6 months', 'completed', 'planning', 100, 'Successfully completed on schedule'),
    ('Design Phase Complete', 'Architectural and engineering designs finalized', CURRENT_DATE - INTERVAL '3 months', 'completed', 'design', 100, 'All designs approved by stakeholders'),
    ('Construction Start', 'Ground breaking and construction commencement', CURRENT_DATE - INTERVAL '1 month', 'completed', 'construction', 100, 'Construction started as planned'),
    ('Foundation Complete', 'Building foundation work completed', CURRENT_DATE + INTERVAL '2 months', 'in_progress', 'construction', 60, 'Foundation work is 60% complete'),
    ('Structural Frame Complete', 'Building structural framework completed', CURRENT_DATE + INTERVAL '6 months', 'pending', 'construction', 0, 'Scheduled to begin after foundation completion'),
    ('Interior Fit-out Start', 'Interior construction and fit-out begins', CURRENT_DATE + INTERVAL '12 months', 'pending', 'construction', 0, 'Dependent on structural completion'),
    ('Final Inspection', 'Building final inspection and certification', CURRENT_DATE + INTERVAL '18 months', 'pending', 'completion', 0, 'Final milestone before handover'),
    ('Project Handover', 'Project completion and handover to client', CURRENT_DATE + INTERVAL '20 months', 'pending', 'completion', 0, 'Final project delivery')
) AS milestone(title, description, target_date, status, milestone_type, completion_percentage, notes)
WHERE p.project_name LIKE '%University Science Building%'
LIMIT 1;

-- Sample project expenses for budget tracking
INSERT INTO project_expenses (project_id, category, description, amount, expense_date, status, notes)
SELECT 
    p.id as project_id,
    expense.category,
    expense.description,
    expense.amount,
    expense.expense_date,
    expense.status,
    expense.notes
FROM projects p
CROSS JOIN (
    VALUES 
    ('Design & Engineering', 'Architectural design services', 250000.00, CURRENT_DATE - INTERVAL '4 months', 'approved', 'Initial design phase payment'),
    ('Design & Engineering', 'Structural engineering services', 150000.00, CURRENT_DATE - INTERVAL '3 months', 'approved', 'Structural design and analysis'),
    ('Construction', 'Site preparation and excavation', 180000.00, CURRENT_DATE - INTERVAL '2 months', 'approved', 'Site clearing and foundation excavation'),
    ('Construction', 'Foundation materials and labor', 320000.00, CURRENT_DATE - INTERVAL '1 month', 'approved', 'Concrete and rebar for foundation'),
    ('Equipment & Furnishing', 'Laboratory equipment procurement', 450000.00, CURRENT_DATE, 'pending', 'Specialized scientific equipment for labs'),
    ('Project Management', 'Project management services Q1', 75000.00, CURRENT_DATE - INTERVAL '3 months', 'approved', 'Quarterly PM fees'),
    ('Project Management', 'Project management services Q2', 75000.00, CURRENT_DATE, 'pending', 'Current quarter PM fees')
) AS expense(category, description, amount, expense_date, status, notes)
WHERE p.project_name LIKE '%University Science Building%'
LIMIT 1;

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_vendors_updated_at BEFORE UPDATE ON project_vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_expenses_updated_at BEFORE UPDATE ON project_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

