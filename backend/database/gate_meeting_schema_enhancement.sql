-- Enhanced Gate Meeting Schema for Comprehensive Workflow Management
-- This extends the existing schema with comprehensive gate meeting functionality

-- Drop existing gate_meetings table to recreate with enhanced structure
DROP TABLE IF EXISTS gate_meetings CASCADE;

-- Gate Meeting Types lookup table
CREATE TABLE gate_meeting_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    typical_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard gate meeting types
INSERT INTO gate_meeting_types (name, description, is_mandatory, typical_order) VALUES
('Capital Plan Strategy Meeting', 'High-level client alignment meeting', true, 1),
('Initiation Project Gate Meeting', 'Executive project launch meeting', true, 2),
('PM Assignment', 'Project Manager assignment and baseline setup', true, 3),
('Baseline', 'Project foundation and planning approval', true, 4),
('Functional Program', 'Scope definition and cost validation', false, 5),
('Schematic Design', 'Design direction confirmation', false, 6),
('Design Development', 'Design refinement review', false, 7),
('Contract Documents/Pre-Tender', 'Construction readiness review', true, 8),
('25% Construction', 'Early construction progress review', false, 9),
('50% Construction', 'Mid-construction progress review', false, 10),
('85% Construction', 'Late construction progress review', false, 11),
('Substantial Completion', 'Project closure preparation', true, 12);

-- Gate Meeting Status lookup table
CREATE TABLE gate_meeting_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_final BOOLEAN DEFAULT false,
    color_code VARCHAR(7), -- Hex color for UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard statuses
INSERT INTO gate_meeting_statuses (name, description, is_final, color_code) VALUES
('Planned', 'Meeting is scheduled but not yet held', false, '#FFA500'),
('Scheduled', 'Meeting date confirmed and invitations sent', false, '#0066CC'),
('In Progress', 'Meeting is currently taking place', false, '#FF6600'),
('Completed', 'Meeting completed successfully', true, '#00AA00'),
('Cancelled', 'Meeting was cancelled', true, '#FF0000'),
('Rescheduled', 'Meeting was rescheduled to new date', false, '#9900CC'),
('Pending Approval', 'Awaiting approval to proceed', false, '#CCAA00'),
('Approved', 'Gate approved - proceed to next phase', true, '#006600'),
('Rejected', 'Gate rejected - address issues before proceeding', true, '#CC0000'),
('On Hold', 'Gate meeting on hold pending resolution', false, '#666666');

-- Organizational Roles lookup table
CREATE TABLE organizational_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_panel_member BOOLEAN DEFAULT false,
    is_support_role BOOLEAN DEFAULT false,
    typical_authority_level INTEGER, -- 1=highest, 10=lowest
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert organizational roles
INSERT INTO organizational_roles (name, description, is_panel_member, is_support_role, typical_authority_level) VALUES
('Assistant Deputy Minister', 'ADM - highest authority level', true, false, 1),
('Executive Director', 'ED - executive level oversight', true, false, 2),
('Director', 'Regional/functional director', true, false, 3),
('Senior Project Manager', 'SPM - senior project oversight', true, false, 4),
('Project Manager', 'PM - project execution lead', true, false, 5),
('PMI Director', 'Project Management Integration Director', true, false, 3),
('Project Integration Analyst', 'PIA - program level analysis', false, true, 6),
('Gate Meeting Scribe', 'Meeting documentation specialist', false, true, 7),
('Administrative Assistant', 'Meeting logistics coordinator', false, true, 8),
('PMCOE Representative', 'Project Management Centre of Excellence', false, true, 6),
('Client Representative', 'End user/client stakeholder', true, false, 4),
('Technical Services', 'Technical expertise provider', true, false, 5),
('Procurement Specialist', 'Procurement guidance provider', true, false, 5),
('Legal Counsel', 'Legal guidance provider', true, false, 4);

