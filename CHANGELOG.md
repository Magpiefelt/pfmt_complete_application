# Changelog

All notable changes to the PFMT Enhanced Application are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-08-18

### 🚀 Major Features Added

#### Dual-Wizard System
- **NEW**: Implemented role-based wizard system with different flows for different user types
- **NEW**: PMI users see project initiation workflow
- **NEW**: Directors see team assignment workflow for initiated projects
- **NEW**: PM/SPM users see configuration workflow for assigned projects
- **NEW**: Legacy wizard support for Directors/SPMs/Admins for backward compatibility

#### Dual Status System
- **NEW**: Added `lifecycle_status` column to projects table
- **NEW**: Implemented dual status tracking: `workflow_status` + `lifecycle_status`
- **NEW**: Enhanced project state management with comprehensive status options
- **NEW**: Status transitions: initiated → assigned → finalized (workflow) + active → completed → archived (lifecycle)

### 🔧 Critical Fixes

#### P0 Configuration Step Fix
- **FIXED**: Configuration Step component now properly binds to wizard store fields
- **FIXED**: Replaced local `formData` with computed properties bound to `wizardStore.vendors.vendors`
- **FIXED**: Fixed budget data binding to `wizardStore.budget.budget_breakdown`
- **FIXED**: Fixed milestone binding to `wizardStore.milestone1` (single milestone enforcement)
- **FIXED**: Fixed overview data binding to `wizardStore.overview`
- **FIXED**: Project finalization now works correctly with proper store data access

#### Data Persistence Issues
- **FIXED**: Form data now persists correctly between navigation steps
- **FIXED**: Auto-save functionality integrated with wizard store
- **FIXED**: Two-way data binding ensures immediate store updates
- **FIXED**: Wizard store contract compliance for all form components

### 🆕 New API Endpoints

#### Dual-Wizard Support
- **NEW**: `GET /api/project-workflow/users/available` - Get available users for team assignment
- **NEW**: `GET /api/project-workflow/vendors/available` - Get available vendors for project configuration
- **NEW**: `GET /api/project-workflow/:id/details` - Get enhanced project details with lifecycle status
- **NEW**: Enhanced `getNextStepForUser` function for role-based navigation

#### Enhanced Project Management
- **NEW**: `getProjectWithStatus` method for comprehensive project data
- **NEW**: Fallback mechanisms for all new endpoints to ensure reliability
- **NEW**: Enhanced error handling and response formatting

### 🎨 Frontend Enhancements

#### Router Improvements
- **NEW**: Legacy wizard route for authorized users (`/legacy-wizard`)
- **NEW**: Enhanced wizard routes with proper role-based access control
- **NEW**: Improved route guards and navigation logic

#### Component Improvements
- **ENHANCED**: Configuration Step with proper store binding and validation
- **ENHANCED**: Wizard integration composable with dual status support
- **ENHANCED**: Project workflow API service with new methods and fallbacks
- **ENHANCED**: Form validation and error handling throughout wizard steps

#### User Experience
- **NEW**: Auto-save indicators and feedback
- **NEW**: Enhanced form validation with real-time error display
- **NEW**: Improved responsive design for mobile devices
- **NEW**: Better loading states and user feedback

### 🗄️ Database Changes

#### Schema Enhancements
- **NEW**: Added `lifecycle_status` column with comprehensive status options
- **NEW**: Added check constraints for valid status values
- **NEW**: Added database indexes for performance optimization
- **NEW**: Enhanced migration script with proper rollback support

#### Data Migration
- **NEW**: Automatic migration of existing projects to new status system
- **NEW**: Intelligent status mapping based on current project state
- **NEW**: Verification queries for migration validation

### 🔐 Security Improvements

#### Authorization Enhancements
- **ENHANCED**: Role-based access control for new endpoints
- **ENHANCED**: Enhanced route guards with proper role checking
- **ENHANCED**: Improved middleware for dual-wizard system
- **ENHANCED**: Better error handling for unauthorized access

#### Data Protection
- **ENHANCED**: Input validation for all new form fields
- **ENHANCED**: SQL injection prevention in new queries
- **ENHANCED**: Enhanced audit logging for new operations

### 📊 Performance Optimizations

#### Database Performance
- **NEW**: Indexes on `lifecycle_status` column for query optimization
- **ENHANCED**: Optimized queries for dual status system
- **ENHANCED**: Connection pooling improvements

#### Frontend Performance
- **ENHANCED**: Computed properties for efficient reactivity
- **ENHANCED**: Optimized component re-rendering
- **ENHANCED**: Better memory management in wizard components

