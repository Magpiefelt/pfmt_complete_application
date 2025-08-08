-- Migration 007: Fix Project Wizard Schema UUID Issues
-- This migration fixes the duplicate table definitions and ensures UUID consistency

-- Drop existing SERIAL-based wizard tables if they exist
DROP TABLE IF EXISTS project_wizard_step_data CASCADE;
DROP TABLE IF EXISTS project_wizard_sessions CASCADE;
DROP TABLE IF EXISTS project_templates CASCADE;

-- Recreate wizard tables with UUID primary keys (consistent with the rest of the schema)
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
    template_id UUID REFERENCES project_templates(id),
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

-- Create indexes for performance
CREATE INDEX idx_project_templates_category ON project_templates(category);
CREATE INDEX idx_project_templates_is_active ON project_templates(is_active);
CREATE INDEX idx_project_wizard_sessions_user_id ON project_wizard_sessions(user_id);
CREATE INDEX idx_project_wizard_sessions_session_id ON project_wizard_sessions(session_id);
CREATE INDEX idx_project_wizard_step_data_session_id ON project_wizard_step_data(session_id);

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

-- Add missing columns to projects table if they don't exist
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

