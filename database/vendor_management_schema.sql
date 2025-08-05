-- Advanced Vendor Management Database Schema
-- Add these tables to support the vendor management system

-- Vendor Registrations (self-service portal)
CREATE TABLE IF NOT EXISTS vendor_registrations (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    business_number VARCHAR(50) UNIQUE NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(10),
    website VARCHAR(255),
    business_type VARCHAR(100),
    capabilities JSONB,
    certifications JSONB,
    password_hash VARCHAR(255) NOT NULL,
    registration_status VARCHAR(50) DEFAULT 'Pending Review',
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    approval_comments TEXT,
    rejected_by INTEGER REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Documents (document management)
CREATE TABLE IF NOT EXISTS vendor_documents (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendor_registrations(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending Review',
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Portal Sessions (session management)
CREATE TABLE IF NOT EXISTS vendor_portal_sessions (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendor_registrations(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Qualification Criteria (assessment framework)
CREATE TABLE IF NOT EXISTS qualification_criteria (
    id SERIAL PRIMARY KEY,
    criteria_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.0,
    max_score INTEGER NOT NULL DEFAULT 100,
    is_required BOOLEAN DEFAULT false,
    evaluation_method VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Assessments (qualification assessments)
CREATE TABLE IF NOT EXISTS vendor_assessments (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendor_registrations(id) ON DELETE CASCADE,
    assessed_by INTEGER NOT NULL REFERENCES users(id),
    overall_score DECIMAL(8,2) NOT NULL,
    max_score DECIMAL(8,2) NOT NULL,
    qualification_status VARCHAR(50) NOT NULL,
    overall_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Qualification Scores (detailed scoring)
CREATE TABLE IF NOT EXISTS vendor_qualification_scores (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES vendor_assessments(id) ON DELETE CASCADE,
    criteria_id INTEGER REFERENCES qualification_criteria(id),
    criteria_name VARCHAR(255) NOT NULL,
    score DECIMAL(8,2) NOT NULL,
    max_score DECIMAL(8,2) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Performance Metrics (performance tracking)
CREATE TABLE IF NOT EXISTS vendor_performance_metrics (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id),
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(50),
    measurement_date DATE NOT NULL,
    measured_by INTEGER REFERENCES users(id),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Ratings (performance ratings)
CREATE TABLE IF NOT EXISTS vendor_ratings (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id),
    rated_by INTEGER NOT NULL REFERENCES users(id),
    overall_rating DECIMAL(3,2) NOT NULL CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 1.0 AND quality_rating <= 5.0),
    timeliness_rating DECIMAL(3,2) CHECK (timeliness_rating >= 1.0 AND timeliness_rating <= 5.0),
    communication_rating DECIMAL(3,2) CHECK (communication_rating >= 1.0 AND communication_rating <= 5.0),
    value_rating DECIMAL(3,2) CHECK (value_rating >= 1.0 AND value_rating <= 5.0),
    comments TEXT,
    rating_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Reviews (formal reviews)
CREATE TABLE IF NOT EXISTS performance_reviews (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    reviewed_by INTEGER NOT NULL REFERENCES users(id),
    overall_performance_score DECIMAL(5,2),
    strengths TEXT,
    areas_for_improvement TEXT,
    action_items TEXT,
    next_review_date DATE,
    review_status VARCHAR(50) DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts (contract management)
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    contract_title VARCHAR(255) NOT NULL,
    contract_type VARCHAR(100) NOT NULL,
    contract_value DECIMAL(15,2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft',
    terms_and_conditions TEXT,
    deliverables TEXT,
    payment_terms TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract Templates (template management)
CREATE TABLE IF NOT EXISTS contract_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    template_content TEXT NOT NULL,
    template_variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contract Renewals (renewal tracking)
CREATE TABLE IF NOT EXISTS contract_renewals (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    renewal_date DATE NOT NULL,
    new_end_date DATE NOT NULL,
    renewal_value DECIMAL(15,2),
    renewal_terms TEXT,
    renewed_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default qualification criteria
INSERT INTO qualification_criteria (criteria_name, description, category, weight, max_score, is_required, evaluation_method) VALUES
('Business Registration', 'Valid business registration and licensing', 'Legal Compliance', 1.0, 100, true, 'Document Review'),
('Insurance Coverage', 'Adequate liability and professional insurance', 'Legal Compliance', 1.0, 100, true, 'Document Review'),
('Financial Stability', 'Financial statements and credit worthiness', 'Financial', 0.8, 100, true, 'Financial Analysis'),
('Technical Capability', 'Technical skills and expertise assessment', 'Technical', 1.2, 100, true, 'Technical Evaluation'),
('Past Performance', 'Track record and references from previous projects', 'Experience', 1.0, 100, false, 'Reference Check'),
('Quality Management', 'Quality assurance processes and certifications', 'Quality', 0.9, 100, false, 'Process Review'),
('Safety Record', 'Workplace safety history and procedures', 'Safety', 1.1, 100, true, 'Safety Audit'),
('Environmental Compliance', 'Environmental policies and compliance record', 'Environmental', 0.7, 100, false, 'Compliance Review'),
('Project Management', 'Project management methodology and tools', 'Management', 0.8, 100, false, 'Methodology Review'),
('Communication Skills', 'Communication and reporting capabilities', 'Soft Skills', 0.6, 100, false, 'Interview Assessment')
ON CONFLICT DO NOTHING;

-- Insert default contract templates
INSERT INTO contract_templates (template_name, template_type, template_content, template_variables, created_by) VALUES
('Standard Service Contract', 'Service', 'STANDARD SERVICE AGREEMENT\n\nThis agreement is between {{VENDOR_NAME}} and the Government of Alberta...', '{"VENDOR_NAME": "text", "CONTRACT_VALUE": "currency", "START_DATE": "date", "END_DATE": "date"}', 1),
('Construction Contract', 'Construction', 'CONSTRUCTION CONTRACT\n\nThis construction agreement is between {{VENDOR_NAME}} and the Government of Alberta...', '{"VENDOR_NAME": "text", "PROJECT_DESCRIPTION": "text", "CONTRACT_VALUE": "currency", "COMPLETION_DATE": "date"}', 1),
('IT Services Contract', 'Technology', 'INFORMATION TECHNOLOGY SERVICES AGREEMENT\n\nThis IT services agreement is between {{VENDOR_NAME}} and the Government of Alberta...', '{"VENDOR_NAME": "text", "SERVICE_DESCRIPTION": "text", "SLA_REQUIREMENTS": "text", "CONTRACT_VALUE": "currency"}', 1),
('Consulting Agreement', 'Consulting', 'CONSULTING SERVICES AGREEMENT\n\nThis consulting agreement is between {{VENDOR_NAME}} and the Government of Alberta...', '{"VENDOR_NAME": "text", "CONSULTANT_EXPERTISE": "text", "DELIVERABLES": "text", "HOURLY_RATE": "currency"}', 1)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_registrations_email ON vendor_registrations(contact_email);
CREATE INDEX IF NOT EXISTS idx_vendor_registrations_status ON vendor_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_vendor_registrations_business_number ON vendor_registrations(business_number);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_type ON vendor_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_vendor_portal_sessions_vendor_id ON vendor_portal_sessions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_portal_sessions_token ON vendor_portal_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_qualification_criteria_category ON qualification_criteria(category);
CREATE INDEX IF NOT EXISTS idx_vendor_assessments_vendor_id ON vendor_assessments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_qualification_scores_assessment_id ON vendor_qualification_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_metrics_vendor_id ON vendor_performance_metrics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_metrics_project_id ON vendor_performance_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_vendor_id ON vendor_ratings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_project_id ON vendor_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_vendor_id ON performance_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contract_renewals_contract_id ON contract_renewals(contract_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
DO $$ 
BEGIN
    -- Only create triggers if they don't already exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vendor_registrations_updated_at') THEN
        CREATE TRIGGER update_vendor_registrations_updated_at 
            BEFORE UPDATE ON vendor_registrations 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_qualification_criteria_updated_at') THEN
        CREATE TRIGGER update_qualification_criteria_updated_at 
            BEFORE UPDATE ON qualification_criteria 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_performance_reviews_updated_at') THEN
        CREATE TRIGGER update_performance_reviews_updated_at 
            BEFORE UPDATE ON performance_reviews 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contracts_updated_at') THEN
        CREATE TRIGGER update_contracts_updated_at 
            BEFORE UPDATE ON contracts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_templates_updated_at') THEN
        CREATE TRIGGER update_contract_templates_updated_at 
            BEFORE UPDATE ON contract_templates 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