-- Enhanced Gate Meetings table
CREATE TABLE gate_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    gate_meeting_type_id UUID REFERENCES gate_meeting_types(id),
    status_id UUID REFERENCES gate_meeting_statuses(id),
    
    -- Meeting Details
    meeting_title VARCHAR(255),
    meeting_description TEXT,
    planned_date DATE,
    actual_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    meeting_url VARCHAR(500), -- For virtual meetings
    
    -- Fiscal Year Information
    fiscal_year VARCHAR(10), -- e.g., "2024-25"
    fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_month INTEGER CHECK (fiscal_month BETWEEN 1 AND 12),
    
    -- Meeting Outcomes
    decision VARCHAR(50) CHECK (decision IN ('approved', 'rejected', 'conditional', 'deferred', 'cancelled')),
    decision_rationale TEXT,
    next_milestone_date DATE,
    next_gate_meeting_type_id UUID REFERENCES gate_meeting_types(id),
    
    -- Risk and Issues
    key_risks_identified TEXT,
    mitigation_strategies TEXT,
    escalated_issues TEXT,
    
    -- Documentation
    agenda_document_path VARCHAR(500),
    presentation_path VARCHAR(500),
    minutes_document_path VARCHAR(500),
    supporting_documents JSONB, -- Array of document paths/URLs
    
    -- Workflow State
    is_mandatory BOOLEAN DEFAULT false,
    requires_adm_attendance BOOLEAN DEFAULT false,
    requires_ed_attendance BOOLEAN DEFAULT false,
    preparation_deadline DATE,
    materials_deadline DATE,
    
    -- Audit Fields
    created_by UUID REFERENCES users(id),
    scheduled_by UUID REFERENCES users(id),
    chaired_by UUID REFERENCES users(id),
    scribed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    approved_at TIMESTAMP
);

-- Gate Meeting Participants table
CREATE TABLE gate_meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES organizational_roles(id),
    
    -- Participation Details
    attendance_status VARCHAR(50) DEFAULT 'invited' CHECK (attendance_status IN ('invited', 'accepted', 'declined', 'tentative', 'attended', 'absent')),
    is_required BOOLEAN DEFAULT false,
    is_chair BOOLEAN DEFAULT false,
    is_scribe BOOLEAN DEFAULT false,
    
    -- Notifications
    invitation_sent_at TIMESTAMP,
    response_received_at TIMESTAMP,
    reminder_sent_at TIMESTAMP,
    
    -- Notes
    participation_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meeting Action Items table
CREATE TABLE gate_meeting_action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    
    -- Action Item Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled', 'deferred')),
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_role_id UUID REFERENCES organizational_roles(id),
    due_date DATE,
    
    -- Completion
    completed_date DATE,
    completion_notes TEXT,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meeting Dependencies table
CREATE TABLE gate_meeting_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    depends_on_gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'prerequisite' CHECK (dependency_type IN ('prerequisite', 'parallel', 'successor')),
    is_blocking BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meeting Templates table
CREATE TABLE gate_meeting_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_type_id UUID REFERENCES gate_meeting_types(id),
    
    -- Template Details
    template_name VARCHAR(255) NOT NULL,
    agenda_template TEXT,
    required_documents JSONB, -- Array of required document types
    standard_participants JSONB, -- Array of role IDs that should typically attend
    estimated_duration INTEGER, -- Duration in minutes
    
    -- Template Configuration
    requires_preparation_meeting BOOLEAN DEFAULT false,
    preparation_lead_time_days INTEGER DEFAULT 14,
    materials_deadline_days INTEGER DEFAULT 2,
    
    -- Template Content
    standard_agenda_items JSONB,
    key_decision_points JSONB,
    typical_outcomes JSONB,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gate Meeting Workflow States table
CREATE TABLE gate_meeting_workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_meeting_id UUID REFERENCES gate_meetings(id) ON DELETE CASCADE,
    
    -- Workflow State
    current_state VARCHAR(100) NOT NULL,
    previous_state VARCHAR(100),
    next_possible_states JSONB, -- Array of possible next states
    
    -- State Details
    state_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    state_entered_by UUID REFERENCES users(id),
    state_notes TEXT,
    
    -- Automation
    auto_transition_date DATE,
    auto_transition_to_state VARCHAR(100),
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fiscal Year Calendar Events table
CREATE TABLE fiscal_year_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event Details
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    end_date DATE, -- For multi-day events
    
    -- Fiscal Year Context
    fiscal_year VARCHAR(10) NOT NULL,
    fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_month INTEGER CHECK (fiscal_month BETWEEN 1 AND 12),
    
    -- Event Properties
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(100), -- 'monthly', 'quarterly', 'annually'
    is_deadline BOOLEAN DEFAULT false,
    is_milestone BOOLEAN DEFAULT false,
    
    -- Associations
    project_id UUID REFERENCES projects(id),
    gate_meeting_id UUID REFERENCES gate_meetings(id),
    
    -- Display Properties
    color_code VARCHAR(7),
    icon VARCHAR(50),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    
    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_gate_meetings_project_id ON gate_meetings(project_id);
