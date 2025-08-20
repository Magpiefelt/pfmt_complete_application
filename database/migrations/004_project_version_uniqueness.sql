-- Ensure unique version_number per project (safe even if constraint exists)
DO $$
BEGIN
    -- Try to create a unique index if it does not already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'ux_project_version_number'
          AND c.relkind = 'i'
    ) THEN
        CREATE UNIQUE INDEX ux_project_version_number
        ON project_versions(project_id, version_number);
    END IF;
END$$;
