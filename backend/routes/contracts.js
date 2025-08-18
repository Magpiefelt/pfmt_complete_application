/**
 * Contracts Routes
 * API routes for contract management (Team A integration)
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const ContractsController = require('../controllers/contractsController');
const { authenticateToken, requireRole } = require('../middleware/auth-consolidated');

// Validation middleware
const contractValidation = [
    body('projectId').isUUID().withMessage('Valid project ID is required'),
    body('vendorId').optional().isUUID().withMessage('Valid vendor ID is required'),
    body('contractNumber').isLength({ min: 1, max: 100 }).withMessage('Contract number is required (max 100 characters)'),
    body('title').isLength({ min: 1, max: 255 }).withMessage('Title is required (max 255 characters)'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    body('status').optional().isIn(['Draft', 'Active', 'Completed', 'Terminated', 'Expired']).withMessage('Invalid status'),
    body('performanceMetrics').optional().isObject().withMessage('Performance metrics must be an object')
];

const contractUpdateValidation = [
    body('vendorId').optional().isUUID().withMessage('Valid vendor ID is required'),
    body('contractNumber').optional().isLength({ min: 1, max: 100 }).withMessage('Contract number must be 1-100 characters'),
    body('title').optional().isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    body('status').optional().isIn(['Draft', 'Active', 'Completed', 'Terminated', 'Expired']).withMessage('Invalid status'),
    body('performanceMetrics').optional().isObject().withMessage('Performance metrics must be an object')
];

const idValidation = [
    param('id').isUUID().withMessage('Valid contract ID is required')
];

const projectIdValidation = [
    param('projectId').isUUID().withMessage('Valid project ID is required')
];

const vendorIdValidation = [
    param('vendorId').isUUID().withMessage('Valid vendor ID is required')
];

// Routes

/**
 * @route   GET /api/contracts
 * @desc    Get all contracts with filtering and pagination
 * @access  Private
 */
router.get('/', 
    authenticateToken,
    ContractsController.getAllContracts
);

/**
 * @route   GET /api/contracts/statistics
 * @desc    Get contract statistics
 * @access  Private
 */
router.get('/statistics',
    authenticateToken,
    ContractsController.getContractStatistics
);

/**
 * @route   GET /api/contracts/project/:projectId
 * @desc    Get contracts by project ID
 * @access  Private
 */
router.get('/project/:projectId',
    authenticateToken,
    projectIdValidation,
    ContractsController.getContractsByProject
);

/**
 * @route   GET /api/contracts/vendor/:vendorId
 * @desc    Get contracts by vendor ID
 * @access  Private
 */
router.get('/vendor/:vendorId',
    authenticateToken,
    vendorIdValidation,
    ContractsController.getContractsByVendor
);

/**
 * @route   GET /api/contracts/:id
 * @desc    Get contract by ID
 * @access  Private
 */
router.get('/:id',
    authenticateToken,
    idValidation,
    ContractsController.getContractById
);

/**
 * @route   POST /api/contracts
 * @desc    Create new contract
 * @access  Private (Project Manager, Admin)
 */
router.post('/',
    authenticateToken,
    requireRole(['Project Manager', 'Admin']),
    contractValidation,
    ContractsController.createContract
);

/**
 * @route   PUT /api/contracts/:id
 * @desc    Update contract
 * @access  Private (Project Manager, Admin)
 */
router.put('/:id',
    authenticateToken,
    requireRole(['Project Manager', 'Admin']),
    idValidation,
    contractUpdateValidation,
    ContractsController.updateContract
);

/**
 * @route   DELETE /api/contracts/:id
 * @desc    Delete contract
 * @access  Private (Admin only)
 */
router.delete('/:id',
    authenticateToken,
    requireRole(['Admin']),
    idValidation,
    ContractsController.deleteContract
);

/**
 * @route   POST /api/contracts/:id/approve
 * @desc    Approve contract
 * @access  Private (Project Manager, Admin)
 */
router.post('/:id/approve',
    authenticateToken,
    requireRole(['Project Manager', 'Admin']),
    idValidation,
    ContractsController.approveContract
);

module.exports = router;

