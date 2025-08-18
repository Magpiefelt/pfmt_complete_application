/**
 * Standardized error response utility
 * Provides consistent error formatting across the application
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standard error response format
 */
const createErrorResponse = (message, statusCode = 500, code = null, details = null) => {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Success response format
 */
const createSuccessResponse = (data = null, message = null, meta = null) => {
  const response = {
    success: true
  };

  if (data !== null) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
};

/**
 * Handle database errors
 */
const handleDatabaseError = (error) => {
  console.error('Database error:', error);

  // PostgreSQL specific error codes
  switch (error.code) {
    case '23505': // Unique violation
      return new AppError('Resource already exists', 409, 'DUPLICATE_RESOURCE');
    case '23503': // Foreign key violation
      return new AppError('Referenced resource not found', 400, 'INVALID_REFERENCE');
    case '23502': // Not null violation
      return new AppError('Required field is missing', 400, 'MISSING_REQUIRED_FIELD');
    case '42P01': // Undefined table
      return new AppError('Database configuration error', 500, 'DATABASE_ERROR');
    default:
      return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};

/**
 * Handle validation errors
 */
const handleValidationError = (errors) => {
  const details = errors.map(error => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));

  return new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
};

/**
 * Handle authentication errors
 */
const handleAuthError = (message = 'Authentication failed') => {
  return new AppError(message, 401, 'AUTH_ERROR');
};

/**
 * Handle authorization errors
 */
const handleAuthorizationError = (message = 'Insufficient permissions') => {
  return new AppError(message, 403, 'AUTHORIZATION_ERROR');
};

/**
 * Handle not found errors
 */
const handleNotFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

/**
 * Handle rate limiting errors
 */
const handleRateLimitError = (message = 'Too many requests') => {
  return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
};

/**
 * Global error handler middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    error = handleValidationError(err.errors);
  } else if (err.code && err.code.startsWith('23')) {
    error = handleDatabaseError(err);
  } else if (!err.isOperational) {
    // Programming errors - log and send generic message
    console.error('Programming error:', err);
    error = new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
  }

  // Log error for monitoring
  if (error.statusCode >= 500) {
    console.error('Server error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      user: req.user?.id,
      timestamp: new Date().toISOString()
    });
  }

  // Send error response
  res.status(error.statusCode || 500).json(
    createErrorResponse(
      error.message,
      error.statusCode,
      error.code,
      error.details
    )
  );
};

/**
 * Async error wrapper
 * Catches async errors and passes them to error handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

module.exports = {
  AppError,
  createErrorResponse,
  createSuccessResponse,
  handleDatabaseError,
  handleValidationError,
  handleAuthError,
  handleAuthorizationError,
  handleNotFoundError,
  handleRateLimitError,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler
};

