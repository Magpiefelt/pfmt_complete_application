-- Migration: 003_vendor_indexes.sql
-- Description: Add indexes for vendor lookup performance and resilience
-- Date: 2024-08-19

-- Add index on vendors active status for performance
CREATE INDEX IF NOT EXISTS idx_vendors_active 
ON vendors (COALESCE(is_active, true));

-- Add index on vendor name for lookup performance
CREATE INDEX IF NOT EXISTS idx_vendors_name 
ON vendors (COALESCE(vendor_name, name));

-- Add composite index for active vendors by name
CREATE INDEX IF NOT EXISTS idx_vendors_active_name 
ON vendors (COALESCE(is_active, true), COALESCE(vendor_name, name));

-- Add index on vendor status for filtering
CREATE INDEX IF NOT EXISTS idx_vendors_status 
ON vendors (status);

-- Add index on vendor capabilities for search
CREATE INDEX IF NOT EXISTS idx_vendors_capabilities 
ON vendors USING gin (to_tsvector('english', COALESCE(capabilities, '')));

-- Add index on vendor contact information for lookup
CREATE INDEX IF NOT EXISTS idx_vendors_contact_email 
ON vendors (contact_email);

-- Update statistics for query planner
ANALYZE vendors;

