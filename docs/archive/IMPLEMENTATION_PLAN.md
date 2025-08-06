# PFMT Application Enhancement Implementation Plan

## Executive Summary

This document outlines the implementation plan for comprehensive enhancements to the PFMT (Project Financial Management Tool) application. The enhancements focus on integrating gate meeting processes, improving project versioning workflows, and implementing a new project creation wizard while maintaining existing functionality.

## Current State Analysis

### Frontend Architecture
- **Technology Stack**: Vue 3 + TypeScript
- **Key Components**:
  - `HomePage.vue`: Contains navigation tiles including "Create New Project" (currently points to PFMT extractor)
  - `ProjectDetailPage.vue`: Has tabs including a placeholder Milestones tab
  - `EnhancedGateMeetings.vue`: Manages gate meetings with filters, status tracking, and workflow progress
  - `ProjectVersionsManager.vue`: Handles project version creation, submission, and approval
  - `NewProjectPage.vue`: Exists but not linked from main navigation, contains wizard options
  - `ProjectWizard.vue`: Five-step guided project creation wizard

### Backend Architecture
- **Technology Stack**: Node.js/Express + PostgreSQL
- **Key Controllers**:
  - `gateMeetingController.js`: Manages gate meeting CRUD operations
  - `phase2_enhancements.js`: Handles project version management (create, submit, approve)
  - `projectWizardController.js`: Supports project creation wizard

### Database Schema
- **Key Tables**:
  - `projects`: Main project data
  - `project_versions`: Version management with JSONB data storage
  - `gate_meetings`: Gate meeting management
  - `users`: User authentication and roles
  - `workflow_tasks`: Task management

### Current Routing
- No `/new-project` route exists
- `/pfmt-extractor` route exists but should be deprecated
- Gate meetings accessible via workflow tab

## Implementation Plan

### Phase 1: Gate Meeting Process Enhancements

#### 1.1 Replace Milestones Tab Placeholder
**File**: `frontend/src/pages/ProjectDetailPage.vue`
- Replace the placeholder content in the Milestones tab
- Create new component `ProjectMilestones.vue` or enhance existing `EnhancedGateMeetings.vue`
- Display gate meetings timeline with status, dates, and decisions
- Add role-based editing capabilities (PM/SPM can edit, Directors view-only)

#### 1.2 Add Upcoming Gate Meetings Widget to HomePage
**File**: `frontend/src/pages/HomePage.vue`
- Add new widget in the "Quick Overview" section
- Fetch upcoming gate meetings using existing API endpoints
- Show next 5 upcoming meetings with project names and dates
- Filter by user role (Directors see all, PMs see their projects)

#### 1.3 Link Gate Meetings to Approval Workflow
**File**: `frontend/src/components/workflow/EnhancedGateMeetings.vue`
- Add event emission when meeting is marked "completed"
- Add button to trigger version submission after meeting completion
- Integrate with `ProjectVersionsManager.vue` for seamless workflow

#### 1.4 Workflow Status Synchronization
**Files**: Multiple components
- Update `projectWorkflow.currentState` based on gate meeting progress
- Sync `projectWorkflow.nextAction` with upcoming meetings
- Use Vue watchers to maintain consistency

### Phase 2: Project Versioning & Approval Workflow

#### 2.1 Implement Dual Version System
**File**: `frontend/src/components/workflow/ProjectVersionsManager.vue`
- Enforce exactly two versions: one approved (is_current = true) and one draft
- Block creation of multiple drafts
- Merge changes into existing draft if one exists

#### 2.2 Add Draft/Approved View Toggle
**File**: `frontend/src/pages/ProjectDetailPage.vue`
- Add toggle button near version indicator
- Switch between approved and draft data views
- Ensure editing only affects draft version
- Load appropriate data from `project_versions.version_data`

#### 2.3 Director's All Projects View
**Files**: Project listing components
- Filter to show only approved/current project data
- Add "Pending Draft" badges for projects with drafts awaiting approval
- Use API endpoint that returns `is_current = true` versions

#### 2.4 Manual Submit for Approval
**File**: `frontend/src/components/workflow/ProjectVersionsManager.vue`
- Add prominent "Submit for Approval" button on draft editing page
- Call existing `submitVersionForApproval` API endpoint
- Provide confirmation dialog and success feedback

### Phase 3: New Project Creation Wizard

#### 3.1 Update HomePage Navigation
**File**: `frontend/src/pages/HomePage.vue`
- Change "Create New Project" tile description from "Upload PFMT Excel to create a project"
- Update path from `/pfmt-extractor` to `/new-project`
- Update roles if needed to exclude vendors from deprecated extractor

