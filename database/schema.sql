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
-- The simple gate_meetings table has been removed in favor of the enhanced
-- gate meeting schema defined at the end of this file.  See the
-- "Enhanced Gate Meeting Schema" section for the new structure.

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
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- For generic audit trigger usage
    table_name VARCHAR(100),
    record_id UUID,
    -- For inline edit and manual logs
    entity_type VARCHAR(100),
    entity_id UUID,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    -- Audit action type (INSERT, UPDATE, DELETE, inline_edit, etc.)
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),       -- For inline edit logs
    changed_by UUID REFERENCES users(id),   -- For trigger-based logs
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- For trigger-based logs
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- For inline edit logs
    ip_address INET,
    user_agent TEXT,
    action_batch_id UUID
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

-- Indexes on the old gate_meetings table have been removed.  Indexes for
-- the enhanced gate meeting schema are created later in this file.

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

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
-- Removed trigger for old gate_meetings table.  See enhanced schema section for new triggers.

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
        INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), user_id_val);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), user_id_val);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by)
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
-- ENHANCED SCHEMA DEFINITIONS (Unified)
-- =====================================================

-- Drop old or conflicting tables prior to creating enhanced structures
DROP TABLE IF EXISTS gate_meetings CASCADE;
DROP TABLE IF EXISTS gate_meeting_types CASCADE;
DROP TABLE IF EXISTS gate_meeting_statuses CASCADE;
DROP TABLE IF EXISTS organizational_roles CASCADE;
DROP TABLE IF EXISTS gate_meeting_participants CASCADE;
DROP TABLE IF EXISTS gate_meeting_action_items CASCADE;
DROP TABLE IF EXISTS gate_meeting_dependencies CASCADE;
DROP TABLE IF EXISTS gate_meeting_templates CASCADE;
DROP TABLE IF EXISTS gate_meeting_workflow_states CASCADE;
DROP TABLE IF EXISTS fiscal_year_events CASCADE;
DROP TABLE IF EXISTS project_templates CASCADE;
DROP TABLE IF EXISTS project_wizard_sessions CASCADE;
DROP TABLE IF EXISTS project_wizard_step_data CASCADE;
DROP TABLE IF EXISTS project_team_assignments CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS project_status_history CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS contract_payments CASCADE;
DROP TABLE IF EXISTS budget_transfers CASCADE;
DROP TABLE IF EXISTS approval_workflows CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS system_configs CASCADE;

-- ===========================================
-- Enhanced Gate Meeting Schema
-- ===========================================

-- Gate Meeting Types lookup table
CREATE TABLE gate_meeting_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    typical_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meeting Statuses lookup table
CREATE TABLE gate_meeting_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_final BOOLEAN DEFAULT false,
    color_code VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizational Roles lookup table
CREATE TABLE organizational_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_panel_member BOOLEAN DEFAULT false,
    is_support_role BOOLEAN DEFAULT false,
    typical_authority_level INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Gate Meetings table
CREATE TABLE gate_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    gate_meeting_type_id UUID REFERENCES gate_meeting_types(id),
    status_id UUID REFERENCES gate_meeting_statuses(id),

    -- Meeting Details
    meeting_title VARCHAR(255),
    meeting_description TEXT,
    planned_date DATE,
    actual_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    meeting_url VARCHAR(500),

    -- Fiscal Year Information
    fiscal_year VARCHAR(10),
    fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_month INTEGER CHECK (fiscal_month BETWEEN 1 AND 12),

    -- Meeting Outcomes
    decision VARCHAR(50) CHECK (decision IN ('approved','rejected','conditional','deferred','cancelled')),
    decision_rationale TEXT,
    next_milestone_date DATE,
    next_gate_meeting_type_id UUID REFERENCES gate_meeting_types(id),

    -- Risk and Issues
    key_risks_identified TEXT,
    mitigation_strategies TEXT,
    escalated_issues TEXT,

    -- Documentation
    agenda_document_path VARCHAR(500),
    presentation_path VARCHAR(500),
    minutes_document_path VARCHAR(500),
    supporting_documents JSONB,

    -- Workflow and attendance flags
    is_mandatory BOOLEAN DEFAULT false,
    requires_adm_attendance BOOLEAN DEFAULT false,
    requires_ed_attendance BOOLEAN DEFAULT false,
    preparation_deadline DATE,
    materials_deadline DATE,

    -- Audit Fields
    created_by UUID REFERENCES users(id),
    scheduled_by UUID REFERENCES users(id),
    chaired_by UUID REFERENCES users(id),
    scribed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    approved_at TIMESTAMP
);

