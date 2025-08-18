/**
 * Team A Reports Routes (Simplified)
 * API routes for report management operations using existing controller methods
 */

const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireRole } = require('../middleware/auth-consolidated');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateReportId = [
  param('id').isUUID().withMessage('Invalid report ID format')
];

const validateReportData = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('report_type').notEmpty().withMessage('Report type is required'),
  body('project_id').optional().isUUID().withMessage('Invalid project ID'),
  body('status').optional().isIn(['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected']).withMessage('Invalid status')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected']).withMessage('Invalid status filter'),
  query('report_type').optional().isLength({ max: 100 }).withMessage('Report type filter too long'),
  query('project_id').optional().isUUID().withMessage('Invalid project ID filter')
];

// Routes using existing controller methods

/**
 * @route   GET /api/team-a-reports
 * @desc    Get all reports with filtering and pagination
 * @access  Private
 */
router.get('/', 
  authenticateToken, 
  validateQueryParams,
  reportsController.getAllReports
);

/**
 * @route   GET /api/team-a-reports/statistics
 * @desc    Get report statistics
 * @access  Private
 */
router.get('/statistics', 
  authenticateToken,
  reportsController.getReportStatistics
);

/**
 * @route   GET /api/team-a-reports/types
 * @desc    Get available report types
 * @access  Private
 */
router.get('/types', 
  authenticateToken,
  reportsController.getReportTypes
);

/**
 * @route   GET /api/team-a-reports/project/:projectId
 * @desc    Get reports by project
 * @access  Private
 */
router.get('/project/:projectId', 
  authenticateToken,
  param('projectId').isUUID().withMessage('Invalid project ID format'),
  reportsController.getReportsByProject
);

/**
 * @route   GET /api/team-a-reports/type/:type
 * @desc    Get reports by type
 * @access  Private
 */
router.get('/type/:type', 
  authenticateToken,
  param('type').notEmpty().withMessage('Report type is required'),
  reportsController.getReportsByType
);

/**
 * @route   GET /api/team-a-reports/:id
 * @desc    Get report by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken, 
  validateReportId,
  reportsController.getReportById
);

/**
 * @route   POST /api/team-a-reports
 * @desc    Create new report
 * @access  Private
 */
router.post('/', 
  authenticateToken, 
  validateReportData,
  reportsController.createReport
);

/**
 * @route   PUT /api/team-a-reports/:id
 * @desc    Update report
 * @access  Private
 */
router.put('/:id', 
  authenticateToken, 
  validateReportId,
  validateReportData,
  reportsController.updateReport
);

/**
 * @route   DELETE /api/team-a-reports/:id
 * @desc    Delete report
 * @access  Private
 */
router.delete('/:id', 
  authenticateToken, 
  validateReportId,
  requireRole(['admin', 'project_manager']),
  reportsController.deleteReport
);

/**
 * @route   POST /api/team-a-reports/:id/submit
 * @desc    Submit report for approval
 * @access  Private
 */
router.post('/:id/submit', 
  authenticateToken, 
  validateReportId,
  [
    body('submission_notes').optional().isLength({ max: 1000 }).withMessage('Submission notes too long')
  ],
  reportsController.submitReport
);

/**
 * @route   POST /api/team-a-reports/:id/approve
 * @desc    Approve report
 * @access  Private
 */
router.post('/:id/approve', 
  authenticateToken, 
  validateReportId,
  requireRole(['admin', 'project_manager', 'approver']),
  [
    body('approval_notes').optional().isLength({ max: 1000 }).withMessage('Approval notes too long')
  ],
  reportsController.approveReport
);

/**
 * @route   POST /api/team-a-reports/:id/reject
 * @desc    Reject report
 * @access  Private
 */
router.post('/:id/reject', 
  authenticateToken, 
  validateReportId,
  requireRole(['admin', 'project_manager', 'approver']),
  [
    body('rejection_reason').notEmpty().withMessage('Rejection reason is required'),
    body('rejection_notes').optional().isLength({ max: 1000 }).withMessage('Rejection notes too long')
  ],
  reportsController.rejectReport
);

module.exports = router;

