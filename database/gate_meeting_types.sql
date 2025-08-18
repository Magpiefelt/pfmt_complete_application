-- Gate Meeting Types Table (Added for Team A integration)
-- This table is required for gate meetings functionality

CREATE TABLE IF NOT EXISTS gate_meeting_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

