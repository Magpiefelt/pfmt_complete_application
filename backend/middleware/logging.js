/**
 * Enhanced Logging Middleware
 * Provides comprehensive request/response logging with performance monitoring
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log levels for different types of messages
 */
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

/**
 * Enhanced logger with multiple output targets
 */
class Logger {
    constructor() {
        this.logToFile = process.env.LOG_TO_FILE === 'true';
        this.logLevel = process.env.LOG_LEVEL || 'INFO';
    }

    /**
     * Format log message with timestamp and context
     */
    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
        return `[${timestamp}] ${level}: ${message} ${contextStr}`;
    }

    /**
     * Write log to file if enabled
     */
    writeToFile(level, message, context) {
        if (!this.logToFile) return;

        const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
        const formattedMessage = this.formatMessage(level, message, context);
        
        fs.appendFile(logFile, formattedMessage + '\n', (err) => {
            if (err) console.error('Failed to write to log file:', err);
        });
    }

    /**
     * Log error messages
     */
    error(message, context = {}) {
        const formattedMessage = this.formatMessage(LOG_LEVELS.ERROR, message, context);
        console.error(formattedMessage);
        this.writeToFile(LOG_LEVELS.ERROR, message, context);
    }

    /**
     * Log warning messages
     */
    warn(message, context = {}) {
        const formattedMessage = this.formatMessage(LOG_LEVELS.WARN, message, context);
        console.warn(formattedMessage);
        this.writeToFile(LOG_LEVELS.WARN, message, context);
    }

    /**
     * Log info messages
     */
    info(message, context = {}) {
        const formattedMessage = this.formatMessage(LOG_LEVELS.INFO, message, context);
        console.log(formattedMessage);
        this.writeToFile(LOG_LEVELS.INFO, message, context);
    }

    /**
     * Log debug messages
     */
    debug(message, context = {}) {
        if (this.logLevel === 'DEBUG') {
            const formattedMessage = this.formatMessage(LOG_LEVELS.DEBUG, message, context);
            console.log(formattedMessage);
            this.writeToFile(LOG_LEVELS.DEBUG, message, context);
        }
    }
}

const logger = new Logger();

/**
 * Request logging middleware with performance monitoring
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    // Add request ID to request object for correlation
    req.requestId = requestId;
    
    // Log incoming request
    logger.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.headers['x-user-id'] || 'anonymous',
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length')
    });

    // Log request body for POST/PUT requests (excluding sensitive data)
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
        const sanitizedBody = sanitizeRequestBody(req.body);
        logger.debug('Request body', {
            requestId,
            body: sanitizedBody
        });
    }

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        
        // Log response
        logger.info('Response sent', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.headers['x-user-id'] || 'anonymous'
        });

        // Log response body for errors or debug mode
        if (res.statusCode >= 400 || logger.logLevel === 'DEBUG') {
            logger.debug('Response body', {
                requestId,
                statusCode: res.statusCode,
                body: data
            });
        }

        // Log slow requests
        if (duration > 1000) {
            logger.warn('Slow request detected', {
                requestId,
                method: req.method,
                url: req.url,
                duration: `${duration}ms`,
                userId: req.headers['x-user-id'] || 'anonymous'
            });
        }

        return originalJson.call(this, data);
    };

    next();
};

/**
 * Database query logging middleware
 */
const queryLogger = (query, params = [], duration = 0) => {
    logger.debug('Database query executed', {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        paramCount: params.length,
        duration: `${duration}ms`
    });

    // Log slow queries
    if (duration > 500) {
        logger.warn('Slow database query detected', {
            query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
            duration: `${duration}ms`
        });
    }
};

/**
 * Audit logging for important actions
 */
const auditLogger = (action, entity, entityId, userId, changes = {}) => {
    logger.info('Audit event', {
        action,
        entity,
        entityId,
        userId,
        changes,
        timestamp: new Date().toISOString()
    });

    // Write to separate audit log file
    const auditLogFile = path.join(logsDir, 'audit.log');
    const auditEntry = {
        timestamp: new Date().toISOString(),
        action,
        entity,
        entityId,
        userId,
        changes
    };

    if (fs.existsSync(logsDir)) {
        fs.appendFile(auditLogFile, JSON.stringify(auditEntry) + '\n', (err) => {
            if (err) logger.error('Failed to write audit log', { error: err.message });
        });
    }
};

/**
 * Security event logging
 */
const securityLogger = (event, details = {}) => {
    logger.warn('Security event', {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });

    // Write to separate security log file
    const securityLogFile = path.join(logsDir, 'security.log');
    const securityEntry = {
        timestamp: new Date().toISOString(),
        event,
        ...details
    };

    if (fs.existsSync(logsDir)) {
        fs.appendFile(securityLogFile, JSON.stringify(securityEntry) + '\n', (err) => {
            if (err) logger.error('Failed to write security log', { error: err.message });
        });
    }
};

/**
 * Generate unique request ID for correlation
 */
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...body };

    Object.keys(sanitized).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        }
    });

    return sanitized;
}

/**
 * Performance monitoring middleware
 */
const performanceMonitor = (req, res, next) => {
    const startTime = process.hrtime();
    const startMemory = process.memoryUsage();

    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
        const endMemory = process.memoryUsage();

        const memoryDelta = {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal
        };

        // Log performance metrics for slow requests or high memory usage
        if (duration > 1000 || Math.abs(memoryDelta.heapUsed) > 10 * 1024 * 1024) { // 10MB
            logger.info('Performance metrics', {
                requestId: req.requestId,
                method: req.method,
                url: req.url,
                duration: `${duration.toFixed(2)}ms`,
                memoryDelta: {
                    rss: `${(memoryDelta.rss / 1024 / 1024).toFixed(2)}MB`,
                    heapUsed: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                    heapTotal: `${(memoryDelta.heapTotal / 1024 / 1024).toFixed(2)}MB`
                }
            });
        }
    });

    next();
};

module.exports = {
    logger,
    requestLogger,
    queryLogger,
    auditLogger,
    securityLogger,
    performanceMonitor,
    LOG_LEVELS
};

