-- PFMT Project Wizard Enhancement Database Migrations
-- This file contains all database schema changes needed for the enhanced wizard

-- Start transaction
BEGIN;

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '20241210_wizard_enhancements') THEN
        RAISE NOTICE 'Migration 20241210_wizard_enhancements already applied, skipping...';
        ROLLBACK;
        RETURN;
    END IF;
END $$;

-- ============================================================================
-- NOTIFICATION SYSTEM TABLES
-- ============================================================================

-- Create notification logs table for tracking all notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    notification_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    data JSONB,
    options JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient);

-- Create user notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

-- ============================================================================
-- PROJECT TEMPLATES SYSTEM
-- ============================================================================

-- Create project templates table
CREATE TABLE IF NOT EXISTS project_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    template_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for project templates
CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_project_templates_status ON project_templates(status);
CREATE INDEX IF NOT EXISTS idx_project_templates_created_by ON project_templates(created_by);

-- ============================================================================
-- ENHANCED WIZARD SESSION TRACKING
-- ============================================================================

-- Add new columns to project_wizard_sessions if they don't exist
DO $$
BEGIN
    -- Add template_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'project_wizard_sessions' AND column_name = 'template_id') THEN
        ALTER TABLE project_wizard_sessions ADD COLUMN template_id INTEGER REFERENCES project_templates(id);
    END IF;
    
    -- Add metadata column for storing additional session data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'project_wizard_sessions' AND column_name = 'metadata') THEN
        ALTER TABLE project_wizard_sessions ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Add last_activity column for session management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'project_wizard_sessions' AND column_name = 'last_activity') THEN
        ALTER TABLE project_wizard_sessions ADD COLUMN last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add ip_address column for security tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'project_wizard_sessions' AND column_name = 'ip_address') THEN
        ALTER TABLE project_wizard_sessions ADD COLUMN ip_address INET;
    END IF;
    
    -- Add user_agent column for analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'project_wizard_sessions' AND column_name = 'user_agent') THEN
        ALTER TABLE project_wizard_sessions ADD COLUMN user_agent TEXT;
    END IF;
END $$;

-- Create indexes for enhanced wizard sessions
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_template_id ON project_wizard_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_last_activity ON project_wizard_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_ip_address ON project_wizard_sessions(ip_address);

-- ============================================================================
-- USER PREFERENCES AND SETTINGS
-- ============================================================================

-- Add notification preferences to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'notification_preferences') THEN
        ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{
            "email_notifications": true,
            "in_app_notifications": true,
            "project_creation": true,
            "project_updates": true,
            "system_alerts": true,
            "vendor_assignments": true,
            "budget_approvals": true
        }';
    END IF;
END $$;

-- ============================================================================
-- AUDIT TRAIL ENHANCEMENTS
-- ============================================================================

-- Create audit trail table for tracking all wizard actions
CREATE TABLE IF NOT EXISTS wizard_audit_trail (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    step_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    correlation_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit trail
CREATE INDEX IF NOT EXISTS idx_wizard_audit_session_id ON wizard_audit_trail(session_id);
CREATE INDEX IF NOT EXISTS idx_wizard_audit_user_id ON wizard_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_wizard_audit_action ON wizard_audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_wizard_audit_created_at ON wizard_audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_wizard_audit_correlation_id ON wizard_audit_trail(correlation_id);

-- ============================================================================
-- PERFORMANCE MONITORING TABLES
-- ============================================================================

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS wizard_performance_metrics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC,
    metadata JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_wizard_metrics_session_id ON wizard_performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_wizard_metrics_type ON wizard_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_wizard_metrics_recorded_at ON wizard_performance_metrics(recorded_at);

-- ============================================================================
-- FILE UPLOAD TRACKING
-- ============================================================================

-- Create file uploads table for tracking wizard file uploads
CREATE TABLE IF NOT EXISTS wizard_file_uploads (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    step_id INTEGER NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255),
    upload_status VARCHAR(50) DEFAULT 'uploaded',
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for file uploads
CREATE INDEX IF NOT EXISTS idx_wizard_uploads_session_id ON wizard_file_uploads(session_id);
CREATE INDEX IF NOT EXISTS idx_wizard_uploads_step_id ON wizard_file_uploads(step_id);
CREATE INDEX IF NOT EXISTS idx_wizard_uploads_uploaded_by ON wizard_file_uploads(uploaded_by);

-- ============================================================================
-- ENHANCED PROJECT DATA
-- ============================================================================

-- Add enhanced fields to projects table
DO $$
BEGIN
    -- Add project metadata column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'metadata') THEN
        ALTER TABLE projects ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Add wizard session reference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'wizard_session_id') THEN
        ALTER TABLE projects ADD COLUMN wizard_session_id VARCHAR(255);
    END IF;
    
    -- Add creation source tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'creation_source') THEN
        ALTER TABLE projects ADD COLUMN creation_source VARCHAR(50) DEFAULT 'wizard';
    END IF;
END $$;

-- Create indexes for enhanced project data
CREATE INDEX IF NOT EXISTS idx_projects_wizard_session_id ON projects(wizard_session_id);
CREATE INDEX IF NOT EXISTS idx_projects_creation_source ON projects(creation_source);

-- ============================================================================
-- VENDOR ENHANCEMENTS
-- ============================================================================

-- Add enhanced fields to vendors table
DO $$
BEGIN
    -- Add vendor rating system
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vendors' AND column_name = 'avg_rating') THEN
        ALTER TABLE vendors ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT 0.00;
    END IF;
    
    -- Add project count for vendors
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vendors' AND column_name = 'project_count') THEN
        ALTER TABLE vendors ADD COLUMN project_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add vendor capabilities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vendors' AND column_name = 'capabilities') THEN
        ALTER TABLE vendors ADD COLUMN capabilities JSONB DEFAULT '[]';
    END IF;
