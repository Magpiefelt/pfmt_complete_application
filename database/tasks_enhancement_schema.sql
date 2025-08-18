-- Enhanced Task Management Schema
-- This file adds missing tables and fields for advanced task management functionality

-- First, let's enhance the existing workflow_tasks table with additional fields
ALTER TABLE workflow_tasks 
ADD COLUMN IF NOT EXISTS type VARCHAR(100),
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS entity_id UUID,
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS assignment_notes TEXT,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS hold_reason TEXT,
ADD COLUMN IF NOT EXISTS hold_notes TEXT,
ADD COLUMN IF NOT EXISTS resume_notes TEXT,
ADD COLUMN IF NOT EXISTS reopen_reason TEXT,
ADD COLUMN IF NOT EXISTS reopen_notes TEXT,
ADD COLUMN IF NOT EXISTS unassignment_reason TEXT;

-- Create task_dependencies table for managing task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, depends_on_task_id),
    CHECK (task_id != depends_on_task_id)
);

-- Create task_comments table for task comments
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create task_time_logs table for time tracking
CREATE TABLE IF NOT EXISTS task_time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    hours DECIMAL(8,2) NOT NULL CHECK (hours > 0),
    description TEXT NOT NULL,
    log_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create task_history table for audit trail
CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID NOT NULL REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_by ON task_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_log_date ON task_time_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_entity ON workflow_tasks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_type ON workflow_tasks(type);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_due_date ON workflow_tasks(due_date);

-- Add updated_at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_task_dependencies_updated_at 
    BEFORE UPDATE ON task_dependencies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_task_comments_updated_at 
    BEFORE UPDATE ON task_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_task_time_logs_updated_at 
    BEFORE UPDATE ON task_time_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for task types
INSERT INTO workflow_tasks (
    id, title, description, type, entity_type, priority, status, created_by
) VALUES (
    uuid_generate_v4(),
    'Sample Task',
    'This is a sample task for testing',
    'general',
    'project',
    'medium',
    'pending',
    (SELECT id FROM users LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE task_dependencies IS 'Manages dependencies between tasks';
COMMENT ON TABLE task_comments IS 'Stores comments and notes for tasks';
COMMENT ON TABLE task_time_logs IS 'Tracks time spent on tasks';
COMMENT ON TABLE task_history IS 'Audit trail for task changes';

COMMENT ON COLUMN task_dependencies.dependency_type IS 'Type of dependency: finish_to_start, start_to_start, finish_to_finish, start_to_finish';
COMMENT ON COLUMN workflow_tasks.entity_type IS 'Type of entity this task is related to (project, contract, report, etc.)';
COMMENT ON COLUMN workflow_tasks.entity_id IS 'ID of the related entity';
COMMENT ON COLUMN workflow_tasks.type IS 'Type/category of the task';
COMMENT ON COLUMN workflow_tasks.tags IS 'Array of tags for categorization';

