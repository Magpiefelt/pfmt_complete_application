-- Migration: Add canonical role constraints
-- Created: 2025-01-18
-- Description: Enforce canonical role system and normalize existing roles

-- Add role constraint to enforce canonical roles
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin','pmi','director','pm','spm','analyst','executive','vendor'));

-- Update any existing non-canonical roles to canonical equivalents
UPDATE users SET role = 'pm' WHERE role = 'project_manager';
UPDATE users SET role = 'spm' WHERE role = 'senior_project_manager';
UPDATE users SET role = 'pmi' WHERE role = 'project_initiator';
UPDATE users SET role = 'analyst' WHERE role = 'contract_analyst';
UPDATE users SET role = 'executive' WHERE role = 'cfo';
UPDATE users SET role = 'admin' WHERE role = 'administrator';

-- Add audit fields to users table if they don't exist
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing users to have created_at if null
UPDATE users SET created_at = NOW() WHERE created_at IS NULL;
UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;

-- Create index on role for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add comment to document the canonical roles
COMMENT ON CONSTRAINT users_role_check ON users IS 'Enforces canonical role system: admin, pmi, director, pm, spm, analyst, executive, vendor';

