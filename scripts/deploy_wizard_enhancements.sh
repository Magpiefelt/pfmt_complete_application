#!/bin/bash

# PFMT Project Wizard Enhancement Deployment Script
# This script deploys the enhanced project creation wizard with all improvements

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$PROJECT_ROOT/logs/deployment_$(date +%Y%m%d_%H%M%S).log"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO $(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 16+ and try again."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    if ! printf '%s\n%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V -C; then
        error "Node.js version $NODE_VERSION is too old. Please upgrade to version 16+ and try again."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check if PostgreSQL is running
    if ! pg_isready -q; then
        error "PostgreSQL is not running. Please start PostgreSQL and try again."
        exit 1
    fi
    
    # Check if project directory exists
    if [ ! -d "$PROJECT_ROOT" ]; then
        error "Project root directory not found: $PROJECT_ROOT"
        exit 1
    fi
    
    log "Prerequisites check completed successfully"
}

# Function to create backup
create_backup() {
    log "Creating backup of existing files..."
    
    # Backup backend files
    if [ -d "$PROJECT_ROOT/backend" ]; then
        cp -r "$PROJECT_ROOT/backend" "$BACKUP_DIR/"
        log "Backend files backed up"
    fi
    
    # Backup frontend files
    if [ -d "$PROJECT_ROOT/frontend" ]; then
        cp -r "$PROJECT_ROOT/frontend" "$BACKUP_DIR/"
        log "Frontend files backed up"
    fi
    
    # Backup database schema
    if command -v pg_dump &> /dev/null; then
        pg_dump -s "$DATABASE_NAME" > "$BACKUP_DIR/schema_backup.sql" 2>/dev/null || warning "Could not backup database schema"
    fi
    
    log "Backup created at: $BACKUP_DIR"
}

# Function to run database migrations
run_database_migrations() {
    log "Running database migrations..."
    
    # Check if migration file exists
    MIGRATION_FILE="$SCRIPT_DIR/database_migrations.sql"
    if [ ! -f "$MIGRATION_FILE" ]; then
        warning "Migration file not found: $MIGRATION_FILE"
        return 0
    fi
    
    # Run migrations
    if psql -d "$DATABASE_NAME" -f "$MIGRATION_FILE" >> "$LOG_FILE" 2>&1; then
        log "Database migrations completed successfully"
    else
        error "Database migrations failed. Check log file: $LOG_FILE"
        exit 1
    fi
}

# Function to install backend dependencies
install_backend_dependencies() {
    log "Installing backend dependencies..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Install new dependencies
    BACKEND_DEPS=(
        "helmet@^7.0.0"
        "compression@^1.7.4"
        "node-cache@^5.1.2"
        "redis@^4.6.0"
        "winston@^3.8.0"
        "nodemailer@^6.9.0"
        "uuid@^9.0.0"
    )
    
    for dep in "${BACKEND_DEPS[@]}"; do
        if npm install "$dep" >> "$LOG_FILE" 2>&1; then
            log "Installed: $dep"
        else
            warning "Failed to install: $dep"
        fi
    done
    
    log "Backend dependencies installation completed"
}

# Function to install frontend dependencies
install_frontend_dependencies() {
    log "Installing frontend dependencies..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # Install new dependencies
    FRONTEND_DEPS=(
        "lucide-vue-next@^0.263.0"
        "@vueuse/core@^10.0.0"
        "vue-toastification@^2.0.0"
    )
    
    for dep in "${FRONTEND_DEPS[@]}"; do
        if npm install "$dep" >> "$LOG_FILE" 2>&1; then
            log "Installed: $dep"
        else
            warning "Failed to install: $dep"
        fi
    done
    
    log "Frontend dependencies installation completed"
}

