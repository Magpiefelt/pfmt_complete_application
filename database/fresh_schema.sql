-- PFMT Fresh Database Schema
-- Created: 2025-01-18
-- Description: Complete database schema for PFMT Enhanced Application v2.0.0
-- Replaces all existing migration files with single source of truth

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean reset)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS project_vendors CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with canonical roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin','pmi','director','pm','spm','analyst','executive','vendor')),
    is_active BOOLEAN DEFAULT true,
    password_hash VARCHAR(255), -- For future authentication
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Projects table with workflow status
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    project_description TEXT,
    estimated_budget DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    project_type VARCHAR(100),
    delivery_method VARCHAR(100),
    project_category VARCHAR(100),
    geographic_region VARCHAR(100),
    
    -- Workflow fields
    workflow_status VARCHAR(20) DEFAULT 'initiated' 
        CHECK (workflow_status IN ('initiated','assigned','finalized','active','on_hold','complete','archived')),
    created_by UUID REFERENCES users(id),
    assigned_pm UUID REFERENCES users(id),
    assigned_spm UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    finalized_by UUID REFERENCES users(id),
    finalized_at TIMESTAMPTZ,
    workflow_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional project details (for finalization step)
    detailed_description TEXT,
    risk_assessment TEXT,
    budget_breakdown JSONB,
    
    -- Legacy compatibility fields
    project_status VARCHAR(50) DEFAULT 'active',
    project_phase VARCHAR(50) DEFAULT 'planning',
    cpd_number VARCHAR(100),
    approval_year VARCHAR(4),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project vendors (many-to-many relationship)
CREATE TABLE project_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    role VARCHAR(100), -- e.g., 'contractor', 'consultant', 'supplier'
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, vendor_id, role) -- Prevent duplicate vendor roles per project
);

-- Project milestones
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- e.g., 'design', 'construction', 'review'
    planned_start DATE,
    planned_finish DATE,
    actual_start DATE,
    actual_finish DATE,
    status VARCHAR(50) DEFAULT 'planned',
    description TEXT,
    budget_allocated DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications for workflow handoffs
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(100) NOT NULL, -- e.g., 'project_submitted', 'team_assigned', 'project_finalized'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    payload JSONB, -- Additional data (project_id, etc.)
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for workflow actions
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- e.g., 'project_created', 'team_assigned', 'project_finalized'
    resource_type VARCHAR(100), -- e.g., 'project', 'user'
    resource_id UUID,
    details JSONB, -- Action-specific details
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
-- User indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Project indexes
CREATE INDEX idx_projects_workflow_status ON projects(workflow_status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_assigned_pm ON projects(assigned_pm);
CREATE INDEX idx_projects_assigned_spm ON projects(assigned_spm);
CREATE INDEX idx_projects_assigned_by ON projects(assigned_by);
CREATE INDEX idx_projects_finalized_by ON projects(finalized_by);
CREATE INDEX idx_projects_project_category ON projects(project_category);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Vendor indexes
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_name ON vendors(name);

-- Project vendor indexes
CREATE INDEX idx_project_vendors_project_id ON project_vendors(project_id);
CREATE INDEX idx_project_vendors_vendor_id ON project_vendors(vendor_id);
CREATE INDEX idx_project_vendors_status ON project_vendors(status);

-- Milestone indexes
CREATE INDEX idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX idx_milestones_status ON project_milestones(status);
CREATE INDEX idx_milestones_planned_start ON project_milestones(planned_start);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit log indexes
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX idx_audit_log_resource_id ON audit_log(resource_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Comments for documentation
COMMENT ON TABLE users IS 'System users with canonical role-based access control';
COMMENT ON COLUMN users.role IS 'Canonical roles: admin, pmi, director, pm, spm, analyst, executive, vendor';

COMMENT ON TABLE projects IS 'Projects with multi-step workflow status';
COMMENT ON COLUMN projects.workflow_status IS 'Workflow: initiated → assigned → finalized → active → (on_hold/complete/archived)';
COMMENT ON COLUMN projects.created_by IS 'User who initiated the project (PMI role)';
COMMENT ON COLUMN projects.assigned_pm IS 'Project Manager assigned by Director';
COMMENT ON COLUMN projects.assigned_spm IS 'Senior Project Manager assigned by Director';
COMMENT ON COLUMN projects.assigned_by IS 'Director who assigned the team';
COMMENT ON COLUMN projects.finalized_by IS 'PM/SPM who finalized the project setup';

COMMENT ON TABLE project_vendors IS 'Many-to-many relationship between projects and vendors';
COMMENT ON TABLE project_milestones IS 'Project milestones and deliverables';
COMMENT ON TABLE notifications IS 'System notifications for workflow handoffs';
COMMENT ON TABLE audit_log IS 'Audit trail for all system actions';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_vendors_updated_at BEFORE UPDATE ON project_vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Schema version tracking
CREATE TABLE schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) 
VALUES ('2.0.0', 'Fresh schema for PFMT Enhanced Application');

-- Success message
SELECT 'PFMT Fresh Schema Applied Successfully!' as status;

