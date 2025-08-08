#!/bin/bash

# PFMT Database Fix Script Runner
# This script applies the database fixes to resolve missing table errors

echo "🔧 PFMT Database Fix Script"
echo "=========================="
echo ""

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the pfmt_complete_application root directory"
    exit 1
fi

echo "📋 This script will:"
echo "   - Create missing database tables (project_templates, project_wizard_sessions, gate_meetings)"
echo "   - Create the upcoming_gate_meetings view"
echo "   - Insert default data for gate meeting types and project templates"
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q "pfmt_db_dev"; then
    echo "❌ Error: Database container (pfmt_db_dev) is not running."
    echo "   Please start the application with: docker-compose up -d"
    exit 1
fi

echo "🚀 Applying database fixes..."
echo ""

# Apply the database fix script
if docker exec -i pfmt_db_dev psql -U postgres -d pfmt_integrated < database_fix_script.sql; then
    echo ""
    echo "✅ Database fixes applied successfully!"
    echo ""
    echo "🎉 The following issues should now be resolved:"
    echo "   - Project wizard should work (project_templates table created)"
    echo "   - Gate meetings API should work (upcoming_gate_meetings view created)"
    echo "   - Project creation should complete properly"
    echo ""
    echo "🔄 You may need to refresh your browser to see the changes."
else
    echo ""
    echo "❌ Error applying database fixes. Please check the error messages above."
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Ensure the database container is running: docker ps"
    echo "   2. Check database logs: docker logs pfmt_db_dev"
    echo "   3. Verify database connection settings in .env files"
    exit 1
fi

echo ""
echo "✨ Database fix complete! Your PFMT application should now work properly."

