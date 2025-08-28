-- ============================================================================
-- PFMT CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- This schema consolidates all database changes from multiple schema files
-- into a single, comprehensive source of truth for the PFMT application.
-- 
-- Consolidated from:
-- - schema-COMPLETE.sql (primary base)
-- - fresh_schema.sql (workflow enhancements)
-- - schema_enhancements.sql (additional tables)
-- - All migration files from backend/database/migrations/
-- - All migration files from database/migrations/
-- 
-- Created: 2025-08-20
-- Version: 3.0.0 (Consolidated)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP EXISTING TABLES (for clean reset)
-- ============================================================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS workflow_tasks CASCADE;
DROP TABLE IF EXISTS project_versions CASCADE;
DROP TABLE IF EXISTS company_vendors CASCADE;
DROP TABLE IF EXISTS project_vendors CASCADE;
DROP TABLE IF EXISTS project_teams CASCADE;
DROP TABLE IF EXISTS project_locations CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS pfmt_files CASCADE;
DROP TABLE IF EXISTS school_jurisdictions CASCADE;
DROP TABLE IF EXISTS client_ministries CASCADE;
DROP TABLE IF EXISTS capital_plan_lines CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS gate_meetings CASCADE;
DROP TABLE IF EXISTS project_templates CASCADE;
DROP TABLE IF EXISTS project_wizard_sessions CASCADE;
DROP TABLE IF EXISTS schema_version CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table for authentication and user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin','pmi','director','pm','spm','analyst','executive','vendor','user')),
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table for organizational entities
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    location VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors table for vendor management
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    capabilities TEXT,
    category VARCHAR(100),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    certification_level VARCHAR(100),
    performance_rating DECIMAL(3,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capital plan lines for project categorization
CREATE TABLE capital_plan_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget_amount DECIMAL(15,2),
    fiscal_year INTEGER,
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client ministries for government organization
CREATE TABLE client_ministries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(20),
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- School jurisdictions for education projects
CREATE TABLE school_jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE,
    name VARCHAR(255) NOT NULL,
    jurisdiction_code VARCHAR(20),
    region VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PFMT files for project file management
CREATE TABLE pfmt_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(50),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJECTS TABLE - COMPREHENSIVE WITH ALL FIELD VARIATIONS
-- ============================================================================

-- Main projects table - FIELD NAMES MATCH ALL MODEL VARIATIONS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core project identification (supports multiple naming conventions)
    project_name VARCHAR(255) NOT NULL,
    name VARCHAR(255), -- For wizard compatibility (synced with project_name)
    code VARCHAR(100), -- For wizard compatibility
    cpd_number VARCHAR(100),
    
    -- Project description (supports multiple naming conventions)
    project_description TEXT,
    description TEXT,  -- For wizard compatibility (synced with project_description)
    
    -- Status tracking (multiple status systems for compatibility)
    report_status VARCHAR(50) DEFAULT 'update_required',
    project_status VARCHAR(50) DEFAULT 'active',
    project_phase VARCHAR(50) DEFAULT 'planning',
    status VARCHAR(50) DEFAULT 'Active', -- For wizard compatibility
    workflow_status VARCHAR(20) DEFAULT 'initiated' 
        CHECK (workflow_status IN ('initiated','assigned','finalized','active','on_hold','complete','archived')),
    
    -- Audit and modification tracking
    modified_by UUID REFERENCES users(id),
    modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id), -- For wizard compatibility
    
    -- Workflow assignments (from fresh_schema)
    assigned_pm UUID REFERENCES users(id),
    assigned_spm UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    finalized_by UUID REFERENCES users(id),
    finalized_at TIMESTAMPTZ,
    workflow_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Important dates
    reporting_as_of_date DATE,
    director_review_date DATE,
    pfmt_data_date DATE,
    archived_date DATE,
    start_date DATE,
    end_date DATE,
    
    -- Project classification
    capital_plan_line_id UUID REFERENCES capital_plan_lines(id),
    approval_year INTEGER,
    project_category VARCHAR(100),
    funded_to_complete BOOLEAN DEFAULT false,
    client_ministry_id UUID REFERENCES client_ministries(id),
    school_jurisdiction_id UUID REFERENCES school_jurisdictions(id),
    pfmt_file_id UUID REFERENCES pfmt_files(id),
    
    -- Project type and delivery
    project_type VARCHAR(100),
    delivery_type VARCHAR(100),
    specific_delivery_type VARCHAR(100),
    delivery_method VARCHAR(100),
    program VARCHAR(100),
    geographic_region VARCHAR(100),
    
    -- Budget information
    estimated_budget DECIMAL(15,2),
    budget_total DECIMAL(15,2), -- For wizard compatibility
    budget_currency VARCHAR(3) DEFAULT 'CAD', -- For wizard compatibility
    budget_breakdown JSONB,
    
    -- Facility-specific fields
    number_of_beds INTEGER,
    total_opening_capacity INTEGER,
    capacity_at_full_build_out INTEGER,
    is_charter_school BOOLEAN DEFAULT false,
    grades_from INTEGER,
    grades_to INTEGER,
    square_meters DECIMAL(10,2),
    number_of_jobs INTEGER,
    
    -- Additional project details (for finalization step)
    detailed_description TEXT,
    risk_assessment TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJECT RELATED TABLES
