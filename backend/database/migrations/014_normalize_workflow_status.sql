-- Migration 014: Normalize workflow_status vocabulary
-- Date: 2025-08-18
-- Description: Updates workflow_status constraint to include all valid status values

BEGIN;

-- Drop existing constraint if it exists
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_workflow_status_check;

-- Add updated constraint with normalized vocabulary
ALTER TABLE projects
  ADD CONSTRAINT projects_workflow_status_check
  CHECK (workflow_status IN ('initiated','assigned','finalized','active','on_hold','completed','archived'));

COMMIT;