### 🧪 Testing Improvements

#### Test Coverage
- **NEW**: Comprehensive test scenarios for dual-wizard system
- **NEW**: Database migration testing procedures
- **NEW**: API endpoint testing for new functionality
- **NEW**: End-to-end workflow testing

#### Validation Framework
- **NEW**: Manual testing checklist for critical functionality
- **NEW**: Automated validation for store binding
- **NEW**: Performance benchmarking for new features

### 📚 Documentation

#### Comprehensive Documentation
- **NEW**: Enhanced README with dual-wizard system documentation
- **NEW**: API documentation for new endpoints
- **NEW**: Installation and deployment guides
- **NEW**: Troubleshooting guide with common issues

#### Developer Resources
- **NEW**: Architecture documentation for dual-wizard system
- **NEW**: Code examples and usage patterns
- **NEW**: Migration guide from v1.x to v2.0
- **NEW**: Contributing guidelines

### 🔄 Backward Compatibility

#### Legacy Support
- **MAINTAINED**: All existing API endpoints continue to work
- **MAINTAINED**: Existing user roles and permissions preserved
- **MAINTAINED**: Legacy wizard accessible to authorized users
- **MAINTAINED**: Existing project data fully compatible

#### Migration Path
- **NEW**: Seamless upgrade path from v1.x
- **NEW**: Data migration scripts with rollback capability
- **NEW**: Configuration migration tools
- **NEW**: User training materials for new features

### 🐛 Bug Fixes

#### Critical Issues Resolved
- **FIXED**: Configuration Step store contract violation
- **FIXED**: Data persistence failures in project finalization
- **FIXED**: Form validation errors in wizard steps
- **FIXED**: Navigation issues between wizard steps

#### Minor Issues Resolved
- **FIXED**: UI inconsistencies in form layouts
- **FIXED**: Error message display issues
- **FIXED**: Mobile responsiveness problems
- **FIXED**: Loading state indicators

### ⚠️ Breaking Changes

#### Configuration Changes
- **BREAKING**: Configuration Step component API changed (internal only)
- **BREAKING**: Wizard store structure enhanced (backward compatible data)
- **BREAKING**: Database schema requires migration for lifecycle_status

#### Migration Required
- **ACTION REQUIRED**: Run database migration script
- **ACTION REQUIRED**: Update environment configuration
- **ACTION REQUIRED**: Clear browser cache for frontend updates

### 🔮 Deprecated Features

#### Legacy Components
- **DEPRECATED**: Old configuration step implementation (removed)
- **DEPRECATED**: Legacy status handling (replaced with dual system)

#### Future Removals
- **NOTICE**: Legacy wizard will be maintained but not enhanced
- **NOTICE**: Old API response formats will be phased out in v3.0

---

## [1.0.0] - 2025-08-01

### Initial Release
- **NEW**: Basic project workflow system
- **NEW**: Role-based access control
- **NEW**: Project initiation, assignment, and finalization
- **NEW**: Vue.js 3 frontend with TypeScript
- **NEW**: Node.js/Express backend
- **NEW**: PostgreSQL database with comprehensive schema
- **NEW**: JWT authentication system
- **NEW**: Audit logging and security features

---

## Version History

- **v2.0.0** - Dual-Wizard System with Enhanced Features (Current)
- **v1.0.0** - Initial Release with Basic Workflow System

## Upgrade Guide

### From v1.0.0 to v2.0.0

1. **Database Migration**
   ```bash
   # Backup existing database
   pg_dump pfmt_enhanced > backup_v1.sql
   
   # Run migration
   psql -d pfmt_enhanced -f database/add_lifecycle_status_migration.sql
   ```

2. **Backend Updates**
   ```bash
   # Update dependencies
   cd backend && npm install
   
   # Restart services
   npm restart
   ```

3. **Frontend Updates**
   ```bash
   # Update dependencies
   cd frontend && npm install
   
   # Clear cache and rebuild
   npm run build
   ```

4. **Verification**
   - Test dual-wizard functionality
   - Verify role-based access
   - Confirm data persistence in Configuration Step
   - Test legacy wizard access

## Support

For questions about this release or upgrade assistance:
- **Documentation**: See README.md and docs/ folder
- **Issues**: Report bugs via GitHub Issues
- **Support**: Contact development team

---

**PFMT Enhanced Application** - Professional Financial Management Tool  
**Maintained by**: Manus AI Development Team

