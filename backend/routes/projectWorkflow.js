const express = require('express');
const router = express.Router();
const projectWorkflowController = require('../controllers/projectWorkflowController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { 
  canAssignTeam, 
  canFinalizeProject, 
  validateAssignedUsers 
} = require('../middleware/authorize');
const { auditLog } = require('../middleware/audit');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * PM&I Routes - Project Initiation
 */

// Create new project initiation
router.post('/initiate',
  authorizeRoles('pmi', 'admin'),
  auditLog('create', 'project'),
  projectWorkflowController.createProjectInitiation
);

/**
 * Director Routes - Team Assignment
 */

// Get projects pending assignment
router.get('/pending-assignments',
  authorizeRoles('director', 'admin'),
  projectWorkflowController.getPendingAssignments
);

// Assign team to project
router.post('/:id/assign',
  canAssignTeam,
  validateAssignedUsers,
  auditLog('assign', 'project'),
  projectWorkflowController.assignProjectTeam
);

/**
 * PM/SPM Routes - Project Finalization
 */

// Get my assigned projects
router.get('/my-projects',
  authorizeRoles('pm', 'spm', 'admin'),
  projectWorkflowController.getMyProjects
);

// Finalize project setup
router.post('/:id/finalize',
  canFinalizeProject,
  auditLog('finalize', 'project'),
  projectWorkflowController.finalizeProjectSetup
);

/**
 * General Workflow Routes
 */

// Get workflow status for a project
router.get('/:id/status',
  authorizeRoles('admin', 'director', 'pm', 'spm', 'pmi', 'analyst'),
  projectWorkflowController.getProjectWorkflowStatus
);

// Get project with enhanced status information (for dual-wizard system)
router.get('/:id/details',
  authorizeRoles('admin', 'director', 'pm', 'spm', 'pmi', 'analyst'),
  projectWorkflowController.getProjectWithStatus
);

/**
 * Dual-Wizard Support Routes
 */

// Get available users for team assignment
router.get('/users/available',
  authorizeRoles('director', 'admin'),
  projectWorkflowController.getAvailableUsers
);

// Get available vendors for project configuration
router.get('/vendors/available',
  authorizeRoles('pm', 'spm', 'director', 'admin'),
  projectWorkflowController.getAvailableVendors
);

module.exports = router;

