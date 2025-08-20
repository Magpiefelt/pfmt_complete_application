const { body, param, query, validationResult } = require('express-validator');
const { formatValidationErrors } = require('../utils/validation');

/**
 * Middleware to handle validation errors with consistent formatting (P1-6)
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Convert express-validator errors to our standard format
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      code: 'VALIDATION_ERROR',
      value: error.value
    }));
    
    const response = formatValidationErrors(formattedErrors);
    return res.status(400).json(response);
  }
  next();
};

/**
 * Create a validation middleware for UUID parameters
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} Express middleware
 */
const validateUUIDParam = (paramName = 'id') => {
  return [
    param(paramName).isUUID().withMessage(`${paramName} must be a valid UUID`),
    handleValidationErrors
  ];
};

/**
 * Validation rules for project version creation
 */
const validateCreateVersion = [
  param('projectId').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
  body('versionNumber').isInt({ min: 1 }).withMessage('Version number must be a positive integer'),
  body('dataSnapshot').isObject().withMessage('Data snapshot must be an object'),
  body('changeSummary').optional().isString().isLength({ max: 1000 }).withMessage('Change summary must be a string with max 1000 characters'),
  handleValidationErrors
];

/**
 * Validation rules for version submission
 */
const validateSubmitVersion = [
  param('versionId').isInt({ min: 1 }).withMessage('Version ID must be a positive integer'),
  handleValidationErrors
];

/**
 * Validation rules for version approval
 */
const validateApproveVersion = [
  param('versionId').isInt({ min: 1 }).withMessage('Version ID must be a positive integer'),
  body('comments').optional().isString().isLength({ max: 1000 }).withMessage('Comments must be a string with max 1000 characters'),
  handleValidationErrors
];

/**
 * Validation rules for version rejection
 */
const validateRejectVersion = [
  param('versionId').isInt({ min: 1 }).withMessage('Version ID must be a positive integer'),
  body('reason').isString().isLength({ min: 1, max: 1000 }).withMessage('Rejection reason is required and must be max 1000 characters'),
  body('comments').optional().isString().isLength({ max: 1000 }).withMessage('Comments must be a string with max 1000 characters'),
  handleValidationErrors
];

/**
 * Validation rules for version comparison
 */
const validateCompareVersions = [
  param('projectId').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
  query('version1').isInt({ min: 1 }).withMessage('Version 1 ID must be a positive integer'),
  query('version2').isInt({ min: 1 }).withMessage('Version 2 ID must be a positive integer'),
  handleValidationErrors
];

/**
 * Validation rules for calendar event creation
 */
const validateCreateCalendarEvent = [
  param('projectId').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be max 200 characters'),
  body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must be max 1000 characters'),
  body('event_date').isISO8601().withMessage('Event date must be a valid ISO 8601 date'),
  body('event_type').isIn(['gate_meeting', 'milestone', 'deadline', 'review']).withMessage('Event type must be one of: gate_meeting, milestone, deadline, review'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Priority must be one of: low, medium, high, critical'),
  handleValidationErrors
];

/**
 * Validation rules for meeting agenda creation
 */
const validateCreateMeetingAgenda = [
  param('gateMeetingId').isInt({ min: 1 }).withMessage('Gate meeting ID must be a positive integer'),
  body('agenda_items').isArray({ min: 1 }).withMessage('Agenda items must be a non-empty array'),
  body('agenda_items.*.title').isString().isLength({ min: 1, max: 200 }).withMessage('Agenda item title is required and must be max 200 characters'),
  body('agenda_items.*.description').optional().isString().isLength({ max: 500 }).withMessage('Agenda item description must be max 500 characters'),
  body('agenda_items.*.duration_minutes').optional().isInt({ min: 1, max: 480 }).withMessage('Duration must be between 1 and 480 minutes'),
  body('agenda_items.*.presenter').optional().isString().isLength({ max: 100 }).withMessage('Presenter name must be max 100 characters'),
  handleValidationErrors
];

/**
 * Validation rules for workflow state update
 */
const validateUpdateWorkflowState = [
  param('projectId').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
  body('current_phase').isString().isLength({ min: 1, max: 50 }).withMessage('Current phase is required and must be max 50 characters'),
  body('phase_status').isIn(['not_started', 'in_progress', 'completed', 'blocked']).withMessage('Phase status must be one of: not_started, in_progress, completed, blocked'),
  body('completion_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Completion percentage must be between 0 and 100'),
  body('next_milestone_date').optional().isISO8601().withMessage('Next milestone date must be a valid ISO 8601 date'),
  body('blockers').optional().isArray().withMessage('Blockers must be an array'),
  body('blockers.*.description').optional().isString().isLength({ max: 500 }).withMessage('Blocker description must be max 500 characters'),
  body('blockers.*.severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Blocker severity must be one of: low, medium, high, critical'),
  handleValidationErrors
];

/**
 * Validation rules for notification actions
 */
const validateNotificationAction = [
  param('notificationId').isInt({ min: 1 }).withMessage('Notification ID must be a positive integer'),
  handleValidationErrors
];

/**
 * Common parameter validations
 */
const validateProjectId = [
  param('projectId').isInt({ min: 1 }).withMessage('Project ID must be a positive integer'),
  handleValidationErrors
];

const validateVersionId = [
  param('versionId').isInt({ min: 1 }).withMessage('Version ID must be a positive integer'),
  handleValidationErrors
];

const validateGateMeetingId = [
  param('gateMeetingId').isInt({ min: 1 }).withMessage('Gate meeting ID must be a positive integer'),
  handleValidationErrors
];

// HP-4: Uniform Request & UUID Validation
const { validate: validateUuid } = require('uuid');

const validateUUID = (paramName) => (req, res, next) => {
  const v = req.params[paramName];
  if (!validateUuid(v)) return res.status(400).json({ success:false, code:'INVALID_UUID', fieldErrors:[{ field:paramName, message:'invalid uuid' }] });
  next();
};

const validateUUIDInBody = (field) => (req, res, next) => {
  const v = req.body[field];
  if (v && !validateUuid(v)) return res.status(400).json({ success:false, code:'INVALID_UUID', fieldErrors:[{ field, message:'invalid uuid' }] });
  next();
};

const validatePagination = (max = 100) => (req, res, next) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 25);
  if (page < 1 || limit < 1 || limit > max) {
    return res.status(422).json({ success:false, code:'INVALID_PAGINATION', fieldErrors:[
      { field:'page', message:'>=1' }, { field:'limit', message:`1..${max}` }
    ]});
  }
  next();
};

module.exports = {
  handleValidationErrors,
  validateUUIDParam,
  validateCreateVersion,
  validateSubmitVersion,
  validateApproveVersion,
  validateRejectVersion,
  validateCompareVersions,
  validateCreateCalendarEvent,
  validateCreateMeetingAgenda,
  validateUpdateWorkflowState,
  validateNotificationAction,
  validateProjectId,
  validateVersionId,
  validateGateMeetingId,
  // HP-4: New validation functions
  validateUUID,
  validateUUIDInBody,
  validatePagination
};

