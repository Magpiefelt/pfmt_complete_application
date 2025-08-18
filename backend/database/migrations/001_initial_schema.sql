-- Migration: Initial database schema
-- Created: 2025-01-18
-- Description: Create the basic table structure for PFMT application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'pm',
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create capital_plan_lines table
CREATE TABLE IF NOT EXISTS capital_plan_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create client_ministries table
CREATE TABLE IF NOT EXISTS client_ministries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create school_jurisdictions table
CREATE TABLE IF NOT EXISTS school_jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_status VARCHAR(50),
    project_status VARCHAR(50) DEFAULT 'active',
    project_phase VARCHAR(50),
    modified_by UUID REFERENCES users(id),
    project_name VARCHAR(255) NOT NULL,
    capital_plan_line_id UUID REFERENCES capital_plan_lines(id),
    approval_year VARCHAR(10),
    cpd_number VARCHAR(50),
    project_category VARCHAR(100),
    funded_to_complete VARCHAR(50),
    client_ministry_id UUID REFERENCES client_ministries(id),
    school_jurisdiction_id UUID REFERENCES school_jurisdictions(id),
    pfmt_file_id UUID,
    project_type VARCHAR(100),
    delivery_type VARCHAR(100),
    delivery_method VARCHAR(100),
    program VARCHAR(100),
    geographic_region VARCHAR(100),
    project_description TEXT,
    number_of_beds INTEGER,
    total_opening_capacity INTEGER,
    capacity_at_full_build_out INTEGER,
    is_charter_school BOOLEAN DEFAULT false,
    square_meters DECIMAL(10,2),
    number_of_jobs INTEGER,
    estimated_budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pfmt_files table
CREATE TABLE IF NOT EXISTS pfmt_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    project_id VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_teams table
CREATE TABLE IF NOT EXISTS project_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    executive_director_id UUID REFERENCES users(id),
    director_id UUID REFERENCES users(id),
    sr_project_manager_id UUID REFERENCES users(id),
    project_manager_id UUID REFERENCES users(id),
    project_coordinator_id UUID REFERENCES users(id),
    contract_services_analyst_id UUID REFERENCES users(id),
    program_integration_analyst_id UUID REFERENCES users(id),
    additional_members TEXT,
    historical_members TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_versions table
CREATE TABLE IF NOT EXISTS project_versions (
    id SERIAL PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_current BOOLEAN DEFAULT false,
    UNIQUE(project_id, version_number)
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    planned_start DATE,
    planned_finish DATE,
    actual_start DATE,
    actual_finish DATE,
    gate_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_project_status ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_geographic_region ON projects(geographic_region);
CREATE INDEX IF NOT EXISTS idx_projects_client_ministry ON projects(client_ministry_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_is_current ON project_versions(is_current);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);

-- Add comments to document the schema
COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE projects IS 'Main projects table with comprehensive project information';
COMMENT ON TABLE project_versions IS 'Version history for project data changes';
COMMENT ON TABLE milestones IS 'Project milestones and gates';
COMMENT ON TABLE project_teams IS 'Project team assignments and roles';