-- Gate Meeting Participants
CREATE TABLE gate_meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES organizational_roles(id),
    attendance_status VARCHAR(50) DEFAULT 'invited' CHECK (attendance_status IN ('invited','accepted','declined','tentative','attended','absent')),
    is_required BOOLEAN DEFAULT false,
    is_chair BOOLEAN DEFAULT false,
    is_scribe BOOLEAN DEFAULT false,
    invitation_sent_at TIMESTAMP,
    response_received_at TIMESTAMP,
    reminder_sent_at TIMESTAMP,
    participation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meeting Action Items
CREATE TABLE gate_meeting_action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled','deferred')),
    assigned_to UUID REFERENCES users(id),
    assigned_role_id UUID REFERENCES organizational_roles(id),
    due_date DATE,
    completed_date DATE,
    completion_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meeting Dependencies
CREATE TABLE gate_meeting_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    depends_on_gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'prerequisite' CHECK (dependency_type IN ('prerequisite','parallel','successor')),
    is_blocking BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meeting Templates
CREATE TABLE gate_meeting_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_type_id UUID REFERENCES gate_meeting_types(id),
    template_name VARCHAR(255) NOT NULL,
    agenda_template TEXT,
    required_documents JSONB,
    standard_participants JSONB,
    estimated_duration INTEGER,
    requires_preparation_meeting BOOLEAN DEFAULT false,
    preparation_lead_time_days INTEGER DEFAULT 14,
    materials_deadline_days INTEGER DEFAULT 2,
    standard_agenda_items JSONB,
    key_decision_points JSONB,
    typical_outcomes JSONB,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meeting Workflow States
CREATE TABLE gate_meeting_workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    current_state VARCHAR(100) NOT NULL,
    previous_state VARCHAR(100),
    next_possible_states JSONB,
    state_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    state_entered_by UUID REFERENCES users(id),
    state_notes TEXT,
    auto_transition_date DATE,
    auto_transition_to_state VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fiscal Year Events
CREATE TABLE fiscal_year_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    end_date DATE,
    fiscal_year VARCHAR(10) NOT NULL,
    fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_month INTEGER CHECK (fiscal_month BETWEEN 1 AND 12),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(100),
    is_deadline BOOLEAN DEFAULT false,
    is_milestone BOOLEAN DEFAULT false,
    project_id UUID REFERENCES projects(id),
    gate_meeting_id UUID REFERENCES gate_meetings(id),
    color_code VARCHAR(7),
    icon VARCHAR(50),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for enhanced gate meeting schema
CREATE INDEX idx_gate_meetings_project_id ON gate_meetings(project_id);
CREATE INDEX idx_gate_meetings_planned_date ON gate_meetings(planned_date);
CREATE INDEX idx_gate_meetings_fiscal_year ON gate_meetings(fiscal_year);
CREATE INDEX idx_gate_meetings_status_id ON gate_meetings(status_id);
CREATE INDEX idx_gate_meeting_participants_meeting_id ON gate_meeting_participants(gate_meeting_id);
CREATE INDEX idx_gate_meeting_participants_user_id ON gate_meeting_participants(user_id);
CREATE INDEX idx_gate_meeting_action_items_meeting_id ON gate_meeting_action_items(gate_meeting_id);
CREATE INDEX idx_gate_meeting_action_items_assigned_to ON gate_meeting_action_items(assigned_to);
CREATE INDEX idx_fiscal_year_events_date ON fiscal_year_events(event_date);
CREATE INDEX idx_fiscal_year_events_fiscal_year ON fiscal_year_events(fiscal_year);
CREATE INDEX idx_fiscal_year_events_project_id ON fiscal_year_events(project_id);

