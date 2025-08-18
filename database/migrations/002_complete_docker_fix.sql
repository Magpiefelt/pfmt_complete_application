-- COMPLETE DOCKER DATABASE FIX
-- This script fixes all the missing tables and columns identified in the error logs
-- Sample data is managed separately in database/sample_data.sql and is not included in this migration.
-- 1. Create missing project_wizard_step_data table
CREATE TABLE IF NOT EXISTS project_wizard_step_data (
  session_id TEXT NOT NULL,
  step_id INTEGER NOT NULL,
  step_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, step_id)
);

-- 2. Add missing columns to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_type TEXT DEFAULT 'General';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;

-- 3. Update existing vendors with vendor_name from name column
UPDATE vendors SET vendor_name = name WHERE vendor_name IS NULL;
UPDATE vendors SET vendor_type = 'General' WHERE vendor_type IS NULL;

-- 4. Fix project_templates table - add missing status column
ALTER TABLE project_templates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
UPDATE project_templates SET status = 'active' WHERE status IS NULL;

-- 5. Create missing projects table if it doesn't exist (for project access)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT ('proj_' || extract(epoch from now()) * 1000 || '_' || substr(md5(random()::text), 1, 9)),
  project_name TEXT NOT NULL,
  project_description TEXT,
  project_status TEXT DEFAULT 'underway',
  project_phase TEXT DEFAULT 'planning',
  project_type TEXT DEFAULT 'new_construction',
  delivery_type TEXT DEFAULT 'design_bid_build',
  program TEXT DEFAULT 'government_facilities',
  geographic_region TEXT DEFAULT 'central',
  cpd_number TEXT UNIQUE,
  approval_year TEXT,
  project_category TEXT DEFAULT 'construction',
  funded_to_complete BOOLEAN DEFAULT false,
  modified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create project_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_locations (
  id SERIAL PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  location TEXT,
  municipality TEXT,
  urban_rural TEXT,
  address TEXT,
  building_name TEXT,
  constituency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create project_teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_teams (
  id SERIAL PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  project_manager_id TEXT,
  director_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_project_wizard_step_data_session_id ON project_wizard_step_data(session_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_step_data_step_id ON project_wizard_step_data(step_id);
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_name ON vendors(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_project_name ON projects(project_name);
CREATE INDEX IF NOT EXISTS idx_projects_cpd_number ON projects(cpd_number);
CREATE INDEX IF NOT EXISTS idx_project_locations_project_id ON project_locations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_teams_project_id ON project_teams(project_id);
-- 9. Add comments for documentation
COMMENT ON TABLE project_wizard_step_data IS 'Stores step-by-step data during project wizard completion';
COMMENT ON TABLE vendors IS 'Vendor information with enhanced columns for project wizard';
COMMENT ON COLUMN vendors.vendor_name IS 'Vendor display name (compatibility column)';
COMMENT ON COLUMN vendors.vendor_type IS 'Type of vendor (General, Engineering, Architecture, etc.)';
COMMENT ON COLUMN project_templates.status IS 'Template status (active, inactive, draft)';

