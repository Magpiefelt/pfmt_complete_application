-- PFMT Database Fix Script
-- This script creates all missing tables that are causing the application errors
-- Run this script to fix the database issues

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create missing gate meeting related tables (required for upcoming_gate_meetings view)

-- Gate meeting types
CREATE TABLE IF NOT EXISTS gate_meeting_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate meeting statuses
CREATE TABLE IF NOT EXISTS gate_meeting_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate meetings table (required for upcoming_gate_meetings view)
CREATE TABLE IF NOT EXISTS gate_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    gate_meeting_type_id INTEGER NOT NULL REFERENCES gate_meeting_types(id),
    status_id INTEGER NOT NULL REFERENCES gate_meeting_statuses(id),
    meeting_title VARCHAR(255) NOT NULL,
    planned_date DATE NOT NULL,
    actual_date DATE,
    location VARCHAR(255),
    agenda TEXT,
    minutes TEXT,
    decision TEXT,
    next_steps TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT fk_gate_meetings_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project Templates (from 006_wizard_enhancements.sql)
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
    created_by UUID
);

-- Project Wizard Sessions (from 006_wizard_enhancements.sql)
CREATE TABLE IF NOT EXISTS project_wizard_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    current_step INTEGER DEFAULT 1,
    template_id INTEGER REFERENCES project_templates(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Wizard Step Data (from 006_wizard_enhancements.sql)
CREATE TABLE IF NOT EXISTS project_wizard_step_data (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES project_wizard_sessions(session_id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL,
    step_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, step_id)
);

-- Insert default gate meeting types
INSERT INTO gate_meeting_types (name, description) VALUES
('Gate 1', 'Project Initiation Gate'),
('Gate 2', 'Design Approval Gate'),
('Gate 3', 'Construction Start Gate'),
('Gate 4', 'Project Completion Gate'),
('Gate 5', 'Post-Implementation Review Gate')
ON CONFLICT (name) DO NOTHING;

-- Insert default gate meeting statuses
INSERT INTO gate_meeting_statuses (name, description) VALUES
('Scheduled', 'Meeting is scheduled'),
('In Progress', 'Meeting is currently happening'),
('Completed', 'Meeting has been completed'),
('Cancelled', 'Meeting has been cancelled'),
('Approved', 'Gate has been approved'),
('Rejected', 'Gate has been rejected'),
('Pending', 'Awaiting decision')
ON CONFLICT (name) DO NOTHING;

-- Create the upcoming_gate_meetings view
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

-- Insert default project templates (only if we have users)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gate_meetings_project_id ON gate_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_gate_meetings_planned_date ON gate_meetings(planned_date);
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_user_id ON project_wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_session_id ON project_wizard_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_step_data_session_id ON project_wizard_step_data(session_id);

-- Verify tables were created
DO $$
BEGIN
    -- Check if all required tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_templates') THEN
        RAISE NOTICE '✅ project_templates table created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create project_templates table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_wizard_sessions') THEN
        RAISE NOTICE '✅ project_wizard_sessions table created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create project_wizard_sessions table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gate_meetings') THEN
        RAISE NOTICE '✅ gate_meetings table created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create gate_meetings table';
    END IF;
    
    -- Check if view exists
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'upcoming_gate_meetings') THEN
        RAISE NOTICE '✅ upcoming_gate_meetings view created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create upcoming_gate_meetings view';
    END IF;
    
    RAISE NOTICE '🎉 All database fixes applied successfully!';
END $$;

