/**
 * Change Orders Routes (Simplified)
 * API routes for change order management operations using existing controller methods
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
  body('status').optional().isIn(['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented', 'Cancelled']).withMessage('Invalid status')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented', 'Cancelled']).withMessage('Invalid status filter'),
  query('change_type').optional().isIn(['Scope Change', 'Schedule Change', 'Budget Change', 'Resource Change', 'Quality Change', 'Risk Change']).withMessage('Invalid change type filter'),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority filter')
];

// Routes using existing controller methods

/**
 * @route   GET /api/change-orders
 * @desc    Get all change orders with filtering and pagination
 * @access  Private
 */
router.get('/', 
  authenticateToken, 
  validateQueryParams,
  changeOrdersController.getAllChangeOrders
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
 * @route   GET /api/change-orders/project/:projectId
 * @desc    Get change orders by project
 * @access  Private
 */
router.get('/project/:projectId', 
  authenticateToken,
  param('projectId').isUUID().withMessage('Invalid project ID format'),
  changeOrdersController.getChangeOrdersByProject
);

/**
 * @route   GET /api/change-orders/contract/:contractId
 * @desc    Get change orders by contract
 * @access  Private
 */
router.get('/contract/:contractId', 
  authenticateToken,
  param('contractId').isUUID().withMessage('Invalid contract ID format'),
  changeOrdersController.getChangeOrdersByContract
);

/**
 * @route   GET /api/change-orders/:id
 * @desc    Get change order by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken, 
  validateChangeOrderId,
  changeOrdersController.getChangeOrderById
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
 * @desc    Submit change order for approval
 * @access  Private
 */
router.post('/:id/submit', 
  authenticateToken, 
  validateChangeOrderId,
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
    body('approval_notes').optional().isLength({ max: 1000 }).withMessage('Approval notes too long')
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
  requireRole(['admin', 'project_manager']),
  [
    body('implementation_notes').optional().isLength({ max: 1000 }).withMessage('Implementation notes too long')
  ],
  changeOrdersController.implementChangeOrder
);

/**
 * @route   GET /api/change-orders/:id/impact-summary
 * @desc    Get change order impact summary
 * @access  Private
 */
router.get('/:id/impact-summary', 
  authenticateToken, 
  validateChangeOrderId,
  changeOrdersController.getChangeOrderImpactSummary
);

module.exports = router;

