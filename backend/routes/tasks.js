/**
 * Tasks Routes
 * API routes for enhanced task management operations
 */

const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');
const { authenticateToken, requireRole } = require('../middleware/auth-consolidated');
const { body, param, query } = require('express-validator');

// Validation middleware
const validateTaskId = [
  param('id').isUUID().withMessage('Invalid task ID format')
];

const validateTaskData = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('entity_type').isIn(['project', 'contract', 'report', 'gate_meeting', 'change_order']).withMessage('Invalid entity type'),
  body('entity_id').isUUID().withMessage('Valid entity ID is required'),
  body('assigned_to').optional().isUUID().withMessage('Invalid assigned user ID'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['Open', 'In Progress', 'Completed', 'Cancelled', 'On Hold']).withMessage('Invalid status'),
  body('due_date').optional().isISO8601().withMessage('Invalid due date'),
  body('estimated_hours').optional().isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),
  body('actual_hours').optional().isFloat({ min: 0 }).withMessage('Actual hours must be a positive number'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('dependencies').optional().isArray().withMessage('Dependencies must be an array'),
  body('dependencies.*').optional().isUUID().withMessage('Each dependency must be a valid UUID')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['Open', 'In Progress', 'Completed', 'Cancelled', 'On Hold']).withMessage('Invalid status filter'),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority filter'),
  query('entity_type').optional().isIn(['project', 'contract', 'report', 'gate_meeting', 'change_order']).withMessage('Invalid entity type filter'),
  query('entity_id').optional().isUUID().withMessage('Invalid entity ID filter'),
  query('assigned_to').optional().isUUID().withMessage('Invalid assigned user ID filter'),
  query('due_date_from').optional().isISO8601().withMessage('Invalid due_date_from format'),
  query('due_date_to').optional().isISO8601().withMessage('Invalid due_date_to format'),
  query('overdue').optional().isBoolean().withMessage('Overdue must be a boolean'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
];

// Routes

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with filtering and pagination
 * @access  Private
 */
router.get('/', 
  authenticateToken, 
  validateQueryParams,
  tasksController.getAllTasks
);

/**
 * @route   GET /api/tasks/statistics
 * @desc    Get task statistics
 * @access  Private
 */
router.get('/statistics', 
  authenticateToken,
  tasksController.getTaskStatistics
);

/**
 * @route   GET /api/tasks/my-tasks
 * @desc    Get tasks assigned to current user
 * @access  Private
 */
router.get('/my-tasks', 
  authenticateToken,
  validateQueryParams,
  tasksController.getMyTasks
);

/**
 * @route   GET /api/tasks/overdue
 * @desc    Get overdue tasks
 * @access  Private
 */
router.get('/overdue', 
  authenticateToken,
  validateQueryParams,
  tasksController.getOverdueTasks
);

/**
 * @route   GET /api/tasks/upcoming
 * @desc    Get upcoming tasks (due within specified days)
 * @access  Private
 */
router.get('/upcoming', 
  authenticateToken,
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
  ],
  tasksController.getUpcomingTasks
);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken, 
  validateTaskId,
  tasksController.getTaskById
);

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @access  Private
 */
