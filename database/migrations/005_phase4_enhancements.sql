-- Phase 4 Database Enhancements
-- UX Polish, Bulk Ops, Seeds & Coverage

-- Add archived flag to projects for soft delete functionality
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id);

-- Add archived flag to vendors
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id);

-- Add archived flag to contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id);

-- Add batch operation tracking to audit logs
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS action_batch_id UUID,
ADD COLUMN IF NOT EXISTS batch_size INTEGER;

-- Create bulk operations log table
CREATE TABLE IF NOT EXISTS bulk_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    operation_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_ids UUID[] NOT NULL,
    operation_data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    error_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for bulk operations
CREATE INDEX IF NOT EXISTS idx_bulk_operations_user ON bulk_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_type ON bulk_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_date ON bulk_operations(started_at);

-- Create inline edit tracking table
CREATE TABLE IF NOT EXISTS inline_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    edit_session_id UUID,
    auto_saved BOOLEAN DEFAULT false,
    confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for inline edits
CREATE INDEX IF NOT EXISTS idx_inline_edits_entity ON inline_edits(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_inline_edits_user ON inline_edits(user_id);
CREATE INDEX IF NOT EXISTS idx_inline_edits_session ON inline_edits(edit_session_id);
CREATE INDEX IF NOT EXISTS idx_inline_edits_date ON inline_edits(created_at);

-- Add indexes for archived items filtering
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_vendors_archived ON vendors(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_contracts_archived ON contracts(archived) WHERE archived = false;

-- Create user preferences table for UI customization
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- Create index for user preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Create system settings table for application configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('bulk_operation_max_items', '100', 'Maximum number of items that can be processed in a single bulk operation', false),
('auto_save_interval', '30', 'Auto-save interval for inline edits in seconds', true),
('export_max_records', '10000', 'Maximum number of records that can be exported at once', false),
('session_timeout', '3600', 'Session timeout in seconds', false),
('audit_retention_days', '2555', 'Number of days to retain audit logs (7 years)', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    notification_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    delivery_method VARCHAR(50) DEFAULT 'in_app',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id, notification_type, enabled, delivery_method)
SELECT 
    u.id,
    notification_type,
    true,
    'in_app'
FROM users u
CROSS JOIN (
    VALUES 
    ('project_approval_required'),
    ('project_approved'),
    ('project_rejected'),
    ('gate_meeting_scheduled'),
    ('gate_meeting_reminder'),
    ('budget_threshold_exceeded'),
    ('contract_payment_due'),
    ('vendor_performance_review'),
    ('system_maintenance')
) AS nt(notification_type)
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- Function to archive entities with proper audit trail
CREATE OR REPLACE FUNCTION archive_entity(
    entity_table TEXT,
    entity_uuid UUID,
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    sql_query TEXT;
    affected_rows INTEGER;
BEGIN
    -- Validate entity table
    IF entity_table NOT IN ('projects', 'vendors', 'contracts') THEN
        RAISE EXCEPTION 'Invalid entity table: %', entity_table;
    END IF;
    
    -- Build and execute update query
    sql_query := format(
        'UPDATE %I SET archived = true, archived_at = CURRENT_TIMESTAMP, archived_by = $1 WHERE id = $2 AND archived = false',
        entity_table
    );
    
    EXECUTE sql_query USING user_uuid, entity_uuid;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Log the archive action
    IF affected_rows > 0 THEN
        INSERT INTO audit_logs (user_id, entity_type, entity_id, action, field_name, old_value, new_value)
        VALUES (user_uuid, entity_table, entity_uuid, 'archive', 'archived', 'false', 'true');
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to unarchive entities
CREATE OR REPLACE FUNCTION unarchive_entity(
    entity_table TEXT,
    entity_uuid UUID,
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    sql_query TEXT;
    affected_rows INTEGER;
BEGIN
    -- Validate entity table
    IF entity_table NOT IN ('projects', 'vendors', 'contracts') THEN
        RAISE EXCEPTION 'Invalid entity table: %', entity_table;
    END IF;
    
    -- Build and execute update query
    sql_query := format(
        'UPDATE %I SET archived = false, archived_at = NULL, archived_by = NULL WHERE id = $1 AND archived = true',
        entity_table
    );
    
    EXECUTE sql_query USING entity_uuid;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Log the unarchive action
    IF affected_rows > 0 THEN
        INSERT INTO audit_logs (user_id, entity_type, entity_id, action, field_name, old_value, new_value)
        VALUES (user_uuid, entity_table, entity_uuid, 'unarchive', 'archived', 'true', 'false');
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to perform bulk status updates
CREATE OR REPLACE FUNCTION bulk_update_status(
    entity_table TEXT,
    entity_uuids UUID[],
    new_status TEXT,
    user_uuid UUID
)
RETURNS TABLE(success_count INTEGER, failure_count INTEGER, batch_id UUID) AS $$
DECLARE
    sql_query TEXT;
    batch_uuid UUID;
    success_cnt INTEGER := 0;
    failure_cnt INTEGER := 0;
    entity_id UUID;
    old_status TEXT;
BEGIN
    -- Generate batch ID
    batch_uuid := gen_random_uuid();
    
    -- Validate entity table
    IF entity_table NOT IN ('projects', 'vendors', 'contracts') THEN
        RAISE EXCEPTION 'Invalid entity table: %', entity_table;
    END IF;
    
    -- Log bulk operation start
    INSERT INTO bulk_operations (id, user_id, operation_type, entity_type, entity_ids, operation_data, status)
    VALUES (batch_uuid, user_uuid, 'status_update', entity_table, entity_uuids, 
            jsonb_build_object('new_status', new_status), 'in_progress');
    
    -- Process each entity
    FOREACH entity_id IN ARRAY entity_uuids
    LOOP
        BEGIN
            -- Get current status
            sql_query := format('SELECT status FROM %I WHERE id = $1', entity_table);
            EXECUTE sql_query INTO old_status USING entity_id;
            
            -- Update status
            sql_query := format('UPDATE %I SET status = $1 WHERE id = $2', entity_table);
            EXECUTE sql_query USING new_status, entity_id;
            
            -- Log individual change
            INSERT INTO audit_logs (user_id, entity_type, entity_id, action, field_name, old_value, new_value, action_batch_id)
            VALUES (user_uuid, entity_table, entity_id, 'bulk_status_update', 'status', old_status, new_status, batch_uuid);
            
            success_cnt := success_cnt + 1;
            
        EXCEPTION WHEN OTHERS THEN
            failure_cnt := failure_cnt + 1;
        END;
    END LOOP;
    
    -- Update bulk operation record
    UPDATE bulk_operations 
    SET status = 'completed', 
        success_count = success_cnt, 
        failure_count = failure_cnt,
        completed_at = CURRENT_TIMESTAMP
    WHERE id = batch_uuid;
    
    RETURN QUERY SELECT success_cnt, failure_cnt, batch_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs based on retention policy
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    retention_days INTEGER;
    deleted_count INTEGER;
BEGIN
    -- Get retention setting
    SELECT (setting_value::text)::integer INTO retention_days
    FROM system_settings 
    WHERE setting_key = 'audit_retention_days';
    
    -- Default to 7 years if not set
    IF retention_days IS NULL THEN
        retention_days := 2555;
    END IF;
    
    -- Delete old audit logs
    DELETE FROM audit_logs 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function for tables that need it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers where needed
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_system_settings_updated_at ON system_settings;
CREATE TRIGGER trigger_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trigger_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE bulk_operations IS 'Tracking of bulk operations for audit and monitoring';
COMMENT ON TABLE inline_edits IS 'Tracking of inline edit operations with auto-save support';
COMMENT ON TABLE user_preferences IS 'User-specific UI and behavior preferences';
COMMENT ON TABLE system_settings IS 'Application-wide configuration settings';
COMMENT ON TABLE notification_preferences IS 'User notification delivery preferences';

-- Insert audit log entry for this migration
INSERT INTO audit_logs (user_id, entity_type, entity_id, action, field_name, new_value)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@alberta.ca' LIMIT 1),
    'system',
    gen_random_uuid(),
    'migration',
    'database_version',
    'Phase 4 enhancements applied'
);