-- ============================================================================

-- Project locations for geographic information
CREATE TABLE project_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Address information (for wizard compatibility)
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    municipality VARCHAR(255),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Canada',
    
    -- Legacy location fields (for Project model compatibility)
    location VARCHAR(255),
    urban_rural VARCHAR(50),
    project_address TEXT,
    constituency VARCHAR(100),
    
    -- Building information
    building_name VARCHAR(255),
    building_type VARCHAR(100),
    building_id VARCHAR(100),
    building_owner VARCHAR(255),
    
    -- Political and administrative
    mla VARCHAR(255),
    plan VARCHAR(100),
    block VARCHAR(100),
    lot VARCHAR(100),
    
    -- Geographic coordinates
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project teams for team member assignments
CREATE TABLE project_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    executive_director_id UUID REFERENCES users(id),
    director_id UUID REFERENCES users(id),
    sr_project_manager_id UUID REFERENCES users(id),
    project_manager_id UUID REFERENCES users(id),
    project_coordinator_id UUID REFERENCES users(id),
    contract_services_analyst_id UUID REFERENCES users(id),
    program_integration_analyst_id UUID REFERENCES users(id),
    additional_members JSONB,
    historical_members JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project vendors for vendor relationships (Many-to-Many)
CREATE TABLE project_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    role VARCHAR(100),
    contract_value DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, vendor_id, role) -- Prevent duplicate vendor roles per project
);

-- Company vendors for company-vendor relationships
CREATE TABLE company_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, vendor_id)
);

-- Project versions for version control and approval workflows
CREATE TABLE project_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_data JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'draft',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    comments TEXT,
    UNIQUE(project_id, version_number)
);

-- Project milestones (from fresh_schema)
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- e.g., 'design', 'construction', 'review'
    planned_start DATE,
    planned_finish DATE,
    actual_start DATE,
    actual_finish DATE,
    status VARCHAR(50) DEFAULT 'planned',
    description TEXT,
    budget_allocated DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow tasks for task management
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    completed_at TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BUDGET MANAGEMENT TABLES
-- ============================================================================

-- Project budgets for budget management
CREATE TABLE project_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    total_budget DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'CAD',
    fiscal_year INTEGER,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, version)
);

