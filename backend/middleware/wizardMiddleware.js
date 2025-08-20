const redis = require('redis');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Initialize cache (fallback to in-memory if Redis not available)
let cache;
let isRedisAvailable = false;

const initializeCache = async () => {
  try {
    if (process.env.REDIS_URL) {
      cache = redis.createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });
      
      await cache.connect();
      isRedisAvailable = true;
      logger.info('Redis cache initialized successfully');
    } else {
      // Fallback to in-memory cache
      cache = new NodeCache({ 
        stdTTL: 600, // 10 minutes default TTL
        checkperiod: 120, // Check for expired keys every 2 minutes
        useClones: false
      });
      logger.info('In-memory cache initialized (Redis not available)');
    }
  } catch (error) {
    logger.warn('Failed to initialize Redis, falling back to in-memory cache', { error: error.message });
    cache = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false });
  }
};

// Cache utility functions
const cacheUtils = {
  async get(key) {
    try {
      if (isRedisAvailable) {
        const value = await cache.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return cache.get(key) || null;
      }
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  },

  async set(key, value, ttl = 600) {
    try {
      if (isRedisAvailable) {
        await cache.setEx(key, ttl, JSON.stringify(value));
      } else {
        cache.set(key, value, ttl);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  },

  async del(key) {
    try {
      if (isRedisAvailable) {
        await cache.del(key);
      } else {
        cache.del(key);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  },

  async flush() {
    try {
      if (isRedisAvailable) {
        await cache.flushAll();
      } else {
        cache.flushAll();
      }
      return true;
    } catch (error) {
      logger.error('Cache flush error', { error: error.message });
      return false;
    }
  }
};

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
  const start = process.hrtime.bigint();
  const correlationId = req.correlationId || uuidv4();
  req.correlationId = correlationId;
  
  // Memory usage before request
  const memBefore = process.memoryUsage();
  
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    const memAfter = process.memoryUsage();
    
    // Log performance metrics
    logger.info('Request performance', {
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      memoryUsage: {
        heapUsedDelta: memAfter.heapUsed - memBefore.heapUsed,
        heapTotal: memAfter.heapTotal,
        external: memAfter.external
      }
    });
    
    // Set performance headers
    res.set('X-Response-Time', `${duration}ms`);
    res.set('X-Correlation-ID', correlationId);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Request validation middleware
const requestValidation = {
  // Validate UUID parameters
  validateUUID: (paramName) => (req, res, next) => {
    const value = req.params[paramName];
    if (value && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
        correlationId: req.correlationId
      });
    }
    next();
  },

  // Validate session ID format
  validateSessionId: (req, res, next) => {
    const { sessionId } = req.params;
    if (sessionId && (!sessionId.startsWith('wizard_') || sessionId.length < 20)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
        correlationId: req.correlationId
      });
    }
    next();
  },

  // Validate step ID
  validateStepId: (req, res, next) => {
    const { stepId } = req.params;
    const stepNumber = parseInt(stepId);
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step ID (must be 1-4)',
        correlationId: req.correlationId
      });
    }
    req.stepNumber = stepNumber;
    next();
  },

  // Validate request body size
  validateBodySize: (maxSize = 1024 * 1024) => (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request body too large',
        correlationId: req.correlationId
      });
    }
    next();
  }
};

// Caching middleware for frequently accessed data
const cacheMiddleware = {
  // Cache vendors list
  cacheVendors: async (req, res, next) => {
    const cacheKey = `vendors:${JSON.stringify(req.query)}`;
    
    try {
      const cachedData = await cacheUtils.get(cacheKey);
      if (cachedData) {
        logger.info('Vendors served from cache', { 
          correlationId: req.correlationId,
          cacheKey 
        });
        return res.json({
          success: true,
          vendors: cachedData.vendors,
          count: cachedData.count,
          cached: true,
          correlationId: req.correlationId
        });
      }
    } catch (error) {
      logger.warn('Cache retrieval failed, proceeding to database', { 
        correlationId: req.correlationId,
        error: error.message 
      });
    }
    
    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache successful responses
      if (data.success && data.vendors) {
        cacheUtils.set(cacheKey, { 
          vendors: data.vendors, 
          count: data.count 
        }, 300); // Cache for 5 minutes
      }
      originalJson.call(this, data);
    };
    
    next();
  },

  // Cache templates
  cacheTemplates: async (req, res, next) => {
    const cacheKey = 'templates:active';
    
    try {
      const cachedData = await cacheUtils.get(cacheKey);
      if (cachedData) {
        logger.info('Templates served from cache', { 
          correlationId: req.correlationId 
        });
        return res.json({
          success: true,
          templates: cachedData,
          cached: true,
          correlationId: req.correlationId
        });
      }
    } catch (error) {
      logger.warn('Cache retrieval failed for templates', { 
        correlationId: req.correlationId,
        error: error.message 
      });
    }
    
    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache successful responses
      if (data.success && data.templates) {
        cacheUtils.set(cacheKey, data.templates, 1800); // Cache for 30 minutes
      }
      originalJson.call(this, data);
    };
    
    next();
  }
};

