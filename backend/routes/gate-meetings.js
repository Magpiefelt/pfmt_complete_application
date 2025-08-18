/**
 * Gate Meetings Routes
 * API routes for gate meeting management operations
 */

const express = require('express');
const router = express.Router();
const gateMeetingsController = require('../controllers/gateMeetingsController');
const { authenticateToken, requireRole } = require('../middleware/auth-consolidated');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateGateMeetingId = [
  param('id').isUUID().withMessage('Invalid gate meeting ID format')
];

const validateGateMeetingData = [
  body('title').notEmpty().withMessage('Title is required'),
  body('project_id').isUUID().withMessage('Valid project ID is required'),
  body('gate_type').isIn(['Gate 0', 'Gate 1', 'Gate 2', 'Gate 3', 'Gate 4', 'Gate 5', 'Gate 6']).withMessage('Invalid gate type'),
  body('scheduled_date').isISO8601().withMessage('Valid scheduled date is required'),
  body('location').optional().isLength({ max: 200 }).withMessage('Location too long'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('agenda').optional().isLength({ max: 5000 }).withMessage('Agenda too long'),
  body('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed']).withMessage('Invalid status'),
  body('attendees').optional().isArray().withMessage('Attendees must be an array'),
  body('action_items').optional().isArray().withMessage('Action items must be an array'),
  body('decisions').optional().isArray().withMessage('Decisions must be an array')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed']).withMessage('Invalid status filter'),
  query('gate_type').optional().isIn(['Gate 0', 'Gate 1', 'Gate 2', 'Gate 3', 'Gate 4', 'Gate 5', 'Gate 6']).withMessage('Invalid gate type filter'),
  query('project').optional().isUUID().withMessage('Invalid project ID filter'),
  query('date_from').optional().isISO8601().withMessage('Invalid date_from format'),
  query('date_to').optional().isISO8601().withMessage('Invalid date_to format'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
];

// Routes - Only include methods that exist in the controller

/**
 * @route   GET /api/gate-meetings
 * @desc    Get all gate meetings with filtering and pagination
 * @access  Private
 */
router.get('/', 
  authenticateToken,
  validateQueryParams,
  gateMeetingsController.getAllGateMeetings
);

/**
 * @route   GET /api/gate-meetings/statistics
 * @desc    Get gate meeting statistics
 * @access  Private
 */
router.get('/statistics', 
  authenticateToken,
  gateMeetingsController.getGateMeetingStatistics
);

/**
 * @route   GET /api/gate-meetings/upcoming
 * @desc    Get upcoming gate meetings
 * @access  Private
 */
router.get('/upcoming', 
  authenticateToken,
  validateQueryParams,
  gateMeetingsController.getUpcomingGateMeetings
);

/**
 * @route   GET /api/gate-meetings/:id
 * @desc    Get gate meeting by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken,
  validateGateMeetingId,
  gateMeetingsController.getGateMeetingById
);

/**
 * @route   POST /api/gate-meetings
 * @desc    Create new gate meeting
 * @access  Private (Project Manager, Admin)
 */
router.post('/', 
  authenticateToken,
  requireRole(['Project Manager', 'Admin']),
  validateGateMeetingData,
  gateMeetingsController.createGateMeeting
);

/**
 * @route   PUT /api/gate-meetings/:id
 * @desc    Update gate meeting
 * @access  Private (Project Manager, Admin)
 */
router.put('/:id', 
  authenticateToken,
  requireRole(['Project Manager', 'Admin']),
  validateGateMeetingId,
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('gate_type').optional().isIn(['Gate 0', 'Gate 1', 'Gate 2', 'Gate 3', 'Gate 4', 'Gate 5', 'Gate 6']).withMessage('Invalid gate type'),
    body('scheduled_date').optional().isISO8601().withMessage('Valid scheduled date is required'),
    body('location').optional().isLength({ max: 200 }).withMessage('Location too long'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
    body('agenda').optional().isLength({ max: 5000 }).withMessage('Agenda too long'),
    body('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed']).withMessage('Invalid status'),
    body('attendees').optional().isArray().withMessage('Attendees must be an array'),
    body('action_items').optional().isArray().withMessage('Action items must be an array'),
    body('decisions').optional().isArray().withMessage('Decisions must be an array')
  ],
  gateMeetingsController.updateGateMeeting
);

/**
 * @route   DELETE /api/gate-meetings/:id
 * @desc    Delete gate meeting
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authenticateToken,
  requireRole(['Admin']),
  validateGateMeetingId,
  gateMeetingsController.deleteGateMeeting
);

/**
 * @route   POST /api/gate-meetings/:id/start
 * @desc    Start gate meeting
 * @access  Private (Project Manager, Admin)
 */
router.post('/:id/start', 
  authenticateToken,
  requireRole(['Project Manager', 'Admin']),
  validateGateMeetingId,
  gateMeetingsController.startGateMeeting
);

/**
 * @route   POST /api/gate-meetings/:id/complete
 * @desc    Complete gate meeting
 * @access  Private (Project Manager, Admin)
 */
router.post('/:id/complete', 
  authenticateToken,
  requireRole(['Project Manager', 'Admin']),
  validateGateMeetingId,
  [
    body('outcomes').optional().isArray().withMessage('Outcomes must be an array'),
    body('decisions').optional().isArray().withMessage('Decisions must be an array'),
    body('action_items').optional().isArray().withMessage('Action items must be an array'),
    body('next_steps').optional().isString().withMessage('Next steps must be a string')
  ],
  gateMeetingsController.completeGateMeeting
);

/**
 * @route   POST /api/gate-meetings/:id/cancel
 * @desc    Cancel gate meeting
 * @access  Private (Project Manager, Admin)
 */
router.post('/:id/cancel', 
  authenticateToken,
  requireRole(['Project Manager', 'Admin']),
  validateGateMeetingId,
  [
    body('reason').notEmpty().withMessage('Cancellation reason is required')
  ],
  gateMeetingsController.cancelGateMeeting
);

module.exports = router;

