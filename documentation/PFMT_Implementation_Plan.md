# PFMT Application Enhancement Implementation Plan

## Executive Summary

This implementation plan details the technical changes required to enhance the PFMT application with role-based access control (RBAC) and a multi-step project creation workflow. The plan is organized into 10 implementation chunks, prioritized by dependencies and business value.

## Current State Assessment

### Existing Architecture
- **Backend**: Node.js/Express with JWT authentication middleware
- **Frontend**: Vue 3 + Pinia with TypeScript and route guards
- **Database**: PostgreSQL with users, projects, and related tables
- **Authentication**: JWT-based with basic role checking

### Key Gaps Identified
1. **Role Inconsistency**: Mixed role labels between frontend and backend
2. **Missing Workflow**: No multi-step project creation process
3. **Database Schema**: Missing workflow status and audit fields
4. **Authorization**: Limited resource-level permission checking
5. **Project Creation**: Single-step process instead of PM&I → Director → PM/SPM workflow

## Implementation Strategy

### Approach
- **Incremental Enhancement**: Build on existing functionality rather than replacing
- **Backward Compatibility**: Preserve all existing features during transition
- **Security First**: Implement RBAC foundation before workflow features
- **Test-Driven**: Include testing strategy for each chunk

### Risk Mitigation
- **Feature Flags**: Use environment variables to enable/disable new features
- **Database Migrations**: Reversible migrations with rollback procedures
- **Gradual Rollout**: Deploy backend changes before frontend to maintain compatibility



## Chunk 1: Database Schema & Migrations

### Overview
Establish the database foundation for RBAC and workflow by adding necessary tables and constraints.

### Priority: HIGH (Foundation)
**Dependencies**: None  
**Estimated Effort**: 2-3 days  
**Risk Level**: Low

### Technical Specifications

#### 1.1 Role Constraint Migration
**File**: `backend/database/migrations/008_canonical_roles.sql`

```sql
-- Add role constraint to enforce canonical roles
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin','pmi','director','pm','spm','analyst','executive','vendor'));

-- Update any existing non-canonical roles
UPDATE users SET role = 'pm' WHERE role = 'project_manager';
UPDATE users SET role = 'spm' WHERE role = 'senior_project_manager';
-- Add other mappings as needed
```

#### 1.2 Project Workflow Fields
**File**: `backend/database/migrations/009_project_workflow.sql`

```sql
-- Add workflow status and assignment fields to projects
ALTER TABLE projects
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('initiated','assigned','active','on_hold','complete','archived')),
  ADD COLUMN created_by UUID REFERENCES users(id),
  ADD COLUMN assigned_pm UUID REFERENCES users(id),
  ADD COLUMN assigned_spm UUID REFERENCES users(id),
  ADD COLUMN assigned_by UUID REFERENCES users(id),
  ADD COLUMN finalized_by UUID REFERENCES users(id),
  ADD COLUMN finalized_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_assigned_pm ON projects(assigned_pm);
CREATE INDEX idx_projects_assigned_spm ON projects(assigned_spm);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- Backfill existing projects as 'active' status
UPDATE projects SET status = 'active' WHERE status IS NULL;
```

#### 1.3 Audit Log Table
**File**: `backend/database/migrations/010_audit_log.sql`

```sql
-- Create audit log table for tracking changes
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  entity TEXT NOT NULL,           -- 'project', 'contract', etc.
  entity_id UUID,                 -- affected record id
  action TEXT NOT NULL,           -- 'create','update','assign','finalize'
  details JSONB,                  -- change details
  ip_address INET,                -- request IP
  user_agent TEXT,                -- request user agent
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

#### 1.4 Notifications Table
**File**: `backend/database/migrations/011_notifications.sql`

```sql
-- Create notifications table for workflow handoffs
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,             -- 'project_submitted','project_assigned','project_finalized'
  title TEXT NOT NULL,            -- notification title
  message TEXT,                   -- notification body
  payload JSONB,                  -- additional data (project_id, etc.)
  read_at TIMESTAMPTZ,            -- when user marked as read
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for notification queries
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### Files to Modify
- **NEW**: `backend/database/migrations/008_canonical_roles.sql`
- **NEW**: `backend/database/migrations/009_project_workflow.sql`
- **NEW**: `backend/database/migrations/010_audit_log.sql`
- **NEW**: `backend/database/migrations/011_notifications.sql`
- **MODIFY**: `backend/database/migrate.js` (add new migrations)

### Testing Strategy
- Verify migrations run successfully on clean database
- Test rollback procedures for each migration
- Validate constraints prevent invalid data
- Confirm indexes improve query performance

### Rollback Plan
Each migration includes corresponding DOWN migration:
```sql
-- Example rollback for workflow fields
ALTER TABLE projects 
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS created_by,
  -- ... other fields
```


## Chunk 2: Backend RBAC & Authorization

### Overview
Enhance the existing authentication middleware to support canonical roles and implement resource-level authorization.

### Priority: HIGH (Security Foundation)
**Dependencies**: Chunk 1 (Database Schema)  
**Estimated Effort**: 3-4 days  
**Risk Level**: Medium

### Technical Specifications

#### 2.1 Enhanced Authorization Middleware
**File**: `backend/middleware/authorize.js` (NEW)