// Session management utilities
const sessionUtils = {
  // Generate session ID
  generateSessionId: (userId) => {
    return `wizard_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Validate session ownership
  validateSessionOwnership: (sessionId, userId) => {
    return sessionId.includes(userId);
  },

  // Extract user ID from session ID
  extractUserIdFromSession: (sessionId) => {
    const parts = sessionId.split('_');
    return parts.length >= 2 ? parts[1] : null;
  },

  // Check session expiry
  isSessionExpired: (sessionCreatedAt, maxAgeHours = 24) => {
    const now = new Date();
    const created = new Date(sessionCreatedAt);
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours > maxAgeHours;
  }
};

// Database connection pool monitoring
const dbMonitoring = {
  // Monitor database connection health
  checkDbHealth: async () => {
    try {
      const { query } = require('../database/db');
      const start = Date.now();
      await query('SELECT 1');
      const duration = Date.now() - start;
      
      return {
        healthy: true,
        responseTime: duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database health check failed', { error: error.message });
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  // Get database pool statistics
  getPoolStats: () => {
    try {
      const { pool } = require('../database/db');
      return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      };
    } catch (error) {
      logger.error('Failed to get pool stats', { error: error.message });
      return null;
    }
  }
};

// Error categorization and handling
const errorHandling = {
  // Categorize errors for appropriate response
  categorizeError: (error) => {
    if (error.message.includes('Validation failed')) {
      return { type: 'validation', statusCode: 400 };
    }
    if (error.message.includes('Authentication required')) {
      return { type: 'authentication', statusCode: 401 };
    }
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return { type: 'authorization', statusCode: 403 };
    }
    if (error.message.includes('not found')) {
      return { type: 'not_found', statusCode: 404 };
    }
    if (error.message.includes('duplicate') || error.message.includes('already exists')) {
      return { type: 'conflict', statusCode: 409 };
    }
    if (error.message.includes('too large') || error.message.includes('limit exceeded')) {
      return { type: 'payload_too_large', statusCode: 413 };
    }
    if (error.message.includes('rate limit')) {
      return { type: 'rate_limit', statusCode: 429 };
    }
    
    // Default to server error
    return { type: 'server_error', statusCode: 500 };
  },

  // Create standardized error response
  createErrorResponse: (error, correlationId) => {
    const category = errorHandling.categorizeError(error);
    
    const response = {
      success: false,
      error: {
        type: category.type,
        message: category.type === 'server_error' ? 'Internal server error' : error.message,
        correlationId
      }
    };

    // Add details for non-server errors
    if (category.type !== 'server_error') {
      response.error.details = error.message;
    }

    return { response, statusCode: category.statusCode };
  }
};

// Metrics collection
const metricsCollector = {
  // Collect request metrics
  collectRequestMetrics: (req, res, duration) => {
    const metrics = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      correlationId: req.correlationId
    };

    // Store metrics (could be sent to monitoring service)
    logger.info('Request metrics', metrics);
    
    return metrics;
  },

  // Collect error metrics
  collectErrorMetrics: (error, req) => {
    const metrics = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      correlationId: req.correlationId
    };

    logger.error('Error metrics', metrics);
    
    return metrics;
  }
};

// Initialize cache on module load
initializeCache().catch(error => {
  logger.error('Failed to initialize cache', { error: error.message });
});

// HP-2: Server-Side Wizard Step Gating
const { getProgressForProject } = require('../services/wizardProgress');
const { query } = require('../config/database-enhanced');

async function resolveProjectIdFromSession(sessionId) {
  // implement actual lookup based on your schema
  const r = await query('SELECT project_id FROM project_wizard_sessions WHERE session_id = $1 OR id = $1 ORDER BY updated_at DESC LIMIT 1', [sessionId]);
  return r.rows[0]?.project_id;
}

function requireWizardStep(stepOrResolver){
  return async (req, res, next) => {
    try {
      const step = typeof stepOrResolver === 'function' ? Number(stepOrResolver(req)) : Number(stepOrResolver);
      const sessionId = req.params.sessionId || req.body.sessionId;
      if (!sessionId) return res.status(400).json({ success:false, code:'MISSING_SESSION_ID' });

      const projectId = await resolveProjectIdFromSession(sessionId);
      if (!projectId) return res.status(404).json({ success:false, code:'SESSION_OR_PROJECT_NOT_FOUND' });

      const { nextAllowed } = await getProgressForProject(projectId);
      if (step > nextAllowed) {
        return res.status(409).json({ success:false, code:'STEP_BLOCKED', nextAllowed });
      }
      next();
    } catch (err) {
      req.log?.error?.({ err }, 'Wizard gating error');
      return res.status(500).json({ success:false, code:'WIZARD_GATING_FAILED' });
    }
  };
}

module.exports = {
  initializeCache,
  cacheUtils,
  performanceMonitoring,
  requestValidation,
  cacheMiddleware,
  sessionUtils,
  dbMonitoring,
  errorHandling,
  metricsCollector,
  logger,
  requireWizardStep
};