-- Project Wizard Database Schema (Fixed for UUID compatibility)
-- This file creates the missing tables required for the project wizard functionality

-- Project Templates Table
CREATE TABLE IF NOT EXISTS project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    default_budget DECIMAL(15,2),
    estimated_duration INTEGER, -- in days
    required_roles TEXT[], -- array of required roles
    template_data JSONB, -- template-specific configuration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Wizard Sessions Table
CREATE TABLE IF NOT EXISTS project_wizard_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Wizard Step Data Table
CREATE TABLE IF NOT EXISTS project_wizard_step_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL REFERENCES project_wizard_sessions(session_id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL,
    step_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, step_id)
);

-- Project Versions Table (if not exists)
CREATE TABLE IF NOT EXISTS project_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    total_approved_funding DECIMAL(15,2),
    current_budget DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'Draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, version_number)
);

-- Project Team Assignments Table (if not exists)
CREATE TABLE IF NOT EXISTS project_team_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    removed_at TIMESTAMP NULL,
    removed_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true
);

-- Gate Meeting Workflow States Table (if not exists)
CREATE TABLE IF NOT EXISTS gate_meeting_workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    current_state VARCHAR(100) NOT NULL,
    previous_state VARCHAR(100),
    state_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entered_by UUID REFERENCES users(id),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_user_id ON project_wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_session_id ON project_wizard_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_step_data_session_id ON project_wizard_step_data(session_id);
CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_project_templates_active ON project_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_project_team_assignments_project_id ON project_team_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_assignments_user_id ON project_team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_gate_meeting_workflow_states_project_id ON gate_meeting_workflow_states(project_id);

-- Insert sample project templates
INSERT INTO project_templates (name, description, category, default_budget, estimated_duration, required_roles, template_data, is_active) VALUES
('School Construction', 'New school building construction project', 'Education', 15000000.00, 730, ARRAY['Project Manager', 'Construction Manager', 'Architect'], '{"phases": ["Planning", "Design", "Construction", "Commissioning"], "milestones": ["Site Preparation", "Foundation", "Structure", "Interior", "Completion"]}', true),

('Highway Expansion', 'Highway widening and improvement project', 'Transportation', 25000000.00, 1095, ARRAY['Project Manager', 'Civil Engineer', 'Environmental Specialist'], '{"phases": ["Environmental Assessment", "Design", "Construction"], "milestones": ["Environmental Approval", "Design Completion", "Construction Start", "Phase 1 Complete", "Final Completion"]}', true),

('Hospital Renovation', 'Hospital facility renovation and modernization', 'Healthcare', 8000000.00, 545, ARRAY['Project Manager', 'Healthcare Planner', 'Construction Manager'], '{"phases": ["Planning", "Design", "Phased Construction"], "milestones": ["Operational Planning", "Design Approval", "Phase 1", "Phase 2", "Commissioning"]}', true),

('Bridge Replacement', 'Bridge replacement and infrastructure upgrade', 'Transportation', 12000000.00, 910, ARRAY['Project Manager', 'Structural Engineer', 'Traffic Coordinator'], '{"phases": ["Assessment", "Design", "Construction"], "milestones": ["Structural Assessment", "Traffic Management Plan", "Demolition", "New Construction", "Opening"]}', true),

('Water Treatment Plant', 'Water treatment facility construction', 'Utilities', 35000000.00, 1460, ARRAY['Project Manager', 'Environmental Engineer', 'Process Engineer'], '{"phases": ["Environmental", "Design", "Construction", "Commissioning"], "milestones": ["Environmental Permits", "Design Completion", "Equipment Installation", "Testing", "Operations"]}', true),

('Community Center', 'Community recreation center construction', 'Community', 5000000.00, 365, ARRAY['Project Manager', 'Architect', 'Community Liaison'], '{"phases": ["Community Consultation", "Design", "Construction"], "milestones": ["Community Input", "Design Approval", "Construction Start", "Interior Completion", "Grand Opening"]}', true);

-- Update the updated_at timestamp function for project_templates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_project_templates_updated_at ON project_templates;
CREATE TRIGGER update_project_templates_updated_at 
    BEFORE UPDATE ON project_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_wizard_sessions_updated_at ON project_wizard_sessions;
CREATE TRIGGER update_project_wizard_sessions_updated_at 
    BEFORE UPDATE ON project_wizard_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_wizard_step_data_updated_at ON project_wizard_step_data;
CREATE TRIGGER update_project_wizard_step_data_updated_at 
    BEFORE UPDATE ON project_wizard_step_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample users if they don't exist (for team assignment)
INSERT INTO users (first_name, last_name, email, username, password_hash, role, is_active, created_at) VALUES
('John', 'Smith', 'john.smith@gov.ab.ca', 'john.smith', '$2b$10$dummy.hash.for.development', 'pm', true, CURRENT_TIMESTAMP),
('Mary', 'Johnson', 'mary.johnson@gov.ab.ca', 'mary.johnson', '$2b$10$dummy.hash.for.development', 'pm', true, CURRENT_TIMESTAMP),
('David', 'Wilson', 'david.wilson@gov.ab.ca', 'david.wilson', '$2b$10$dummy.hash.for.development', 'pmi', true, CURRENT_TIMESTAMP),
('Lisa', 'Brown', 'lisa.brown@gov.ab.ca', 'lisa.brown', '$2b$10$dummy.hash.for.development', 'analyst', true, CURRENT_TIMESTAMP),
('Michael', 'Davis', 'michael.davis@gov.ab.ca', 'michael.davis', '$2b$10$dummy.hash.for.development', 'pm', true, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