```javascript
// Resource-level authorization middleware
const { query } = require('../config/database');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: { message: 'Authentication required', code: 'AUTH_REQUIRED' }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: { 
          message: 'Insufficient permissions', 
          code: 'INSUFFICIENT_PERMISSIONS',
          required: allowedRoles,
          current: req.user.role
        }
      });
    }

    next();
  };
};

const canEditProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    // Admin and Director can edit any project
    if (['admin', 'director'].includes(role)) {
      return next();
    }

    // Get project assignment details
    const result = await query(
      'SELECT assigned_pm, assigned_spm, created_by FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = result.rows[0];
    const isAssignedPM = project.assigned_pm === userId;
    const isAssignedSPM = project.assigned_spm === userId;
    const isCreator = project.created_by === userId;

    // PM/SPM can edit if assigned, PMI can edit if creator
    if ((role === 'pm' || role === 'spm') && (isAssignedPM || isAssignedSPM)) {
      return next();
    }

    if (role === 'pmi' && isCreator) {
      return next();
    }

    return res.status(403).json({ 
      error: { 
        message: 'Not authorized to edit this project', 
        code: 'PROJECT_EDIT_FORBIDDEN'
      }
    });

  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ 
      error: { message: 'Authorization check failed', code: 'AUTH_ERROR' }
    });
  }
};

const canViewProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    // Admin, Director, Executive can view any project
    if (['admin', 'director', 'executive'].includes(role)) {
      return next();
    }

    // Get project details
    const result = await query(
      'SELECT assigned_pm, assigned_spm, created_by FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = result.rows[0];
    const isAssignedPM = project.assigned_pm === userId;
    const isAssignedSPM = project.assigned_spm === userId;
    const isCreator = project.created_by === userId;

    // Allow access if user is involved with the project
    if (isAssignedPM || isAssignedSPM || isCreator) {
      return next();
    }

    // Analyst can view for read-only access
    if (role === 'analyst') {
      req.readOnly = true; // Flag for read-only access
      return next();
    }

    return res.status(403).json({ 
      error: { 
        message: 'Not authorized to view this project', 
        code: 'PROJECT_VIEW_FORBIDDEN'
      }
    });

  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ 
      error: { message: 'Authorization check failed', code: 'AUTH_ERROR' }
    });
  }
};

module.exports = {
  authorizeRoles,
  canEditProject,
  canViewProject
};
```

#### 2.2 Enhanced Authentication Middleware
**File**: `backend/middleware/auth.js` (MODIFY)

```javascript
// Add to existing auth.js file

// Hardened login - remove demo mode bypass
const authenticateToken = async (req, res, next) => {
  // Remove BYPASS_AUTH logic for production security
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: { message: 'Access token required', code: 'TOKEN_MISSING' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data from database (ensures role changes are immediate)
    const userResult = await query(
      'SELECT id, username, email, role, is_active, last_login_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: { message: 'User not found', code: 'USER_NOT_FOUND' }
      });
    }

    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({
        error: { message: 'Account deactivated', code: 'ACCOUNT_DEACTIVATED' }
      });
    }

    // Validate role against canonical roles
    const validRoles = ['admin','pmi','director','pm','spm','analyst','executive','vendor'];
    if (!validRoles.includes(user.role)) {
      return res.status(401).json({
        error: { message: 'Invalid user role', code: 'INVALID_ROLE' }
      });
    }

    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { message: 'Token expired', code: 'TOKEN_EXPIRED' }
      });
    }
    
    console.error('Token verification error:', error);
    return res.status(403).json({
      error: { message: 'Invalid token', code: 'TOKEN_INVALID' }
    });
  }
};

// Add role validation helper
const validateRole = (role) => {
  const validRoles = ['admin','pmi','director','pm','spm','analyst','executive','vendor'];
  return validRoles.includes(role);
};

// Export new functions
module.exports = {
  authenticateToken,
  authorizeRoles,
  requireRole,
  requirePMOrPMI,
  requireDirectorOrAdmin,
  requireAdmin,
  validateRole // NEW
};
```

#### 2.3 Audit Logging Middleware
**File**: `backend/middleware/audit.js` (NEW)

```javascript
const { query } = require('../config/database');

const auditLog = (action, entity = 'unknown') => {
  return async (req, res, next) => {
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture request details
    const auditData = {
      user_id: req.user?.id,
      entity,
      entity_id: req.params.id || null,
      action,
      details: {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        params: req.params
      },
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    };

    // Override response methods to capture success/failure
    res.send = function(data) {
      logAuditEntry(auditData, res.statusCode, data);
      originalSend.call(this, data);
    };

    res.json = function(data) {
      logAuditEntry(auditData, res.statusCode, data);
      originalJson.call(this, data);
    };

    next();
  };
};

const logAuditEntry = async (auditData, statusCode, responseData) => {
  try {
    // Only log successful operations and errors
    if (statusCode >= 200 && statusCode < 300) {
      auditData.details.status = 'success';
      auditData.details.response = responseData;
    } else if (statusCode >= 400) {
      auditData.details.status = 'error';
      auditData.details.error = responseData;
    } else {
      return; // Skip other status codes
    }

    await query(
      `INSERT INTO audit_log (user_id, entity, entity_id, action, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        auditData.user_id,
        auditData.entity,
        auditData.entity_id,
        auditData.action,
        JSON.stringify(auditData.details),
        auditData.ip_address,
        auditData.user_agent
      ]
    );
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't fail the request if audit logging fails
  }
};

