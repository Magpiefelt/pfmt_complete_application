-- Phase 2 Database Migrations: Project Versions, Calendar Events, and Guidance System
-- Created: August 2, 2025
-- Purpose: Support workflow enrichment and version traceability features

-- Project Versions Table for Draft/Review/Approve workflow
CREATE TABLE IF NOT EXISTS project_versions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL DEFAULT '1.0',
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    data_snapshot JSONB NOT NULL DEFAULT '{}',
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by INTEGER REFERENCES users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by INTEGER REFERENCES users(id),
    rejection_reason TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    change_summary TEXT,
    CONSTRAINT unique_current_version UNIQUE (project_id, is_current) DEFERRABLE INITIALLY DEFERRED
);

-- Project Changes Table for detailed field-level tracking
CREATE TABLE IF NOT EXISTS project_changes (
    id SERIAL PRIMARY KEY,
    version_id INTEGER NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200),
    old_value TEXT,
    new_value TEXT,
    change_type VARCHAR(20) NOT NULL DEFAULT 'modified', -- 'added', 'modified', 'removed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Events Table for fiscal year and PMI calendar integration
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'milestone', 'gate_meeting', 'deadline', 'review'
    title VARCHAR(500) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    end_date DATE,
    all_day BOOLEAN DEFAULT TRUE,
    location VARCHAR(200),
    reference_table VARCHAR(100), -- 'gate_meetings', 'milestones', 'tasks'
    reference_id INTEGER,
    category VARCHAR(100), -- 'planning', 'design', 'construction', 'closure'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Guidance Notifications Table for contextual prompts and next steps
