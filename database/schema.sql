-- PFMT Integrated Database Schema
-- Combines PFMT Enhanced project management with enterprise PostgreSQL capabilities

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table for organizational entities
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    location VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors table for vendor management
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capabilities TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    certification_level VARCHAR(100),
    performance_rating DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Capital plan lines for project categorization
CREATE TABLE capital_plan_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget_amount DECIMAL(15,2),
    fiscal_year INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client ministries for government organization
CREATE TABLE client_ministries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(20),
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- School jurisdictions for education projects
CREATE TABLE school_jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    jurisdiction_code VARCHAR(20),
    region VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PFMT files for project file management
CREATE TABLE pfmt_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(50),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_status VARCHAR(50) DEFAULT 'update_required',
    project_status VARCHAR(50),
    project_phase VARCHAR(50),
    modified_by UUID REFERENCES users(id),
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reporting_as_of_date DATE,
    director_review_date DATE,
    pfmt_data_date DATE,
    archived_date DATE,
    
    -- Project Details
    project_name VARCHAR(255) NOT NULL,
    capital_plan_line_id UUID REFERENCES capital_plan_lines(id),
    approval_year INTEGER,
    cpd_number VARCHAR(100),
    project_category VARCHAR(100),
    funded_to_complete BOOLEAN DEFAULT false,
    client_ministry_id UUID REFERENCES client_ministries(id),
    school_jurisdiction_id UUID REFERENCES school_jurisdictions(id),
    pfmt_file_id UUID REFERENCES pfmt_files(id),
    project_type VARCHAR(100),
    delivery_type VARCHAR(100),
    specific_delivery_type VARCHAR(100),
    delivery_method VARCHAR(100),
    program VARCHAR(100),
    geographic_region VARCHAR(100),
    project_description TEXT,
    
    -- Facility-specific fields
    number_of_beds INTEGER,
    total_opening_capacity INTEGER,
    capacity_at_full_build_out INTEGER,
    is_charter_school BOOLEAN DEFAULT false,
    grades_from INTEGER,
    grades_to INTEGER,
    square_meters DECIMAL(10,2),
    number_of_jobs INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project locations for geographic information
CREATE TABLE project_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    location VARCHAR(255),
    municipality VARCHAR(255),
    urban_rural VARCHAR(50),
    project_address TEXT,
    constituency VARCHAR(100),
    building_name VARCHAR(255),
    building_type VARCHAR(100),
    building_id VARCHAR(100),
    building_owner VARCHAR(255),
    mla VARCHAR(255),
    plan VARCHAR(100),
    block VARCHAR(100),
    lot VARCHAR(100),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project teams for team member assignments
CREATE TABLE project_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    executive_director_id UUID REFERENCES users(id),
    director_id UUID REFERENCES users(id),
    sr_project_manager_id UUID REFERENCES users(id),
    project_manager_id UUID REFERENCES users(id),
    project_coordinator_id UUID REFERENCES users(id),
    contract_services_analyst_id UUID REFERENCES users(id),
    program_integration_analyst_id UUID REFERENCES users(id),
    additional_members JSONB,
    historical_members JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project vendors for vendor relationships
CREATE TABLE project_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    role VARCHAR(100),
    contract_value DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, vendor_id, role)
);

-- Company vendors for company-vendor relationships
CREATE TABLE company_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    relationship_type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, vendor_id)
);

-- Project versions for version control and approval workflows
CREATE TABLE project_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_data JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    comments TEXT,
    UNIQUE(project_id, version_number)
);

-- Workflow tasks for task management
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate meetings for project milestone management
CREATE TABLE gate_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    gate_type VARCHAR(100) NOT NULL,
    scheduled_date DATE,
    actual_date DATE,
    status VARCHAR(50) DEFAULT 'scheduled',
    attendees JSONB,
    agenda TEXT,
    minutes TEXT,
    decisions JSONB,
    action_items JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invitations for user invitations and onboarding
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    project_id UUID REFERENCES projects(id),
    invited_by UUID REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for tracking all changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX idx_projects_status ON projects(project_status);
CREATE INDEX idx_projects_phase ON projects(project_phase);
CREATE INDEX idx_projects_name ON projects(project_name);
CREATE INDEX idx_projects_cpd_number ON projects(cpd_number);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_modified_by ON projects(modified_by);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_vendors_status ON vendors(status);