module.exports = {
  auditLog
};
```

### Files to Modify
- **NEW**: `backend/middleware/authorize.js`
- **NEW**: `backend/middleware/audit.js`
- **MODIFY**: `backend/middleware/auth.js` (enhance existing)

### Testing Strategy
- Unit tests for each authorization scenario
- Test role-based access to protected endpoints
- Verify audit logging captures all required events
- Test token validation and error handling

### Security Considerations
- Remove all development bypasses in production
- Implement rate limiting on auth endpoints
- Add request validation and sanitization
- Ensure audit logs don't contain sensitive data


## Chunk 3: Backend Workflow API Endpoints

### Overview
Implement the multi-step project creation workflow API endpoints for PM&I → Director → PM/SPM handoffs.

### Priority: HIGH (Core Functionality)
**Dependencies**: Chunks 1, 2 (Database Schema, RBAC)  
**Estimated Effort**: 4-5 days  
**Risk Level**: Medium

### Technical Specifications

#### 3.1 Project Workflow Controller
**File**: `backend/controllers/projectWorkflowController.js` (NEW)

```javascript
const Project = require('../models/Project');
const { query, transaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// PM&I: Create project initiation
const createProjectInitiation = async (req, res) => {
  try {
    const {
      name,
      description,
      program_id,
      client_ministry_id,
      estimated_budget,
      start_date,
      end_date,
      project_type,
      delivery_method
    } = req.body;

    const projectId = uuidv4();
    const userId = req.user.id;

    await transaction(async (client) => {
      // Create project with 'initiated' status
      await client.query(
        `INSERT INTO projects (
          id, project_name, project_description, program_id, client_ministry_id,
          estimated_budget, start_date, end_date, project_type, delivery_method,
          status, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          projectId, name, description, program_id, client_ministry_id,
          estimated_budget, start_date, end_date, project_type, delivery_method,
          'initiated', userId
        ]
      );

      // Create notifications for all directors
      const directors = await client.query(
        "SELECT id FROM users WHERE role = 'director' AND is_active = true"
      );

      for (const director of directors.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, payload)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            director.id,
            'project_submitted',
            'New Project Awaiting Assignment',
            `Project "${name}" has been submitted by PM&I and requires team assignment.`,
            JSON.stringify({ project_id: projectId, project_name: name })
          ]
        );
      }
    });

    // Return created project
    const project = await Project.findById(projectId);
    
    res.status(201).json({
      success: true,
      project,
      message: 'Project initiated successfully'
    });

  } catch (error) {
    console.error('Project initiation error:', error);
    res.status(500).json({
      error: { message: 'Failed to create project', code: 'PROJECT_CREATE_FAILED' }
    });
  }
};

// Director: Assign team to project
const assignProjectTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_pm, assigned_spm } = req.body;
    const userId = req.user.id;

    // Validate project exists and is in correct status
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = projectResult.rows[0];
    
    if (project.status !== 'initiated') {
      return res.status(400).json({
        error: { 
          message: 'Project must be in initiated status for assignment',
          code: 'INVALID_PROJECT_STATUS',
          current_status: project.status
        }
      });
    }

    // Validate assigned users exist and have correct roles
    if (assigned_pm) {
      const pmResult = await query(
        "SELECT id FROM users WHERE id = $1 AND role IN ('pm', 'spm') AND is_active = true",
        [assigned_pm]
      );
      
      if (pmResult.rows.length === 0) {
        return res.status(400).json({
          error: { message: 'Invalid PM assignment', code: 'INVALID_PM' }
        });
      }
    }

    if (assigned_spm) {
      const spmResult = await query(
        "SELECT id FROM users WHERE id = $1 AND role = 'spm' AND is_active = true",
        [assigned_spm]
      );
      
      if (spmResult.rows.length === 0) {
        return res.status(400).json({
          error: { message: 'Invalid SPM assignment', code: 'INVALID_SPM' }
        });
      }
    }

    await transaction(async (client) => {
      // Update project with assignments
      await client.query(
        `UPDATE projects 
         SET assigned_pm = $1, assigned_spm = $2, assigned_by = $3, 
             status = 'assigned', updated_at = NOW()
         WHERE id = $4`,
        [assigned_pm, assigned_spm, userId, id]
      );

      // Notify assigned team members
      const notifications = [];
      
      if (assigned_pm) {
        notifications.push([
          assigned_pm,
          'project_assigned',
          'Project Assigned to You',
          `You have been assigned as PM for project "${project.project_name}".`,
          JSON.stringify({ project_id: id, project_name: project.project_name, role: 'pm' })
        ]);
      }

      if (assigned_spm) {
        notifications.push([
          assigned_spm,
          'project_assigned',
          'Project Assigned to You',
          `You have been assigned as SPM for project "${project.project_name}".`,
          JSON.stringify({ project_id: id, project_name: project.project_name, role: 'spm' })
        ]);
      }

      for (const notification of notifications) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, payload)
           VALUES ($1, $2, $3, $4, $5)`,
          notification
        );
      }
    });

    // Return updated project
    const updatedProject = await Project.findById(id);
    
    res.json({
      success: true,
      project: updatedProject,
      message: 'Team assigned successfully'
    });

  } catch (error) {
    console.error('Team assignment error:', error);
    res.status(500).json({
      error: { message: 'Failed to assign team', code: 'TEAM_ASSIGN_FAILED' }
    });
  }
};