-- Budget categories for budget breakdown
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
    category_name VARCHAR(255) NOT NULL,
    allocated_amount DECIMAL(15,2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget entries for individual transactions
CREATE TABLE budget_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    entry_type VARCHAR(50) DEFAULT 'Expense' CHECK (entry_type IN ('Expense', 'Income', 'Transfer')),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Committed', 'Paid')),
    transaction_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget approvals for approval workflow
CREATE TABLE budget_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    comments TEXT,
    approval_level INTEGER DEFAULT 1,
    urgency VARCHAR(20) DEFAULT 'Normal' CHECK (urgency IN ('Low', 'Normal', 'High', 'Critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget audit trail for change tracking
CREATE TABLE budget_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES project_budgets(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Budget transfers for budget transfer records
CREATE TABLE budget_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_budget_id UUID REFERENCES project_budgets(id),
    to_budget_id UUID REFERENCES project_budgets(id),
    from_category_id UUID REFERENCES budget_categories(id),
    to_category_id UUID REFERENCES budget_categories(id),
    amount DECIMAL(15,2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- GATE MEETING ENHANCEMENT TABLES
-- ============================================================================

-- Gate meeting types
CREATE TABLE gate_meeting_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate meeting statuses
CREATE TABLE gate_meeting_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color_code VARCHAR(7), -- Hex color code
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate meeting participants
CREATE TABLE gate_meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    role VARCHAR(100),
    attendance_status VARCHAR(50) DEFAULT 'Invited' CHECK (attendance_status IN ('Invited', 'Confirmed', 'Attended', 'Declined')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate meeting action items
CREATE TABLE gate_meeting_action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Completed', 'Cancelled')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WORKFLOW AND APPROVAL TABLES
-- ============================================================================

-- Scheduled submissions for auto-submission tracking
CREATE TABLE scheduled_submissions (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_id INTEGER NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval workflows for project approval workflows
CREATE TABLE approval_workflows (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_id INTEGER NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by VARCHAR(100) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System configuration settings
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ORGANIZATIONAL TABLES
-- ============================================================================

-- Organizational roles
CREATE TABLE organizational_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    level INTEGER,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fiscal year calendar
CREATE TABLE fiscal_year_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fiscal_year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    quarter INTEGER,
    month_name VARCHAR(20),
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fiscal year events
CREATE TABLE fiscal_year_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fiscal_year INTEGER NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(100),
    description TEXT,
    is_deadline BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED TABLES (from schema_enhancements.sql)
-- ============================================================================

-- Contracts table for contract management and tracking
CREATE TABLE contracts (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table for project reporting and documentation
CREATE TABLE reports (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate meetings for project governance and milestone meetings
CREATE TABLE gate_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    gate_meeting_type_id INTEGER REFERENCES gate_meeting_types(id),
    status_id INTEGER REFERENCES gate_meeting_statuses(id),
    planned_date DATE,
    actual_date DATE,
    fiscal_year INTEGER,
    agenda TEXT,
    attendees JSONB,
    action_items JSONB,
    decisions JSONB,
    meeting_notes TEXT,
    chaired_by UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WIZARD AND TEMPLATE TABLES
-- ============================================================================

-- Project Templates table for wizard template selection
CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    default_budget DECIMAL(15,2),
    estimated_duration INTEGER, -- in days
    required_roles TEXT[], -- array of required roles
    template_data JSONB, -- template configuration data
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Wizard Sessions table for tracking wizard progress
CREATE TABLE project_wizard_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 5,
    template_id UUID REFERENCES project_templates(id),
    step_data JSONB, -- stores data for each step
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- Invitations for user invitations and onboarding
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    project_id UUID REFERENCES projects(id),
    invited_by UUID REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications for workflow handoffs (from fresh_schema)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(100) NOT NULL, -- e.g., 'project_submitted', 'team_assigned', 'project_finalized'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    payload JSONB, -- Additional data (project_id, etc.)
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for tracking all changes (consolidated from both audit_logs and audit_log)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- For generic audit trigger usage
    table_name VARCHAR(100),
    record_id UUID,
    -- For inline edit and manual logs
    entity_type VARCHAR(100),
    entity_id UUID,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    -- Audit action type (INSERT, UPDATE, DELETE, inline_edit, etc.)
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    details JSONB, -- Action-specific details
    user_id UUID REFERENCES users(id),       -- For inline edit logs
    changed_by UUID REFERENCES users(id),   -- For trigger-based logs
    changed_at TIMESTAMPTZ DEFAULT NOW(), -- For trigger-based logs
    timestamp TIMESTAMPTZ DEFAULT NOW(),   -- For inline edit logs
    ip_address INET,
    user_agent TEXT,
    action_batch_id UUID,
    -- Additional fields from fresh_schema
    resource_type VARCHAR(100), -- e.g., 'project', 'user'
    resource_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema version tracking
CREATE TABLE schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

-- Migration tracking table
CREATE TABLE schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(64)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Company indexes
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_status ON companies(status);

-- Vendor indexes
CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_category ON vendors(category);

-- Project indexes
CREATE INDEX idx_projects_status ON projects(project_status);
CREATE INDEX idx_projects_phase ON projects(project_phase);
CREATE INDEX idx_projects_name ON projects(project_name);
CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_workflow_status ON projects(workflow_status);
CREATE INDEX idx_projects_lifecycle_status ON projects(lifecycle_status);
CREATE INDEX idx_projects_capital_plan_line_id ON projects(capital_plan_line_id);
CREATE INDEX idx_projects_client_ministry_id ON projects(client_ministry_id);
CREATE INDEX idx_projects_school_jurisdiction_id ON projects(school_jurisdiction_id);
CREATE INDEX idx_projects_modified_by ON projects(modified_by);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);
CREATE INDEX idx_projects_cpd_number ON projects(cpd_number);

-- Budget management indexes
CREATE INDEX idx_project_budgets_project_id ON project_budgets(project_id);
CREATE INDEX idx_project_budgets_fiscal_year ON project_budgets(fiscal_year);
CREATE INDEX idx_project_budgets_status ON project_budgets(status);
CREATE INDEX idx_project_budgets_created_by ON project_budgets(created_by);

CREATE INDEX idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX idx_budget_categories_category_name ON budget_categories(category_name);

CREATE INDEX idx_budget_entries_budget_id ON budget_entries(budget_id);
CREATE INDEX idx_budget_entries_category_id ON budget_entries(category_id);
CREATE INDEX idx_budget_entries_status ON budget_entries(status);
CREATE INDEX idx_budget_entries_transaction_date ON budget_entries(transaction_date);
CREATE INDEX idx_budget_entries_created_by ON budget_entries(created_by);

CREATE INDEX idx_budget_approvals_budget_id ON budget_approvals(budget_id);
CREATE INDEX idx_budget_approvals_status ON budget_approvals(status);
CREATE INDEX idx_budget_approvals_submitted_by ON budget_approvals(submitted_by);
CREATE INDEX idx_budget_approvals_approved_by ON budget_approvals(approved_by);

CREATE INDEX idx_budget_audit_trail_budget_id ON budget_audit_trail(budget_id);
CREATE INDEX idx_budget_audit_trail_changed_by ON budget_audit_trail(changed_by);
CREATE INDEX idx_budget_audit_trail_changed_at ON budget_audit_trail(changed_at);

CREATE INDEX idx_budget_transfers_from_budget_id ON budget_transfers(from_budget_id);
CREATE INDEX idx_budget_transfers_to_budget_id ON budget_transfers(to_budget_id);
CREATE INDEX idx_budget_transfers_status ON budget_transfers(status);

-- Gate meeting enhancement indexes
CREATE INDEX idx_gate_meeting_participants_meeting_id ON gate_meeting_participants(meeting_id);
CREATE INDEX idx_gate_meeting_participants_user_id ON gate_meeting_participants(user_id);
CREATE INDEX idx_gate_meeting_participants_attendance_status ON gate_meeting_participants(attendance_status);

CREATE INDEX idx_gate_meeting_action_items_meeting_id ON gate_meeting_action_items(meeting_id);
CREATE INDEX idx_gate_meeting_action_items_assigned_to ON gate_meeting_action_items(assigned_to);
CREATE INDEX idx_gate_meeting_action_items_status ON gate_meeting_action_items(status);
CREATE INDEX idx_gate_meeting_action_items_due_date ON gate_meeting_action_items(due_date);

-- Workflow and approval indexes
CREATE INDEX idx_scheduled_submissions_project_id ON scheduled_submissions(project_id);
CREATE INDEX idx_scheduled_submissions_version_id ON scheduled_submissions(version_id);
CREATE INDEX idx_scheduled_submissions_status ON scheduled_submissions(status);
CREATE INDEX idx_scheduled_submissions_created_at ON scheduled_submissions(created_at);

CREATE INDEX idx_approval_workflows_project_id ON approval_workflows(project_id);
CREATE INDEX idx_approval_workflows_version_id ON approval_workflows(version_id);
CREATE INDEX idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX idx_approval_workflows_submitted_at ON approval_workflows(submitted_at);

CREATE INDEX idx_system_config_key ON system_config(key);

-- Organizational indexes
CREATE INDEX idx_organizational_roles_name ON organizational_roles(name);
CREATE INDEX idx_organizational_roles_level ON organizational_roles(level);

CREATE INDEX idx_fiscal_year_calendar_fiscal_year ON fiscal_year_calendar(fiscal_year);
CREATE INDEX idx_fiscal_year_calendar_is_current ON fiscal_year_calendar(is_current);

CREATE INDEX idx_fiscal_year_events_fiscal_year ON fiscal_year_events(fiscal_year);
CREATE INDEX idx_fiscal_year_events_event_date ON fiscal_year_events(event_date);
CREATE INDEX idx_fiscal_year_events_is_deadline ON fiscal_year_events(is_deadline);

-- Gate meeting indexes (updated)
CREATE INDEX idx_gate_meetings_project_id ON gate_meetings(project_id);
CREATE INDEX idx_gate_meetings_gate_meeting_type_id ON gate_meetings(gate_meeting_type_id);
CREATE INDEX idx_gate_meetings_status_id ON gate_meetings(status_id);
CREATE INDEX idx_gate_meetings_planned_date ON gate_meetings(planned_date);
CREATE INDEX idx_gate_meetings_fiscal_year ON gate_meetings(fiscal_year);

-- ============================================================================
-- INITIAL DATA FOR NEW TABLES
-- ============================================================================

-- Insert default gate meeting types
INSERT INTO gate_meeting_types (name, description) VALUES
('Gate 0', 'Project Initiation Gate'),
('Gate 1', 'Concept Gate'),
('Gate 2', 'Definition Gate'),
('Gate 3', 'Implementation Gate'),
('Gate 4', 'Commissioning Gate'),
('Gate 5', 'Benefits Realization Gate'),
('Gate 6', 'Project Closure Gate')
ON CONFLICT (name) DO NOTHING;

-- Insert default gate meeting statuses
INSERT INTO gate_meeting_statuses (name, description, color_code) VALUES
('Scheduled', 'Meeting is scheduled', '#007bff'),
('In Progress', 'Meeting is currently happening', '#ffc107'),
('Completed', 'Meeting has been completed', '#28a745'),
('Cancelled', 'Meeting has been cancelled', '#dc3545'),
('Postponed', 'Meeting has been postponed', '#fd7e14')
ON CONFLICT (name) DO NOTHING;

-- Insert initial system configuration
INSERT INTO system_config (key, value, description) VALUES 
('auto_submission_enabled', 'true', 'Global toggle for automatic submission feature'),
('auto_submission_cron', '0 9 1 * *', 'Cron expression for auto-submission schedule (9 AM on 1st of each month)'),
('auto_submission_min_age_days', '7', 'Minimum age in days for a version to be eligible for auto-submission'),
('budget_approval_threshold_level_1', '100000', 'Budget amount threshold for level 1 approval'),
('budget_approval_threshold_level_2', '1000000', 'Budget amount threshold for level 2 approval'),
('fiscal_year_start_month', '4', 'Month when fiscal year starts (1-12)')
ON CONFLICT (key) DO NOTHING;

-- Insert default organizational roles
INSERT INTO organizational_roles (name, description, level, permissions) VALUES
('Executive', 'Executive level role with full permissions', 1, '{"all": true}'),
('Director', 'Director level role with management permissions', 2, '{"manage_projects": true, "approve_budgets": true}'),
('Project Manager', 'Project manager role with project permissions', 3, '{"manage_assigned_projects": true, "submit_reports": true}'),
('Senior Project Manager', 'Senior project manager with enhanced permissions', 3, '{"manage_projects": true, "mentor_pms": true}'),
('Analyst', 'Analyst role with read and analysis permissions', 4, '{"view_projects": true, "generate_reports": true}'),
('Vendor', 'External vendor role with limited permissions', 5, '{"view_assigned_projects": true, "submit_deliverables": true}')
ON CONFLICT (name) DO NOTHING;
CREATE INDEX idx_projects_assigned_pm ON projects(assigned_pm);
CREATE INDEX idx_projects_assigned_spm ON projects(assigned_spm);
CREATE INDEX idx_projects_assigned_by ON projects(assigned_by);
CREATE INDEX idx_projects_finalized_by ON projects(finalized_by);
CREATE INDEX idx_projects_project_category ON projects(project_category);

-- Project relationship indexes
CREATE INDEX idx_project_teams_project_id ON project_teams(project_id);
CREATE INDEX idx_project_locations_project_id ON project_locations(project_id);
CREATE INDEX idx_project_vendors_project_id ON project_vendors(project_id);
CREATE INDEX idx_project_vendors_vendor_id ON project_vendors(vendor_id);
CREATE INDEX idx_project_vendors_status ON project_vendors(status);

-- Milestone indexes
CREATE INDEX idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX idx_milestones_status ON project_milestones(status);
CREATE INDEX idx_milestones_planned_start ON project_milestones(planned_start);

-- Workflow task indexes
CREATE INDEX idx_workflow_tasks_project_id ON workflow_tasks(project_id);
CREATE INDEX idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);

-- Contract indexes
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_contract_number ON contracts(contract_number);

-- Report indexes
CREATE INDEX idx_reports_project_id ON reports(project_id);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_status ON reports(status);

-- Gate meeting indexes
CREATE INDEX idx_gate_meetings_project_id ON gate_meetings(project_id);
CREATE INDEX idx_gate_meetings_meeting_date ON gate_meetings(meeting_date);
CREATE INDEX idx_gate_meetings_status ON gate_meetings(status);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit log indexes
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Template and wizard indexes
CREATE INDEX idx_project_templates_category ON project_templates(category);
CREATE INDEX idx_project_templates_active ON project_templates(is_active);
CREATE INDEX idx_project_wizard_sessions_user_id ON project_wizard_sessions(user_id);
CREATE INDEX idx_project_wizard_sessions_session_id ON project_wizard_sessions(session_id);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capital_plan_lines_updated_at BEFORE UPDATE ON capital_plan_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_ministries_updated_at BEFORE UPDATE ON client_ministries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_jurisdictions_updated_at BEFORE UPDATE ON school_jurisdictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pfmt_files_updated_at BEFORE UPDATE ON pfmt_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_locations_updated_at BEFORE UPDATE ON project_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_teams_updated_at BEFORE UPDATE ON project_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_vendors_updated_at BEFORE UPDATE ON project_vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_vendors_updated_at BEFORE UPDATE ON company_vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_tasks_updated_at BEFORE UPDATE ON workflow_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gate_meetings_updated_at BEFORE UPDATE ON gate_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_templates_updated_at BEFORE UPDATE ON project_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_wizard_sessions_updated_at BEFORE UPDATE ON project_wizard_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to sync name fields in projects table
CREATE OR REPLACE FUNCTION sync_project_name_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- If project_name is updated, sync to name field
    IF NEW.project_name IS DISTINCT FROM OLD.project_name THEN
        NEW.name = NEW.project_name;
    END IF;
    
    -- If name is updated, sync to project_name field
    IF NEW.name IS DISTINCT FROM OLD.name THEN
        NEW.project_name = NEW.name;
    END IF;
    
    -- If description is updated, sync to project_description field
    IF NEW.description IS DISTINCT FROM OLD.description THEN
        NEW.project_description = NEW.description;
    END IF;
    
    -- If project_description is updated, sync to description field
    IF NEW.project_description IS DISTINCT FROM OLD.project_description THEN
        NEW.description = NEW.project_description;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_project_fields BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION sync_project_name_fields();

-- Create audit trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
BEGIN
    -- Try to extract user ID from various possible fields
    user_id_val := NULL;
    
    IF TG_OP = 'INSERT' THEN
        -- Try to get user ID from common fields
        BEGIN
            user_id_val := COALESCE(
                (row_to_json(NEW)->>'created_by')::UUID,
                (row_to_json(NEW)->>'modified_by')::UUID,
                (row_to_json(NEW)->>'user_id')::UUID
            );
        EXCEPTION WHEN OTHERS THEN
            user_id_val := NULL;
        END;
        
        INSERT INTO audit_logs (table_name, record_id, action, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), user_id_val, NOW());
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Try to get user ID from common fields
        BEGIN
            user_id_val := COALESCE(
                (row_to_json(NEW)->>'modified_by')::UUID,
                (row_to_json(NEW)->>'created_by')::UUID,
                (row_to_json(NEW)->>'user_id')::UUID
            );
        EXCEPTION WHEN OTHERS THEN
            user_id_val := NULL;
        END;
        
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), user_id_val, NOW());
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, changed_at)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), NOW());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply audit triggers to key tables
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON projects FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_vendors AFTER INSERT OR UPDATE OR DELETE ON vendors FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON contracts FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'System users with canonical role-based access control';
COMMENT ON COLUMN users.role IS 'Canonical roles: admin, pmi, director, pm, spm, analyst, executive, vendor, user';

COMMENT ON TABLE projects IS 'Projects with multi-step workflow status and comprehensive field compatibility';
COMMENT ON COLUMN projects.workflow_status IS 'Workflow: initiated → assigned → finalized → active → (on_hold/complete/archived)';
COMMENT ON COLUMN projects.created_by IS 'User who initiated the project (PMI role)';
COMMENT ON COLUMN projects.assigned_pm IS 'Project Manager assigned by Director';
COMMENT ON COLUMN projects.assigned_spm IS 'Senior Project Manager assigned by Director';
COMMENT ON COLUMN projects.assigned_by IS 'Director who assigned the team';
COMMENT ON COLUMN projects.finalized_by IS 'PM/SPM who finalized the project setup';

COMMENT ON TABLE project_vendors IS 'Many-to-many relationship between projects and vendors';
COMMENT ON TABLE project_milestones IS 'Project milestones and deliverables';
COMMENT ON TABLE notifications IS 'System notifications for workflow handoffs';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON TABLE contracts IS 'Contract management and tracking';
COMMENT ON TABLE reports IS 'Project reporting and documentation';
COMMENT ON TABLE gate_meetings IS 'Project governance and milestone meetings';

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

INSERT INTO schema_version (version, description) 
VALUES ('3.0.0', 'Consolidated schema combining all previous schema files and migrations');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PFMT CONSOLIDATED Schema applied successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created % tables with comprehensive structure', (
        SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'
    );
    RAISE NOTICE 'Schema consolidates:';
    RAISE NOTICE '✓ schema-COMPLETE.sql (primary base)';
    RAISE NOTICE '✓ fresh_schema.sql (workflow enhancements)';
    RAISE NOTICE '✓ schema_enhancements.sql (additional tables)';
    RAISE NOTICE '✓ All backend/database/migrations/';
    RAISE NOTICE '✓ All database/migrations/';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COMPATIBILITY FEATURES:';
    RAISE NOTICE '✓ Multiple field naming conventions supported';
    RAISE NOTICE '✓ Automatic field synchronization enabled';
    RAISE NOTICE '✓ Comprehensive audit logging';
    RAISE NOTICE '✓ Workflow status management';
    RAISE NOTICE '✓ Project wizard compatibility';
    RAISE NOTICE '✓ Enhanced vendor and contract management';
    RAISE NOTICE '✓ Gate meeting and reporting systems';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Your PFMT application is ready to use!';
    RAISE NOTICE 'Single source of truth - no more migration confusion!';
    RAISE NOTICE '========================================';
END $$;

