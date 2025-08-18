-- Migration 012: Add lifecycle_status column and indexes
-- Date: 2025-08-18
-- Description: Adds lifecycle_status column to projects table for dual status tracking

BEGIN;

-- Add lifecycle_status column with proper constraint
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'active'
  CHECK (lifecycle_status IN ('active','completed','archived'));

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_lifecycle_status  ON projects(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_projects_workflow_status   ON projects(workflow_status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_pm       ON projects(assigned_pm);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_spm      ON projects(assigned_spm);
CREATE INDEX IF NOT EXISTS idx_projects_created_by        ON projects(created_by);

-- Add comment to document the column purpose
COMMENT ON COLUMN projects.lifecycle_status IS 'Tracks the lifecycle stage of the project independent of workflow status. Used for dual-wizard system and project management.';

COMMIT;

