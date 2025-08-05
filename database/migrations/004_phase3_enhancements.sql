-- Phase 3 Database Enhancements
-- Financial Clarity, Rollups, Exports & Print

-- Add denormalized financial fields to projects table for performance
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_committed DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_variance DECIMAL(15,2) DEFAULT 0;

-- Add denormalized financial fields to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS holdback_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_remaining DECIMAL(15,2) DEFAULT 0;

-- Create audit logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit logs performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Create financial summaries view for easy reporting
CREATE OR REPLACE VIEW project_financial_summary AS
SELECT 
    p.id,
    p.project_name,
    p.total_budget,
    COALESCE(p.total_spent, 0) as total_spent,
    COALESCE(p.total_committed, 0) as total_committed,
    (p.total_budget - COALESCE(p.total_spent, 0) - COALESCE(p.total_committed, 0)) as available_budget,
    COALESCE(p.total_variance, 0) as total_variance,
    CASE 
        WHEN p.total_budget > 0 THEN 
            ROUND((COALESCE(p.total_spent, 0) / p.total_budget * 100), 2)
        ELSE 0 
    END as spent_percentage,
    CASE 
        WHEN p.total_budget > 0 THEN 
            ROUND(((COALESCE(p.total_spent, 0) + COALESCE(p.total_committed, 0)) / p.total_budget * 100), 2)
        ELSE 0 
    END as utilized_percentage
FROM projects p;

-- Create contract financial summary view
CREATE OR REPLACE VIEW contract_financial_summary AS
SELECT 
    c.id,
    c.contract_number,
    c.vendor_id,
    c.project_id,
    c.original_amount,
    COALESCE(co_summary.total_co_amount, 0) as total_change_orders,
    (c.original_amount + COALESCE(co_summary.total_co_amount, 0)) as revised_amount,
    COALESCE(c.total_paid, 0) as total_paid,
    COALESCE(c.holdback_amount, 0) as holdback_amount,
    COALESCE(c.balance_remaining, 0) as balance_remaining,
    c.status,
    c.created_at
FROM contracts c
LEFT JOIN (
    SELECT 
        contract_id,
        SUM(amount) as total_co_amount
    FROM change_orders 
    WHERE status = 'Approved'
    GROUP BY contract_id
) co_summary ON c.id = co_summary.contract_id;

-- Create export tracking table for audit purposes
CREATE TABLE IF NOT EXISTS export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    export_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    filter_criteria JSONB,
    record_count INTEGER,
    file_name VARCHAR(255),
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for export logs
CREATE INDEX IF NOT EXISTS idx_export_logs_user ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_type ON export_logs(export_type);
CREATE INDEX IF NOT EXISTS idx_export_logs_date ON export_logs(exported_at);

-- Add print settings table for customizable print layouts
CREATE TABLE IF NOT EXISTS print_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    template_name VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint for default print settings per user per template
CREATE UNIQUE INDEX IF NOT EXISTS idx_print_settings_user_template_default 
ON print_settings(user_id, template_name) 
WHERE is_default = true;

-- Function to update financial totals for projects
CREATE OR REPLACE FUNCTION update_project_financials(project_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE projects 
    SET 
        total_spent = COALESCE((
            SELECT SUM(amount) 
            FROM contract_payments cp
            JOIN contracts c ON cp.contract_id = c.id
            WHERE c.project_id = project_uuid
        ), 0),
        total_committed = COALESCE((
            SELECT SUM(c.original_amount + COALESCE(co.total_co, 0))
            FROM contracts c
            LEFT JOIN (
                SELECT contract_id, SUM(amount) as total_co
                FROM change_orders 
                WHERE status = 'Approved'
                GROUP BY contract_id
            ) co ON c.id = co.contract_id
            WHERE c.project_id = project_uuid
        ), 0)
    WHERE id = project_uuid;
    
    -- Update variance calculation
    UPDATE projects 
    SET total_variance = total_budget - total_spent - total_committed
    WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update contract financials
CREATE OR REPLACE FUNCTION update_contract_financials(contract_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE contracts 
    SET 
        total_paid = COALESCE((
            SELECT SUM(amount) 
            FROM contract_payments 
            WHERE contract_id = contract_uuid
        ), 0),
        balance_remaining = (
            original_amount + 
            COALESCE((
                SELECT SUM(amount) 
                FROM change_orders 
                WHERE contract_id = contract_uuid AND status = 'Approved'
            ), 0) - 
            COALESCE((
                SELECT SUM(amount) 
                FROM contract_payments 
                WHERE contract_id = contract_uuid
            ), 0) -
            COALESCE(holdback_amount, 0)
        )
    WHERE id = contract_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update project financials when payments change
CREATE OR REPLACE FUNCTION trigger_update_project_financials()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_project_financials((
            SELECT c.project_id 
            FROM contracts c 
            WHERE c.id = NEW.contract_id
        ));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_project_financials((
            SELECT c.project_id 
            FROM contracts c 
            WHERE c.id = OLD.contract_id
        ));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic financial updates
DROP TRIGGER IF EXISTS trigger_contract_payments_update_financials ON contract_payments;
CREATE TRIGGER trigger_contract_payments_update_financials
    AFTER INSERT OR UPDATE OR DELETE ON contract_payments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_project_financials();

-- Trigger to update contract financials
CREATE OR REPLACE FUNCTION trigger_update_contract_financials()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_contract_financials(NEW.contract_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_contract_financials(OLD.contract_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contract_payments_update_contract_financials ON contract_payments;
CREATE TRIGGER trigger_contract_payments_update_contract_financials
    AFTER INSERT OR UPDATE OR DELETE ON contract_payments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_contract_financials();

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system changes';
COMMENT ON TABLE export_logs IS 'Tracking of data exports for audit purposes';
COMMENT ON TABLE print_settings IS 'User-specific print layout preferences';
COMMENT ON VIEW project_financial_summary IS 'Consolidated financial view for projects';
COMMENT ON VIEW contract_financial_summary IS 'Consolidated financial view for contracts';

-- Insert initial audit log entry for migration
INSERT INTO audit_logs (user_id, entity_type, entity_id, action, field_name, new_value)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@alberta.ca' LIMIT 1),
    'system',
    gen_random_uuid(),
    'migration',
    'database_version',
    'Phase 3 enhancements applied'
);

