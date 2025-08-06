-- Comprehensive fix for PFMT Project Wizard UUID and table issues
-- This script ensures all required tables exist and use proper UUID format

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a default user with UUID if users table is empty
-- This ensures we have at least one user for development
DO $$
BEGIN
    -- Check if users table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- If users table exists but is empty, insert a default user
        IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
            INSERT INTO users (
                id, username, email, first_name, last_name, role, 
                password_hash, is_active, created_at, updated_at
            ) VALUES (
                '550e8400-e29b-41d4-a716-446655440002',
                'devuser',
                'dev.user@gov.ab.ca',
                'Dev',
                'User',
                'PM',
                '$2b$10$dummy.hash.for.development.only',
                true,
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Created default development user with UUID: 550e8400-e29b-41d4-a716-446655440002';
        END IF;
    END IF;
END $$;

-- Project Templates table (ensure it exists)
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
    created_by UUID -- Reference to users.id but without FK constraint for flexibility
);

-- Project Wizard Sessions table (ensure it exists with proper UUID reference)
CREATE TABLE IF NOT EXISTS project_wizard_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL, -- This must be UUID to match users.id
    current_step INTEGER DEFAULT 1,
    template_id INTEGER REFERENCES project_templates(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Wizard Step Data table (ensure it exists)
CREATE TABLE IF NOT EXISTS project_wizard_step_data (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES project_wizard_sessions(session_id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL,
    step_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, step_id)
);

-- Insert default project templates if they don't exist
INSERT INTO project_templates (name, description, category, default_budget, estimated_duration, required_roles, template_data, created_by) 
SELECT * FROM (VALUES
    ('Standard Infrastructure Project', 'Standard template for infrastructure projects', 'Infrastructure', 1000000.00, 365, ARRAY['Project Manager', 'Engineer', 'Contractor'], '{"phases": ["Planning", "Design", "Construction", "Completion"], "gates": ["Gate 1", "Gate 2", "Gate 3", "Gate 4"]}', '550e8400-e29b-41d4-a716-446655440002'),
    ('IT System Implementation', 'Template for IT system implementations', 'Technology', 500000.00, 180, ARRAY['Project Manager', 'System Analyst', 'Developer'], '{"phases": ["Analysis", "Design", "Development", "Testing", "Deployment"], "gates": ["Requirements Gate", "Design Gate", "Testing Gate", "Go-Live Gate"]}', '550e8400-e29b-41d4-a716-446655440002'),
    ('Building Renovation', 'Template for building renovation projects', 'Construction', 2000000.00, 270, ARRAY['Project Manager', 'Architect', 'Contractor', 'Safety Officer'], '{"phases": ["Assessment", "Planning", "Renovation", "Inspection"], "gates": ["Assessment Gate", "Planning Gate", "Construction Gate", "Completion Gate"]}', '550e8400-e29b-41d4-a716-446655440002'),
    ('Research & Development', 'Template for R&D projects', 'Research', 300000.00, 540, ARRAY['Project Manager', 'Researcher', 'Analyst'], '{"phases": ["Research", "Development", "Testing", "Documentation"], "gates": ["Research Gate", "Development Gate", "Testing Gate", "Publication Gate"]}', '550e8400-e29b-41d4-a716-446655440002')
) AS v(name, description, category, default_budget, estimated_duration, required_roles, template_data, created_by)
WHERE NOT EXISTS (
    SELECT 1 FROM project_templates WHERE project_templates.name = v.name
);

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_user_id ON project_wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_session_id ON project_wizard_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_step_data_session_id ON project_wizard_step_data(session_id);
CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_project_templates_is_active ON project_templates(is_active);

-- Verify the fix by showing table counts
SELECT 
    'users' as table_name, 
    count(*) as row_count,
    'UUID format: ' || (SELECT id FROM users LIMIT 1) as sample_id
FROM users
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')

UNION ALL

SELECT 
    'project_templates' as table_name, 
    count(*) as row_count,
    'Templates available' as sample_id
FROM project_templates

UNION ALL

SELECT 
    'project_wizard_sessions' as table_name, 
    count(*) as row_count,
    'Ready for wizard sessions' as sample_id
FROM project_wizard_sessions

UNION ALL

SELECT 
    'project_wizard_step_data' as table_name, 
    count(*) as row_count,
    'Ready for step data' as sample_id
FROM project_wizard_step_data;

-- Show available templates
SELECT 
    id, 
    name, 
    category, 
    default_budget,
    'Template ready for use' as status
FROM project_templates 
WHERE is_active = true
ORDER BY category, name;

