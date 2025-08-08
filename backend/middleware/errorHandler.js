/**
 * Standardized Error Handling Middleware
 * Normalizes database errors and provides consistent HTTP status codes
 */

/**
 * Maps PostgreSQL error codes to HTTP status codes and user-friendly messages
 */
const postgresErrorMap = {
    // Constraint violations
    '23505': { status: 409, message: 'Resource already exists' }, // unique_violation
    '23503': { status: 400, message: 'Referenced resource does not exist' }, // foreign_key_violation
    '23502': { status: 400, message: 'Required field is missing' }, // not_null_violation
    '23514': { status: 400, message: 'Invalid data format or value' }, // check_violation
    
    // Data type errors
    '22P02': { status: 400, message: 'Invalid data format' }, // invalid_text_representation
    '22003': { status: 400, message: 'Numeric value out of range' }, // numeric_value_out_of_range
    '22007': { status: 400, message: 'Invalid datetime format' }, // invalid_datetime_format
    '22012': { status: 400, message: 'Division by zero' }, // division_by_zero
    
    // Connection and system errors
    '08000': { status: 503, message: 'Database connection error' }, // connection_exception
    '08003': { status: 503, message: 'Connection does not exist' }, // connection_does_not_exist
    '08006': { status: 503, message: 'Connection failure' }, // connection_failure
    
    // Insufficient resources
    '53000': { status: 503, message: 'Insufficient resources' }, // insufficient_resources
    '53100': { status: 503, message: 'Disk full' }, // disk_full
    '53200': { status: 503, message: 'Out of memory' }, // out_of_memory
    '53300': { status: 503, message: 'Too many connections' }, // too_many_connections
    
    // Syntax and access errors
    '42601': { status: 500, message: 'Database query error' }, // syntax_error
    '42501': { status: 403, message: 'Insufficient privileges' }, // insufficient_privilege
    '42P01': { status: 500, message: 'Database table not found' }, // undefined_table
    '42703': { status: 500, message: 'Database column not found' }, // undefined_column
};

/**
 * Extracts meaningful information from PostgreSQL errors
 * @param {Error} error - PostgreSQL error object
 * @returns {Object} Normalized error information
 */
const normalizePostgresError = (error) => {
    const code = error.code;
    const mapping = postgresErrorMap[code];
    
    if (mapping) {
        return {
            status: mapping.status,
            message: mapping.message,
            code: code,
            detail: error.detail || null,
            constraint: error.constraint || null,
            table: error.table || null,
            column: error.column || null
        };
    }
    
    // Default for unmapped PostgreSQL errors
    return {
        status: 500,
        message: 'Database error occurred',
        code: code || 'UNKNOWN',
        detail: error.message || 'Unknown database error'
    };
};

/**
 * Handles UUID validation errors
 * @param {Error} error - UUID validation error
 * @returns {Object} Normalized error response
 */
const handleUUIDError = (error) => {
    return {
        status: 400,
        message: error.message || 'Invalid UUID format',
        field: error.field || null,
        value: error.value || null
    };
};

/**
 * Handles application-specific business logic errors
 * @param {Error} error - Application error
 * @returns {Object} Normalized error response
 */
const handleApplicationError = (error) => {
    return {
        status: error.status || 500,
        message: error.message || 'Application error occurred',
        code: error.code || 'APP_ERROR',
        details: error.details || null
    };
};

/**
 * Main error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    // Log the error for debugging
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        userId: req.headers['x-user-id']
    });
    
    let errorResponse;
    
    // Handle different types of errors
    if (err.code && typeof err.code === 'string' && err.code.match(/^[0-9A-Z]{5}$/)) {
        // PostgreSQL error
        errorResponse = normalizePostgresError(err);
    } else if (err.message && err.message.includes('UUID')) {
        // UUID validation error
        errorResponse = handleUUIDError(err);
    } else if (err.status) {
        // Application error with status
        errorResponse = handleApplicationError(err);
    } else if (err.name === 'ValidationError') {
        // Validation error
        errorResponse = {
            status: 400,
            message: 'Validation failed',
            details: err.message
        };
    } else if (err.name === 'CastError') {
        // Type casting error
        errorResponse = {
            status: 400,
            message: 'Invalid data format',
            field: err.path,
            value: err.value
        };
    } else {
        // Generic error
        errorResponse = {
            status: 500,
            message: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : err.message || 'Unknown error occurred'
        };
    }
    
    // Send error response
    res.status(errorResponse.status).json({
        error: {
            message: errorResponse.message,
            status: errorResponse.status,
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV !== 'production' && {
                code: errorResponse.code,
                detail: errorResponse.detail,
                constraint: errorResponse.constraint,
                table: errorResponse.table,
                column: errorResponse.column,
                field: errorResponse.field,
                value: errorResponse.value,
                details: errorResponse.details
            })
        }
    });
};

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that catches async errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Creates a standardized error object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Error} Standardized error object
 */
const createError = (message, status = 500, code = null, details = null) => {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    error.details = details;
    return error;
};

module.exports = {
    errorHandler,
    asyncHandler,
    createError,
    normalizePostgresError,
    handleUUIDError,
    handleApplicationError
};

