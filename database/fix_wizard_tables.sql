-- Fix for missing project wizard tables
-- This script adds the missing tables that are causing the 500 errors

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
    created_by INTEGER -- Note: removed REFERENCES users(id) to avoid FK issues
);

-- Project Wizard Sessions (temporary storage during wizard process)
CREATE TABLE IF NOT EXISTS project_wizard_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL, -- Note: removed REFERENCES users(id) to avoid FK issues
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

-- Insert default project templates
INSERT INTO project_templates (name, description, category, default_budget, estimated_duration, required_roles, template_data, created_by) VALUES
('Standard Infrastructure Project', 'Standard template for infrastructure projects', 'Infrastructure', 1000000.00, 365, ARRAY['Project Manager', 'Engineer', 'Contractor'], '{"phases": ["Planning", "Design", "Construction", "Completion"], "gates": ["Gate 1", "Gate 2", "Gate 3", "Gate 4"]}', 1),
('IT System Implementation', 'Template for IT system implementations', 'Technology', 500000.00, 180, ARRAY['Project Manager', 'System Analyst', 'Developer'], '{"phases": ["Analysis", "Design", "Development", "Testing", "Deployment"], "gates": ["Requirements Gate", "Design Gate", "Testing Gate", "Go-Live Gate"]}', 1),
('Building Renovation', 'Template for building renovation projects', 'Construction', 2000000.00, 270, ARRAY['Project Manager', 'Architect', 'Contractor', 'Safety Officer'], '{"phases": ["Assessment", "Planning", "Renovation", "Inspection"], "gates": ["Assessment Gate", "Planning Gate", "Construction Gate", "Completion Gate"]}', 1),
('Research & Development', 'Template for R&D projects', 'Research', 300000.00, 540, ARRAY['Project Manager', 'Researcher', 'Analyst'], '{"phases": ["Research", "Development", "Testing", "Documentation"], "gates": ["Research Gate", "Development Gate", "Testing Gate", "Publication Gate"]}', 1)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_user_id ON project_wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_session_id ON project_wizard_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_step_data_session_id ON project_wizard_step_data(session_id);
CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_project_templates_is_active ON project_templates(is_active);

-- Verify tables were created
SELECT 'project_templates' as table_name, count(*) as row_count FROM project_templates
UNION ALL
SELECT 'project_wizard_sessions' as table_name, count(*) as row_count FROM project_wizard_sessions
UNION ALL
SELECT 'project_wizard_step_data' as table_name, count(*) as row_count FROM project_wizard_step_data;

