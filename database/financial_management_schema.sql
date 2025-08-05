-- Financial Management Database Schema
-- Enhanced budget management, reporting, and approval workflows

-- Project Budgets (enhanced budget management)
CREATE TABLE IF NOT EXISTS project_budgets (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_budget DECIMAL(15,2) NOT NULL,
    fiscal_year VARCHAR(10) NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Draft',
    approval_required BOOLEAN DEFAULT false,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, version)
);

-- Budget Categories (detailed budget breakdown)
CREATE TABLE IF NOT EXISTS budget_categories (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
    category_name VARCHAR(255) NOT NULL,
    category_code VARCHAR(50),
    allocated_amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Entries (expenses and commitments)
CREATE TABLE IF NOT EXISTS budget_entries (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    entry_type VARCHAR(50) NOT NULL, -- 'Expense', 'Commitment', 'Adjustment'
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Paid', 'Cancelled'
    reference_number VARCHAR(100),
    vendor_id INTEGER REFERENCES vendors(id),
    invoice_number VARCHAR(100),
    due_date DATE,
    paid_date DATE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Transfers (inter-category transfers)
CREATE TABLE IF NOT EXISTS budget_transfers (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
    from_category_id INTEGER NOT NULL REFERENCES budget_categories(id),
    to_category_id INTEGER NOT NULL REFERENCES budget_categories(id),
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT NOT NULL,
    transferred_by INTEGER NOT NULL REFERENCES users(id),
    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Approvals (approval workflow)
CREATE TABLE IF NOT EXISTS budget_approvals (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
    approval_level INTEGER DEFAULT 1,
    approver_id INTEGER REFERENCES users(id),
    requested_by INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Escalated'
    comments TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

-- Budget Audit Trail (comprehensive audit logging)
CREATE TABLE IF NOT EXISTS budget_audit_trail (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER REFERENCES project_budgets(id) ON DELETE CASCADE,
    entry_id INTEGER REFERENCES budget_entries(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    amount DECIMAL(15,2),
    performed_by INTEGER NOT NULL REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Financial Reports (saved reports)
CREATE TABLE IF NOT EXISTS financial_reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL, -- 'Budget Summary', 'Variance Analysis', 'Cash Flow', 'Custom'
    report_parameters JSONB NOT NULL,
    report_data JSONB,
    project_id INTEGER REFERENCES projects(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_generated TIMESTAMP,
    is_scheduled BOOLEAN DEFAULT false,
    schedule_frequency VARCHAR(50), -- 'Daily', 'Weekly', 'Monthly', 'Quarterly'
    next_run_date TIMESTAMP
);

-- Report Subscriptions (report distribution)
CREATE TABLE IF NOT EXISTS report_subscriptions (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES financial_reports(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_method VARCHAR(50) DEFAULT 'Email', -- 'Email', 'Dashboard', 'Both'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_id, user_id)
);

-- Cash Flow Projections (cash flow management)
CREATE TABLE IF NOT EXISTS cash_flow_projections (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    projection_date DATE NOT NULL,
    projected_inflow DECIMAL(15,2) DEFAULT 0,
    projected_outflow DECIMAL(15,2) DEFAULT 0,
    actual_inflow DECIMAL(15,2),
    actual_outflow DECIMAL(15,2),
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, projection_date)
);

-- Expense Categories (standardized expense categories)
CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    category_code VARCHAR(50) UNIQUE NOT NULL,
    parent_category_id INTEGER REFERENCES expense_categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    approval_threshold DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders (procurement management)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    budget_entry_id INTEGER REFERENCES budget_entries(id),
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Pending Approval', 'Approved', 'Sent', 'Received', 'Closed'
    description TEXT,
    terms_and_conditions TEXT,
    delivery_date DATE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Line Items (detailed PO items)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    category_id INTEGER REFERENCES expense_categories(id),
    delivery_date DATE,
    received_quantity DECIMAL(10,2) DEFAULT 0,
    received_date DATE
);

-- Invoices (invoice management)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    vendor_invoice_number VARCHAR(100),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id),
    po_id INTEGER REFERENCES purchase_orders(id),
    budget_entry_id INTEGER REFERENCES budget_entries(id),
    invoice_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Received', -- 'Received', 'Under Review', 'Approved', 'Paid', 'Disputed'
    payment_terms VARCHAR(100),
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    paid_by INTEGER REFERENCES users(id),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, vendor_invoice_number)
);

-- Payment Records (payment tracking)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'EFT', 'Check', 'Wire Transfer', 'Credit Card'
    payment_reference VARCHAR(100),
    bank_reference VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Processed', -- 'Processed', 'Cleared', 'Failed', 'Cancelled'
    processed_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default expense categories
INSERT INTO expense_categories (category_name, category_code, description, requires_approval, approval_threshold) VALUES
('Personnel', 'PERS', 'Salaries, wages, benefits, and contractor fees', true, 10000.00),
('Equipment', 'EQUIP', 'Hardware, software, and equipment purchases', true, 5000.00),
('Materials', 'MAT', 'Raw materials and supplies', false, 2000.00),
('Travel', 'TRAV', 'Travel expenses including accommodation and meals', true, 1000.00),
('Professional Services', 'PROF', 'Consulting, legal, and professional services', true, 15000.00),
('Utilities', 'UTIL', 'Electricity, water, gas, and telecommunications', false, 500.00),
('Maintenance', 'MAINT', 'Equipment and facility maintenance', false, 3000.00),
('Training', 'TRAIN', 'Training and professional development', true, 2000.00),
('Marketing', 'MARK', 'Marketing and promotional activities', true, 5000.00),
('Administrative', 'ADMIN', 'General administrative expenses', false, 1000.00),
('Research & Development', 'RND', 'Research and development activities', true, 20000.00),
('Contingency', 'CONT', 'Contingency and emergency funds', true, 50000.00)
ON CONFLICT (category_code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_budgets_project_id ON project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_status ON project_budgets(status);
CREATE INDEX IF NOT EXISTS idx_project_budgets_fiscal_year ON project_budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_entries_budget_id ON budget_entries(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_entries_category_id ON budget_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_entries_status ON budget_entries(status);
CREATE INDEX IF NOT EXISTS idx_budget_entries_created_at ON budget_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_budget_id ON budget_transfers(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_approvals_budget_id ON budget_approvals(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_approvals_status ON budget_approvals(status);
CREATE INDEX IF NOT EXISTS idx_budget_audit_trail_budget_id ON budget_audit_trail(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_audit_trail_performed_at ON budget_audit_trail(performed_at);
CREATE INDEX IF NOT EXISTS idx_financial_reports_project_id ON financial_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_report_type ON financial_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_projections_project_id ON cash_flow_projections(project_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_projections_date ON cash_flow_projections(projection_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Add triggers for updated_at timestamps
DO $$ 
BEGIN
    -- Only create triggers if they don't already exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_project_budgets_updated_at') THEN
        CREATE TRIGGER update_project_budgets_updated_at 
            BEFORE UPDATE ON project_budgets 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_entries_updated_at') THEN
        CREATE TRIGGER update_budget_entries_updated_at 
            BEFORE UPDATE ON budget_entries 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cash_flow_projections_updated_at') THEN
        CREATE TRIGGER update_cash_flow_projections_updated_at 
            BEFORE UPDATE ON cash_flow_projections 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_orders_updated_at') THEN
        CREATE TRIGGER update_purchase_orders_updated_at 
            BEFORE UPDATE ON purchase_orders 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
        CREATE TRIGGER update_invoices_updated_at 
            BEFORE UPDATE ON invoices 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create views for common financial reports
CREATE OR REPLACE VIEW budget_summary_view AS
SELECT 
    pb.id as budget_id,
    pb.project_id,
    p.name as project_name,
    pb.total_budget,
    pb.fiscal_year,
    pb.status as budget_status,
    SUM(bc.allocated_amount) as total_allocated,
    COALESCE(SUM(be.amount), 0) as total_spent,
    SUM(bc.allocated_amount) - COALESCE(SUM(be.amount), 0) as remaining_budget,
    CASE 
        WHEN SUM(bc.allocated_amount) > 0 
        THEN (COALESCE(SUM(be.amount), 0) / SUM(bc.allocated_amount)) * 100 
        ELSE 0 
    END as utilization_percentage
FROM project_budgets pb
JOIN projects p ON pb.project_id = p.id
LEFT JOIN budget_categories bc ON pb.id = bc.budget_id
LEFT JOIN budget_entries be ON bc.id = be.category_id AND be.status != 'Cancelled'
WHERE pb.status = 'Active'
GROUP BY pb.id, pb.project_id, p.name, pb.total_budget, pb.fiscal_year, pb.status;

CREATE OR REPLACE VIEW vendor_spending_view AS
SELECT 
    v.id as vendor_id,
    v.name as vendor_name,
    p.id as project_id,
    p.name as project_name,
    COUNT(be.id) as transaction_count,
    SUM(be.amount) as total_spent,
    AVG(be.amount) as average_transaction,
    MIN(be.created_at) as first_transaction,
    MAX(be.created_at) as last_transaction
FROM vendors v
JOIN budget_entries be ON v.id = be.vendor_id
JOIN budget_categories bc ON be.category_id = bc.id
JOIN project_budgets pb ON bc.budget_id = pb.id
JOIN projects p ON pb.project_id = p.id
WHERE be.status != 'Cancelled'
GROUP BY v.id, v.name, p.id, p.name;

CREATE OR REPLACE VIEW monthly_spending_view AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    DATE_TRUNC('month', be.created_at) as spending_month,
    bc.category_name,
    SUM(be.amount) as monthly_amount,
    COUNT(be.id) as transaction_count
FROM budget_entries be
JOIN budget_categories bc ON be.category_id = bc.id
JOIN project_budgets pb ON bc.budget_id = pb.id
JOIN projects p ON pb.project_id = p.id
WHERE be.status != 'Cancelled'
GROUP BY p.id, p.name, DATE_TRUNC('month', be.created_at), bc.category_name
ORDER BY spending_month DESC, p.name, bc.category_name;

