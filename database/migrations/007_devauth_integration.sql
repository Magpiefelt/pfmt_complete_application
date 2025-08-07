-- Migration: DevAuth Integration Support
-- This migration ensures the database is compatible with the devAuth middleware

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update users table to ensure UUID compatibility if needed
-- This is safe to run multiple times
DO $$
BEGIN
    -- Check if we need to add any missing columns or constraints
    -- Most tables should already be UUID-compatible from the main schema
    
    -- Ensure we have at least one development user for testing
    INSERT INTO users (
        id, username, email, first_name, last_name, role, 
        password_hash, is_active, created_at, updated_at
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440002',
        'devuser',
        'dev.user@gov.ab.ca',
        'Dev',
        'User',
        'Project Manager',
        '$2b$10$dummy.hash.for.development.only',
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Ensure we have additional test users for role testing
    INSERT INTO users (
        id, username, email, first_name, last_name, role, 
        password_hash, is_active, created_at, updated_at
    ) VALUES 
    (
        '550e8400-e29b-41d4-a716-446655440003',
        'director.user',
        'director@gov.ab.ca',
        'Director',
        'User',
        'Director',
        '$2b$10$dummy.hash.for.development.only',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440004',
        'spm.user',
        'spm@gov.ab.ca',
        'Senior PM',
        'User',
        'Senior Project Manager',
        '$2b$10$dummy.hash.for.development.only',
        true,
        NOW(),
        NOW()
    ),
    (
        '550e8400-e29b-41d4-a716-446655440005',
        'vendor.user',
        'vendor@example.com',
        'Vendor',
        'User',
        'Vendor',
        '$2b$10$dummy.hash.for.development.only',
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'DevAuth integration users created/verified';
END $$;

-- Create indexes for better performance with user-based filtering
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_modified_by ON projects(modified_by);
CREATE INDEX IF NOT EXISTS idx_project_teams_project_manager_id ON project_teams(project_manager_id);

-- Add any missing columns for user tracking if they don't exist
DO $$
BEGIN
    -- Add created_by column to projects if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'created_by') THEN
        ALTER TABLE projects ADD COLUMN created_by UUID REFERENCES users(id);
        RAISE NOTICE 'Added created_by column to projects table';
    END IF;
    
    -- Add modified_by column to projects if it doesn't exist (should already exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'modified_by') THEN
        ALTER TABLE projects ADD COLUMN modified_by UUID REFERENCES users(id);
        RAISE NOTICE 'Added modified_by column to projects table';
    END IF;
END $$;

-- Update any existing projects to have a default created_by if null
UPDATE projects 
SET created_by = '550e8400-e29b-41d4-a716-446655440002'
WHERE created_by IS NULL;

UPDATE projects 
SET modified_by = '550e8400-e29b-41d4-a716-446655440002'
WHERE modified_by IS NULL;

-- Ensure project templates exist for wizard functionality
INSERT INTO project_templates (name, description, category, default_budget, template_data) VALUES
('Standard Construction', 'Standard new construction project template', 'Construction', 5000000, 
 '{"projectType": "new_construction", "deliveryType": "design_bid_build", "phases": ["planning", "design", "construction", "completion"]}'),
('Renovation Project', 'Building renovation and upgrade template', 'Renovation', 2000000,
 '{"projectType": "renovation", "deliveryType": "design_build", "phases": ["assessment", "design", "construction", "completion"]}'),
('Infrastructure Upgrade', 'Infrastructure and systems upgrade template', 'Infrastructure', 3000000,
 '{"projectType": "infrastructure", "deliveryType": "design_bid_build", "phases": ["planning", "design", "implementation", "testing"]}')
ON CONFLICT (name) DO NOTHING;

RAISE NOTICE 'DevAuth integration migration completed successfully';