CREATE INDEX idx_project_teams_project_id ON project_teams(project_id);
CREATE INDEX idx_project_locations_project_id ON project_locations(project_id);
CREATE INDEX idx_project_vendors_project_id ON project_vendors(project_id);
CREATE INDEX idx_project_vendors_vendor_id ON project_vendors(vendor_id);

CREATE INDEX idx_workflow_tasks_project_id ON workflow_tasks(project_id);
CREATE INDEX idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);

CREATE INDEX idx_gate_meetings_project_id ON gate_meetings(project_id);
CREATE INDEX idx_gate_meetings_scheduled_date ON gate_meetings(scheduled_date);

CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_locations_updated_at BEFORE UPDATE ON project_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_teams_updated_at BEFORE UPDATE ON project_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_tasks_updated_at BEFORE UPDATE ON workflow_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gate_meetings_updated_at BEFORE UPDATE ON gate_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
BEGIN
    -- Get user ID from session variable
    BEGIN
        user_id_val := current_setting('app.current_user_id')::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            user_id_val := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), user_id_val);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), user_id_val);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), user_id_val);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to main tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON projects FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_vendors AFTER INSERT OR UPDATE OR DELETE ON vendors FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Insert sample data for testing
INSERT INTO users (id, username, email, first_name, last_name, role, password_hash) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@pfmt.gov.ab.ca', 'Admin', 'User', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('550e8400-e29b-41d4-a716-446655440002', 'sarah.johnson', 'sarah.johnson@gov.ab.ca', 'Sarah', 'Johnson', 'project_manager', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('550e8400-e29b-41d4-a716-446655440003', 'michael.chen', 'michael.chen@gov.ab.ca', 'Michael', 'Chen', 'sr_project_manager', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('550e8400-e29b-41d4-a716-446655440004', 'lisa.rodriguez', 'lisa.rodriguez@gov.ab.ca', 'Lisa', 'Rodriguez', 'director', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

INSERT INTO client_ministries (id, name, abbreviation) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Infrastructure', 'INF'),
('550e8400-e29b-41d4-a716-446655440011', 'Education', 'EDU'),
('550e8400-e29b-41d4-a716-446655440012', 'Health', 'HEA');

INSERT INTO companies (id, name, industry, status) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'ABC Construction Ltd.', 'Construction', 'active'),
('550e8400-e29b-41d4-a716-446655440021', 'XYZ Engineering Inc.', 'Engineering', 'active'),
('550e8400-e29b-41d4-a716-446655440022', 'DEF Consulting Group', 'Consulting', 'active');

INSERT INTO vendors (id, name, capabilities, status) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'BuildCorp Solutions', 'Construction, Project Management', 'active'),
('550e8400-e29b-41d4-a716-446655440031', 'TechServ Inc.', 'IT Services, Software Development', 'active'),
('550e8400-e29b-41d4-a716-446655440032', 'ConsultPro Ltd.', 'Business Consulting, Process Improvement', 'active');

-- Sample projects
INSERT INTO projects (
    id, project_name, project_status, project_phase, project_type, 
    delivery_type, program, geographic_region, project_description,
    client_ministry_id, cpd_number, approval_year, modified_by
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440040',
    'Red Deer Justice Centre',
    'underway',
    'construction',
    'New Construction',
    'Design-Build',
    'Justice',
    'Central',
    'Construction of new justice facility in Red Deer',
    '550e8400-e29b-41d4-a716-446655440010',
    'CPD-2024-001',
    2024,
    '550e8400-e29b-41d4-a716-446655440002'
),
(
    '550e8400-e29b-41d4-a716-446655440041',
    'Calgary Courthouse Renovation',
    'underway',
    'design',
    'Renovation',
    'Traditional',
    'Justice',
    'South',
    'Major renovation and modernization of Calgary courthouse',
    '550e8400-e29b-41d4-a716-446655440010',
    'CPD-2024-002',
    2024,
    '550e8400-e29b-41d4-a716-446655440002'
);

-- Sample project locations
INSERT INTO project_locations (project_id, location, municipality, building_name) VALUES
('550e8400-e29b-41d4-a716-446655440040', 'Red Deer', 'Red Deer', 'Red Deer Justice Centre'),
('550e8400-e29b-41d4-a716-446655440041', 'Calgary', 'Calgary', 'Calgary Courthouse');

-- Sample project teams
INSERT INTO project_teams (project_id, project_manager_id, director_id) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004');

COMMIT;



