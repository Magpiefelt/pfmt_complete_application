const { body, param, query, validationResult } = require('express-validator');
const { isValidUUID } = require('./uuidValidation');

/**
 * Comprehensive request validation middleware
 * Provides strict validation for all API endpoints
 */

/**
 * Handle validation errors with consistent format
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Request validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array().map(error => ({
                    field: error.path,
                    message: error.msg,
                    value: error.value,
                    location: error.location
                }))
            }
        });
    }
    next();
};

/**
 * Project creation validation
 */
const validateProjectCreation = [
    body('project_name')
        .isString()
        .isLength({ min: 1, max: 255 })
        .withMessage('Project name is required and must be 1-255 characters'),
    body('project_description')
        .optional()
        .isString()
        .isLength({ max: 2000 })
        .withMessage('Project description must be max 2000 characters'),
    body('project_category')
        .optional()
        .isIn(['construction', 'renovation', 'maintenance', 'planning', 'other'])
        .withMessage('Invalid project category'),
    body('project_type')
        .optional()
        .isIn(['new_construction', 'renovation', 'addition', 'infrastructure', 'other'])
        .withMessage('Invalid project type'),
    body('delivery_type')
        .optional()
        .isIn(['design_bid_build', 'design_build', 'construction_management', 'other'])
        .withMessage('Invalid delivery type'),
    body('budget_total')
        .optional()
        .isNumeric()
        .custom(value => value >= 0)
        .withMessage('Budget must be a non-negative number'),
    body('approval_year')
        .optional()
        .isString()
        .matches(/^\d{4}$/)
        .withMessage('Approval year must be a 4-digit year'),
    handleValidationErrors
];

/**
 * Project update validation
 */
const validateProjectUpdate = [
    param('id')
        .custom(isValidUUID)
        .withMessage('Project ID must be a valid UUID'),
    body('project_name')
        .optional()
        .isString()
        .isLength({ min: 1, max: 255 })
        .withMessage('Project name must be 1-255 characters'),
    body('project_description')
        .optional()
        .isString()
        .isLength({ max: 2000 })
        .withMessage('Project description must be max 2000 characters'),
    body('project_status')
        .optional()
        .isIn(['planning', 'design', 'procurement', 'construction', 'commissioning', 'complete', 'on_hold', 'cancelled'])
        .withMessage('Invalid project status'),
    body('budget_total')
        .optional()
        .isNumeric()
        .custom(value => value >= 0)
        .withMessage('Budget must be a non-negative number'),
    handleValidationErrors
];

/**
 * Vendor creation validation
 */
const validateVendorCreation = [
    body('name')
        .isString()
        .isLength({ min: 1, max: 255 })
        .withMessage('Vendor name is required and must be 1-255 characters'),
    body('contact_email')
        .optional()
        .isEmail()
        .withMessage('Contact email must be a valid email address'),
    body('contact_phone')
        .optional()
        .isString()
        .matches(/^[\d\s\-\+\(\)\.]+$/)
        .withMessage('Contact phone must contain only valid phone characters'),
    body('website')
        .optional()
        .isURL()
        .withMessage('Website must be a valid URL'),
    body('performance_rating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Performance rating must be between 0 and 5'),
    handleValidationErrors
];

/**
 * User creation validation
 */
const validateUserCreation = [
    body('username')
        .isString()
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email address is required'),
    body('first_name')
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name is required and must be 1-100 characters'),
    body('last_name')
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name is required and must be 1-100 characters'),
    body('role')
        .isIn(['VENDOR', 'ANALYST', 'PMI', 'PM', 'SPM', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN'])
        .withMessage('Invalid user role'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    handleValidationErrors
];

/**
 * Wizard step validation
 */
const validateWizardStep = [
    param('sessionId')
        .isString()
        .matches(/^wizard_[a-f0-9\-]{36}_\d+$/)
        .withMessage('Invalid wizard session ID format'),
    param('stepNumber')
        .isInt({ min: 1, max: 10 })
        .withMessage('Step number must be between 1 and 10'),
    body('data')
        .isObject()
        .withMessage('Step data must be an object'),
    handleValidationErrors
];

/**
 * Gate meeting creation validation
 */
const validateGateMeetingCreation = [
    body('project_id')
        .custom(isValidUUID)
        .withMessage('Project ID must be a valid UUID'),
    body('meeting_type')
        .isIn(['gate_0', 'gate_1', 'gate_2', 'gate_3', 'gate_4', 'gate_5', 'other'])
        .withMessage('Invalid meeting type'),
    body('scheduled_date')
        .isISO8601()
        .withMessage('Scheduled date must be a valid ISO 8601 date'),
    body('title')
        .isString()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title is required and must be 1-200 characters'),
    body('description')
        .optional()
        .isString()
        .isLength({ max: 1000 })
        .withMessage('Description must be max 1000 characters'),
    handleValidationErrors
];

/**
 * Budget update validation
 */
const validateBudgetUpdate = [
    param('projectId')
        .custom(isValidUUID)
        .withMessage('Project ID must be a valid UUID'),
    body('budget_total')
        .optional()
        .isNumeric()
        .custom(value => value >= 0)
        .withMessage('Total budget must be a non-negative number'),
    body('amount_spent')
        .optional()
        .isNumeric()
        .custom(value => value >= 0)
        .withMessage('Amount spent must be a non-negative number'),
    body('budget_items')
        .optional()
        .isArray()
        .withMessage('Budget items must be an array'),
    body('budget_items.*.category')
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Budget item category is required'),
    body('budget_items.*.amount')
        .optional()
        .isNumeric()
        .custom(value => value >= 0)
        .withMessage('Budget item amount must be non-negative'),
    handleValidationErrors
];

/**
 * File upload validation
 */
const validateFileUpload = [
    body('project_id')
        .custom(isValidUUID)
        .withMessage('Project ID must be a valid UUID'),
    body('file_type')
        .isIn(['document', 'image', 'drawing', 'report', 'other'])
        .withMessage('Invalid file type'),
    body('file_category')
        .optional()
        .isString()
        .isLength({ max: 100 })
        .withMessage('File category must be max 100 characters'),
    handleValidationErrors
];

/**
 * Search and pagination validation
 */
const validateSearchAndPagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
        .optional()
        .isString()
        .isLength({ max: 50 })
        .withMessage('Sort field must be max 50 characters'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    query('search')
        .optional()
        .isString()
        .isLength({ max: 200 })
        .withMessage('Search term must be max 200 characters'),
    handleValidationErrors
];

/**
 * Date range validation
 */
const validateDateRange = [
    query('dateFrom')
        .optional()
        .isISO8601()
        .withMessage('Date from must be a valid ISO 8601 date'),
    query('dateTo')
        .optional()
        .isISO8601()
        .withMessage('Date to must be a valid ISO 8601 date'),
    query('dateFrom')
        .optional()
        .custom((value, { req }) => {
            if (value && req.query.dateTo) {
                const fromDate = new Date(value);
                const toDate = new Date(req.query.dateTo);
                if (fromDate > toDate) {
                    throw new Error('Date from must be before date to');
                }
            }
            return true;
        }),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateProjectCreation,
    validateProjectUpdate,
    validateVendorCreation,
    validateUserCreation,
    validateWizardStep,
    validateGateMeetingCreation,
    validateBudgetUpdate,
    validateFileUpload,
    validateSearchAndPagination,
    validateDateRange
};

