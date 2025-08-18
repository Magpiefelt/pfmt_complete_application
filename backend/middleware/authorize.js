// Resource-level authorization middleware
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pfmt_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Helper function for database operations
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

/**
 * Generic role-based authorization middleware
 * @param {...string} allowedRoles - List of roles that can access the resource
 * @returns {Function} Express middleware function
 */
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

/**
 * Check if user can edit a specific project
 * Based on role and project assignment
 */
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
      'SELECT assigned_pm, assigned_spm, created_by, workflow_status FROM projects WHERE id = $1',
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

    // PM/SPM can edit if assigned
    if ((role === 'pm' || role === 'spm') && (isAssignedPM || isAssignedSPM)) {
      return next();
    }

    // PMI can edit if they created it and it's still in initiated status
    if (role === 'pmi' && isCreator && project.workflow_status === 'initiated') {
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

/**
 * Check if user can view a specific project
 * More permissive than edit - includes read-only access for analysts
 */
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

/**
 * Check if user can assign team to a project
 * Only Directors and Admins can assign teams
 */
const canAssignTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    // Only admin and director can assign teams
    if (!['admin', 'director'].includes(role)) {
      return res.status(403).json({
        error: {
          message: 'Only Directors and Admins can assign project teams',
          code: 'TEAM_ASSIGN_FORBIDDEN'
        }
      });
    }

    // Check if project exists and is in correct status
    const result = await query(
      'SELECT workflow_status FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = result.rows[0];
    if (project.workflow_status !== 'initiated') {
      return res.status(400).json({
        error: {
          message: 'Project must be in initiated status for team assignment',
          code: 'INVALID_PROJECT_STATUS',
          current_status: project.workflow_status
        }
      });
    }

    next();

  } catch (error) {
    console.error('Team assignment authorization error:', error);
    return res.status(500).json({
      error: { message: 'Authorization check failed', code: 'AUTH_ERROR' }
    });
  }
};

/**
 * Check if user can finalize a project
 * Only assigned PM/SPM or admins can finalize
 */
const canFinalizeProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    // Admin can always finalize
    if (role === 'admin') {
      return next();
    }

    // Check if user is PM or SPM
    if (!['pm', 'spm'].includes(role)) {
      return res.status(403).json({
        error: {
          message: 'Only Project Managers and Senior Project Managers can finalize projects',
          code: 'PROJECT_FINALIZE_FORBIDDEN'
        }
      });
    }

    // Get project assignment details
    const result = await query(
      'SELECT assigned_pm, assigned_spm, workflow_status FROM projects WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = result.rows[0];

    // Check if project is in correct status
    if (project.workflow_status !== 'assigned') {
      return res.status(400).json({
        error: {
          message: 'Project must be in assigned status for finalization',
          code: 'INVALID_PROJECT_STATUS',
          current_status: project.workflow_status
        }
      });
    }

    // Check if user is assigned to this project
    if (project.assigned_pm !== userId && project.assigned_spm !== userId) {
      return res.status(403).json({
        error: {
          message: 'You are not assigned to this project',
          code: 'NOT_ASSIGNED_TO_PROJECT'
        }
      });
    }

    next();

  } catch (error) {
    console.error('Project finalization authorization error:', error);
    return res.status(500).json({
      error: { message: 'Authorization check failed', code: 'AUTH_ERROR' }
    });
  }
};

/**
 * Validate that assigned users have correct roles
 * Used when assigning PM/SPM to projects
 */
const validateAssignedUsers = async (req, res, next) => {
  try {
    const { assigned_pm, assigned_spm } = req.body;

    // Validate assigned PM if provided
    if (assigned_pm) {
      const pmResult = await query(
        "SELECT id, role FROM users WHERE id = $1 AND role IN ('pm', 'spm') AND is_active = true",
        [assigned_pm]
      );
      
      if (pmResult.rows.length === 0) {
        return res.status(400).json({
          error: { 
            message: 'Assigned PM must be an active user with PM or SPM role', 
            code: 'INVALID_PM_ASSIGNMENT' 
          }
        });
      }
    }

    // Validate assigned SPM if provided
    if (assigned_spm) {
      const spmResult = await query(
        "SELECT id, role FROM users WHERE id = $1 AND role = 'spm' AND is_active = true",
        [assigned_spm]
      );
      
      if (spmResult.rows.length === 0) {
        return res.status(400).json({
          error: { 
            message: 'Assigned SPM must be an active user with SPM role', 
            code: 'INVALID_SPM_ASSIGNMENT' 
          }
        });
      }
    }

    next();

  } catch (error) {
    console.error('User validation error:', error);
    return res.status(500).json({
      error: { message: 'User validation failed', code: 'VALIDATION_ERROR' }
    });
  }
};

module.exports = {
  authorizeRoles,
  canEditProject,
  canViewProject,
  canAssignTeam,
  canFinalizeProject,
  validateAssignedUsers
};