-- Functions to compute fiscal year components
CREATE OR REPLACE FUNCTION get_fiscal_year(input_date DATE)
RETURNS VARCHAR(10) AS $$
BEGIN
    IF EXTRACT(MONTH FROM input_date) >= 4 THEN
        RETURN EXTRACT(YEAR FROM input_date)::TEXT || '-' || RIGHT((EXTRACT(YEAR FROM input_date) + 1)::TEXT, 2);
    ELSE
        RETURN (EXTRACT(YEAR FROM input_date) - 1)::TEXT || '-' || RIGHT(EXTRACT(YEAR FROM input_date)::TEXT, 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_fiscal_quarter(input_date DATE)
RETURNS INTEGER AS $$
DECLARE
    month_num INTEGER;
BEGIN
    month_num := EXTRACT(MONTH FROM input_date);
    IF month_num >= 4 AND month_num <= 6 THEN
        RETURN 1;
    ELSIF month_num >= 7 AND month_num <= 9 THEN
        RETURN 2;
    ELSIF month_num >= 10 AND month_num <= 12 THEN
        RETURN 3;
    ELSE
        RETURN 4;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_fiscal_month(input_date DATE)
RETURNS INTEGER AS $$
DECLARE
    calendar_month INTEGER;
BEGIN
    calendar_month := EXTRACT(MONTH FROM input_date);
    IF calendar_month >= 4 THEN
        RETURN calendar_month - 3;
    ELSE
        RETURN calendar_month + 9;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to set fiscal year fields on gate meetings and fiscal events
CREATE OR REPLACE FUNCTION set_fiscal_year_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.planned_date IS NOT NULL THEN
        NEW.fiscal_year := get_fiscal_year(NEW.planned_date);
        NEW.fiscal_quarter := get_fiscal_quarter(NEW.planned_date);
        NEW.fiscal_month := get_fiscal_month(NEW.planned_date);
    END IF;
    IF NEW.event_date IS NOT NULL THEN
        NEW.fiscal_year := get_fiscal_year(NEW.event_date);
        NEW.fiscal_quarter := get_fiscal_quarter(NEW.event_date);
        NEW.fiscal_month := get_fiscal_month(NEW.event_date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply fiscal year triggers
CREATE TRIGGER gate_meetings_fiscal_year_trigger
    BEFORE INSERT OR UPDATE ON gate_meetings
    FOR EACH ROW EXECUTE FUNCTION set_fiscal_year_fields();

CREATE TRIGGER fiscal_year_events_fiscal_year_trigger
    BEFORE INSERT OR UPDATE ON fiscal_year_events
    FOR EACH ROW EXECUTE FUNCTION set_fiscal_year_fields();

-- Apply updated_at triggers to enhanced tables
CREATE TRIGGER update_gate_meetings_updated_at 
    BEFORE UPDATE ON gate_meetings FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gate_meeting_participants_updated_at 
    BEFORE UPDATE ON gate_meeting_participants FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gate_meeting_action_items_updated_at 
    BEFORE UPDATE ON gate_meeting_action_items FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gate_meeting_templates_updated_at 
    BEFORE UPDATE ON gate_meeting_templates FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fiscal_year_events_updated_at 
    BEFORE UPDATE ON fiscal_year_events FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply audit triggers to enhanced gate meeting tables
CREATE TRIGGER audit_gate_meetings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gate_meetings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_gate_meeting_participants_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gate_meeting_participants
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_gate_meeting_action_items_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gate_meeting_action_items
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create dashboard and reporting views
CREATE OR REPLACE VIEW gate_meeting_dashboard AS
SELECT 
    gm.id,
    gm.project_id,
    p.project_name,
    p.cpd_number,
    gmt.name as meeting_type,
    gms.name as status,
    gms.color_code,
    gm.planned_date,
    gm.actual_date,
    gm.fiscal_year,
    gm.fiscal_quarter,
    gm.decision,
    gm.requires_adm_attendance,
    gm.requires_ed_attendance,
    COUNT(gmp.id) as participant_count,
    COUNT(CASE WHEN gmp.attendance_status = 'attended' THEN 1 END) as attended_count,
    COUNT(gmai.id) as action_item_count,
    COUNT(CASE WHEN gmai.status = 'completed' THEN 1 END) as completed_action_items
FROM gate_meetings gm
JOIN projects p ON gm.project_id = p.id
JOIN gate_meeting_types gmt ON gm.gate_meeting_type_id = gmt.id
JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
LEFT JOIN gate_meeting_participants gmp ON gm.id = gmp.gate_meeting_id
LEFT JOIN gate_meeting_action_items gmai ON gm.id = gmai.gate_meeting_id
GROUP BY gm.id, p.project_name, p.cpd_number, gmt.name, gms.name, gms.color_code;

CREATE OR REPLACE VIEW upcoming_gate_meetings AS
SELECT 
    gm.*,
    p.project_name,
    p.cpd_number,
    gmt.name as meeting_type,
    gms.name as status,
    EXTRACT(DAYS FROM (gm.planned_date - CURRENT_DATE)) as days_until_meeting
FROM gate_meetings gm
JOIN projects p ON gm.project_id = p.id
JOIN gate_meeting_types gmt ON gm.gate_meeting_type_id = gmt.id
JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
WHERE gm.planned_date >= CURRENT_DATE
    AND gms.name NOT IN ('Completed','Cancelled','Approved','Rejected')
ORDER BY gm.planned_date ASC;

CREATE OR REPLACE VIEW fiscal_year_calendar AS
SELECT 
    'gate_meeting' as event_type,
    gm.id as event_id,
    gm.meeting_title as title,
    gm.planned_date as event_date,
    gm.planned_date as end_date,
    gm.fiscal_year,
    gm.fiscal_quarter,
    gms.color_code,
    p.project_name,
    gmt.name as meeting_type
FROM gate_meetings gm
JOIN projects p ON gm.project_id = p.id
JOIN gate_meeting_types gmt ON gm.gate_meeting_type_id = gmt.id
JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
UNION ALL
SELECT 
    'fiscal_event' as event_type,
    fye.id as event_id,
    fye.event_title as title,
    fye.event_date,
    COALESCE(fye.end_date, fye.event_date) as end_date,
    fye.fiscal_year,
    fye.fiscal_quarter,
    fye.color_code,
    COALESCE(p.project_name, 'General') as project_name,
    fye.event_type as meeting_type
FROM fiscal_year_events fye
LEFT JOIN projects p ON fye.project_id = p.id
ORDER BY event_date;

-- ===========================================
-- Project Wizard and Templates (UUID based)
-- ===========================================

CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    default_budget DECIMAL(15,2),
    estimated_duration INTEGER,
    required_roles TEXT[],
    template_data JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_wizard_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_wizard_step_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL REFERENCES project_wizard_sessions(session_id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL,
    step_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, step_id)
);

-- Apply updated_at triggers to wizard tables
CREATE TRIGGER update_project_templates_updated_at 
    BEFORE UPDATE ON project_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_wizard_sessions_updated_at 
    BEFORE UPDATE ON project_wizard_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_wizard_step_data_updated_at 
    BEFORE UPDATE ON project_wizard_step_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Contracts and Financial Tables
-- ===========================================

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    original_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contract_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Link back to the contract
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    -- Duplicate the project_id from the parent contract for easier filtering
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    -- Monetary amount of the payment
    payment_amount DECIMAL(15,2) NOT NULL,
    -- Date the payment was made
    payment_date DATE NOT NULL,
    -- Status of the payment ('paid', 'pending', 'cancelled', etc.)
    status VARCHAR(50) DEFAULT 'paid',
    -- Optional source reference or invoice/cheque number
    source_ref VARCHAR(100),
    -- Payment type (e.g., EFT, cheque, credit) if provided
    payment_type VARCHAR(50),
    -- Description or memo for the payment
    description TEXT,
    -- User who created/recorded the payment
    created_by UUID REFERENCES users(id),
    -- User who approved the payment (if approvals are used)
    approved_by UUID REFERENCES users(id),
    -- Timestamp of approval
    approved_at TIMESTAMP,
    -- Any additional notes
    notes TEXT,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(15,2),
    from_category VARCHAR(100),
    to_category VARCHAR(100),
    transfer_date DATE,
    -- Status of the transfer ('pending','approved','rejected')
    status VARCHAR(50) DEFAULT 'pending',
    -- Approval metadata
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    gate_meeting_id UUID REFERENCES gate_meetings(id),
    status VARCHAR(50) DEFAULT 'pending',
    current_step INTEGER,
    initiated_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_configs (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Apply updated_at triggers to financial and config tables
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_payments_updated_at BEFORE UPDATE ON contract_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_transfers_updated_at BEFORE UPDATE ON budget_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON approval_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply audit triggers to contracts and related tables
CREATE TRIGGER audit_contracts_trigger AFTER INSERT OR UPDATE OR DELETE ON contracts FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_contract_payments_trigger AFTER INSERT OR UPDATE OR DELETE ON contract_payments FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_budget_transfers_trigger AFTER INSERT OR UPDATE OR DELETE ON budget_transfers FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_approval_workflows_trigger AFTER INSERT OR UPDATE OR DELETE ON approval_workflows FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_notifications_trigger AFTER INSERT OR UPDATE OR DELETE ON notifications FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_system_configs_trigger AFTER INSERT OR UPDATE OR DELETE ON system_configs FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();



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

-- =====================================================
-- FINANCIAL MANAGEMENT SCHEMA (UUID VERSION)
-- These tables are used by the budget and approval controllers.
-- They replace the integer-based tables from financial_management_schema.sql.
-- =====================================================

-- Ensure any legacy financial tables are dropped to avoid conflicts
DROP TABLE IF EXISTS project_budgets CASCADE;
DROP TABLE IF EXISTS budget_categories CASCADE;
DROP TABLE IF EXISTS budget_entries CASCADE;
DROP TABLE IF EXISTS budget_transfers CASCADE;
DROP TABLE IF EXISTS budget_approvals CASCADE;
DROP TABLE IF EXISTS budget_audit_trail CASCADE;
DROP TABLE IF EXISTS approval_notifications CASCADE;

-- Project Budgets: overarching budget per project and version
CREATE TABLE project_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_budget DECIMAL(15,2) NOT NULL,
    fiscal_year VARCHAR(10) NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Draft',
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, version)
);