// PM/SPM: Finalize project setup
const finalizeProjectSetup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      milestones,
      vendors,
      budget_breakdown,
      detailed_description,
      risk_assessment
    } = req.body;

    // Validate project exists and user is authorized
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = projectResult.rows[0];
    
    if (project.status !== 'assigned') {
      return res.status(400).json({
        error: { 
          message: 'Project must be in assigned status for finalization',
          code: 'INVALID_PROJECT_STATUS',
          current_status: project.status
        }
      });
    }

    // Verify user is assigned to this project
    if (project.assigned_pm !== userId && project.assigned_spm !== userId) {
      return res.status(403).json({
        error: { message: 'Not authorized to finalize this project', code: 'NOT_AUTHORIZED' }
      });
    }

    await transaction(async (client) => {
      // Update project status and finalization details
      await client.query(
        `UPDATE projects 
         SET status = 'active', finalized_by = $1, finalized_at = NOW(),
             project_description = COALESCE($2, project_description),
             updated_at = NOW()
         WHERE id = $3`,
        [userId, detailed_description, id]
      );

      // Insert milestones if provided
      if (milestones && milestones.length > 0) {
        for (const milestone of milestones) {
          await client.query(
            `INSERT INTO milestones (id, project_id, title, description, planned_start, planned_finish, gate_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              uuidv4(),
              id,
              milestone.title,
              milestone.description,
              milestone.planned_start,
              milestone.planned_finish,
              milestone.gate_type
            ]
          );
        }
      }

      // Notify director and initiator
      const notifications = [
        [
          project.assigned_by,
          'project_finalized',
          'Project Setup Completed',
          `Project "${project.project_name}" has been finalized and is now active.`,
          JSON.stringify({ project_id: id, project_name: project.project_name })
        ],
        [
          project.created_by,
          'project_finalized',
          'Your Project is Now Active',
          `Project "${project.project_name}" has been completed setup and is now active.`,
          JSON.stringify({ project_id: id, project_name: project.project_name })
        ]
      ];

      for (const notification of notifications) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, payload)
           VALUES ($1, $2, $3, $4, $5)`,
          notification
        );
      }
    });

    // Return finalized project
    const finalizedProject = await Project.findById(id);
    
    res.json({
      success: true,
      project: finalizedProject,
      message: 'Project finalized successfully'
    });

  } catch (error) {
    console.error('Project finalization error:', error);
    res.status(500).json({
      error: { message: 'Failed to finalize project', code: 'PROJECT_FINALIZE_FAILED' }
    });
  }
};

// Get projects pending assignment (for Directors)
const getPendingAssignments = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.first_name, u.last_name, u.email as creator_email
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.status = 'initiated'
       ORDER BY p.created_at ASC`
    );

    const projects = result.rows.map(Project.fromDb);
    
    res.json({
      success: true,
      projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Get pending assignments error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch pending assignments', code: 'FETCH_FAILED' }
    });
  }
};

// Get my assigned projects (for PM/SPM)
const getMyProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let statusCondition = '';
    const params = [userId, userId];
    
    if (status && status !== 'all') {
      statusCondition = 'AND p.status = $3';
      params.push(status);
    }

    const result = await query(
      `SELECT p.*, 
              pm.first_name as pm_first_name, pm.last_name as pm_last_name,
              spm.first_name as spm_first_name, spm.last_name as spm_last_name
       FROM projects p
       LEFT JOIN users pm ON p.assigned_pm = pm.id
       LEFT JOIN users spm ON p.assigned_spm = spm.id
       WHERE (p.assigned_pm = $1 OR p.assigned_spm = $2) ${statusCondition}
       ORDER BY p.updated_at DESC`,
      params
    );

    const projects = result.rows.map(Project.fromDb);
    
    res.json({
      success: true,
      projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch projects', code: 'FETCH_FAILED' }
    });
  }
};

module.exports = {
  createProjectInitiation,
  assignProjectTeam,
  finalizeProjectSetup,
  getPendingAssignments,
  getMyProjects
};
```

#### 3.2 Workflow Routes
**File**: `backend/routes/projectWorkflow.js` (NEW)

```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const { auditLog } = require('../middleware/audit');
const {
  createProjectInitiation,
  assignProjectTeam,
  finalizeProjectSetup,
  getPendingAssignments,
  getMyProjects
} = require('../controllers/projectWorkflowController');

const router = express.Router();

// Validation middleware
const validateProjectInitiation = [
  body('name').notEmpty().withMessage('Project name is required'),
  body('description').optional().isLength({ max: 1000 }),
  body('estimated_budget').optional().isNumeric(),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601()
];

const validateTeamAssignment = [
  body('assigned_pm').isUUID().withMessage('Valid PM ID is required'),
  body('assigned_spm').optional().isUUID()
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    });
  }
  next();
};

// Apply authentication to all routes
router.use(authenticateToken);

// PM&I: Create project initiation
router.post('/',
  authorizeRoles('admin', 'pmi'),
  validateProjectInitiation,
  handleValidationErrors,
  auditLog('create', 'project'),
  createProjectInitiation
);

// Director: Assign team to project
router.post('/:id/assign',
  authorizeRoles('admin', 'director'),
  validateTeamAssignment,
  handleValidationErrors,
  auditLog('assign', 'project'),
  assignProjectTeam
);

// PM/SPM: Finalize project setup
router.post('/:id/finalize',
  authorizeRoles('admin', 'pm', 'spm'),
  auditLog('finalize', 'project'),
  finalizeProjectSetup
);

// Director: Get projects pending assignment
router.get('/pending-assignments',
  authorizeRoles('admin', 'director'),
  getPendingAssignments
);

// PM/SPM: Get my assigned projects
router.get('/my',
  authorizeRoles('admin', 'pm', 'spm'),
  getMyProjects
);

module.exports = router;
```

#### 3.3 Notifications API
**File**: `backend/routes/notifications.js` (NEW)

```javascript
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// Get notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unread_only = false } = req.query;

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    
    if (unread_only === 'true') {
      whereClause += ' AND read_at IS NULL';
    }

    const result = await query(
      `SELECT * FROM notifications 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      params
    );

    res.json({
      success: true,
      notifications: result.rows,
      total: parseInt(countResult.rows[0].total),
      unread_count: await getUnreadCount(userId)
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch notifications', code: 'FETCH_FAILED' }
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Notification not found', code: 'NOTIFICATION_NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      notification: result.rows[0],
      unread_count: await getUnreadCount(userId)
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: { message: 'Failed to mark notification as read', code: 'UPDATE_FAILED' }
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      unread_count: 0
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: { message: 'Failed to mark notifications as read', code: 'UPDATE_FAILED' }
    });
  }
});

