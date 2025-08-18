-- Migration: Add scheduled submissions functionality
-- Created: 2025-01-08
-- Description: Add tables and fields to support scheduled auto-submission of project versions

-- Add auto_submission_enabled field to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS auto_submission_enabled BOOLEAN DEFAULT true;

-- Create scheduled_submissions table to track auto-submission attempts
CREATE TABLE IF NOT EXISTS scheduled_submissions (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_id INTEGER NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for scheduled_submissions
CREATE INDEX IF NOT EXISTS idx_scheduled_submissions_project_id ON scheduled_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_submissions_version_id ON scheduled_submissions(version_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_submissions_created_at ON scheduled_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_submissions_status ON scheduled_submissions(status);

-- Add submitted_by field to project_versions if it doesn't exist
ALTER TABLE project_versions 
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100);

-- Add submitted_at field to project_versions if it doesn't exist
ALTER TABLE project_versions 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Create approval_workflows table if it doesn't exist
CREATE TABLE IF NOT EXISTS approval_workflows (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_id INTEGER NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by VARCHAR(100) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for approval_workflows
CREATE INDEX IF NOT EXISTS idx_approval_workflows_project_id ON approval_workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_version_id ON approval_workflows(version_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_submitted_at ON approval_workflows(submitted_at);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Update existing projects to enable auto-submission by default
UPDATE projects 
SET auto_submission_enabled = true 
WHERE auto_submission_enabled IS NULL;

-- Add comment to document the migration
COMMENT ON TABLE scheduled_submissions IS 'Tracks automatic submission attempts for project versions';
COMMENT ON TABLE approval_workflows IS 'Manages the approval workflow for project versions';
COMMENT ON TABLE notifications IS 'Stores user notifications for various system events';

-- Create system_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial configuration data
INSERT INTO system_config (key, value, description, created_at, updated_at) 
VALUES 
    ('auto_submission_enabled', 'true', 'Global toggle for automatic submission feature', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('auto_submission_cron', '0 9 1 * *', 'Cron expression for auto-submission schedule (9 AM on 1st of each month)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('auto_submission_min_age_days', '7', 'Minimum age in days for a version to be eligible for auto-submission', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

