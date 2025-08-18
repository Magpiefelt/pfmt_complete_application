-- TEAM A FEATURE ENHANCEMENTS FOR TEAM B SCHEMA (CORRECTED)
-- This script adds Team A's unique tables and fields to Team B's existing schema
-- Execute this after Team B's schema-COMPLETE.sql is already applied

-- ============================================================================
-- PHASE 1: ADD TEAM A'S MISSING TABLES
-- ============================================================================

-- Contracts table for contract management and tracking
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Completed', 'Terminated', 'Expired')),
    performance_metrics JSONB,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table for project reporting and documentation
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected')),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate meetings table for project governance and milestone meetings
CREATE TABLE IF NOT EXISTS gate_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    meeting_date TIMESTAMP,
    agenda TEXT,
    attendees JSONB,
    action_items JSONB,
    decisions JSONB,
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced tasks table (more flexible than Team B's workflow_tasks)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    related_entity_type VARCHAR(50), -- 'project', 'contract', 'report', 'gate_meeting', etc.
    related_entity_id UUID,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Change orders table for contract change order management
CREATE TABLE IF NOT EXISTS change_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    change_order_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    reason TEXT,
    cost_impact DECIMAL(15,2) DEFAULT 0,
    schedule_impact INTEGER, -- days
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented')),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced file uploads table (more flexible than Team B's pfmt_files)
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    size INTEGER,
    path VARCHAR(500) NOT NULL,
    related_entity_type VARCHAR(50), -- 'project', 'contract', 'report', 'gate_meeting', 'task', 'change_order'
    related_entity_id UUID,
    uploaded_by UUID REFERENCES users(id),
    description TEXT,
    tags JSONB,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PHASE 2: ENHANCE EXISTING PROJECTS TABLE WITH TEAM A FIELDS
-- ============================================================================

-- Add Team A's budget management fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_estimate DECIMAL(15,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contingency DECIMAL(15,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS management_reserve DECIMAL(15,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS eac_forecast DECIMAL(15,2);

-- Add direct PM assignment (simpler than Team B's complex team structure)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_pm UUID REFERENCES users(id);

-- Add Team A's project categorization
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type VARCHAR(100);

-- ============================================================================
-- PHASE 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for contracts table
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);

-- Indexes for reports table
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);

-- Indexes for gate_meetings table
CREATE INDEX IF NOT EXISTS idx_gate_meetings_project_id ON gate_meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_gate_meetings_meeting_date ON gate_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_gate_meetings_status ON gate_meetings(status);

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_related_entity ON tasks(related_entity_type, related_entity_id);

-- Indexes for change_orders table
CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_contract_id ON change_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_change_order_number ON change_orders(change_order_number);

-- Indexes for file_uploads table
CREATE INDEX IF NOT EXISTS idx_file_uploads_entity ON file_uploads(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);

-- Indexes for enhanced projects fields
CREATE INDEX IF NOT EXISTS idx_projects_assigned_pm ON projects(assigned_pm);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);

-- ============================================================================
-- PHASE 4: ADD UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================================================

-- Apply updated_at triggers to new tables (only if the trigger function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Create triggers for new tables
        EXECUTE 'CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
        EXECUTE 'CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
        EXECUTE 'CREATE TRIGGER update_gate_meetings_updated_at BEFORE UPDATE ON gate_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
        EXECUTE 'CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
        EXECUTE 'CREATE TRIGGER update_change_orders_updated_at BEFORE UPDATE ON change_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
        EXECUTE 'CREATE TRIGGER update_file_uploads_updated_at BEFORE UPDATE ON file_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    ELSE
        RAISE NOTICE 'update_updated_at_column function not found, skipping trigger creation';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Triggers already exist, skipping creation';
END $$;

-- ============================================================================
-- PHASE 5: CREATE VIEWS FOR COMPATIBILITY
-- ============================================================================

-- Create view to maintain compatibility with Team A's simpler project structure
CREATE OR REPLACE VIEW projects_team_a_compatible AS
SELECT 
    id,
    project_name as name,
    project_description as description,
    budget_estimate,
    contingency,
    management_reserve,
    eac_forecast,
    assigned_pm,
    category,
    type,
    project_status as status,
    created_by,
    created_at,
    updated_at
FROM projects;

-- Create view for enhanced project summary with Team A features
CREATE OR REPLACE VIEW project_summary_enhanced AS
SELECT 
    p.id,
    p.project_name,
    p.project_description,
    p.project_status,
    p.budget_estimate,
    p.contingency,
    p.management_reserve,
    p.eac_forecast,
    p.assigned_pm,
    u.first_name || ' ' || u.last_name as pm_name,
    COUNT(DISTINCT c.id) as contract_count,
    COUNT(DISTINCT r.id) as report_count,
    COUNT(DISTINCT gm.id) as gate_meeting_count,
    COUNT(DISTINCT t.id) as task_count,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN users u ON p.assigned_pm = u.id
LEFT JOIN contracts c ON p.id = c.project_id
LEFT JOIN reports r ON p.id = r.project_id
LEFT JOIN gate_meetings gm ON p.id = gm.project_id
LEFT JOIN tasks t ON t.related_entity_type = 'project' AND t.related_entity_id = p.id
GROUP BY p.id, u.first_name, u.last_name;

-- ============================================================================
-- PHASE 6: LOG SCHEMA ENHANCEMENT
-- ============================================================================

-- Log the schema enhancement in audit_logs if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, new_values, changed_at) 
        VALUES ('SCHEMA_ENHANCEMENT', 'database', uuid_generate_v4(), 
                '{"enhancement": "Team A features added", "tables_added": ["contracts", "reports", "gate_meetings", "tasks", "change_orders", "file_uploads"], "fields_added": ["budget_estimate", "contingency", "management_reserve", "eac_forecast", "assigned_pm", "category", "type"]}', 
                CURRENT_TIMESTAMP);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not log schema enhancement: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (COMMENTED OUT)
-- ============================================================================

-- Verify all new tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('contracts', 'reports', 'gate_meetings', 'tasks', 'change_orders', 'file_uploads');

-- Verify new columns were added to projects table
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND column_name IN ('budget_estimate', 'contingency', 'management_reserve', 'eac_forecast', 'assigned_pm', 'category', 'type');

-- Verify indexes were created
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('contracts', 'reports', 'gate_meetings', 'tasks', 'change_orders', 'file_uploads');

-- Success message
SELECT 'Team A schema enhancements applied successfully!' as result;

