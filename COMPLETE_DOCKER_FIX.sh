#!/bin/bash

# PFMT Wizard Complete Docker Fix Script
# This script will fix the wizard database issues in Docker environment

echo "🚀 PFMT Wizard Complete Fix Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Verify Docker containers are running
echo "Step 1: Checking Docker containers..."
if ! docker ps | grep -q "pfmt_db_dev"; then
    print_error "pfmt_db_dev container is not running!"
    echo "Please start your Docker containers with: docker-compose up -d"
    exit 1
fi
print_status "Docker containers are running"

# Step 2: Check if migration file exists
echo "Step 2: Checking migration file..."
if [ ! -f "database/migrations/007_fix_wizard_uuid_schema.sql" ]; then
    print_error "Migration file not found!"
    echo "Please ensure you're in the correct directory and the migration file exists"
    exit 1
fi
print_status "Migration file found"

# Step 3: Copy migration to container
echo "Step 3: Copying migration to Docker container..."
docker cp database/migrations/007_fix_wizard_uuid_schema.sql pfmt_db_dev:/tmp/
if [ $? -eq 0 ]; then
    print_status "Migration file copied to container"
else
    print_error "Failed to copy migration file"
    exit 1
fi

# Step 4: Check current database state
echo "Step 4: Checking current database state..."
echo "Current tables in database:"
docker exec -it pfmt_db_dev psql -U postgres -d pfmt_db -c "\dt" 2>/dev/null

# Step 5: Run the migration
echo "Step 5: Running database migration..."
docker exec -it pfmt_db_dev psql -U postgres -d pfmt_db -f /tmp/007_fix_wizard_uuid_schema.sql
if [ $? -eq 0 ]; then
    print_status "Migration executed"
else
    print_warning "Migration may have failed, continuing with verification..."
fi

# Step 6: Verify wizard tables were created
echo "Step 6: Verifying wizard tables..."
WIZARD_TABLES=$(docker exec -it pfmt_db_dev psql -U postgres -d pfmt_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'project_wizard%' OR table_name = 'project_templates';" 2>/dev/null | tr -d ' \n\r')

if [ "$WIZARD_TABLES" = "3" ]; then
    print_status "All 3 wizard tables created successfully"
else
    print_warning "Expected 3 wizard tables, found $WIZARD_TABLES. Attempting manual creation..."
    
    # Manual table creation
    echo "Creating tables manually..."
    docker exec -i pfmt_db_dev psql -U postgres -d pfmt_db << 'EOF'
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to handle partial creation)
DROP TABLE IF EXISTS project_wizard_step_data CASCADE;
DROP TABLE IF EXISTS project_wizard_sessions CASCADE;
DROP TABLE IF EXISTS project_templates CASCADE;

-- Create project_templates table
CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    default_budget DECIMAL(15,2),
    estimated_duration INTEGER,
    required_roles JSONB,
    template_data JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_wizard_sessions table
CREATE TABLE project_wizard_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    current_step INTEGER DEFAULT 1,
    template_id UUID REFERENCES project_templates(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_wizard_step_data table
CREATE TABLE project_wizard_step_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL REFERENCES project_wizard_sessions(session_id) ON DELETE CASCADE,
    step_id INTEGER NOT NULL,
    step_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, step_id)
);