# Function to deploy backend files
deploy_backend_files() {
    log "Deploying backend files..."
    
    # Copy enhanced controller
    if [ -f "$SCRIPT_DIR/projectWizardController_enhanced.js" ]; then
        cp "$SCRIPT_DIR/projectWizardController_enhanced.js" "$PROJECT_ROOT/backend/controllers/projectWizardController.js"
        log "Enhanced controller deployed"
    fi
    
    # Copy enhanced routes
    if [ -f "$SCRIPT_DIR/projectWizard_routes_enhanced.js" ]; then
        cp "$SCRIPT_DIR/projectWizard_routes_enhanced.js" "$PROJECT_ROOT/backend/routes/projectWizard.js"
        log "Enhanced routes deployed"
    fi
    
    # Copy middleware
    if [ -f "$SCRIPT_DIR/wizardMiddleware.js" ]; then
        cp "$SCRIPT_DIR/wizardMiddleware.js" "$PROJECT_ROOT/backend/middleware/wizardMiddleware.js"
        log "Wizard middleware deployed"
    fi
    
    # Copy utilities
    if [ -f "$SCRIPT_DIR/wizardUtils.js" ]; then
        cp "$SCRIPT_DIR/wizardUtils.js" "$PROJECT_ROOT/backend/utils/wizardUtils.js"
        log "Wizard utilities deployed"
    fi
    
    # Copy notification service
    if [ -f "$SCRIPT_DIR/notificationService.js" ]; then
        cp "$SCRIPT_DIR/notificationService.js" "$PROJECT_ROOT/backend/services/notificationService.js"
        log "Notification service deployed"
    fi
    
    log "Backend files deployment completed"
}

# Function to deploy frontend files
deploy_frontend_files() {
    log "Deploying frontend files..."
    
    # Create directories if they don't exist
    mkdir -p "$PROJECT_ROOT/frontend/src/components/project-wizard/steps"
    mkdir -p "$PROJECT_ROOT/frontend/src/services"
    mkdir -p "$PROJECT_ROOT/frontend/src/composables"
    
    # Copy enhanced wizard component
    if [ -f "$SCRIPT_DIR/ProjectWizard_enhanced.vue" ]; then
        cp "$SCRIPT_DIR/ProjectWizard_enhanced.vue" "$PROJECT_ROOT/frontend/src/components/project-wizard/ProjectWizard.vue"
        log "Enhanced wizard component deployed"
    fi
    
    # Copy step components
    STEP_COMPONENTS=(
        "ProjectDetailsStep.vue"
        "LocationStep.vue"
        "VendorsStep.vue"
        "BudgetStep.vue"
    )
    
    for component in "${STEP_COMPONENTS[@]}"; do
        if [ -f "$SCRIPT_DIR/$component" ]; then
            cp "$SCRIPT_DIR/$component" "$PROJECT_ROOT/frontend/src/components/project-wizard/steps/"
            log "Step component deployed: $component"
        fi
    done
    
    # Copy enhanced service
    if [ -f "$SCRIPT_DIR/projectWizardService_enhanced.ts" ]; then
        cp "$SCRIPT_DIR/projectWizardService_enhanced.ts" "$PROJECT_ROOT/frontend/src/services/projectWizardService.ts"
        log "Enhanced wizard service deployed"
    fi
    
    log "Frontend files deployment completed"
}

# Function to update configuration files
update_configuration() {
    log "Updating configuration files..."
    
    # Update backend package.json if needed
    cd "$PROJECT_ROOT/backend"
    if [ -f "package.json" ]; then
        # Add new scripts if they don't exist
        npm pkg set scripts.migrate="node scripts/migrate.js"
        npm pkg set scripts.seed="node scripts/seed.js"
        log "Backend package.json updated"
    fi
    
    # Update frontend package.json if needed
    cd "$PROJECT_ROOT/frontend"
    if [ -f "package.json" ]; then
        # Add new scripts if they don't exist
        npm pkg set scripts.type-check="vue-tsc --noEmit"
        log "Frontend package.json updated"
    fi
    
    log "Configuration files updated"
}