// Helper function to get unread count
const getUnreadCount = async (userId) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
};

module.exports = router;
```

### Files to Modify
- **NEW**: `backend/controllers/projectWorkflowController.js`
- **NEW**: `backend/routes/projectWorkflow.js`
- **NEW**: `backend/routes/notifications.js`
- **MODIFY**: `backend/app.js` (add new routes)

### Integration Points
```javascript
// In backend/app.js, add:
app.use('/api/projects/workflow', require('./routes/projectWorkflow'));
app.use('/api/notifications', require('./routes/notifications'));
```

### Testing Strategy
- Unit tests for each workflow step
- Integration tests for complete workflow scenarios
- Test error handling and validation
- Test notification creation and delivery
- Test authorization for each endpoint

### API Documentation
- Document all new endpoints with request/response examples
- Include error codes and status meanings
- Provide workflow sequence diagrams
- Add Postman collection for testing


## Chunk 4: Frontend Role Standardization

### Overview
Standardize role handling across the frontend to use canonical roles and implement consistent authorization.

### Priority: HIGH (Foundation for Wizard)
**Dependencies**: Chunk 2 (Backend RBAC)  
**Estimated Effort**: 2-3 days  
**Risk Level**: Low

### Technical Specifications

#### 4.1 Canonical Roles Constants
**File**: `frontend/src/constants/roles.ts` (NEW)

```typescript
// Canonical role types
export type Role = 
  | 'admin' 
  | 'pmi' 
  | 'director' 
  | 'pm' 
  | 'spm' 
  | 'analyst' 
  | 'executive' 
  | 'vendor';

// Human-readable role labels
export const RoleLabels: Record<Role, string> = {
  admin: 'Administrator',
  pmi: 'PM&I',
  director: 'Director',
  pm: 'Project Manager',
  spm: 'Senior Project Manager',
  analyst: 'Contract Analyst',
  executive: 'Executive',
  vendor: 'Vendor'
};

// Role hierarchy for permission checking
export const RoleHierarchy: Record<Role, number> = {
  admin: 100,
  director: 80,
  executive: 70,
  spm: 60,
  pm: 50,
  pmi: 40,
  analyst: 30,
  vendor: 10
};

// Role capabilities matrix
export const RoleCapabilities = {
  admin: {
    canCreateProject: true,
    canAssignTeam: true,
    canFinalizeProject: true,
    canEditAnyProject: true,
    canViewAllProjects: true,
    canManageUsers: true
  },
  pmi: {
    canCreateProject: true,
    canAssignTeam: false,
    canFinalizeProject: false,
    canEditAnyProject: false,
    canViewAllProjects: false,
    canManageUsers: false
  },
  director: {
    canCreateProject: false,
    canAssignTeam: true,
    canFinalizeProject: false,
    canEditAnyProject: true,
    canViewAllProjects: true,
    canManageUsers: false
  },
  pm: {
    canCreateProject: false,
    canAssignTeam: false,
    canFinalizeProject: true,
    canEditAnyProject: false,
    canViewAllProjects: false,
    canManageUsers: false
  },
  spm: {
    canCreateProject: false,
    canAssignTeam: false,
    canFinalizeProject: true,
    canEditAnyProject: false,
    canViewAllProjects: false,
    canManageUsers: false
  },
  analyst: {
    canCreateProject: false,
    canAssignTeam: false,
    canFinalizeProject: false,
    canEditAnyProject: false,
    canViewAllProjects: true,
    canManageUsers: false
  },
  executive: {
    canCreateProject: false,
    canAssignTeam: false,
    canFinalizeProject: false,
    canEditAnyProject: false,
    canViewAllProjects: true,
    canManageUsers: false
  },
  vendor: {
    canCreateProject: false,
    canAssignTeam: false,
    canFinalizeProject: false,
    canEditAnyProject: false,
    canViewAllProjects: false,
    canManageUsers: false
  }
};

// Helper functions
export const hasRole = (userRole: Role, requiredRoles: Role[]): boolean => {
  return requiredRoles.includes(userRole);
};

export const hasCapability = (userRole: Role, capability: keyof typeof RoleCapabilities.admin): boolean => {
  return RoleCapabilities[userRole]?.[capability] || false;
};

export const getRoleLabel = (role: Role): string => {
  return RoleLabels[role] || role;
};

// Legacy role mapping for migration
export const LegacyRoleMapping: Record<string, Role> = {
  'Project Manager': 'pm',
  'Senior Project Manager': 'spm',
  'Director': 'director',
  'Admin': 'admin',
  'Administrator': 'admin',
  'PM&I': 'pmi',
  'Contract Analyst': 'analyst',
  'Executive': 'executive',
  'CFO': 'executive',
  'Vendor': 'vendor'
};

