-- PFMT Enhanced Application - Lifecycle Status Migration (Enhanced)
-- Adds lifecycle_status column to projects table for dual status tracking
-- Author: Manus AI
-- Date: 2025-08-18
-- Version: 2.0 - Enhanced with comprehensive status options

BEGIN;

-- Add lifecycle_status column with default value and comprehensive status options
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) DEFAULT 'active';

-- Drop existing constraint if it exists to update it
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS chk_lifecycle_status;

-- Add enhanced check constraint for valid lifecycle status values
ALTER TABLE projects 
ADD CONSTRAINT chk_lifecycle_status 
CHECK (lifecycle_status IN ('active', 'on_hold', 'completed', 'archived', 'cancelled'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_lifecycle_status ON projects(lifecycle_status);

-- Update existing projects with appropriate lifecycle status based on workflow_status and project_status
UPDATE projects 
SET lifecycle_status = CASE 
  WHEN project_status = 'archived' THEN 'archived'
  WHEN project_status = 'cancelled' THEN 'cancelled'
  WHEN project_status = 'completed' THEN 'completed'
  WHEN project_status = 'on_hold' THEN 'on_hold'
  WHEN workflow_status = 'finalized' THEN 'active'
  WHEN workflow_status = 'assigned' THEN 'active'
  WHEN workflow_status = 'initiated' THEN 'active'
  WHEN workflow_status = 'active' THEN 'active'
  WHEN workflow_status = 'complete' THEN 'completed'
  WHEN workflow_status = 'archived' THEN 'archived'
  ELSE 'active'
END
WHERE lifecycle_status IS NULL OR lifecycle_status NOT IN ('active', 'on_hold', 'completed', 'archived', 'cancelled');

-- Add comment to document the column purpose
COMMENT ON COLUMN projects.lifecycle_status IS 'Tracks the lifecycle stage of the project independent of workflow status. Used for dual-wizard system and project management.';

COMMIT;

-- Verification and reporting (for manual execution if needed)
-- Uncomment these lines to run verification queries:

-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'projects' AND column_name = 'lifecycle_status';

-- SELECT 
--     lifecycle_status,
--     workflow_status,
--     COUNT(*) as count,
--     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
-- FROM projects 
-- GROUP BY lifecycle_status, workflow_status
-- ORDER BY lifecycle_status, workflow_status;

-- SELECT 
--     lifecycle_status,
--     COUNT(*) as total_count,
--     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
-- FROM projects 
-- GROUP BY lifecycle_status
-- ORDER BY total_count DESC;

