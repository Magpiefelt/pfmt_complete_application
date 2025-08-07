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

-- Project Wizard Sessions table
CREATE TABLE IF NOT EXISTS project_wizard_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL, -- Changed from INTEGER to UUID
    current_step INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Wizard Step Data table
CREATE TABLE IF NOT EXISTS project_wizard_step_data (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    step_id INTEGER NOT NULL,
    step_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, step_id)
);

-- Insert default project templates if they don't exist
INSERT INTO project_templates (name, description, category, default_budget, estimated_duration, required_roles, template_data, is_active, created_by)
SELECT * FROM (VALUES
    ('New Construction', 'Template for new building construction projects', 'Construction', 5000000.00, 365, ARRAY['Project Manager', 'Architect', 'Engineer'], '{"phases": ["Planning", "Design", "Construction", "Closeout"], "deliverables": ["Site Plan", "Building Plans", "Construction Documents"]}', true, '550e8400-e29b-41d4-a716-446655440002'),
    ('Renovation', 'Template for building renovation and upgrade projects', 'Renovation', 2000000.00, 180, ARRAY['Project Manager', 'Architect'], '{"phases": ["Assessment", "Design", "Renovation", "Completion"], "deliverables": ["Assessment Report", "Renovation Plans", "Completion Certificate"]}', true, '550e8400-e29b-41d4-a716-446655440002'),
    ('Infrastructure', 'Template for infrastructure development projects', 'Infrastructure', 10000000.00, 730, ARRAY['Project Manager', 'Engineer', 'Environmental Specialist'], '{"phases": ["Planning", "Environmental Assessment", "Design", "Construction"], "deliverables": ["Environmental Impact Assessment", "Infrastructure Plans", "Construction Specifications"]}', true, '550e8400-e29b-41d4-a716-446655440002'),
    ('Maintenance', 'Template for facility maintenance and repair projects', 'Maintenance', 500000.00, 90, ARRAY['Project Manager', 'Maintenance Specialist'], '{"phases": ["Assessment", "Planning", "Execution", "Verification"], "deliverables": ["Maintenance Plan", "Work Orders", "Completion Report"]}', true, '550e8400-e29b-41d4-a716-446655440002')
) AS t(name, description, category, default_budget, estimated_duration, required_roles, template_data, is_active, created_by)
WHERE NOT EXISTS (SELECT 1 FROM project_templates WHERE name = t.name);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_user_id ON project_wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_session_id ON project_wizard_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_step_data_session_id ON project_wizard_step_data(session_id);
CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_project_templates_active ON project_templates(is_active);

-- Update any existing integer user_id references to UUID format if needed
-- This is a safety measure in case there are existing records with integer IDs

-- Check if there are any existing wizard sessions with integer user_ids
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Only proceed if the column exists and has integer values
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_wizard_sessions' 
        AND column_name = 'user_id'
    ) THEN
        -- Check if there are any records that might need conversion
        FOR rec IN 
            SELECT session_id, user_id 
            FROM project_wizard_sessions 
            WHERE user_id::text ~ '^[0-9]+$' -- Check if it's a numeric string
        LOOP
            -- Update integer user IDs to the default UUID
            UPDATE project_wizard_sessions 
            SET user_id = '550e8400-e29b-41d4-a716-446655440002'
            WHERE session_id = rec.session_id;
            
            RAISE NOTICE 'Updated wizard session % user_id from % to default UUID', rec.session_id, rec.user_id;
        END LOOP;
    END IF;
END $$;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE '=== PFMT Wizard Database Setup Complete ===';
    RAISE NOTICE 'Tables created/verified:';
    RAISE NOTICE '  ✓ project_templates';
    RAISE NOTICE '  ✓ project_wizard_sessions';  
    RAISE NOTICE '  ✓ project_wizard_step_data';
    RAISE NOTICE 'Default user created with UUID: 550e8400-e29b-41d4-a716-446655440002';
    RAISE NOTICE 'Project templates added: % templates', (SELECT COUNT(*) FROM project_templates WHERE is_active = true);
    RAISE NOTICE '=== Setup Complete ===';
END $$;