#### 3.2 Add New Route
**File**: `frontend/src/router/index.ts`
- Add route for `/new-project` pointing to `NewProjectPage.vue`
- Set appropriate role-based access control
- Import `NewProjectPage` component

#### 3.3 Implement Guided Wizard
**File**: `frontend/src/components/project-wizard/ProjectWizard.vue`
- Ensure five-step wizard is fully functional
- Integrate with `ProjectAPI.createProject`
- Add proper validation and error handling
- Navigate to `/projects/:id` upon successful creation

#### 3.4 Deprecate PFMT Extractor
**File**: `frontend/src/pages/PFMTExtractorPage.vue`
- Add deprecation comments
- Keep route for backward compatibility but remove from navigation
- Consider adding deprecation notice in the component

### Phase 4: Scheduled Auto-Submission

#### 4.1 Install and Configure node-cron
**File**: `backend/package.json` and new scheduler file
- Install `node-cron` package
- Create `backend/schedulers/monthlySubmission.js`
- Configure to run on last day of each month
- Set timezone to America/Edmonton

#### 4.2 Implement Auto-Submission Logic
**File**: `backend/schedulers/monthlySubmission.js`
- Find all projects with drafts not already pending approval
- Call existing `submitVersionForApproval` function
- Add logging and error handling
- Prevent duplicate submissions

#### 4.3 Environment Configuration
**File**: `backend/.env` and startup files
- Add environment variables for enabling/disabling scheduler
- Start scheduler when server starts
- Add configuration for timezone and schedule

### Phase 5: Database Schema Updates (If Needed)

#### 5.1 Review Current Schema
- Current `project_versions` table supports the dual version system
- `gate_meetings` table has necessary fields for workflow integration
- May need to add fields for tracking draft status or pending submissions

#### 5.2 Create Migration (If Required)
**File**: `database/migrations/006_enhancement_updates.sql`
- Add any required fields for draft tracking
- Update indexes for performance
- Add constraints for data integrity

### Phase 6: Testing and Documentation

#### 6.1 Comprehensive Testing
- Test PM draft creation and editing workflow
- Test gate meeting completion triggering version submission
- Test director approval/rejection process
- Test auto-submission functionality
- Test new project creation wizard end-to-end
- Test role-based access controls

#### 6.2 Update Documentation
**Files**: `README.md`, code comments
- Document new workflow processes
- Update installation and setup instructions
- Add comments for deprecated components
- Document API changes

## Technical Considerations

### Role-Based Access Control
- **Project Managers/Senior Project Managers**: Can create/edit drafts, create/edit gate meetings, submit for approval
- **Directors**: Can view all projects, approve/reject versions, view gate meetings (read-only)
- **Vendors**: Limited access, no project creation via new wizard

### Data Consistency
- Use Vue watchers and computed properties for real-time updates
- Implement proper error handling and rollback mechanisms
- Ensure atomic operations for critical workflows

### Performance Optimization
- Implement pagination for large datasets
- Use lazy loading for components
- Optimize database queries with proper indexing

### Security Considerations
- Validate all user inputs
- Implement proper authorization checks
- Audit trail for all version changes and approvals

## Risk Mitigation

### Backward Compatibility
- Keep existing API endpoints functional
- Maintain deprecated routes for transition period
- Provide clear migration path for users

### Data Integrity
- Implement database constraints
- Add validation at both frontend and backend
- Regular backup procedures

### User Adoption
- Provide clear documentation and training materials
- Implement gradual rollout if possible
- Maintain support for legacy workflows during transition

## Success Metrics

1. **Workflow Integration**: Gate meetings successfully trigger version submissions
2. **User Experience**: Seamless switching between draft and approved views
3. **Automation**: Monthly auto-submission working without manual intervention
4. **Project Creation**: New wizard replaces PFMT extractor as primary creation method
5. **Role Compliance**: All role-based access controls working correctly

## Timeline Estimation

- **Phase 1 (Gate Meeting Enhancements)**: 3-4 days
- **Phase 2 (Versioning Workflow)**: 4-5 days
- **Phase 3 (New Project Wizard)**: 2-3 days
- **Phase 4 (Auto-Submission)**: 2-3 days
- **Phase 5 (Database Updates)**: 1-2 days
- **Phase 6 (Testing & Documentation)**: 2-3 days

**Total Estimated Time**: 14-20 days

## Conclusion

This implementation plan provides a comprehensive roadmap for enhancing the PFMT application while maintaining existing functionality and ensuring a smooth transition for users. The phased approach allows for incremental testing and validation, reducing the risk of system disruption.

