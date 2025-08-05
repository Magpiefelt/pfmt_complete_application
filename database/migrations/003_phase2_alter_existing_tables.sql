-- Phase 2 Database Migrations: Alter existing tables for compatibility
-- Created: August 2, 2025
-- Purpose: Add missing columns to existing tables for Phase 2 functionality

-- Add missing columns to project_versions table
ALTER TABLE project_versions 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS change_summary TEXT;

-- Add alias for data_snapshot to match existing version_data column
-- We'll use version_data as the actual column and create a view or update our code to use it

-- Update existing project_versions to have proper status values
UPDATE project_versions SET status = 'Draft' WHERE status = 'draft';
UPDATE project_versions SET status = 'Approved' WHERE status = 'approved';

-- Set one version per project as current (the most recent approved one, or latest if none approved)
WITH current_versions AS (
    SELECT DISTINCT ON (project_id) 
        id, project_id
    FROM project_versions 
    WHERE status = 'Approved'
    ORDER BY project_id, approved_at DESC NULLS LAST, created_at DESC
)
UPDATE project_versions 
SET is_current = TRUE 
WHERE id IN (SELECT id FROM current_versions);

-- If no approved versions exist for a project, set the latest as current
WITH latest_versions AS (
    SELECT DISTINCT ON (pv.project_id) 
        pv.id, pv.project_id
    FROM project_versions pv
    LEFT JOIN project_versions pv_current ON pv.project_id = pv_current.project_id AND pv_current.is_current = TRUE
    WHERE pv_current.id IS NULL
    ORDER BY pv.project_id, pv.created_at DESC
)
UPDATE project_versions 
SET is_current = TRUE 
WHERE id IN (SELECT id FROM latest_versions);

-- Create the missing indexes
CREATE INDEX IF NOT EXISTS idx_project_versions_current ON project_versions(project_id, is_current) WHERE is_current = TRUE;

-- Sample data for testing Phase 2 functionality
-- Only insert if we have projects and users
DO $$
DECLARE
    sample_project_id UUID;
    sample_user_id UUID;
BEGIN
    -- Get a sample project and user
    SELECT id INTO sample_project_id FROM projects LIMIT 1;
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    IF sample_project_id IS NOT NULL AND sample_user_id IS NOT NULL THEN
        -- Sample calendar events
        INSERT INTO calendar_events (project_id, type, title, description, event_date, category, created_by)
        SELECT 
            p.id,
            'milestone',
            'Project Initiation Milestone',
            'Project officially begins with team kickoff',
            CURRENT_DATE + INTERVAL '7 days',
            'planning',
            sample_user_id
        FROM projects p
        WHERE NOT EXISTS (
            SELECT 1 FROM calendar_events ce WHERE ce.project_id = p.id AND ce.type = 'milestone'
        )
        LIMIT 3;

        INSERT INTO calendar_events (project_id, type, title, description, event_date, category, created_by)
        SELECT 
            p.id,
            'deadline',
            'Budget Review Deadline',
            'Quarterly budget review and variance analysis due',
            CURRENT_DATE + INTERVAL '30 days',
            'planning',
            sample_user_id
        FROM projects p
        WHERE NOT EXISTS (
            SELECT 1 FROM calendar_events ce WHERE ce.project_id = p.id AND ce.type = 'deadline'
        )
        LIMIT 2;

        -- Sample guidance notifications
        INSERT INTO guidance_notifications (project_id, user_id, type, priority, title, message, action_url, action_label)
        SELECT 
            p.id,
            sample_user_id,
            'next_step',
            'medium',
            'Schedule Gate 2 Meeting',
            'Project has completed planning phase. Schedule Gate 2 design review meeting.',
            '/projects/' || p.id || '/workflow',
            'Schedule Meeting'
        FROM projects p
        WHERE NOT EXISTS (
            SELECT 1 FROM guidance_notifications gn WHERE gn.project_id = p.id AND gn.type = 'next_step'
        )
        LIMIT 2;

        -- Sample workflow states
        INSERT INTO project_workflow_states (project_id, current_state, entered_by, next_required_action, next_action_due_date, next_action_assignee)
        SELECT 
            p.id,
            CASE 
                WHEN p.status = 'Active' THEN 'Planning'
                WHEN p.status = 'Completed' THEN 'Closed'
                ELSE 'Initiation'
            END,
            sample_user_id,
            CASE 
                WHEN p.status = 'Active' THEN 'Complete planning documentation and schedule Gate 2 review'
                ELSE 'Begin project planning activities'
            END,
            CURRENT_DATE + INTERVAL '14 days',
            sample_user_id
        FROM projects p
        WHERE NOT EXISTS (
            SELECT 1 FROM project_workflow_states pws WHERE pws.project_id = p.id AND pws.is_current = TRUE
        )
        LIMIT 3;
    END IF;
END $$;

COMMIT;