CREATE TABLE IF NOT EXISTS guidance_notifications (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'next_step', 'approval_needed', 'deadline_approaching', 'action_required'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meeting Agendas Table for enhanced agenda management
CREATE TABLE IF NOT EXISTS meeting_agendas (
    id SERIAL PRIMARY KEY,
    gate_meeting_id INTEGER NOT NULL REFERENCES gate_meetings(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    agenda_items JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    template_used VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'finalized', 'distributed'
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP WITH TIME ZONE,
    finalized_by INTEGER REFERENCES users(id)
);

-- Agenda Items Table for structured agenda management
CREATE TABLE IF NOT EXISTS agenda_items (
    id SERIAL PRIMARY KEY,
    agenda_id INTEGER NOT NULL REFERENCES meeting_agendas(id) ON DELETE CASCADE,
    item_order INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    presenter VARCHAR(200),
    duration_minutes INTEGER DEFAULT 15,
    item_type VARCHAR(50) DEFAULT 'discussion', -- 'presentation', 'discussion', 'decision', 'information'
    attachments JSONB DEFAULT '[]',
    notes TEXT,
    decision TEXT,
    action_items JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project Workflow States Table for enhanced workflow tracking
CREATE TABLE IF NOT EXISTS project_workflow_states (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    current_state VARCHAR(100) NOT NULL,
    previous_state VARCHAR(100),
    state_entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    entered_by INTEGER NOT NULL REFERENCES users(id),
    next_required_action VARCHAR(500),
    next_action_due_date DATE,
    next_action_assignee INTEGER REFERENCES users(id),
    state_metadata JSONB DEFAULT '{}',
    is_current BOOLEAN DEFAULT TRUE
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_status ON project_versions(status);
CREATE INDEX IF NOT EXISTS idx_project_versions_current ON project_versions(project_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_project_changes_version_id ON project_changes(version_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_guidance_notifications_user_id ON guidance_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_guidance_notifications_project_id ON guidance_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_guidance_notifications_unread ON guidance_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_gate_meeting_id ON meeting_agendas(gate_meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_agenda_id ON agenda_items(agenda_id);
CREATE INDEX IF NOT EXISTS idx_project_workflow_states_project_id ON project_workflow_states(project_id);
CREATE INDEX IF NOT EXISTS idx_project_workflow_states_current ON project_workflow_states(project_id, is_current) WHERE is_current = TRUE;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guidance_notifications_updated_at BEFORE UPDATE ON guidance_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_agendas_updated_at BEFORE UPDATE ON meeting_agendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_workflow_states_updated_at BEFORE UPDATE ON project_workflow_states FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create calendar events from gate meetings
CREATE OR REPLACE FUNCTION create_calendar_event_from_gate_meeting()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO calendar_events (
        project_id, type, title, description, event_date, 
        reference_table, reference_id, category, created_by
    ) VALUES (
        NEW.project_id, 
        'gate_meeting', 
        CONCAT('Gate Meeting: ', NEW.gate_type),
        NEW.description,
        NEW.scheduled_date,
        'gate_meetings',
        NEW.id,
        CASE 
            WHEN NEW.gate_type ILIKE '%planning%' THEN 'planning'
            WHEN NEW.gate_type ILIKE '%design%' THEN 'design'
            WHEN NEW.gate_type ILIKE '%construction%' THEN 'construction'
            WHEN NEW.gate_type ILIKE '%closure%' THEN 'closure'
            ELSE 'planning'
        END,
        NEW.created_by
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER gate_meeting_calendar_event AFTER INSERT ON gate_meetings FOR EACH ROW EXECUTE FUNCTION create_calendar_event_from_gate_meeting();

-- Function to generate guidance notifications based on project state
CREATE OR REPLACE FUNCTION generate_guidance_notification(
    p_project_id INTEGER,
    p_user_id INTEGER,
    p_type VARCHAR(50),
    p_title VARCHAR(500),
    p_message TEXT,
    p_action_url VARCHAR(500) DEFAULT NULL,
    p_action_label VARCHAR(100) DEFAULT NULL,
    p_priority VARCHAR(20) DEFAULT 'medium'
)
RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO guidance_notifications (
        project_id, user_id, type, priority, title, message, action_url, action_label
    ) VALUES (
        p_project_id, p_user_id, p_type, p_priority, p_title, p_message, p_action_url, p_action_label
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ language 'plpgsql';

-- Sample data for testing Phase 2 functionality
INSERT INTO project_versions (project_id, version_number, status, data_snapshot, created_by, is_current)
SELECT 
    p.id,
    '1.0',
    'Approved',
    jsonb_build_object(
        'name', p.name,
        'description', p.description,
        'category', p.category,
        'total_budget', p.total_budget,
        'current_budget', p.current_budget,
        'status', p.status
    ),
    1,
    TRUE
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM project_versions pv WHERE pv.project_id = p.id AND pv.is_current = TRUE
);

-- Sample calendar events
INSERT INTO calendar_events (project_id, type, title, description, event_date, category, created_by)
SELECT 
    p.id,
    'milestone',
    'Project Initiation Milestone',
    'Project officially begins with team kickoff',
    CURRENT_DATE + INTERVAL '7 days',
    'planning',
    1
FROM projects p
WHERE p.status = 'Active'
LIMIT 5;

INSERT INTO calendar_events (project_id, type, title, description, event_date, category, created_by)
SELECT 
    p.id,
    'deadline',
    'Budget Review Deadline',
    'Quarterly budget review and variance analysis due',
    CURRENT_DATE + INTERVAL '30 days',
    'planning',
    1
FROM projects p
WHERE p.status = 'Active'
LIMIT 3;

-- Sample guidance notifications
INSERT INTO guidance_notifications (project_id, user_id, type, priority, title, message, action_url, action_label)
SELECT 
    p.id,
    1,
    'next_step',
    'medium',
    'Schedule Gate 2 Meeting',
    'Project has completed planning phase. Schedule Gate 2 design review meeting.',
    '/projects/' || p.id || '/workflow',
    'Schedule Meeting'
FROM projects p
WHERE p.status = 'Active'
LIMIT 3;

-- Sample workflow states
INSERT INTO project_workflow_states (project_id, current_state, entered_by, next_required_action, next_action_due_date, next_action_assignee)
SELECT 
    p.id,
    CASE 
        WHEN p.status = 'Active' THEN 'Planning'
        WHEN p.status = 'Completed' THEN 'Closed'
        ELSE 'Initiation'
    END,
    1,
    CASE 
        WHEN p.status = 'Active' THEN 'Complete planning documentation and schedule Gate 2 review'
        ELSE 'Begin project planning activities'
    END,
    CURRENT_DATE + INTERVAL '14 days',
    1
FROM projects p;

COMMIT;