export const normalizeRole = (role: string): Role => {
  // First check if it's already canonical
  if (Object.values(RoleLabels).includes(role as Role)) {
    return role as Role;
  }
  
  // Check legacy mapping
  const normalized = LegacyRoleMapping[role];
  if (normalized) {
    return normalized;
  }
  
  // Default fallback
  console.warn(`Unknown role: ${role}, defaulting to 'pm'`);
  return 'pm';
};
```

#### 4.2 Enhanced Auth Store
**File**: `frontend/src/stores/auth.ts` (MODIFY)

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Role } from '@/constants/roles';
import { normalizeRole, getRoleLabel, hasCapability } from '@/constants/roles';
import { UserAPI } from '@/services/apiService';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  last_login_at?: string;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<User | null>(null);
  const isAuthenticated = ref(false);
  const token = ref<string | null>(null);
  const loading = ref(false);

  // Getters
  const userRole = computed(() => currentUser.value?.role);
  const userDisplayName = computed(() => {
    if (!currentUser.value) return '';
    return `${currentUser.value.first_name} ${currentUser.value.last_name}`;
  });
  const roleLabel = computed(() => {
    if (!userRole.value) return '';
    return getRoleLabel(userRole.value);
  });

  // Role-based computed properties
  const canCreateProject = computed(() => 
    userRole.value ? hasCapability(userRole.value, 'canCreateProject') : false
  );
  const canAssignTeam = computed(() => 
    userRole.value ? hasCapability(userRole.value, 'canAssignTeam') : false
  );
  const canFinalizeProject = computed(() => 
    userRole.value ? hasCapability(userRole.value, 'canFinalizeProject') : false
  );
  const canEditAnyProject = computed(() => 
    userRole.value ? hasCapability(userRole.value, 'canEditAnyProject') : false
  );
  const canViewAllProjects = computed(() => 
    userRole.value ? hasCapability(userRole.value, 'canViewAllProjects') : false
  );
  const canManageUsers = computed(() => 
    userRole.value ? hasCapability(userRole.value, 'canManageUsers') : false
  );

  // Legacy compatibility
  const isVendor = computed(() => userRole.value === 'vendor');
  const isStaff = computed(() => !isVendor.value);

  // Actions
  const login = async (credentials: { email: string; password: string }) => {
    loading.value = true;
    try {
      const response = await UserAPI.login(credentials);
      
      if (response.success) {
        token.value = response.token;
        currentUser.value = {
          ...response.user,
          role: normalizeRole(response.user.role)
        };
        isAuthenticated.value = true;
        
        // Store in localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('current_user', JSON.stringify(currentUser.value));
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Login failed' 
      };
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await UserAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state regardless of API call success
      currentUser.value = null;
      isAuthenticated.value = false;
      token.value = null;
      
      // Clear localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }
  };

  const refreshUser = async () => {
    if (!token.value) return;
    
    try {
      const response = await UserAPI.getCurrentUser();
      if (response.success) {
        currentUser.value = {
          ...response.user,
          role: normalizeRole(response.user.role)
        };
        localStorage.setItem('current_user', JSON.stringify(currentUser.value));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails, logout
      await logout();
    }
  };

  const initializeFromStorage = () => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('current_user');
    
    if (storedToken && storedUser) {
      try {
        token.value = storedToken;
        currentUser.value = JSON.parse(storedUser);
        isAuthenticated.value = true;
        
        // Refresh user data to ensure it's current
        refreshUser();
      } catch (error) {
        console.error('Failed to initialize from storage:', error);
        logout();
      }
    }
  };

  // Check if user has specific role
  const hasRole = (requiredRoles: Role[]): boolean => {
    return userRole.value ? requiredRoles.includes(userRole.value) : false;
  };

  // Check if user can edit specific project
  const canEditProject = (project: { assigned_pm?: string; assigned_spm?: string; created_by?: string }): boolean => {
    if (!currentUser.value) return false;
    
    const userId = currentUser.value.id;
    const role = currentUser.value.role;
    
    // Admin and Director can edit any project
    if (role === 'admin' || role === 'director') return true;
    
    // PM/SPM can edit if assigned
    if ((role === 'pm' || role === 'spm') && 
        (project.assigned_pm === userId || project.assigned_spm === userId)) {
      return true;
    }
    
    // PMI can edit if they created it
    if (role === 'pmi' && project.created_by === userId) {
      return true;
    }
    
    return false;
  };

  return {
    // State
    currentUser,
    isAuthenticated,
    token,
    loading,
    
    // Getters
    userRole,
    userDisplayName,
    roleLabel,
    canCreateProject,
    canAssignTeam,
    canFinalizeProject,
    canEditAnyProject,
    canViewAllProjects,
    canManageUsers,
    isVendor,
    isStaff,
    
    // Actions
    login,
    logout,
    refreshUser,
    initializeFromStorage,
    hasRole,
    canEditProject
  };
});
```

#### 4.3 Updated Router Guards
**File**: `frontend/src/router/guards.ts` (NEW)

```typescript
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { Role } from '@/constants/roles';

export const setupRouterGuards = (router: any) => {
  router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const authStore = useAuthStore();
    
    // Check if route requires authentication
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return next('/login');
    }
    
    // Check role-based access
    if (to.meta.roles && authStore.isAuthenticated) {
      const requiredRoles = to.meta.roles as Role[];
      const userRole = authStore.userRole;
      
      if (!userRole || !requiredRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        const dashboardRoute = getDashboardRoute(userRole);
        return next(dashboardRoute);
      }
    }
    
    // Check specific capabilities
    if (to.meta.capability && authStore.isAuthenticated) {
      const capability = to.meta.capability as string;
      const userRole = authStore.userRole;
      
      if (!userRole || !authStore[capability as keyof typeof authStore]) {
        return next('/unauthorized');
      }
    }
    
    next();
  });
};

const getDashboardRoute = (role: Role | undefined): string => {
  switch (role) {
    case 'vendor':
      return '/vendor';
    case 'pmi':
      return '/projects/initiate';
    case 'director':
      return '/projects/assignments';
    case 'pm':
    case 'spm':
      return '/projects/my';
    case 'executive':
      return '/dashboard/executive';
    case 'analyst':
      return '/reports';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
};
```

#### 4.4 Updated Router Configuration
**File**: `frontend/src/router/index.ts` (MODIFY)

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import type { Role } from '@/constants/roles';
import { setupRouterGuards } from './guards';

