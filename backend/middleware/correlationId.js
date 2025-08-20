const { v4: uuidv4 } = require('uuid');

/**
 * Correlation ID middleware for request tracing
 * Adds x-correlation-id to all requests for better observability
 */

/**
 * Generate or extract correlation ID from request
 */
const correlationIdMiddleware = (req, res, next) => {
    // Check if correlation ID already exists in headers
    let correlationId = req.headers['x-correlation-id'];
    
    // If no correlation ID provided, generate a new one
    if (!correlationId) {
        correlationId = uuidv4();
    }
    
    // Store correlation ID in request and response locals
    req.correlationId = correlationId;
    res.locals.correlationId = correlationId;
    
    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);
    
    // Add correlation ID to console logs for this request
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Override console methods to include correlation ID
    req.logWithCorrelation = {
        log: (...args) => originalConsoleLog(`[${correlationId}]`, ...args),
        error: (...args) => originalConsoleError(`[${correlationId}]`, ...args),
        warn: (...args) => originalConsoleWarn(`[${correlationId}]`, ...args)
    };
    
    next();
};

/**
 * Enhanced request logger with correlation ID
 */
const correlationRequestLogger = (req, res, next) => {
    const start = Date.now();
    const correlationId = req.correlationId;
    
    // Log request start
    console.log(`[${correlationId}] ${req.method} ${req.path} - Request started`);
    console.log(`[${correlationId}] Headers:`, {
        'user-agent': req.headers['user-agent'],
        'x-user-id': req.headers['x-user-id'],
        'x-user-role': req.headers['x-user-role'],
        'content-type': req.headers['content-type']
    });
    
    // Log request body for non-GET requests (excluding sensitive data)
    if (req.method !== 'GET' && req.body) {
        const sanitizedBody = { ...req.body };
        // Remove sensitive fields
        delete sanitizedBody.password;
        delete sanitizedBody.password_hash;
        delete sanitizedBody.token;
        
        console.log(`[${correlationId}] Request body:`, sanitizedBody);
    }
    
    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - start;
        
        // Log response
        console.log(`[${correlationId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        
        // Log response data (excluding sensitive information)
        if (data && typeof data === 'object') {
            const sanitizedData = { ...data };
            // Remove sensitive fields from response logging
            if (sanitizedData.password) delete sanitizedData.password;
            if (sanitizedData.token && typeof sanitizedData.token === 'string') {
                sanitizedData.token = sanitizedData.token.substring(0, 10) + '...';
            }
            
            console.log(`[${correlationId}] Response:`, sanitizedData);
        }
        
        return originalJson.call(this, data);
    };
    
    // Override res.send to log response
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - start;
        console.log(`[${correlationId}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        return originalSend.call(this, data);
    };
    
    next();
};

/**
 * Error logger with correlation ID
 */
const correlationErrorLogger = (error, req, res, next) => {
    const correlationId = req.correlationId || 'unknown';
    
    console.error(`[${correlationId}] Error in ${req.method} ${req.path}:`, {
        message: error.message,
        stack: error.stack,
        status: error.status || 500,
        user: req.user ? { id: req.user.id, role: req.user.role } : null
    });
    
    next(error);
};

/**
 * Database query logger with correlation ID
 */
const logDatabaseQuery = (correlationId, query, params, duration) => {
    console.log(`[${correlationId}] DB Query (${duration}ms):`, {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        params: params ? params.slice(0, 5) : null, // Log first 5 params only
        duration
    });
};

/**
 * Performance metrics logger
 */
const logPerformanceMetrics = (correlationId, metrics) => {
    console.log(`[${correlationId}] Performance:`, {
        requestDuration: metrics.requestDuration,
        dbQueries: metrics.dbQueries,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    correlationIdMiddleware,
    correlationRequestLogger,
    correlationErrorLogger,
    logDatabaseQuery,
    logPerformanceMetrics
};

