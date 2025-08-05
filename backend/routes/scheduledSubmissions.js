const express = require('express');
const router = express.Router();
const scheduledSubmissionController = require('../controllers/scheduledSubmissionController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route GET /api/scheduled-submissions/config
 * @desc Get scheduled submission configuration
 * @access Admin, Director
 */
router.get('/config', 
    requireRole(['admin', 'director']), 
    scheduledSubmissionController.getConfiguration
);

/**
 * @route PUT /api/scheduled-submissions/config
 * @desc Update scheduled submission configuration
 * @access Admin
 */
router.put('/config', 
    requireRole(['admin']), 
    scheduledSubmissionController.updateConfiguration
);

/**
 * @route GET /api/scheduled-submissions/history
 * @desc Get scheduled submission history
 * @access Admin, Director
 */
router.get('/history', 
    requireRole(['admin', 'director']), 
    scheduledSubmissionController.getSubmissionHistory
);

/**
 * @route GET /api/scheduled-submissions/eligible
 * @desc Get projects eligible for auto-submission
 * @access Admin, Director, PM, SPM
 */
router.get('/eligible', 
    requireRole(['admin', 'director', 'pm', 'spm']), 
    scheduledSubmissionController.getEligibleProjects
);

/**
 * @route POST /api/scheduled-submissions/trigger
 * @desc Manually trigger auto-submission (for testing)
 * @access Admin, Director
 */
router.post('/trigger', 
    requireRole(['admin', 'director']), 
    scheduledSubmissionController.triggerAutoSubmission
);

/**
 * @route PUT /api/scheduled-submissions/projects/:project_id/auto-submission
 * @desc Update project auto-submission setting
 * @access PM, SPM (for their projects), Admin, Director
 */
router.put('/projects/:project_id/auto-submission', 
    scheduledSubmissionController.updateProjectAutoSubmission
);

module.exports = router;