-- =====================================================
-- PROJECT WIZARD SCHEMA INTEGRATION
-- =====================================================

-- Project Templates
CREATE TABLE IF NOT EXISTS project_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    default_budget DECIMAL(15,2),
    estimated_duration INTEGER, -- in days
    required_roles TEXT[], -- array of required roles
    template_data JSONB, -- template configuration data
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Project Wizard Sessions (temporary storage during wizard process)
CREATE TABLE IF NOT EXISTS project_wizard_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    current_step INTEGER DEFAULT 1,
    template_id INTEGER REFERENCES project_templates(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Wizard Step Data (stores data for each step)
CREATE TABLE IF NOT EXISTS project_wizard_step_data (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES project_wizard_sessions(session_id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL,
    step_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, step_id)
);

-- Project Team Assignments (enhanced from existing structure)
CREATE TABLE IF NOT EXISTS project_team_assignments (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(project_id, user_id, role)
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completion_date DATE,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed, Overdue
    priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Project Tasks
CREATE TABLE IF NOT EXISTS project_tasks (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id INTEGER REFERENCES project_milestones(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Completed, On Hold
    priority VARCHAR(20) DEFAULT 'Medium',
    due_date DATE,
    completion_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Task Dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    depends_on_task_id INTEGER NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start', -- finish_to_start, start_to_start, finish_to_finish, start_to_finish
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, depends_on_task_id)
);

-- Project Status History (for tracking project status changes)
CREATE TABLE IF NOT EXISTS project_status_history (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    previous_status VARCHAR(100),
    new_status VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES users(id),
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_user_id ON project_wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_session_id ON project_wizard_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_step_data_session_id ON project_wizard_step_data(session_id);
CREATE INDEX IF NOT EXISTS idx_project_team_assignments_project_id ON project_team_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_assignments_user_id ON project_team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_milestone_id ON project_tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id ON project_status_history(project_id);

-- Insert default project templates
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user ID
    SELECT id INTO first_user_id FROM users LIMIT 1;
    
    -- Insert default project templates only if we have a user
    IF first_user_id IS NOT NULL THEN
        INSERT INTO project_templates (name, description, category, default_budget, estimated_duration, required_roles, template_data, created_by) VALUES
        ('Standard Infrastructure Project', 'Standard template for infrastructure projects', 'Infrastructure', 1000000.00, 365, ARRAY['Project Manager', 'Engineer', 'Contractor'], '{"phases": ["Planning", "Design", "Construction", "Completion"], "gates": ["Gate 1", "Gate 2", "Gate 3", "Gate 4"]}', first_user_id),
        ('IT System Implementation', 'Template for IT system implementations', 'Technology', 500000.00, 180, ARRAY['Project Manager', 'System Analyst', 'Developer'], '{"phases": ["Analysis", "Design", "Development", "Testing", "Deployment"], "gates": ["Requirements Gate", "Design Gate", "Testing Gate", "Go-Live Gate"]}', first_user_id),
        ('Building Renovation', 'Template for building renovation projects', 'Construction', 2000000.00, 270, ARRAY['Project Manager', 'Architect', 'Contractor', 'Safety Officer'], '{"phases": ["Assessment", "Planning", "Renovation", "Inspection"], "gates": ["Assessment Gate", "Planning Gate", "Construction Gate", "Completion Gate"]}', first_user_id),
        ('Research & Development', 'Template for R&D projects', 'Research', 300000.00, 540, ARRAY['Project Manager', 'Researcher', 'Analyst'], '{"phases": ["Research", "Development", "Testing", "Documentation"], "gates": ["Research Gate", "Development Gate", "Testing Gate", "Publication Gate"]}', first_user_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Update existing projects table if needed (add columns that might be missing)
DO $$ 
BEGIN
    -- Add project_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type VARCHAR(100) DEFAULT 'Standard';
    END IF;
    
    -- Add region column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'region') THEN
        ALTER TABLE projects ADD COLUMN region VARCHAR(100) DEFAULT 'Alberta';
    END IF;
    
    -- Add ministry column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'ministry') THEN
        ALTER TABLE projects ADD COLUMN ministry VARCHAR(100) DEFAULT 'Infrastructure';
    END IF;
    
    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'start_date') THEN
        ALTER TABLE projects ADD COLUMN start_date DATE;
    END IF;
    
    -- Add expected_completion column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'expected_completion') THEN
        ALTER TABLE projects ADD COLUMN expected_completion DATE;
    END IF;
END $$;

