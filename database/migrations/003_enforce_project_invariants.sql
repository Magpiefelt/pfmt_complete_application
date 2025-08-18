-- Ensure single draft per project
CREATE UNIQUE INDEX IF NOT EXISTS ux_project_versions_single_draft
ON project_versions(project_id) WHERE status='draft';

-- Ensure single approved version per project
CREATE UNIQUE INDEX IF NOT EXISTS ux_project_versions_single_approved
ON project_versions(project_id) WHERE status='approved';

-- Prevent duplicate vendors per project
CREATE UNIQUE INDEX IF NOT EXISTS ux_project_vendors_unique
ON project_vendors(project_id, vendor_id);

-- Optimize project version lookups
CREATE INDEX IF NOT EXISTS ix_project_versions_pid_status
ON project_versions(project_id, status);