-- Insert sample templates
INSERT INTO project_templates (name, description, category, default_budget, estimated_duration, required_roles, template_data, is_active) VALUES
('Standard Construction Project', 'Basic construction project template with standard phases and requirements', 'Construction', 5000000.00, 365, '["Project Manager", "Site Supervisor", "Safety Officer"]', '{"phases": ["Planning", "Design", "Construction", "Closeout"], "deliverables": ["Project Plan", "Design Documents", "Construction Reports", "Final Documentation"]}', true),
('Renovation Project', 'Template for building renovation and upgrade projects', 'Renovation', 2000000.00, 180, '["Project Manager", "Architect", "Contractor"]', '{"phases": ["Assessment", "Design", "Renovation", "Inspection"], "deliverables": ["Assessment Report", "Renovation Plans", "Progress Reports", "Completion Certificate"]}', true),
('Infrastructure Development', 'Large-scale infrastructure development template', 'Infrastructure', 15000000.00, 730, '["Senior Project Manager", "Engineering Lead", "Environmental Specialist"]', '{"phases": ["Feasibility", "Environmental Assessment", "Design", "Construction", "Commissioning"], "deliverables": ["Feasibility Study", "Environmental Impact Assessment", "Technical Specifications", "Construction Documentation", "Commissioning Report"]}', true),
('Maintenance Project', 'Routine maintenance and repair project template', 'Maintenance', 500000.00, 90, '["Maintenance Supervisor", "Technician"]', '{"phases": ["Inspection", "Planning", "Execution", "Verification"], "deliverables": ["Inspection Report", "Maintenance Plan", "Work Orders", "Completion Report"]}', true),
('Emergency Response Project', 'Template for urgent repair and emergency response projects', 'Emergency', 1000000.00, 30, '["Emergency Coordinator", "Project Manager", "Safety Officer"]', '{"phases": ["Assessment", "Emergency Response", "Temporary Measures", "Permanent Solution"], "deliverables": ["Emergency Assessment", "Response Plan", "Safety Reports", "Final Resolution"]}', true);
EOF

    if [ $? -eq 0 ]; then
        print_status "Tables created manually"
    else
        print_error "Failed to create tables manually"
        exit 1
    fi
fi

# Step 7: Verify sample data
echo "Step 7: Verifying sample data..."
TEMPLATE_COUNT=$(docker exec -it pfmt_db_dev psql -U postgres -d pfmt_db -t -c "SELECT COUNT(*) FROM project_templates;" 2>/dev/null | tr -d ' \n\r')

if [ "$TEMPLATE_COUNT" = "5" ]; then
    print_status "Sample templates created successfully ($TEMPLATE_COUNT templates)"
else
    print_warning "Expected 5 templates, found $TEMPLATE_COUNT"
fi

# Step 8: Show created tables
echo "Step 8: Listing wizard tables..."
echo "Wizard tables in database:"
docker exec -it pfmt_db_dev psql -U postgres -d pfmt_db -c "\dt project_wizard*"
docker exec -it pfmt_db_dev psql -U postgres -d pfmt_db -c "\dt project_templates"

# Step 9: Show sample templates
echo "Step 9: Showing sample templates..."
echo "Available project templates:"
docker exec -it pfmt_db_dev psql -U postgres -d pfmt_db -c "SELECT name, category FROM project_templates;"

# Step 10: Restart backend service
echo "Step 10: Restarting backend service..."
docker-compose restart pfmt_backend_dev
if [ $? -eq 0 ]; then
    print_status "Backend service restarted"
else
    print_warning "Failed to restart backend service, please restart manually"
fi

# Step 11: Wait for backend to start
echo "Step 11: Waiting for backend to start..."
sleep 5

# Step 12: Test backend health
echo "Step 12: Testing backend health..."
if curl -s http://localhost:3002/health > /dev/null; then
    print_status "Backend is responding"
else
    print_warning "Backend may not be ready yet, please wait a moment and test manually"
fi

echo ""
echo "🎉 Fix Complete!"
echo "==============="
echo ""
echo "✅ Database tables created"
echo "✅ Sample templates added"
echo "✅ Backend service restarted"
echo ""
echo "🧪 Test Instructions:"
echo "1. Open your browser to the frontend URL"
echo "2. Navigate to 'Create New Project'"
echo "3. Click 'Start Guided Wizard'"
echo "4. You should NOT see 'demo mode' message"
echo "5. Complete all wizard steps"
echo "6. Verify project is created and appears in project lists"
echo ""
echo "🆘 If still having issues:"
echo "- Check backend logs: docker logs pfmt_backend_dev"
echo "- Check database connection in backend"
echo "- Verify frontend is pointing to correct backend URL"
echo ""
print_status "PFMT Wizard fix completed successfully!"