router.post('/', 
  authenticateToken, 
  validateTaskData,
  tasksController.createTask
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private
 */
router.put('/:id', 
  authenticateToken, 
  validateTaskId,
  validateTaskData,
  tasksController.updateTask
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:id', 
  authenticateToken, 
  validateTaskId,
  requireRole(['admin', 'project_manager']),
  tasksController.deleteTask
);

/**
 * @route   POST /api/tasks/:id/assign
 * @desc    Assign task to user
 * @access  Private
 */
router.post('/:id/assign', 
  authenticateToken, 
  validateTaskId,
  [
    body('assigned_to').isUUID().withMessage('Valid user ID is required'),
    body('assignment_notes').optional().isLength({ max: 500 }).withMessage('Assignment notes too long')
  ],
  tasksController.assignTask
);

/**
 * @route   POST /api/tasks/:id/unassign
 * @desc    Unassign task from user
 * @access  Private
 */
router.post('/:id/unassign', 
  authenticateToken, 
  validateTaskId,
  [
    body('unassignment_reason').optional().isLength({ max: 500 }).withMessage('Unassignment reason too long')
  ],
  tasksController.unassignTask
);

/**
 * @route   POST /api/tasks/:id/start
 * @desc    Start working on task
 * @access  Private
 */
router.post('/:id/start', 
  authenticateToken, 
  validateTaskId,
  tasksController.startTask
);

/**
 * @route   POST /api/tasks/:id/complete
 * @desc    Mark task as completed
 * @access  Private
 */
router.post('/:id/complete', 
  authenticateToken, 
  validateTaskId,
  [
    body('completion_notes').optional().isLength({ max: 1000 }).withMessage('Completion notes too long'),
    body('actual_hours').optional().isFloat({ min: 0 }).withMessage('Actual hours must be a positive number')
  ],
  tasksController.completeTask
);

/**
 * @route   POST /api/tasks/:id/reopen
 * @desc    Reopen completed task
 * @access  Private
 */
router.post('/:id/reopen', 
  authenticateToken, 
  validateTaskId,
  [
    body('reopen_reason').notEmpty().withMessage('Reopen reason is required'),
    body('reopen_notes').optional().isLength({ max: 500 }).withMessage('Reopen notes too long')
  ],
  tasksController.reopenTask
);

/**
 * @route   POST /api/tasks/:id/cancel
 * @desc    Cancel task
 * @access  Private
 */
router.post('/:id/cancel', 
  authenticateToken, 
  validateTaskId,
  [
    body('cancellation_reason').notEmpty().withMessage('Cancellation reason is required'),
    body('cancellation_notes').optional().isLength({ max: 500 }).withMessage('Cancellation notes too long')
  ],
  tasksController.cancelTask
);

/**
 * @route   POST /api/tasks/:id/hold
 * @desc    Put task on hold
 * @access  Private
 */
router.post('/:id/hold', 
  authenticateToken, 
  validateTaskId,
  [
    body('hold_reason').notEmpty().withMessage('Hold reason is required'),
    body('hold_notes').optional().isLength({ max: 500 }).withMessage('Hold notes too long')
  ],
  tasksController.holdTask
);

/**
 * @route   POST /api/tasks/:id/resume
 * @desc    Resume task from hold
 * @access  Private
 */
router.post('/:id/resume', 
  authenticateToken, 
  validateTaskId,
  [
    body('resume_notes').optional().isLength({ max: 500 }).withMessage('Resume notes too long')
  ],
  tasksController.resumeTask
);

/**
 * @route   GET /api/tasks/:id/dependencies
 * @desc    Get task dependencies
 * @access  Private
 */
router.get('/:id/dependencies', 
  authenticateToken, 
  validateTaskId,
  tasksController.getTaskDependencies
);

/**
 * @route   POST /api/tasks/:id/dependencies
 * @desc    Add task dependency
 * @access  Private
 */
router.post('/:id/dependencies', 
  authenticateToken, 
  validateTaskId,
  [
    body('depends_on_task_id').isUUID().withMessage('Valid dependency task ID is required'),
    body('dependency_type').optional().isIn(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']).withMessage('Invalid dependency type')
  ],
  tasksController.addTaskDependency
);

/**
 * @route   DELETE /api/tasks/:id/dependencies/:dependencyId
 * @desc    Remove task dependency
 * @access  Private
 */
router.delete('/:id/dependencies/:dependencyId', 
  authenticateToken, 
  validateTaskId,
  param('dependencyId').isUUID().withMessage('Invalid dependency ID format'),
  tasksController.removeTaskDependency
);

/**
 * @route   GET /api/tasks/:id/comments
 * @desc    Get task comments
 * @access  Private
 */
router.get('/:id/comments', 
  authenticateToken, 
  validateTaskId,
  tasksController.getTaskComments
);

/**
 * @route   POST /api/tasks/:id/comments
 * @desc    Add task comment
 * @access  Private
 */
router.post('/:id/comments', 
  authenticateToken, 
  validateTaskId,
  [
    body('comment').notEmpty().withMessage('Comment is required'),
    body('comment').isLength({ max: 2000 }).withMessage('Comment too long')
  ],
  tasksController.addTaskComment
);

/**
 * @route   PUT /api/tasks/:id/comments/:commentId
 * @desc    Update task comment
 * @access  Private
 */
router.put('/:id/comments/:commentId', 
  authenticateToken, 
  validateTaskId,
  param('commentId').isUUID().withMessage('Invalid comment ID format'),
  [
    body('comment').notEmpty().withMessage('Comment is required'),
    body('comment').isLength({ max: 2000 }).withMessage('Comment too long')
  ],
  tasksController.updateTaskComment
);

/**
 * @route   DELETE /api/tasks/:id/comments/:commentId
 * @desc    Delete task comment
 * @access  Private
 */
router.delete('/:id/comments/:commentId', 
  authenticateToken, 
  validateTaskId,
  param('commentId').isUUID().withMessage('Invalid comment ID format'),
  tasksController.deleteTaskComment
);

/**
 * @route   GET /api/tasks/:id/time-logs
 * @desc    Get task time logs
 * @access  Private
 */
router.get('/:id/time-logs', 
  authenticateToken, 
  validateTaskId,
  tasksController.getTaskTimeLogs
);

/**
 * @route   POST /api/tasks/:id/time-logs
 * @desc    Add task time log
 * @access  Private
 */
router.post('/:id/time-logs', 
  authenticateToken, 
  validateTaskId,
  [
    body('hours').isFloat({ min: 0.1 }).withMessage('Hours must be at least 0.1'),
    body('description').notEmpty().withMessage('Time log description is required'),
    body('log_date').optional().isISO8601().withMessage('Invalid log date')
  ],
  tasksController.addTaskTimeLog
);

/**
 * @route   GET /api/tasks/export
 * @desc    Export tasks to CSV
 * @access  Private
 */
router.get('/export', 
  authenticateToken,
  validateQueryParams,
  tasksController.exportTasks
);

module.exports = router;

