-- Migration: Add project workflow fields
-- Created: 2025-01-18
-- Description: Add workflow status and assignment fields to support multi-step project creation

-- Add workflow status and assignment fields to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (workflow_status IN ('initiated','assigned','finalized','active','on_hold','complete','archived')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS assigned_pm UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS assigned_spm UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS finalized_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workflow_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for performance on workflow fields
CREATE INDEX IF NOT EXISTS idx_projects_workflow_status ON projects(workflow_status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_pm ON projects(assigned_pm);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_spm ON projects(assigned_spm);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_by ON projects(assigned_by);
CREATE INDEX IF NOT EXISTS idx_projects_finalized_by ON projects(finalized_by);
CREATE INDEX IF NOT EXISTS idx_projects_workflow_updated_at ON projects(workflow_updated_at);

-- Backfill existing projects as 'active' status (they've already been through the workflow)
UPDATE projects 
SET workflow_status = 'active',
    workflow_updated_at = NOW()
WHERE workflow_status = 'initiated'; -- Only update if still at default

-- Add comments to document the workflow fields
COMMENT ON COLUMN projects.workflow_status IS 'Project workflow status: initiated -> assigned -> finalized -> active -> (on_hold/complete/archived)';
COMMENT ON COLUMN projects.created_by IS 'User who initiated the project (PM&I role)';
COMMENT ON COLUMN projects.assigned_pm IS 'Project Manager assigned by Director';
COMMENT ON COLUMN projects.assigned_spm IS 'Senior Project Manager assigned by Director';
COMMENT ON COLUMN projects.assigned_by IS 'Director who assigned the team';
COMMENT ON COLUMN projects.finalized_by IS 'PM/SPM who finalized the project setup';
COMMENT ON COLUMN projects.finalized_at IS 'Timestamp when project was finalized to active status';
COMMENT ON COLUMN projects.workflow_updated_at IS 'Timestamp when workflow status was last updated';

