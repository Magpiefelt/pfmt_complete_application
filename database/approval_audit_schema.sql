-- Additional schema for approval workflows and audit trails
-- This extends the financial_management_schema.sql

-- Approval Notifications (notification system)
CREATE TABLE IF NOT EXISTS approval_notifications (
    id SERIAL PRIMARY KEY,
    approval_id INTEGER NOT NULL REFERENCES budget_approvals(id) ON DELETE CASCADE,
    recipient_role VARCHAR(100) NOT NULL,
    recipient_user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'Approval Request', -- 'Approval Request', 'Approval Decision', 'Escalation'
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Delegation (delegation management)
CREATE TABLE IF NOT EXISTS approval_delegations (
    id SERIAL PRIMARY KEY,
    delegator_id INTEGER NOT NULL REFERENCES users(id),
    delegate_id INTEGER NOT NULL REFERENCES users(id),
    approval_level INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(delegator_id, approval_level, start_date)
);

-- Approval Rules (configurable approval rules)
CREATE TABLE IF NOT EXISTS approval_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL, -- 'Budget Amount', 'Project Type', 'Department', 'Custom'
    condition_field VARCHAR(100) NOT NULL,
    condition_operator VARCHAR(20) NOT NULL, -- '>', '<', '>=', '<=', '=', 'IN', 'LIKE'
    condition_value TEXT NOT NULL,
    approval_level INTEGER NOT NULL,
    required_approvers INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Rule Exceptions (rule exceptions)
CREATE TABLE IF NOT EXISTS approval_rule_exceptions (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES approval_rules(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id),
    user_id INTEGER REFERENCES users(id),
    exception_reason TEXT NOT NULL,
    approved_by INTEGER NOT NULL REFERENCES users(id),
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Templates (approval templates)
CREATE TABLE IF NOT EXISTS approval_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL, -- 'Budget', 'Contract', 'Purchase Order', 'Custom'
    approval_levels JSONB NOT NULL, -- Array of approval level configurations
    auto_escalation_days INTEGER DEFAULT 7,
    notification_settings JSONB,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Audit Trail with more details
CREATE TABLE IF NOT EXISTS enhanced_audit_trail (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- 'Budget', 'Project', 'Vendor', 'Contract'
    entity_id INTEGER NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    change_summary TEXT,
    risk_level VARCHAR(20) DEFAULT 'Low', -- 'Low', 'Medium', 'High', 'Critical'
    compliance_flags JSONB,
    performed_by INTEGER NOT NULL REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    api_endpoint VARCHAR(255),
    request_method VARCHAR(10),
    response_status INTEGER,
    processing_time_ms INTEGER
);

-- Compliance Checks (compliance monitoring)
CREATE TABLE IF NOT EXISTS compliance_checks (
    id SERIAL PRIMARY KEY,
    check_name VARCHAR(255) NOT NULL,
    check_type VARCHAR(100) NOT NULL, -- 'Budget Limit', 'Approval Authority', 'Segregation of Duties'
    entity_type VARCHAR(100) NOT NULL,
    check_criteria JSONB NOT NULL,
    severity_level VARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Violations (violation tracking)
CREATE TABLE IF NOT EXISTS compliance_violations (
    id SERIAL PRIMARY KEY,
    check_id INTEGER NOT NULL REFERENCES compliance_checks(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER NOT NULL,
    violation_description TEXT NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Acknowledged', 'Resolved', 'Accepted Risk'
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

-- Workflow States (workflow state management)
CREATE TABLE IF NOT EXISTS workflow_states (
    id SERIAL PRIMARY KEY,
    workflow_type VARCHAR(100) NOT NULL, -- 'Budget Approval', 'Vendor Onboarding', 'Contract Review'
    entity_id INTEGER NOT NULL,
    current_state VARCHAR(100) NOT NULL,
    previous_state VARCHAR(100),
    next_possible_states JSONB,
    state_data JSONB,
    assigned_to INTEGER REFERENCES users(id),
    due_date TIMESTAMP,
    state_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    state_changed_by INTEGER NOT NULL REFERENCES users(id)
);

-- Insert default approval rules
INSERT INTO approval_rules (rule_name, rule_type, condition_field, condition_operator, condition_value, approval_level, created_by) VALUES
('Small Budget Approval', 'Budget Amount', 'total_budget', '<=', '50000', 1, 1),
('Medium Budget Approval', 'Budget Amount', 'total_budget', '<=', '250000', 2, 1),
('Large Budget Approval', 'Budget Amount', 'total_budget', '<=', '1000000', 2, 1),
('Executive Budget Approval', 'Budget Amount', 'total_budget', '>', '1000000', 3, 1),
('Emergency Project Approval', 'Project Type', 'project_type', '=', 'Emergency', 2, 1),
('Research Project Approval', 'Project Type', 'project_type', '=', 'Research', 2, 1)
ON CONFLICT DO NOTHING;

-- Insert default approval templates
INSERT INTO approval_templates (template_name, template_type, approval_levels, notification_settings, is_default, created_by) VALUES
('Standard Budget Approval', 'Budget', 
 '[{"level": 1, "role": "Manager", "amount_threshold": 50000}, {"level": 2, "role": "Director", "amount_threshold": 250000}, {"level": 3, "role": "Executive", "amount_threshold": null}]',
 '{"email_notifications": true, "dashboard_notifications": true, "escalation_hours": 48}',
 true, 1),
('Fast Track Approval', 'Budget',
 '[{"level": 1, "role": "Director", "amount_threshold": 100000}, {"level": 2, "role": "Executive", "amount_threshold": null}]',
 '{"email_notifications": true, "dashboard_notifications": true, "escalation_hours": 24}',
 false, 1),
('Contract Approval', 'Contract',
 '[{"level": 1, "role": "Legal", "amount_threshold": null}, {"level": 2, "role": "Director", "amount_threshold": 500000}, {"level": 3, "role": "Executive", "amount_threshold": null}]',
 '{"email_notifications": true, "dashboard_notifications": true, "escalation_hours": 72}',
 true, 1)
ON CONFLICT DO NOTHING;

-- Insert default compliance checks
INSERT INTO compliance_checks (check_name, check_type, entity_type, check_criteria, severity_level, created_by) VALUES
('Budget Overspend Check', 'Budget Limit', 'Budget', '{"threshold_percent": 90, "alert_percent": 80}', 'High', 1),
('Approval Authority Check', 'Approval Authority', 'Budget', '{"check_delegation": true, "check_authority_limits": true}', 'Critical', 1),
('Segregation of Duties', 'Segregation of Duties', 'Budget', '{"same_user_create_approve": false, "minimum_approvers": 1}', 'Medium', 1),
('Vendor Payment Limit', 'Budget Limit', 'Payment', '{"single_payment_limit": 100000, "monthly_limit": 500000}', 'High', 1)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_notifications_approval_id ON approval_notifications(approval_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_recipient ON approval_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_read ON approval_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_approval_delegations_delegator ON approval_delegations(delegator_id);
CREATE INDEX IF NOT EXISTS idx_approval_delegations_delegate ON approval_delegations(delegate_id);
CREATE INDEX IF NOT EXISTS idx_approval_delegations_active ON approval_delegations(is_active);
CREATE INDEX IF NOT EXISTS idx_approval_rules_type ON approval_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_approval_rules_active ON approval_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_trail_entity ON enhanced_audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_trail_performed_at ON enhanced_audit_trail(performed_at);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_trail_performed_by ON enhanced_audit_trail(performed_by);
CREATE INDEX IF NOT EXISTS idx_enhanced_audit_trail_risk_level ON enhanced_audit_trail(risk_level);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_type ON compliance_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_active ON compliance_checks(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_status ON compliance_violations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity ON compliance_violations(severity_level);
CREATE INDEX IF NOT EXISTS idx_workflow_states_type_entity ON workflow_states(workflow_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_assigned_to ON workflow_states(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_states_due_date ON workflow_states(due_date);

-- Add triggers for updated_at timestamps
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_approval_rules_updated_at') THEN
        CREATE TRIGGER update_approval_rules_updated_at 
            BEFORE UPDATE ON approval_rules 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_approval_templates_updated_at') THEN
        CREATE TRIGGER update_approval_templates_updated_at 
            BEFORE UPDATE ON approval_templates 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_compliance_checks_updated_at') THEN
        CREATE TRIGGER update_compliance_checks_updated_at 
            BEFORE UPDATE ON compliance_checks 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create views for common approval and audit queries
CREATE OR REPLACE VIEW pending_approvals_view AS
SELECT 
    ba.id as approval_id,
    ba.budget_id,
    ba.approval_level,
    ba.urgency,
    ba.requested_at,
    ba.comments as approval_comments,
    pb.total_budget,
    pb.fiscal_year,
    p.id as project_id,
    p.name as project_name,
    u.name as requested_by_name,
    EXTRACT(DAYS FROM (NOW() - ba.requested_at)) as days_pending
FROM budget_approvals ba
JOIN project_budgets pb ON ba.budget_id = pb.id
JOIN projects p ON pb.project_id = p.id
JOIN users u ON ba.requested_by = u.id
WHERE ba.status = 'Pending'
ORDER BY 
    CASE ba.urgency 
        WHEN 'High' THEN 1 
        WHEN 'Normal' THEN 2 
        WHEN 'Low' THEN 3 
    END,
    ba.requested_at ASC;

CREATE OR REPLACE VIEW audit_summary_view AS
SELECT 
    DATE_TRUNC('day', bat.performed_at) as audit_date,
    bat.action_type,
    COUNT(*) as action_count,
    COUNT(DISTINCT bat.performed_by) as unique_users,
    COUNT(DISTINCT bat.budget_id) as affected_budgets
FROM budget_audit_trail bat
WHERE bat.performed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', bat.performed_at), bat.action_type
ORDER BY audit_date DESC, action_count DESC;

CREATE OR REPLACE VIEW compliance_dashboard_view AS
SELECT 
    cc.check_name,
    cc.check_type,
    cc.severity_level,
    COUNT(cv.id) as total_violations,
    COUNT(CASE WHEN cv.status = 'Open' THEN 1 END) as open_violations,
    COUNT(CASE WHEN cv.status = 'Resolved' THEN 1 END) as resolved_violations,
    MAX(cv.detected_at) as last_violation_date
FROM compliance_checks cc
LEFT JOIN compliance_violations cv ON cc.id = cv.check_id
WHERE cc.is_active = true
GROUP BY cc.id, cc.check_name, cc.check_type, cc.severity_level
ORDER BY open_violations DESC, cc.severity_level DESC;

