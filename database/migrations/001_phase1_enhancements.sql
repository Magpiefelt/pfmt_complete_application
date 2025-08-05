-- Phase 1 Database Enhancements
-- Additive migrations only - no destructive changes

-- Contract payments table for tracking payment transactions
CREATE TABLE IF NOT EXISTS contract_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL, -- Will reference contracts table when it exists
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    source_ref VARCHAR(255), -- Reference to external system (e.g., 1GX)
    payment_type VARCHAR(100), -- e.g., 'progress', 'final', 'holdback'
    description TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget transfers table for tracking budget movements between categories
CREATE TABLE IF NOT EXISTS budget_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    from_category VARCHAR(255) NOT NULL,
    to_category VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transfer_date DATE DEFAULT CURRENT_DATE,
    rationale TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts table if it doesn't exist (for contract payment references)
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    contract_number VARCHAR(255) UNIQUE,
    contract_name VARCHAR(255) NOT NULL,
    contract_type VARCHAR(100),
    original_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract change orders table for tracking contract modifications
CREATE TABLE IF NOT EXISTS contract_change_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    change_order_number VARCHAR(100),
    description TEXT,
    amount_change DECIMAL(15,2),
    time_change_days INTEGER DEFAULT 0,
    reason TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor performance reviews table for tracking vendor ratings
CREATE TABLE IF NOT EXISTS vendor_performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    overall_rating DECIMAL(3,2) CHECK (overall_rating >= 0 AND overall_rating <= 5),
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 0 AND quality_rating <= 5),
    schedule_rating DECIMAL(3,2) CHECK (schedule_rating >= 0 AND schedule_rating <= 5),
    communication_rating DECIMAL(3,2) CHECK (communication_rating >= 0 AND communication_rating <= 5),
    cost_rating DECIMAL(3,2) CHECK (cost_rating >= 0 AND cost_rating <= 5),
    review_notes TEXT,
    review_date DATE DEFAULT CURRENT_DATE,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add optional fields to existing tables (only if they don't exist)

-- Add comments field to audit_log if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_log' AND column_name = 'comments') THEN
        ALTER TABLE audit_log ADD COLUMN comments TEXT;
    END IF;
END $$;

-- Add average_score field to vendors table for performance caching
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'average_score') THEN
        ALTER TABLE vendors ADD COLUMN average_score DECIMAL(3,2);
    END IF;
END $$;

-- Add workflow_state and next_action fields to projects table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'workflow_state') THEN
        ALTER TABLE projects ADD COLUMN workflow_state VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'next_action') THEN
        ALTER TABLE projects ADD COLUMN next_action TEXT;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_payments_contract_id ON contract_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_payments_project_id ON contract_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_payments_payment_date ON contract_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_contract_payments_status ON contract_payments(status);

CREATE INDEX IF NOT EXISTS idx_budget_transfers_project_id ON budget_transfers(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_transfer_date ON budget_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_budget_transfers_status ON budget_transfers(status);

CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);

CREATE INDEX IF NOT EXISTS idx_contract_change_orders_contract_id ON contract_change_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_change_orders_status ON contract_change_orders(status);

CREATE INDEX IF NOT EXISTS idx_vendor_performance_reviews_vendor_id ON vendor_performance_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_reviews_project_id ON vendor_performance_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_reviews_contract_id ON vendor_performance_reviews(contract_id);

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_contract_payments_updated_at 
    BEFORE UPDATE ON contract_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_transfers_updated_at 
    BEFORE UPDATE ON budget_transfers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at 
    BEFORE UPDATE ON contracts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_change_orders_updated_at 
    BEFORE UPDATE ON contract_change_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_performance_reviews_updated_at 
    BEFORE UPDATE ON vendor_performance_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply audit triggers to new tables
CREATE TRIGGER audit_contract_payments 
    AFTER INSERT OR UPDATE OR DELETE ON contract_payments 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_budget_transfers 
    AFTER INSERT OR UPDATE OR DELETE ON budget_transfers 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_contracts 
    AFTER INSERT OR UPDATE OR DELETE ON contracts 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_contract_change_orders 
    AFTER INSERT OR UPDATE OR DELETE ON contract_change_orders 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_vendor_performance_reviews 
    AFTER INSERT OR UPDATE OR DELETE ON vendor_performance_reviews 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Function to update vendor average score
CREATE OR REPLACE FUNCTION update_vendor_average_score(vendor_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE vendors 
    SET average_score = (
        SELECT AVG(overall_rating)
        FROM vendor_performance_reviews 
        WHERE vendor_id = vendor_uuid
    )
    WHERE id = vendor_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update vendor average score when reviews are added/updated
CREATE OR REPLACE FUNCTION trigger_update_vendor_average_score()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_vendor_average_score(OLD.vendor_id);
        RETURN OLD;
    ELSE
        PERFORM update_vendor_average_score(NEW.vendor_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_score_on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON vendor_performance_reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_update_vendor_average_score();

COMMIT;

