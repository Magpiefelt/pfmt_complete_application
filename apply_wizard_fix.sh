#!/bin/bash

# PFMT Project Wizard Database Fix Script
# This script applies the missing database tables for the project wizard

echo "🔧 PFMT Project Wizard Database Fix"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "database/fix_wizard_tables.sql" ]; then
    echo "❌ Error: fix_wizard_tables.sql not found. Please run this script from the project root directory."
    exit 1
fi

echo "📋 This script will:"
echo "   - Create missing project_templates table"
echo "   - Create missing project_wizard_sessions table" 
echo "   - Create missing project_wizard_step_data table"
echo "   - Add default project templates"
echo "   - Create performance indexes"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && docker compose ps &> /dev/null; then
    echo "🐳 Using Docker Compose..."
    
    # Check if database container is running
    if docker compose ps pfmt_db_dev | grep -q "Up"; then
        echo "✅ Database container is running"
        
        # Apply the fix
        echo "🔄 Applying database fix..."
        docker compose exec pfmt_db_dev psql -U pfmt_user -d pfmt_integrated -f /app/database/fix_wizard_tables.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ Database fix applied successfully!"
            
            # Restart backend to clear any cached connections
            echo "🔄 Restarting backend service..."
            docker compose restart pfmt_backend_dev
            
            echo "✅ Backend service restarted"
            echo ""
            echo "🎉 Fix complete! The Create New Project wizard should now work."
            echo "   You can test it by navigating to the 'Create New Project' page."
        else
            echo "❌ Failed to apply database fix"
            exit 1
        fi
    else
        echo "❌ Database container is not running. Please start the application first:"
        echo "   docker compose up -d"
        exit 1
    fi
    
elif command -v psql &> /dev/null; then
    echo "🐘 Using direct PostgreSQL connection..."
    
    # Try to connect and apply the fix
    echo "🔄 Applying database fix..."
    PGPASSWORD=pfmt_password psql -h localhost -U pfmt_user -d pfmt_integrated -f database/fix_wizard_tables.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Database fix applied successfully!"
        echo ""
        echo "🎉 Fix complete! Please restart your backend service and test the Create New Project wizard."
    else
        echo "❌ Failed to apply database fix. Please check your PostgreSQL connection."
        echo "   Make sure PostgreSQL is running and the database credentials are correct."
        exit 1
    fi
    
else
    echo "❌ Neither Docker nor psql command found."
    echo "   Please install Docker or PostgreSQL client tools, or apply the fix manually:"
    echo "   psql -h localhost -U pfmt_user -d pfmt_integrated -f database/fix_wizard_tables.sql"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo "   1. Open your PFMT application in the browser"
echo "   2. Navigate to 'Create New Project'"
echo "   3. Verify that the page loads without errors"
echo "   4. Check that project templates are available"
echo ""
echo "🐛 If you still see issues, check the backend logs for any remaining errors."

