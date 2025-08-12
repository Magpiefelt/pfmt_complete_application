-- Database fixes for PFMT application
-- Fix 1: Create missing project_wizard_step_data table
-- Fix 2: Add vendor_name column to vendors table for backward compatibility

-- Create the missing project_wizard_step_data table
CREATE TABLE IF NOT EXISTS public.project_wizard_step_data (
  session_id TEXT NOT NULL,
  step_id    INTEGER NOT NULL,
  step_data  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, step_id),
  FOREIGN KEY (session_id) REFERENCES public.project_wizard_sessions(session_id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pwsd_session ON public.project_wizard_step_data(session_id);

-- Add vendor_name column to vendors table for backward compatibility
-- This allows existing queries that use vendor_name to work
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_name TEXT;

-- Update vendor_name to match the name column for existing records
UPDATE vendors SET vendor_name = name WHERE vendor_name IS NULL;

-- Add comment for documentation
COMMENT ON TABLE project_wizard_step_data IS 'Stores individual step data for project wizard sessions';
COMMENT ON COLUMN vendors.vendor_name IS 'Backward compatibility column that mirrors the name column';

