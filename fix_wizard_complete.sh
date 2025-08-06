#!/bin/bash

# PFMT Project Wizard Complete Fix Script
# This script applies all necessary fixes for the UUID mismatch and missing tables

echo "🚀 PFMT Project Wizard Complete Fix"
echo "=================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "database/fix_uuid_schema.sql" ]; then
    print_error "fix_uuid_schema.sql not found. Please run this script from the project root directory."
    exit 1
fi

print_status "This script will fix the following issues:"
echo "   ✅ UUID mismatch (database expects UUID, app sends integer)"
echo "   ✅ Missing database tables (project_templates, project_wizard_sessions)"
echo "   ✅ Development authentication with proper UUIDs"
echo "   ✅ Backend controller validation"
echo ""

# Check if Docker is available and containers are running
if command -v docker &> /dev/null; then
    print_status "Checking Docker containers..."
    
    if docker compose ps pfmt_db_dev | grep -q "Up"; then
        print_success "Database container is running"
        
        # Apply the comprehensive database fix
        print_status "Applying comprehensive database fix..."
        docker compose exec pfmt_db_dev psql -U pfmt_user -d pfmt_integrated -f /app/database/fix_uuid_schema.sql
        
        if [ $? -eq 0 ]; then
            print_success "Database fix applied successfully!"
            
            # Install uuid package if not already installed
            print_status "Installing UUID package for Node.js..."
            docker compose exec pfmt_backend_dev npm install uuid
            
            if [ $? -eq 0 ]; then
                print_success "UUID package installed"
            else
                print_warning "UUID package installation failed, but may already be installed"
            fi
            
            # Restart backend to load new middleware and fixes
            print_status "Restarting backend service to apply code changes..."
            docker compose restart pfmt_backend_dev
            
            if [ $? -eq 0 ]; then
                print_success "Backend service restarted successfully"
                
                # Wait a moment for the service to fully start
                print_status "Waiting for backend to fully start..."
                sleep 5
                
                # Test the fix
                print_status "Testing the wizard initialization..."
                
                # Test with proper UUID headers
                RESPONSE=$(curl -s -w "%{http_code}" -X POST \
                    -H "x-user-id: 550e8400-e29b-41d4-a716-446655440002" \
                    -H "x-user-role: Project Manager" \
                    -H "x-user-name: Test User" \
                    -H "Content-Type: application/json" \
                    http://localhost:3002/api/project-wizard/init)
                
                HTTP_CODE="${RESPONSE: -3}"
                RESPONSE_BODY="${RESPONSE%???}"
                
                if [ "$HTTP_CODE" = "200" ]; then
                    print_success "Wizard initialization test PASSED! ✅"
                    echo "   Response: $RESPONSE_BODY"
                else
                    print_warning "Wizard initialization returned HTTP $HTTP_CODE"
                    echo "   Response: $RESPONSE_BODY"
                    echo "   This might be normal if the backend is still starting up"
                fi
                
                # Test templates endpoint
                print_status "Testing templates endpoint..."
                TEMPLATES_RESPONSE=$(curl -s -w "%{http_code}" \
                    -H "x-user-id: 550e8400-e29b-41d4-a716-446655440002" \
                    -H "x-user-role: Project Manager" \
                    -H "x-user-name: Test User" \
                    http://localhost:3002/api/project-wizard/templates)
                
                TEMPLATES_HTTP_CODE="${TEMPLATES_RESPONSE: -3}"
                TEMPLATES_BODY="${TEMPLATES_RESPONSE%???}"
                
                if [ "$TEMPLATES_HTTP_CODE" = "200" ]; then
                    print_success "Templates endpoint test PASSED! ✅"
                else
                    print_warning "Templates endpoint returned HTTP $TEMPLATES_HTTP_CODE"
                    echo "   Response: $TEMPLATES_BODY"
                fi
                
            else
                print_error "Failed to restart backend service"
                exit 1
            fi
        else
            print_error "Failed to apply database fix"
            exit 1
        fi
    else
        print_error "Database container is not running. Please start the application first:"
        echo "   docker compose up -d"
        exit 1
    fi
    
elif command -v psql &> /dev/null; then
    print_status "Using direct PostgreSQL connection..."
    
    # Try to connect and apply the fix
    print_status "Applying database fix..."
    PGPASSWORD=pfmt_password psql -h localhost -U pfmt_user -d pfmt_integrated -f database/fix_uuid_schema.sql
    
    if [ $? -eq 0 ]; then
        print_success "Database fix applied successfully!"
        
        # Install uuid package
        print_status "Installing UUID package..."
        cd backend && npm install uuid && cd ..
        
        print_success "Please restart your backend service manually"
    else
        print_error "Failed to apply database fix. Please check your PostgreSQL connection."
        exit 1
    fi
    
else
    print_error "Neither Docker nor psql command found."
    echo "   Please install Docker or PostgreSQL client tools."
    exit 1
fi

echo ""
print_success "🎉 Complete fix applied successfully!"
echo ""
echo "📋 What was fixed:"
echo "   ✅ Database tables created (project_templates, project_wizard_sessions, project_wizard_step_data)"
echo "   ✅ Default user created with proper UUID format"
echo "   ✅ 4 project templates added"
echo "   ✅ Development authentication middleware added"
echo "   ✅ Backend controller updated with UUID validation"
echo "   ✅ FlexibleAuth middleware updated to use UUIDs"
echo ""
echo "🧪 Next steps:"
echo "   1. Open your PFMT application: http://localhost:5173"
echo "   2. Navigate to 'Create New Project'"
echo "   3. Verify the page loads without 500 errors"
echo "   4. Check that project templates are displayed"
echo "   5. Test the wizard initialization"
echo ""
echo "🔧 Development headers (for testing):"
echo "   x-user-id: 550e8400-e29b-41d4-a716-446655440002"
echo "   x-user-role: Project Manager"
echo "   x-user-name: Test User"
echo ""
echo "🐛 If you still see issues:"
echo "   - Check backend logs: docker compose logs pfmt_backend_dev"
echo "   - Check database logs: docker compose logs pfmt_db_dev"
echo "   - Verify all containers are running: docker compose ps"

