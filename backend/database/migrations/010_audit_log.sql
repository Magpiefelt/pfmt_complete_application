-- Migration: Create audit log table
-- Created: 2025-01-18
-- Description: Create comprehensive audit logging for tracking all system changes

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  entity TEXT NOT NULL,           -- 'project', 'contract', 'user', etc.
  entity_id UUID,                 -- affected record id
  action TEXT NOT NULL,           -- 'create','update','assign','finalize','delete'
  details JSONB,                  -- change details and metadata
  ip_address INET,                -- request IP address
  user_agent TEXT,                -- request user agent
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_action ON audit_log(entity, action);

-- Add comments to document the audit log structure
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all system changes and actions';
COMMENT ON COLUMN audit_log.entity IS 'Type of entity being audited (project, user, contract, etc.)';
COMMENT ON COLUMN audit_log.entity_id IS 'UUID of the specific entity being audited';
COMMENT ON COLUMN audit_log.action IS 'Action performed (create, update, assign, finalize, delete, etc.)';
COMMENT ON COLUMN audit_log.details IS 'JSON object containing change details, old/new values, and metadata';
COMMENT ON COLUMN audit_log.ip_address IS 'IP address of the user making the change';
COMMENT ON COLUMN audit_log.user_agent IS 'Browser/client user agent string';