CREATE INDEX idx_gate_meetings_planned_date ON gate_meetings(planned_date);
CREATE INDEX idx_gate_meetings_fiscal_year ON gate_meetings(fiscal_year);
CREATE INDEX idx_gate_meetings_status ON gate_meetings(status_id);
CREATE INDEX idx_gate_meeting_participants_meeting_id ON gate_meeting_participants(gate_meeting_id);
CREATE INDEX idx_gate_meeting_participants_user_id ON gate_meeting_participants(user_id);
CREATE INDEX idx_gate_meeting_action_items_meeting_id ON gate_meeting_action_items(gate_meeting_id);
CREATE INDEX idx_gate_meeting_action_items_assigned_to ON gate_meeting_action_items(assigned_to);
CREATE INDEX idx_fiscal_year_events_date ON fiscal_year_events(event_date);
CREATE INDEX idx_fiscal_year_events_fiscal_year ON fiscal_year_events(fiscal_year);
CREATE INDEX idx_fiscal_year_events_project_id ON fiscal_year_events(project_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_gate_meetings_updated_at BEFORE UPDATE ON gate_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gate_meeting_participants_updated_at BEFORE UPDATE ON gate_meeting_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gate_meeting_action_items_updated_at BEFORE UPDATE ON gate_meeting_action_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gate_meeting_templates_updated_at BEFORE UPDATE ON gate_meeting_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fiscal_year_events_updated_at BEFORE UPDATE ON fiscal_year_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers for gate meeting tables
CREATE TRIGGER audit_gate_meetings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gate_meetings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_gate_meeting_participants_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gate_meeting_participants
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_gate_meeting_action_items_trigger
    AFTER INSERT OR UPDATE OR DELETE ON gate_meeting_action_items
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Function to calculate fiscal year from date
CREATE OR REPLACE FUNCTION get_fiscal_year(input_date DATE)
RETURNS VARCHAR(10) AS $$
BEGIN
    IF EXTRACT(MONTH FROM input_date) >= 4 THEN
        RETURN EXTRACT(YEAR FROM input_date)::TEXT || '-' || RIGHT((EXTRACT(YEAR FROM input_date) + 1)::TEXT, 2);
    ELSE
        RETURN (EXTRACT(YEAR FROM input_date) - 1)::TEXT || '-' || RIGHT(EXTRACT(YEAR FROM input_date)::TEXT, 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate fiscal quarter from date
CREATE OR REPLACE FUNCTION get_fiscal_quarter(input_date DATE)
RETURNS INTEGER AS $$
DECLARE
    month_num INTEGER;
BEGIN
    month_num := EXTRACT(MONTH FROM input_date);
    
    IF month_num >= 4 AND month_num <= 6 THEN
        RETURN 1; -- Q1: April-June
    ELSIF month_num >= 7 AND month_num <= 9 THEN
        RETURN 2; -- Q2: July-September
    ELSIF month_num >= 10 AND month_num <= 12 THEN
        RETURN 3; -- Q3: October-December
    ELSE
        RETURN 4; -- Q4: January-March
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate fiscal month from date (1=April, 12=March)
CREATE OR REPLACE FUNCTION get_fiscal_month(input_date DATE)
RETURNS INTEGER AS $$
DECLARE
    calendar_month INTEGER;
BEGIN
    calendar_month := EXTRACT(MONTH FROM input_date);
    
    IF calendar_month >= 4 THEN
        RETURN calendar_month - 3; -- April=1, May=2, ..., December=9
    ELSE
        RETURN calendar_month + 9; -- January=10, February=11, March=12
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set fiscal year fields
CREATE OR REPLACE FUNCTION set_fiscal_year_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.planned_date IS NOT NULL THEN
        NEW.fiscal_year := get_fiscal_year(NEW.planned_date);
        NEW.fiscal_quarter := get_fiscal_quarter(NEW.planned_date);
        NEW.fiscal_month := get_fiscal_month(NEW.planned_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gate_meetings_fiscal_year_trigger
    BEFORE INSERT OR UPDATE ON gate_meetings
    FOR EACH ROW EXECUTE FUNCTION set_fiscal_year_fields();

-- Similar trigger for fiscal year events
CREATE TRIGGER fiscal_year_events_fiscal_year_trigger
    BEFORE INSERT OR UPDATE ON fiscal_year_events
    FOR EACH ROW EXECUTE FUNCTION set_fiscal_year_fields();

-- View for gate meeting dashboard
CREATE OR REPLACE VIEW gate_meeting_dashboard AS
SELECT 
    gm.id,
    gm.project_id,
    p.project_name,
    p.cpd_number,
    gmt.name as meeting_type,
    gms.name as status,
    gms.color_code,
    gm.planned_date,
    gm.actual_date,
    gm.fiscal_year,
    gm.fiscal_quarter,
    gm.decision,
    gm.requires_adm_attendance,
    gm.requires_ed_attendance,
    COUNT(gmp.id) as participant_count,
    COUNT(CASE WHEN gmp.attendance_status = 'attended' THEN 1 END) as attended_count,
    COUNT(gmai.id) as action_item_count,
    COUNT(CASE WHEN gmai.status = 'completed' THEN 1 END) as completed_action_items
FROM gate_meetings gm
JOIN projects p ON gm.project_id = p.id
JOIN gate_meeting_types gmt ON gm.gate_meeting_type_id = gmt.id
JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
LEFT JOIN gate_meeting_participants gmp ON gm.id = gmp.gate_meeting_id
LEFT JOIN gate_meeting_action_items gmai ON gm.id = gmai.gate_meeting_id
GROUP BY gm.id, p.project_name, p.cpd_number, gmt.name, gms.name, gms.color_code;

-- View for upcoming gate meetings
CREATE OR REPLACE VIEW upcoming_gate_meetings AS
SELECT 
    gm.*,
    p.project_name,
    p.cpd_number,
    gmt.name as meeting_type,
    gms.name as status,
    EXTRACT(DAYS FROM (gm.planned_date - CURRENT_DATE)) as days_until_meeting
FROM gate_meetings gm
JOIN projects p ON gm.project_id = p.id
JOIN gate_meeting_types gmt ON gm.gate_meeting_type_id = gmt.id
JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
WHERE gm.planned_date >= CURRENT_DATE
    AND gms.name NOT IN ('Completed', 'Cancelled', 'Approved', 'Rejected')
ORDER BY gm.planned_date ASC;

-- View for fiscal year calendar
CREATE OR REPLACE VIEW fiscal_year_calendar AS
SELECT 
    'gate_meeting' as event_type,
    gm.id as event_id,
    gm.meeting_title as title,
    gm.planned_date as event_date,
    gm.planned_date as end_date,
    gm.fiscal_year,
    gm.fiscal_quarter,
    gms.color_code,
    p.project_name,
    gmt.name as meeting_type
FROM gate_meetings gm
JOIN projects p ON gm.project_id = p.id
JOIN gate_meeting_types gmt ON gm.gate_meeting_type_id = gmt.id
JOIN gate_meeting_statuses gms ON gm.status_id = gms.id

UNION ALL

SELECT 
    'fiscal_event' as event_type,
    fye.id as event_id,
    fye.event_title as title,
    fye.event_date,
    COALESCE(fye.end_date, fye.event_date) as end_date,
    fye.fiscal_year,
    fye.fiscal_quarter,
    fye.color_code,
    COALESCE(p.project_name, 'General') as project_name,
    fye.event_type as meeting_type
FROM fiscal_year_events fye
LEFT JOIN projects p ON fye.project_id = p.id

ORDER BY event_date;