-- Budget Categories: allocation buckets under a budget
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
    category_name VARCHAR(255) NOT NULL,
    category_code VARCHAR(50),
    allocated_amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Entries: expenses and commitments
CREATE TABLE budget_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    entry_type VARCHAR(50) NOT NULL, -- Expense, Commitment, Adjustment
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Paid, Cancelled
    reference_number VARCHAR(100),
    vendor_id UUID REFERENCES vendors(id),
    invoice_number VARCHAR(100),
    due_date DATE,
    paid_date DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Transfers: moving funds between categories
CREATE TABLE budget_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
    from_category_id UUID NOT NULL REFERENCES budget_categories(id),
    to_category_id UUID NOT NULL REFERENCES budget_categories(id),
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT NOT NULL,
    transferred_by UUID NOT NULL REFERENCES users(id),
    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Approvals: approval workflow for budgets
CREATE TABLE budget_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
    approval_level INTEGER DEFAULT 1,
    approver_id UUID REFERENCES users(id),
    requested_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Escalated
    comments TEXT,
    urgency VARCHAR(50) DEFAULT 'Normal',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

-- Budget Audit Trail: change history for budgets and entries
CREATE TABLE budget_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES budget_entries(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    amount DECIMAL(15,2),
    performed_by UUID NOT NULL REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Approval Notifications: notifications for approvers
CREATE TABLE approval_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_id UUID NOT NULL REFERENCES budget_approvals(id) ON DELETE CASCADE,
    recipient_role VARCHAR(100) NOT NULL,
    recipient_user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'Approval Request',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for financial tables
CREATE INDEX idx_project_budgets_project_id ON project_budgets(project_id);
CREATE INDEX idx_project_budgets_status ON project_budgets(status);
CREATE INDEX idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX idx_budget_entries_budget_id ON budget_entries(budget_id);
CREATE INDEX idx_budget_entries_category_id ON budget_entries(category_id);
CREATE INDEX idx_budget_entries_status ON budget_entries(status);
CREATE INDEX idx_budget_transfers_budget_id ON budget_transfers(budget_id);
CREATE INDEX idx_budget_transfers_status ON budget_transfers(status);
CREATE INDEX idx_budget_approvals_budget_id ON budget_approvals(budget_id);
CREATE INDEX idx_budget_approvals_status ON budget_approvals(status);
CREATE INDEX idx_budget_audit_trail_budget_id ON budget_audit_trail(budget_id);
CREATE INDEX idx_approval_notifications_approval_id ON approval_notifications(approval_id);
CREATE INDEX idx_approval_notifications_recipient_user_id ON approval_notifications(recipient_user_id);

-- Attach updated_at triggers to financial tables
CREATE TRIGGER update_project_budgets_updated_at BEFORE UPDATE ON project_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_entries_updated_at BEFORE UPDATE ON budget_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_transfers_updated_at BEFORE UPDATE ON budget_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_approvals_updated_at BEFORE UPDATE ON budget_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_audit_trail_updated_at BEFORE UPDATE ON budget_audit_trail FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Attach audit triggers to financial tables
CREATE TRIGGER audit_project_budgets AFTER INSERT OR UPDATE OR DELETE ON project_budgets FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_budget_categories AFTER INSERT OR UPDATE OR DELETE ON budget_categories FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_budget_entries AFTER INSERT OR UPDATE OR DELETE ON budget_entries FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_budget_transfers AFTER INSERT OR UPDATE OR DELETE ON budget_transfers FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_budget_approvals AFTER INSERT OR UPDATE OR DELETE ON budget_approvals FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_budget_audit_trail AFTER INSERT OR UPDATE OR DELETE ON budget_audit_trail FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ===================================================
-- VENDOR MANAGEMENT SCHEMA (UUID VERSION)
-- ===================================================

-- Drop existing vendor management tables to avoid duplication
DROP TABLE IF EXISTS vendor_registrations CASCADE;
DROP TABLE IF EXISTS vendor_documents CASCADE;
DROP TABLE IF EXISTS vendor_portal_sessions CASCADE;
DROP TABLE IF EXISTS qualification_criteria CASCADE;
DROP TABLE IF EXISTS vendor_assessments CASCADE;
DROP TABLE IF EXISTS vendor_qualification_scores CASCADE;
DROP TABLE IF EXISTS vendor_performance_metrics CASCADE;
DROP TABLE IF EXISTS vendor_ratings CASCADE;
DROP TABLE IF EXISTS performance_reviews CASCADE;
DROP TABLE IF EXISTS contract_templates CASCADE;
DROP TABLE IF EXISTS contract_renewals CASCADE;

-- vendor_registrations: self-service vendor registration table
CREATE TABLE vendor_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    business_number VARCHAR(50) UNIQUE NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(10),
    website VARCHAR(255),
    business_type VARCHAR(100),
    capabilities JSONB,
    certifications JSONB,
    password_hash VARCHAR(255) NOT NULL,
    registration_status VARCHAR(50) DEFAULT 'Pending Review',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    approval_comments TEXT,
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- vendor_documents: uploaded vendor documents
CREATE TABLE vendor_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendor_registrations(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending Review',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- vendor_portal_sessions: vendor login sessions
CREATE TABLE vendor_portal_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendor_registrations(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- qualification_criteria: qualification criteria definitions
CREATE TABLE qualification_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    criteria_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.0,
    max_score INTEGER NOT NULL DEFAULT 100,
    is_required BOOLEAN DEFAULT false,
    evaluation_method VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- vendor_assessments: vendor qualification assessments
CREATE TABLE vendor_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendor_registrations(id) ON DELETE CASCADE,
    assessed_by UUID NOT NULL REFERENCES users(id),
    overall_score DECIMAL(8,2) NOT NULL,
    max_score DECIMAL(8,2) NOT NULL,
    qualification_status VARCHAR(50) NOT NULL,
    overall_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- vendor_qualification_scores: detailed criteria scores for assessments
CREATE TABLE vendor_qualification_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES vendor_assessments(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES qualification_criteria(id),
    criteria_name VARCHAR(255) NOT NULL,
    score DECIMAL(8,2) NOT NULL,
    max_score DECIMAL(8,2) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- vendor_performance_metrics: metrics captured per vendor per project
CREATE TABLE vendor_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(50),
    measurement_date DATE NOT NULL,
    measured_by UUID REFERENCES users(id),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- vendor_ratings: overall ratings given to vendors on projects
CREATE TABLE vendor_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),
    rated_by UUID NOT NULL REFERENCES users(id),
    overall_rating DECIMAL(3,2) NOT NULL CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 1.0 AND quality_rating <= 5.0),
    timeliness_rating DECIMAL(3,2) CHECK (timeliness_rating >= 1.0 AND timeliness_rating <= 5.0),
    communication_rating DECIMAL(3,2) CHECK (communication_rating >= 1.0 AND communication_rating <= 5.0),
    value_rating DECIMAL(3,2) CHECK (value_rating >= 1.0 AND value_rating <= 5.0),
    comments TEXT,
    rating_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- performance_reviews: periodic reviews of vendor performance
CREATE TABLE performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    reviewed_by UUID NOT NULL REFERENCES users(id),
    overall_performance_score DECIMAL(5,2),
    strengths TEXT,
    areas_for_improvement TEXT,
    action_items TEXT,
    next_review_date DATE,
    review_status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extend contracts table to include vendor management details.
-- Add additional columns to contracts and adjust default status.
ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS contract_number VARCHAR(100) UNIQUE,
    ADD COLUMN IF NOT EXISTS contract_title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contract_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS contract_value DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
    ADD COLUMN IF NOT EXISTS deliverables TEXT,
    ADD COLUMN IF NOT EXISTS payment_terms TEXT;

ALTER TABLE contracts
    ALTER COLUMN status SET DEFAULT 'Draft';

-- Additional fields used by reporting and financial summaries
ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS contract_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS original_amount DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS current_amount DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS holdback_amount DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS balance_remaining DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- contract_templates: templates for generating contracts
CREATE TABLE contract_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    template_content TEXT NOT NULL,
    template_variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- contract_renewals: renewal information for contracts
CREATE TABLE contract_renewals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    renewal_date DATE NOT NULL,
    new_end_date DATE NOT NULL,
    renewal_value DECIMAL(15,2),
    renewal_terms TEXT,
    renewed_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vendor management
CREATE INDEX idx_vendor_registrations_email ON vendor_registrations(contact_email);
CREATE INDEX idx_vendor_registrations_status ON vendor_registrations(registration_status);
CREATE INDEX idx_vendor_registrations_business_number ON vendor_registrations(business_number);
CREATE INDEX idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_type ON vendor_documents(document_type);
CREATE INDEX idx_vendor_portal_sessions_vendor_id ON vendor_portal_sessions(vendor_id);
CREATE INDEX idx_vendor_portal_sessions_token ON vendor_portal_sessions(session_token);
CREATE INDEX idx_qualification_criteria_category ON qualification_criteria(category);
CREATE INDEX idx_vendor_assessments_vendor_id ON vendor_assessments(vendor_id);
CREATE INDEX idx_vendor_qualification_scores_assessment_id ON vendor_qualification_scores(assessment_id);
CREATE INDEX idx_vendor_performance_metrics_vendor_id ON vendor_performance_metrics(vendor_id);
CREATE INDEX idx_vendor_performance_metrics_project_id ON vendor_performance_metrics(project_id);
CREATE INDEX idx_vendor_ratings_vendor_id ON vendor_ratings(vendor_id);
CREATE INDEX idx_vendor_ratings_project_id ON vendor_ratings(project_id);
CREATE INDEX idx_performance_reviews_vendor_id ON performance_reviews(vendor_id);
CREATE INDEX idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_number ON contracts(contract_number);
CREATE INDEX idx_contract_renewals_contract_id ON contract_renewals(contract_id);

-- Triggers for updated_at timestamps on vendor management tables
CREATE TRIGGER update_vendor_registrations_updated_at BEFORE UPDATE ON vendor_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qualification_criteria_updated_at BEFORE UPDATE ON qualification_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_renewals_updated_at BEFORE UPDATE ON contract_renewals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers for vendor management tables
CREATE TRIGGER audit_vendor_registrations AFTER INSERT OR UPDATE OR DELETE ON vendor_registrations FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_vendor_documents AFTER INSERT OR UPDATE OR DELETE ON vendor_documents FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_vendor_portal_sessions AFTER INSERT OR UPDATE OR DELETE ON vendor_portal_sessions FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_qualification_criteria AFTER INSERT OR UPDATE OR DELETE ON qualification_criteria FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_vendor_assessments AFTER INSERT OR UPDATE OR DELETE ON vendor_assessments FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_vendor_qualification_scores AFTER INSERT OR UPDATE OR DELETE ON vendor_qualification_scores FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_vendor_performance_metrics AFTER INSERT OR UPDATE OR DELETE ON vendor_performance_metrics FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_vendor_ratings AFTER INSERT OR UPDATE OR DELETE ON vendor_ratings FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_performance_reviews AFTER INSERT OR UPDATE OR DELETE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_contract_templates AFTER INSERT OR UPDATE OR DELETE ON contract_templates FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_contract_renewals AFTER INSERT OR UPDATE OR DELETE ON contract_renewals FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