// Lazy-loaded components
const HomePage = () => import('@/pages/HomePage.vue');
const LoginPage = () => import('@/pages/LoginPage.vue');
const VendorPortal = () => import('@/pages/VendorPortal.vue');
const StaffPortal = () => import('@/pages/StaffPortal.vue');
const ProjectsPage = () => import('@/pages/ProjectsPage.vue');
const ProjectDetailPage = () => import('@/pages/ProjectDetailPage.vue');
const NewProjectPage = () => import('@/pages/NewProjectPage.vue');

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/vendor',
      name: 'vendor-portal',
      component: VendorPortal,
      meta: { 
        requiresAuth: true, 
        roles: ['vendor'] as Role[]
      }
    },
    {
      path: '/staff',
      name: 'staff-portal',
      component: StaffPortal,
      meta: { 
        requiresAuth: true, 
        roles: ['admin', 'pmi', 'director', 'pm', 'spm', 'analyst', 'executive'] as Role[]
      }
    },
    {
      path: '/projects',
      name: 'projects',
      component: ProjectsPage,
      meta: { 
        requiresAuth: true,
        roles: ['admin', 'pmi', 'director', 'pm', 'spm', 'analyst', 'executive'] as Role[]
      }
    },
    {
      path: '/projects/initiate',
      name: 'projects-initiate',
      component: NewProjectPage,
      meta: { 
        requiresAuth: true,
        roles: ['admin', 'pmi'] as Role[],
        capability: 'canCreateProject'
      }
    },
    {
      path: '/projects/assignments',
      name: 'projects-assignments',
      component: () => import('@/pages/ProjectAssignmentsPage.vue'),
      meta: { 
        requiresAuth: true,
        roles: ['admin', 'director'] as Role[],
        capability: 'canAssignTeam'
      }
    },
    {
      path: '/projects/my',
      name: 'projects-my',
      component: ProjectsPage,
      meta: { 
        requiresAuth: true,
        roles: ['admin', 'pm', 'spm'] as Role[]
      }
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: ProjectDetailPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: () => import('@/pages/UnauthorizedPage.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

// Setup guards
setupRouterGuards(router);

export default router;
```

### Files to Modify
- **NEW**: `frontend/src/constants/roles.ts`
- **NEW**: `frontend/src/router/guards.ts`
- **MODIFY**: `frontend/src/stores/auth.ts`
- **MODIFY**: `frontend/src/router/index.ts`
- **NEW**: `frontend/src/pages/UnauthorizedPage.vue`

### Migration Strategy
1. **Phase 1**: Add new role constants and helpers
2. **Phase 2**: Update auth store to use canonical roles
3. **Phase 3**: Update router to use new role system
4. **Phase 4**: Update all components to use new role helpers
5. **Phase 5**: Remove legacy role references

### Testing Strategy
- Unit tests for role normalization functions
- Test router guards with different role combinations
- Test auth store role-based computed properties
- Integration tests for role-based navigation

### Backward Compatibility
- Legacy role mapping ensures existing data works
- Gradual migration allows incremental updates
- Fallback mechanisms prevent breaking changes


## Chunk 5: Multi-Step Project Creation Wizard

### Overview
Implement the complete project creation wizard with role-based steps and handoffs.

### Priority: HIGH (Core Requirement)
**Dependencies**: Chunks 1-4  
**Estimated Effort**: 5-6 days  
**Risk Level**: Medium

### Key Components
- **ProjectWizard.vue**: Main wizard container with stepper
- **Stepper.vue**: Role-aware navigation component
- **InitiationStep.vue**: PM&I project creation form
- **TeamAssignmentStep.vue**: Director team assignment
- **ConfigurationSteps**: PM/SPM project finalization (Overview, Vendors, Budget, Milestones)
- **ProjectWizardStore**: Pinia store for wizard state management

### Files to Create/Modify
- **NEW**: `frontend/src/components/wizard/ProjectWizard.vue`
- **NEW**: `frontend/src/components/wizard/Stepper.vue`
- **NEW**: `frontend/src/components/wizard/steps/` (6 step components)
- **NEW**: `frontend/src/stores/projectWizard.ts`
- **NEW**: `frontend/src/router/wizard.routes.ts`
- **MODIFY**: `frontend/src/router/index.ts` (add wizard routes)

---

## Chunk 6: Project Details Edit Authorization

### Overview
Add role-based edit controls to project detail tabs and forms.

### Priority: MEDIUM (User Experience)
**Dependencies**: Chunks 2, 4  
**Estimated Effort**: 2-3 days  
**Risk Level**: Low

### Key Features
- Dynamic edit/read-only mode based on user role and project assignment
- Permission-aware UI components
- Graceful error handling for unauthorized actions

### Files to Modify
- **MODIFY**: `frontend/src/pages/ProjectDetailPage.vue`
- **MODIFY**: All project detail tab components
- **NEW**: `frontend/src/composables/useProjectPermissions.ts`

---

## Chunk 7: Audit Trail & Notifications

### Overview
Implement comprehensive audit logging and user notification system.

### Priority: MEDIUM (Operational Visibility)
**Dependencies**: Chunks 1, 3  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low

### Key Components
- **Backend**: Audit middleware integration, notification endpoints
- **Frontend**: Notification bell menu, activity feed, audit log viewer

### Files to Create/Modify
- **MODIFY**: `backend/middleware/audit.js` (integrate with all routes)
- **NEW**: `frontend/src/components/NotificationBell.vue`
- **NEW**: `frontend/src/components/ActivityFeed.vue`
- **NEW**: `frontend/src/stores/notifications.ts`

---

## Chunk 8: Search, Filters & Performance

### Overview
Enhanced project search, filtering, and performance optimizations.

### Priority: LOW (User Experience)
**Dependencies**: Chunk 3  
**Estimated Effort**: 3-4 days  
**Risk Level**: Low

### Key Features
- Advanced search with multiple criteria
- Server-side pagination and sorting
- Filter state persistence
- Virtualized tables for large datasets

### Files to Create/Modify
- **MODIFY**: `backend/routes/projects.js` (enhanced filtering)
- **NEW**: `frontend/src/components/ProjectSearch.vue`
- **NEW**: `frontend/src/components/VirtualizedTable.vue`
- **MODIFY**: `frontend/src/pages/ProjectsPage.vue`

---

## Chunk 9: Docker & DevOps Improvements

### Overview
Standardize deployment configuration and add CI/CD pipeline.

### Priority: LOW (Infrastructure)
**Dependencies**: None  
**Estimated Effort**: 2-3 days  
**Risk Level**: Low

### Key Improvements
- Unified docker-compose configuration
- Environment variable standardization
- Health checks and monitoring
- Basic CI/CD with GitHub Actions

### Files to Create/Modify
- **MODIFY**: `docker-compose.yml`, `docker-compose.prod.yml`
- **NEW**: `.github/workflows/ci.yml`
- **MODIFY**: `backend/Dockerfile`, `frontend/Dockerfile`
- **NEW**: `docker-healthcheck.js`

---

## Chunk 10: Testing & Validation

### Overview
Comprehensive testing suite for all new functionality.

### Priority: MEDIUM (Quality Assurance)
**Dependencies**: Chunks 1-6  
**Estimated Effort**: 4-5 days  
**Risk Level**: Low

### Testing Strategy
- **Backend**: Unit tests for auth, workflow, and API endpoints
- **Frontend**: Component tests for wizard and role-based features
- **Integration**: End-to-end workflow testing
- **Security**: RBAC and authorization testing

### Files to Create
- **NEW**: `backend/tests/auth.test.js`
- **NEW**: `backend/tests/workflow.test.js`
- **NEW**: `frontend/src/components/__tests__/` (component tests)
- **NEW**: `tests/e2e/` (Playwright/Cypress tests)

---

## Implementation Sequence & Dependencies

### Phase 1: Foundation (Weeks 1-2)
1. **Chunk 1**: Database Schema & Migrations
2. **Chunk 2**: Backend RBAC & Authorization
3. **Chunk 4**: Frontend Role Standardization

### Phase 2: Core Workflow (Weeks 3-4)
4. **Chunk 3**: Backend Workflow API Endpoints
5. **Chunk 5**: Multi-Step Project Creation Wizard

### Phase 3: Enhancements (Weeks 5-6)
6. **Chunk 6**: Project Details Edit Authorization
7. **Chunk 7**: Audit Trail & Notifications

### Phase 4: Polish & Deployment (Weeks 7-8)
8. **Chunk 8**: Search, Filters & Performance
9. **Chunk 9**: Docker & DevOps Improvements
10. **Chunk 10**: Testing & Validation

---

## Risk Assessment & Mitigation

### High-Risk Areas
1. **Database Migrations**: Risk of data loss or corruption
   - **Mitigation**: Comprehensive backup strategy, reversible migrations
2. **Authentication Changes**: Risk of breaking existing sessions
   - **Mitigation**: Gradual rollout, backward compatibility
3. **Workflow Integration**: Risk of disrupting existing project creation
   - **Mitigation**: Feature flags, parallel implementation

### Medium-Risk Areas
1. **Frontend Role Changes**: Risk of breaking existing UI
   - **Mitigation**: Legacy role mapping, incremental updates
2. **API Changes**: Risk of breaking frontend-backend integration
   - **Mitigation**: API versioning, comprehensive testing

### Low-Risk Areas
1. **UI Enhancements**: Minimal impact on core functionality
2. **DevOps Changes**: Can be implemented independently
3. **Testing**: Additive improvements with no functional impact

---

## Success Criteria

### Functional Requirements
- [ ] PM&I can initiate projects with status 'initiated'
- [ ] Directors can assign PM/SPM teams to initiated projects
- [ ] PM/SPM can finalize assigned projects to 'active' status
- [ ] Role-based access control enforced on all endpoints
- [ ] Project edit permissions based on role and assignment
- [ ] Audit trail captures all workflow actions
- [ ] Notifications sent for workflow handoffs

### Technical Requirements
- [ ] All database migrations run successfully
- [ ] No breaking changes to existing functionality
- [ ] API response times under 500ms for standard operations
- [ ] Frontend loads under 3 seconds on standard connections
- [ ] 95%+ test coverage for new functionality

### Security Requirements
- [ ] No unprotected API endpoints remain
- [ ] Role validation enforced at database level
- [ ] Audit logs capture all sensitive operations
- [ ] JWT tokens properly validated and refreshed
- [ ] Input validation prevents injection attacks

---

## Deployment Strategy

### Pre-Deployment
1. **Database Backup**: Full backup of production database
2. **Feature Flags**: Disable new features initially
3. **Staging Testing**: Complete workflow testing in staging environment

### Deployment Sequence
1. **Database Migrations**: Run all schema changes
2. **Backend Deployment**: Deploy API changes with features disabled
3. **Frontend Deployment**: Deploy UI changes
4. **Feature Enablement**: Gradually enable new features
5. **Monitoring**: Monitor system performance and error rates

### Rollback Plan
1. **Database Rollback**: Reverse migrations if needed
2. **Code Rollback**: Revert to previous stable version
3. **Feature Flags**: Disable problematic features immediately
4. **Communication**: Notify stakeholders of any issues

---

## Maintenance & Support

### Documentation Updates
- API documentation for new endpoints
- User guides for new workflow
- Administrator guides for role management
- Developer documentation for new components

### Training Requirements
- User training for new project creation workflow
- Administrator training for role management
- Developer training for new architecture patterns

### Ongoing Monitoring
- Performance metrics for new endpoints
- User adoption metrics for new features
- Error rates and system stability
- Security audit logs and alerts

