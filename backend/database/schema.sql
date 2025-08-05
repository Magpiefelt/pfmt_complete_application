-- PRS Application Database Schema
-- PostgreSQL Database Schema for Project Reporting Site

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'pm', 'pmi', 'director', 'analyst', 'viewer')),
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Capital Plan Lines lookup table
CREATE TABLE capital_plan_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Ministries lookup table
CREATE TABLE client_ministries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- School Jurisdictions lookup table
CREATE TABLE school_jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PFMT Files lookup table
CREATE TABLE pfmt_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    project_id VARCHAR(100) UNIQUE NOT NULL,
    file_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Project Header fields
    report_status VARCHAR(50) DEFAULT 'update_required' CHECK (report_status IN ('update_required', 'updated_by_team', 'reviewed_by_director', 'reporting_not_required')),
    project_status VARCHAR(50) NOT NULL CHECK (project_status IN ('underway', 'complete', 'on_hold', 'cancelled')),
    project_phase VARCHAR(50) NOT NULL CHECK (project_phase IN ('planning', 'design', 'construction', 'post_construction', 'financial_closeout', 'completed')),
    
    -- System fields
    modified_by UUID REFERENCES users(id),
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reporting_as_of_date DATE,
    director_review_date DATE,
    pfmt_data_date TIMESTAMP,
    archived_date DATE,
    
    -- Project Details - Profile
    project_name VARCHAR(500) NOT NULL,
    capital_plan_line_id UUID REFERENCES capital_plan_lines(id),
    approval_year VARCHAR(20) NOT NULL,
    cpd_number VARCHAR(100) UNIQUE NOT NULL,
    project_category VARCHAR(50) NOT NULL CHECK (project_category IN ('planning_only', 'design_only', 'construction')),
    funded_to_complete VARCHAR(100) NOT NULL CHECK (funded_to_complete IN ('business_case', 'functional_program', 'schematic_design', 'design_development', 'contract_documents', 'construction')),
    client_ministry_id UUID REFERENCES client_ministries(id),
    school_jurisdiction_id UUID REFERENCES school_jurisdictions(id),
    pfmt_file_id UUID REFERENCES pfmt_files(id),
    
    -- Project Details - Delivery
    project_type VARCHAR(50) CHECK (project_type IN ('new_construction', 'renovation', 'expansion', 'replacement')),
    delivery_type VARCHAR(50) CHECK (delivery_type IN ('design_bid_build', 'design_build', 'p3', 'cm_at_risk')),
    specific_delivery_type VARCHAR(50) CHECK (specific_delivery_type IN ('internal_design', 'external_consultant', 'hybrid')),
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('traditional', 'fast_track', 'phased')),
    program VARCHAR(100) CHECK (program IN ('health_facilities', 'learning_facilities', 'government_facilities')),
    geographic_region VARCHAR(50) CHECK (geographic_region IN ('calgary', 'edmonton', 'central', 'north', 'south')),
    
    -- Project Description
    project_description TEXT,
    
    -- Facility-specific fields
    number_of_beds INTEGER,
    total_opening_capacity INTEGER,
    capacity_at_full_build_out INTEGER,
    is_charter_school BOOLEAN DEFAULT false,
    grades_from VARCHAR(10),
    grades_to VARCHAR(10),
    square_meters DECIMAL(12,2),
    number_of_jobs INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Location table
CREATE TABLE project_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Location fields
    location VARCHAR(100),
    municipality VARCHAR(100),
    urban_rural VARCHAR(20),
    project_address TEXT,
    constituency VARCHAR(100),
    
    -- Building information
    building_name VARCHAR(255),
    building_type VARCHAR(100) CHECK (building_type IN ('hospital', 'school', 'office', 'clinic', 'laboratory')),
    building_id VARCHAR(255),
    building_owner VARCHAR(255),
    mla VARCHAR(255),
    
    -- Plan-Block-Lot
    plan VARCHAR(100),
    block VARCHAR(100),
    lot VARCHAR(100),
    
    -- GPS Coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Team table
CREATE TABLE project_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Main team roles
    executive_director_id UUID REFERENCES users(id),
    director_id UUID REFERENCES users(id),
    sr_project_manager_id UUID REFERENCES users(id),
    project_manager_id UUID REFERENCES users(id),
    project_coordinator_id UUID REFERENCES users(id),
    contract_services_analyst_id UUID REFERENCES users(id),
    program_integration_analyst_id UUID REFERENCES users(id),
    
    -- Additional team members (as text for flexibility)
    additional_members TEXT,
    historical_members TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meetings table
CREATE TABLE gate_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    meeting_type VARCHAR(100) NOT NULL,
    meeting_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table for tracking all changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Monthly Reports table
CREATE TABLE monthly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    report_month DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewed', 'approved')),
    submitted_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Status Updates table
CREATE TABLE project_status_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    update_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_projects_project_status ON projects(project_status);
CREATE INDEX idx_projects_project_phase ON projects(project_phase);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_cpd_number ON projects(cpd_number);
CREATE INDEX idx_project_locations_project_id ON project_locations(project_id);
CREATE INDEX idx_project_teams_project_id ON project_teams(project_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_gate_meetings_project_id ON gate_meetings(project_id);
CREATE INDEX idx_monthly_reports_project_id ON monthly_reports(project_id);
CREATE INDEX idx_monthly_reports_report_month ON monthly_reports(report_month);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_locations_updated_at BEFORE UPDATE ON project_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_teams_updated_at BEFORE UPDATE ON project_teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), 
                COALESCE(current_setting('app.current_user_id', true)::UUID, NULL), 
                CURRENT_TIMESTAMP);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true)::UUID, NULL),
                CURRENT_TIMESTAMP);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW),
                COALESCE(current_setting('app.current_user_id', true)::UUID, NULL),
                CURRENT_TIMESTAMP);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for main tables
CREATE TRIGGER audit_projects_trigger
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_project_locations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON project_locations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_project_teams_trigger
    AFTER INSERT OR UPDATE OR DELETE ON project_teams
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