END $$;

-- ============================================================================
-- BUDGET ENHANCEMENTS
-- ============================================================================

-- Create budget categories table for better budget management
CREATE TABLE IF NOT EXISTS budget_categories (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    category_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for budget categories
CREATE INDEX IF NOT EXISTS idx_budget_categories_project_id ON budget_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_type ON budget_categories(category_type);

-- ============================================================================
-- WIZARD ANALYTICS
-- ============================================================================

-- Create wizard analytics table for tracking usage patterns
CREATE TABLE IF NOT EXISTS wizard_analytics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    user_id INTEGER REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    step_id INTEGER,
    duration_ms INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for wizard analytics
CREATE INDEX IF NOT EXISTS idx_wizard_analytics_session_id ON wizard_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_wizard_analytics_user_id ON wizard_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_wizard_analytics_event_type ON wizard_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_wizard_analytics_timestamp ON wizard_analytics(timestamp);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DO $$
BEGIN
    -- User notifications trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_notifications_updated_at') THEN
        CREATE TRIGGER update_user_notifications_updated_at
            BEFORE UPDATE ON user_notifications
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Project templates trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_project_templates_updated_at') THEN
        CREATE TRIGGER update_project_templates_updated_at
            BEFORE UPDATE ON project_templates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Budget categories trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_categories_updated_at') THEN
        CREATE TRIGGER update_budget_categories_updated_at
            BEFORE UPDATE ON budget_categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- SEED DATA FOR ENHANCED FEATURES
-- ============================================================================

-- Insert default project templates
INSERT INTO project_templates (name, description, category, template_data, created_by) VALUES
('Basic Infrastructure Project', 'Template for basic infrastructure projects', 'infrastructure', '{
    "details": {
        "category": "infrastructure",
        "projectType": "construction",
        "description": "Basic infrastructure development project"
    },
    "budget": {
        "categories": [
            {"name": "Planning & Design", "amount": "50000"},
            {"name": "Construction", "amount": "200000"},
            {"name": "Materials", "amount": "100000"},
            {"name": "Contingency", "amount": "35000"}
        ]
    }
}', 1),

('IT System Implementation', 'Template for IT system projects', 'technology', '{
    "details": {
        "category": "technology",
        "projectType": "implementation",
        "description": "IT system implementation project"
    },
    "budget": {
        "categories": [
            {"name": "Software Licenses", "amount": "75000"},
            {"name": "Hardware", "amount": "50000"},
            {"name": "Implementation Services", "amount": "100000"},
            {"name": "Training", "amount": "25000"}
        ]
    }
}', 1),

('Public Service Initiative', 'Template for public service projects', 'public_service', '{
    "details": {
        "category": "public_service",
        "projectType": "service_delivery",
        "description": "Public service delivery initiative"
    },
    "budget": {
        "categories": [
            {"name": "Personnel", "amount": "150000"},
            {"name": "Operations", "amount": "75000"},
            {"name": "Marketing & Communications", "amount": "25000"},
            {"name": "Evaluation", "amount": "15000"}
        ]
    }
}', 1)
ON CONFLICT DO NOTHING;

-- Update vendor statistics (project count and ratings)
UPDATE vendors SET 
    project_count = (
        SELECT COUNT(*) 
        FROM project_vendors pv 
        WHERE pv.vendor_id = vendors.id
    ),
    avg_rating = COALESCE((
        SELECT AVG(rating) 
        FROM vendor_ratings vr 
        WHERE vr.vendor_id = vendors.id
    ), 0.00)
WHERE EXISTS (SELECT 1 FROM project_vendors WHERE vendor_id = vendors.id);

-- ============================================================================
-- VIEWS FOR ENHANCED REPORTING
-- ============================================================================

-- Create view for wizard completion statistics
CREATE OR REPLACE VIEW wizard_completion_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_sessions,
    COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_sessions,
    ROUND(
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2
    ) as completion_rate
FROM project_wizard_sessions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create view for step completion analytics
CREATE OR REPLACE VIEW wizard_step_analytics AS
SELECT 
    step_id,
    COUNT(*) as total_completions,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_completion_time_seconds
FROM project_wizard_step_data
GROUP BY step_id
ORDER BY step_id;

-- Create view for user notification summary
CREATE OR REPLACE VIEW user_notification_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(un.id) as total_notifications,
    COUNT(CASE WHEN un.read = false THEN 1 END) as unread_notifications,
    MAX(un.created_at) as last_notification_at
FROM users u
LEFT JOIN user_notifications un ON u.id = un.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email;

-- ============================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to clean up old wizard sessions
CREATE OR REPLACE FUNCTION cleanup_old_wizard_sessions(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old abandoned sessions and their related data
    WITH deleted_sessions AS (
        DELETE FROM project_wizard_sessions 
        WHERE status = 'abandoned' 
        AND created_at < CURRENT_DATE - INTERVAL '1 day' * days_old
        RETURNING session_id
    )
    DELETE FROM project_wizard_step_data 
    WHERE session_id IN (SELECT session_id FROM deleted_sessions);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old notification logs
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notification_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RECORD MIGRATION COMPLETION
-- ============================================================================

-- Record that this migration has been applied
INSERT INTO schema_migrations (version, description) VALUES 
('20241210_wizard_enhancements', 'Enhanced project wizard with notifications, templates, analytics, and performance improvements');

-- Commit transaction
COMMIT;

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration 20241210_wizard_enhancements completed successfully!';
    RAISE NOTICE 'Enhanced wizard features are now available.';
END $$;

