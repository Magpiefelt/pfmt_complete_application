-- Project Wizard Database Schema (Fixed for UUID compatibility)
-- This replaces the original 006_wizard_enhancements.sql with UUID-consistent definitions

-- Project Templates (UUID based)
CREATE TABLE IF NOT EXISTS project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    default_budget DECIMAL(15,2),
    estimated_duration INTEGER, -- in days
    required_roles TEXT[], -- array of required roles
    template_data JSONB, -- template configuration data
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Project Wizard Sessions (temporary storage during wizard process)
CREATE TABLE IF NOT EXISTS project_wizard_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 5,
    template_id UUID REFERENCES project_templates(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project Wizard Step Data (stores data for each step)
CREATE TABLE IF NOT EXISTS project_wizard_step_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL REFERENCES project_wizard_sessions(session_id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL,
    step_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, step_id)
);

-- Project Team Assignments (enhanced from existing structure)
CREATE TABLE IF NOT EXISTS project_team_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(project_id, user_id, role)
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completion_date DATE,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed, Overdue
    priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High, Critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Project Tasks
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Completed, On Hold
    priority VARCHAR(20) DEFAULT 'Medium',
    due_date DATE,
    completion_date DATE,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Task Dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start', -- finish_to_start, start_to_start, finish_to_finish, start_to_finish
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, depends_on_task_id)
);

-- Project Status History (for tracking project status changes)
CREATE TABLE IF NOT EXISTS project_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    previous_status VARCHAR(100),
    new_status VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES users(id),
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_templates_category ON project_templates(category);
CREATE INDEX IF NOT EXISTS idx_project_templates_is_active ON project_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_user_id ON project_wizard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_sessions_session_id ON project_wizard_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_project_wizard_step_data_session_id ON project_wizard_step_data(session_id);
CREATE INDEX IF NOT EXISTS idx_project_team_assignments_project_id ON project_team_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_assignments_user_id ON project_team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_milestone_id ON project_tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id ON project_status_history(project_id);

-- Apply updated_at triggers to wizard tables
CREATE TRIGGER update_project_templates_updated_at 
    BEFORE UPDATE ON project_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_wizard_sessions_updated_at 
    BEFORE UPDATE ON project_wizard_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_wizard_step_data_updated_at 
    BEFORE UPDATE ON project_wizard_step_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_team_assignments_updated_at 
    BEFORE UPDATE ON project_team_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at 
    BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at 
    BEFORE UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_status_history_updated_at 
    BEFORE UPDATE ON project_status_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Get the first user ID for sample data (assuming at least one user exists)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user ID
    SELECT id INTO first_user_id FROM users LIMIT 1;
    
    -- Insert default project templates only if we have a user
    IF first_user_id IS NOT NULL THEN
        INSERT INTO project_templates (name, description, category, default_budget, estimated_duration, required_roles, template_data, created_by) VALUES
        ('Standard Infrastructure Project', 'Standard template for infrastructure projects', 'Infrastructure', 1000000.00, 365, ARRAY['Project Manager', 'Engineer', 'Contractor'], '{"phases": ["Planning", "Design", "Construction", "Completion"], "gates": ["Gate 1", "Gate 2", "Gate 3", "Gate 4"]}', first_user_id),
        ('IT System Implementation', 'Template for IT system implementations', 'Technology', 500000.00, 180, ARRAY['Project Manager', 'System Analyst', 'Developer'], '{"phases": ["Analysis", "Design", "Development", "Testing", "Deployment"], "gates": ["Requirements Gate", "Design Gate", "Testing Gate", "Go-Live Gate"]}', first_user_id),
        ('Building Renovation', 'Template for building renovation projects', 'Construction', 2000000.00, 270, ARRAY['Project Manager', 'Architect', 'Contractor', 'Safety Officer'], '{"phases": ["Assessment", "Planning", "Renovation", "Inspection"], "gates": ["Assessment Gate", "Planning Gate", "Construction Gate", "Completion Gate"]}', first_user_id),
        ('Research & Development', 'Template for R&D projects', 'Research', 300000.00, 540, ARRAY['Project Manager', 'Researcher', 'Analyst'], '{"phases": ["Research", "Development", "Testing", "Documentation"], "gates": ["Research Gate", "Development Gate", "Testing Gate", "Publication Gate"]}', first_user_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Update existing projects table if needed (add columns that might be missing)
DO $$ 
BEGIN
    -- Add project_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_type') THEN
        ALTER TABLE projects ADD COLUMN project_type VARCHAR(100) DEFAULT 'Standard';
    END IF;
    
    -- Add region column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'region') THEN
        ALTER TABLE projects ADD COLUMN region VARCHAR(100) DEFAULT 'Alberta';
    END IF;
    
    -- Add ministry column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'ministry') THEN
        ALTER TABLE projects ADD COLUMN ministry VARCHAR(100) DEFAULT 'Infrastructure';
    END IF;
    
    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'start_date') THEN
        ALTER TABLE projects ADD COLUMN start_date DATE;
    END IF;
    
    -- Add expected_completion column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'expected_completion') THEN
        ALTER TABLE projects ADD COLUMN expected_completion DATE;
    END IF;
END $$;

