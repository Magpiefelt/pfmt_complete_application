/**
 * Change Orders Routes
 * API routes for change order management operations
 */

const express = require('express');
const router = express.Router();
const changeOrdersController = require('../controllers/changeOrdersController');
const { authenticateToken, requireRole } = require('../middleware/auth-consolidated');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateChangeOrderId = [
  param('id').isUUID().withMessage('Invalid change order ID format')
];

const validateChangeOrderData = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('contract_id').isUUID().withMessage('Valid contract ID is required'),
  body('project_id').isUUID().withMessage('Valid project ID is required'),
  body('change_type').isIn(['Scope Change', 'Schedule Change', 'Budget Change', 'Resource Change', 'Quality Change', 'Risk Change']).withMessage('Invalid change type'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented', 'Cancelled']).withMessage('Invalid status'),
  body('requested_by').optional().isUUID().withMessage('Invalid requested by user ID'),
  body('cost_impact').optional().isFloat().withMessage('Cost impact must be a number'),
  body('schedule_impact_days').optional().isInt().withMessage('Schedule impact days must be an integer'),
  body('justification').optional().isLength({ max: 2000 }).withMessage('Justification too long'),
  body('business_case').optional().isLength({ max: 5000 }).withMessage('Business case too long'),
  body('risk_assessment').optional().isLength({ max: 2000 }).withMessage('Risk assessment too long'),
  body('implementation_plan').optional().isLength({ max: 5000 }).withMessage('Implementation plan too long'),
  body('expected_completion_date').optional().isISO8601().withMessage('Invalid expected completion date')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented', 'Cancelled']).withMessage('Invalid status filter'),
  query('change_type').optional().isIn(['Scope Change', 'Schedule Change', 'Budget Change', 'Resource Change', 'Quality Change', 'Risk Change']).withMessage('Invalid change type filter'),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority filter'),
  query('contract_id').optional().isUUID().withMessage('Invalid contract ID filter'),
  query('project_id').optional().isUUID().withMessage('Invalid project ID filter'),
  query('requested_by').optional().isUUID().withMessage('Invalid requested by user ID filter'),
  query('date_from').optional().isISO8601().withMessage('Invalid date_from format'),
  query('date_to').optional().isISO8601().withMessage('Invalid date_to format'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
];

// Routes

/**
 * @route   GET /api/change-orders
 * @desc    Get all change orders with filtering and pagination
 * @access  Private
 */
router.get('/', 
  authenticateToken, 
  validateQueryParams,
  changeOrdersController.getChangeOrders
);

/**
 * @route   GET /api/change-orders/statistics
 * @desc    Get change order statistics
 * @access  Private
 */
router.get('/statistics', 
  authenticateToken,
  changeOrdersController.getChangeOrderStatistics
);

/**
 * @route   GET /api/change-orders/pending-approval
 * @desc    Get change orders pending approval
 * @access  Private
 */
router.get('/pending-approval', 
  authenticateToken,
  requireRole(['admin', 'project_manager', 'approver']),
  validateQueryParams,
  changeOrdersController.getPendingApprovalChangeOrders
);

/**
 * @route   GET /api/change-orders/:id
 * @desc    Get change order by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken, 
  validateChangeOrderId,
  changeOrdersController.getChangeOrder
);

/**
 * @route   POST /api/change-orders
 * @desc    Create new change order
 * @access  Private
 */
router.post('/', 
  authenticateToken, 
  validateChangeOrderData,
  changeOrdersController.createChangeOrder
);

/**
 * @route   PUT /api/change-orders/:id
 * @desc    Update change order
 * @access  Private
 */
router.put('/:id', 
  authenticateToken, 
  validateChangeOrderId,
  validateChangeOrderData,
  changeOrdersController.updateChangeOrder
);

/**
 * @route   DELETE /api/change-orders/:id
 * @desc    Delete change order
 * @access  Private
 */
router.delete('/:id', 
  authenticateToken, 
  validateChangeOrderId,
  requireRole(['admin', 'project_manager']),
  changeOrdersController.deleteChangeOrder
);

/**
 * @route   POST /api/change-orders/:id/submit
 * @desc    Submit change order for review
 * @access  Private
 */
router.post('/:id/submit', 
  authenticateToken, 
  validateChangeOrderId,
  [
    body('submission_notes').optional().isLength({ max: 1000 }).withMessage('Submission notes too long')
  ],
  changeOrdersController.submitChangeOrder
);

/**
 * @route   POST /api/change-orders/:id/approve
 * @desc    Approve change order
 * @access  Private
 */
router.post('/:id/approve', 
  authenticateToken, 
  validateChangeOrderId,
  requireRole(['admin', 'project_manager', 'approver']),
  [
    body('approval_notes').optional().isLength({ max: 1000 }).withMessage('Approval notes too long'),
    body('approved_cost_impact').optional().isFloat().withMessage('Approved cost impact must be a number'),
    body('approved_schedule_impact_days').optional().isInt().withMessage('Approved schedule impact days must be an integer')
  ],
  changeOrdersController.approveChangeOrder
);

/**
 * @route   POST /api/change-orders/:id/reject
 * @desc    Reject change order
 * @access  Private
 */
router.post('/:id/reject', 
  authenticateToken, 
  validateChangeOrderId,
  requireRole(['admin', 'project_manager', 'approver']),
  [
    body('rejection_reason').notEmpty().withMessage('Rejection reason is required'),
    body('rejection_notes').optional().isLength({ max: 1000 }).withMessage('Rejection notes too long')
  ],
  changeOrdersController.rejectChangeOrder
);

/**
 * @route   POST /api/change-orders/:id/implement
 * @desc    Mark change order as implemented
 * @access  Private
 */
router.post('/:id/implement', 
  authenticateToken, 
  validateChangeOrderId,
  [
    body('implementation_notes').optional().isLength({ max: 2000 }).withMessage('Implementation notes too long'),
    body('actual_cost_impact').optional().isFloat().withMessage('Actual cost impact must be a number'),
    body('actual_schedule_impact_days').optional().isInt().withMessage('Actual schedule impact days must be an integer'),
    body('implementation_date').optional().isISO8601().withMessage('Invalid implementation date')
  ],
  changeOrdersController.implementChangeOrder
);

/**
 * @route   POST /api/change-orders/:id/cancel
 * @desc    Cancel change order
 * @access  Private
 */
router.post('/:id/cancel', 
  authenticateToken, 
  validateChangeOrderId,
  [
    body('cancellation_reason').notEmpty().withMessage('Cancellation reason is required'),
    body('cancellation_notes').optional().isLength({ max: 1000 }).withMessage('Cancellation notes too long')
  ],
  changeOrdersController.cancelChangeOrder
);

/**
 * @route   GET /api/change-orders/:id/impact-analysis
 * @desc    Get change order impact analysis
 * @access  Private
 */
router.get('/:id/impact-analysis', 
  authenticateToken, 
  validateChangeOrderId,
  changeOrdersController.getChangeOrderImpactAnalysis
);

/**
 * @route   POST /api/change-orders/:id/impact-analysis
 * @desc    Update change order impact analysis
 * @access  Private
 */
router.post('/:id/impact-analysis', 
  authenticateToken, 
  validateChangeOrderId,
  [
    body('cost_analysis').optional().isLength({ max: 2000 }).withMessage('Cost analysis too long'),
    body('schedule_analysis').optional().isLength({ max: 2000 }).withMessage('Schedule analysis too long'),
    body('resource_analysis').optional().isLength({ max: 2000 }).withMessage('Resource analysis too long'),
    body('risk_analysis').optional().isLength({ max: 2000 }).withMessage('Risk analysis too long'),
    body('quality_analysis').optional().isLength({ max: 2000 }).withMessage('Quality analysis too long')
  ],
  changeOrdersController.updateChangeOrderImpactAnalysis
);

/**
 * @route   GET /api/change-orders/:id/approvals
 * @desc    Get change order approval history
 * @access  Private
 */
router.get('/:id/approvals', 
  authenticateToken, 
  validateChangeOrderId,
  changeOrdersController.getChangeOrderApprovals
);

/**
 * @route   POST /api/change-orders/:id/approvals
 * @desc    Add approval step to change order
 * @access  Private
 */
router.post('/:id/approvals', 
  authenticateToken, 
  validateChangeOrderId,
  requireRole(['admin', 'project_manager']),
  [
    body('approver_id').isUUID().withMessage('Valid approver ID is required'),
    body('approval_level').isInt({ min: 1, max: 10 }).withMessage('Approval level must be between 1 and 10'),
    body('required').optional().isBoolean().withMessage('Required must be a boolean')
  ],
  changeOrdersController.addChangeOrderApproval
);

/**
 * @route   GET /api/change-orders/:id/documents
 * @desc    Get change order documents
 * @access  Private
 */
router.get('/:id/documents', 
  authenticateToken, 
  validateChangeOrderId,
  changeOrdersController.getChangeOrderDocuments
);

/**
 * @route   POST /api/change-orders/:id/documents
 * @desc    Upload change order document
 * @access  Private
 */
router.post('/:id/documents', 
  authenticateToken, 
  validateChangeOrderId,
  changeOrdersController.uploadChangeOrderDocument
);

/**
 * @route   DELETE /api/change-orders/:id/documents/:documentId
 * @desc    Delete change order document
 * @access  Private
 */
router.delete('/:id/documents/:documentId', 
  authenticateToken, 
  validateChangeOrderId,
  param('documentId').isUUID().withMessage('Invalid document ID format'),
  changeOrdersController.deleteChangeOrderDocument
);

/**
 * @route   GET /api/change-orders/:id/export
 * @desc    Export change order to PDF
 * @access  Private
 */
router.get('/:id/export', 
  authenticateToken, 
  validateChangeOrderId,
  [
    query('format').optional().isIn(['pdf', 'docx']).withMessage('Invalid export format')
  ],
  changeOrdersController.exportChangeOrder
);

/**
 * @route   GET /api/change-orders/export
 * @desc    Export change orders to CSV
 * @access  Private
 */
router.get('/export', 
  authenticateToken,
  validateQueryParams,
  changeOrdersController.exportChangeOrders
);

module.exports = router;