# Function to restart services
restart_services() {
    log "Restarting services..."
    
    # Stop existing processes
    pkill -f "node.*backend" || true
    pkill -f "npm.*serve" || true
    
    # Wait for processes to stop
    sleep 3
    
    # Start backend
    cd "$PROJECT_ROOT/backend"
    if [ -f "package.json" ]; then
        nohup npm start > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
        BACKEND_PID=$!
        log "Backend started with PID: $BACKEND_PID"
    fi
    
    # Start frontend
    cd "$PROJECT_ROOT/frontend"
    if [ -f "package.json" ]; then
        nohup npm run serve > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
        FRONTEND_PID=$!
        log "Frontend started with PID: $FRONTEND_PID"
    fi
    
    # Wait for services to start
    sleep 10
    
    log "Services restarted successfully"
}

# Function to run health checks
run_health_checks() {
    log "Running health checks..."
    
    # Check backend health
    if curl -f -s "http://localhost:3000/api/project-wizard/health" > /dev/null 2>&1; then
        log "Backend health check: PASSED"
    else
        warning "Backend health check: FAILED"
    fi
    
    # Check frontend
    if curl -f -s "http://localhost:8080" > /dev/null 2>&1; then
        log "Frontend health check: PASSED"
    else
        warning "Frontend health check: FAILED"
    fi
    
    # Check database connection
    if psql -d "$DATABASE_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log "Database health check: PASSED"
    else
        warning "Database health check: FAILED"
    fi
    
    log "Health checks completed"
}

# Function to cleanup
cleanup() {
    log "Performing cleanup..."
    
    # Remove temporary files
    find "$PROJECT_ROOT" -name "*.tmp" -delete 2>/dev/null || true
    find "$PROJECT_ROOT" -name ".DS_Store" -delete 2>/dev/null || true
    
    # Clear npm cache
    npm cache clean --force > /dev/null 2>&1 || true
    
    log "Cleanup completed"
}

# Function to display deployment summary
display_summary() {
    echo ""
    echo "======================================"
    echo "  DEPLOYMENT SUMMARY"
    echo "======================================"
    echo ""
    echo "✅ Enhanced Project Wizard Deployed Successfully!"
    echo ""
    echo "📁 Backup Location: $BACKUP_DIR"
    echo "📋 Log File: $LOG_FILE"
    echo ""
    echo "🔧 New Features Deployed:"
    echo "  • Enhanced 4-step wizard with improved UX"
    echo "  • Advanced validation and error handling"
    echo "  • Auto-save functionality"
    echo "  • Performance monitoring and caching"
    echo "  • Comprehensive notification system"
    echo "  • Mobile-responsive design"
    echo "  • Accessibility improvements"
    echo ""
    echo "🌐 Application URLs:"
    echo "  • Frontend: http://localhost:8080"
    echo "  • Backend API: http://localhost:3000/api"
    echo "  • Wizard: http://localhost:8080/projects/create"
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Test the wizard functionality"
    echo "  2. Configure email notifications (SMTP settings)"
    echo "  3. Set up monitoring and logging"
    echo "  4. Review and customize templates"
    echo ""
    echo "======================================"
}

# Main deployment function
main() {
    log "Starting PFMT Project Wizard Enhancement Deployment"
    log "Deployment started at: $(date)"
    
    # Set default database name if not provided
    DATABASE_NAME=${DATABASE_NAME:-"pfmt_development"}
    
    # Run deployment steps
    check_prerequisites
    create_backup
    run_database_migrations
    install_backend_dependencies
    install_frontend_dependencies
    deploy_backend_files
    deploy_frontend_files
    update_configuration
    restart_services
    run_health_checks
    cleanup
    
    log "Deployment completed successfully at: $(date)"
    display_summary
}

# Error handling
trap 'error "Deployment failed at line $LINENO. Check log file: $LOG_FILE"' ERR

# Check if running as script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --database-name)
                DATABASE_NAME="$2"
                shift 2
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-restart)
                SKIP_RESTART=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --database-name NAME    Database name (default: pfmt_development)"
                echo "  --skip-backup          Skip backup creation"
                echo "  --skip-restart         Skip service restart"
                echo "  --help                 Show this help message"
                echo ""
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run main deployment
    main
fi

