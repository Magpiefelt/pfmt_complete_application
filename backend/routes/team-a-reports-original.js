/**
 * Team A Reports Routes
 * API routes for report management operations
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
  body('type').isIn(['Status Report', 'Financial Report', 'Progress Report', 'Risk Report', 'Quality Report', 'Milestone Report', 'Final Report']).withMessage('Invalid report type'),
  body('project_id').isUUID().withMessage('Valid project ID is required'),
  body('status').optional().isIn(['Draft', 'Submitted', 'Approved', 'Rejected']).withMessage('Invalid status'),
  body('period_start').optional().isISO8601().withMessage('Invalid period start date'),
  body('period_end').optional().isISO8601().withMessage('Invalid period end date'),
  body('due_date').optional().isISO8601().withMessage('Invalid due date'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('executive_summary').optional().isLength({ max: 5000 }).withMessage('Executive summary too long'),
  body('key_findings').optional().isLength({ max: 5000 }).withMessage('Key findings too long'),
  body('recommendations').optional().isLength({ max: 5000 }).withMessage('Recommendations too long'),
  body('next_steps').optional().isLength({ max: 2000 }).withMessage('Next steps too long')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['Draft', 'Submitted', 'Approved', 'Rejected']).withMessage('Invalid status filter'),
  query('type').optional().isIn(['Status Report', 'Financial Report', 'Progress Report', 'Risk Report', 'Quality Report', 'Milestone Report', 'Final Report']).withMessage('Invalid type filter'),
  query('project').optional().isUUID().withMessage('Invalid project ID filter'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
];

// Routes

/**
 * @route   GET /api/team-a-reports
 * @desc    Get all reports with filtering and pagination
 * @access  Private
 */
router.get('/', 
  authenticateToken, 
  validateQueryParams,
  reportsController.getReports
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
 * @route   GET /api/team-a-reports/templates
 * @desc    Get report templates
 * @access  Private
 */
router.get('/templates', 
  authenticateToken,
  reportsController.getReportTemplates
);

/**
 * @route   POST /api/team-a-reports/generate-template
 * @desc    Generate report template
 * @access  Private
 */
router.post('/generate-template', 
  authenticateToken,
  [
    body('template_type').notEmpty().withMessage('Template type is required'),
    body('project_id').isUUID().withMessage('Valid project ID is required')
  ],
  reportsController.generateReportTemplate
);

/**
 * @route   GET /api/team-a-reports/export
 * @desc    Export reports to CSV
 * @access  Private
 */
router.get('/export', 
  authenticateToken,
  validateQueryParams,
  reportsController.exportReports
);

/**
 * @route   GET /api/team-a-reports/:id
 * @desc    Get report by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken, 
  validateReportId,
  reportsController.getReport
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

/**
 * @route   GET /api/team-a-reports/:id/export
 * @desc    Export single report to PDF
 * @access  Private
 */
router.get('/:id/export', 
  authenticateToken, 
  validateReportId,
  [
    query('format').optional().isIn(['pdf', 'docx']).withMessage('Invalid export format')
  ],
  reportsController.exportReport
);

/**
 * @route   GET /api/team-a-reports/:id/attachments
 * @desc    Get report attachments
 * @access  Private
 */
router.get('/:id/attachments', 
  authenticateToken, 
  validateReportId,
  reportsController.getReportAttachments
);

/**
 * @route   POST /api/team-a-reports/:id/attachments
 * @desc    Upload report attachment
 * @access  Private
 */
router.post('/:id/attachments', 
  authenticateToken, 
  validateReportId,
  reportsController.uploadReportAttachment
);

/**
 * @route   DELETE /api/team-a-reports/:id/attachments/:attachmentId
 * @desc    Delete report attachment
 * @access  Private
 */
router.delete('/:id/attachments/:attachmentId', 
  authenticateToken, 
  validateReportId,
  param('attachmentId').isUUID().withMessage('Invalid attachment ID format'),
  reportsController.deleteReportAttachment
);

module.exports = router;

