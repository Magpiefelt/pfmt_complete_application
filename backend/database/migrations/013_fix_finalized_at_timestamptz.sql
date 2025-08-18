-- Migration 013: Fix finalized_at timestamp type
-- Date: 2025-08-18
-- Description: Ensures finalized_at column uses TIMESTAMPTZ for proper timezone handling

BEGIN;

-- Convert finalized_at to TIMESTAMPTZ if it exists
ALTER TABLE projects
  ALTER COLUMN finalized_at TYPE TIMESTAMPTZ
  USING CASE
         WHEN finalized_at IS NULL THEN NULL
         ELSE finalized_at::timestamptz
       END;

COMMIT;

