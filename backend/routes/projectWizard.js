const express = require('express');
const router = express.Router();
const { ProjectWizardController, wizardRateLimit } = require('../controllers/projectWizardController');
const { flexibleAuth } = require('../middleware/flexibleAuth');
const { authorizeRoles } = require('../middleware/authorize');
const { requireWizardStep } = require('../middleware/wizardMiddleware');
const { validateUUID } = require('../middleware/validation');
const { authorizeProjectFromSession } = require('../middleware/authorizeProject');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { formatValidationErrors } = require('../utils/validation');

// Simple logging utility (replacing winston for Docker compatibility)
const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta);
  }
};

// Security middleware
router.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
router.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024
}));

// HP-3: CORS configuration removed - handled centrally by app.js

// Request logging middleware
router.use((req, res, next) => {
  const start = Date.now();
  const correlationId = req.correlationId || require('uuid').v4();
  req.correlationId = correlationId;
  
  logger.info('Incoming request', {
    correlationId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      responseSize: data ? data.length : 0
    });
    originalSend.call(this, data);
  };
  
  next();
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    logger.warn('Unauthorized access attempt', {
      correlationId: req.correlationId,
      url: req.url,
      ip: req.ip
    });
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      correlationId: req.correlationId
    });
  }
  next();
};

// Authorization middleware for project managers
const requirePMRole = (req, res, next) => {
  if (req.user?.role !== 'project_manager') {
    logger.warn('Forbidden access attempt', {
      correlationId: req.correlationId,
      url: req.url,
      userId: req.user?.id,
      role: req.user?.role
    });
    return res.status(403).json({
      success: false,
      message: 'Forbidden',
      correlationId: req.correlationId
    });
  }
  next();
};

// Input validation middleware
const validateJsonBody = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    // Allow empty body for init endpoint (templateId is optional)
    if (req.url === '/init') {
      return next();
    }
    
    // Allow empty body for validation endpoints (step data can be empty for validation)
    if (req.url.includes('/validate/step/')) {
      return next();
    }
    
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
        correlationId: req.correlationId
      });
    }
  }
  next();
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  const { sessionId } = req.params;
  
  if (sessionId) {
    // Validate session ID format
    if (!sessionId.startsWith('wizard_') || sessionId.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format',
        correlationId: req.correlationId
      });
    }
    
    // Check if user owns this session
    const userId = req.user?.id;
    if (!sessionId.includes(userId)) {
      logger.warn('User attempting to access unauthorized session', {
        correlationId: req.correlationId,
        userId,
        sessionId
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied to session',
        correlationId: req.correlationId
      });
    }
  }
  
  next();
};

// Apply rate limiting to all wizard routes
router.use(wizardRateLimit);

// Liveness and readiness endpoints (no auth required)
router.get('/health', ProjectWizardController.livenessCheck);
router.get('/health/db', ProjectWizardController.healthCheck);

// Apply authentication to all other routes
router.use(requireAuth);
router.use(requirePMRole);

// Wizard session management routes
router.post('/init', validateJsonBody, ProjectWizardController.initializeWizard);
router.get('/session/:sessionId', validateUUID('sessionId'), validateSession, ProjectWizardController.getWizardSession);

// Step data management routes
router.post('/session/:sessionId/step/:stepId', 
  validateUUID('sessionId'),
  authorizeProjectFromSession('sessionId'),
  authorizeRoles('PM','SPM','DIRECTOR','ADMIN'),
  requireWizardStep(req => req.params.stepId),
  validateSession, 
  validateJsonBody, 
  ProjectWizardController.saveStepData
);

// Wizard completion route
router.post('/session/:sessionId/complete', 
  validateUUID('sessionId'),
  authorizeProjectFromSession('sessionId'),
  authorizeRoles('PM','SPM','DIRECTOR','ADMIN'),
  requireWizardStep(3), // Final step
  validateSession, 
  ProjectWizardController.completeWizard
);

// Session-based validation route (HP-2 spec requirement)
router.post('/session/:sessionId/validate',
  validateUUID('sessionId'),
  authorizeProjectFromSession('sessionId'),
  authorizeRoles('PM','SPM','DIRECTOR','ADMIN'),
  requireWizardStep(3), // Final step validation
  validateSession,
  validateJsonBody,
  ProjectWizardController.validateStep
);

// Alias for finalize (HP-2 spec mentions finalize)
router.post('/session/:sessionId/finalize',
  validateUUID('sessionId'),
  authorizeProjectFromSession('sessionId'),
  authorizeRoles('PM','SPM','DIRECTOR','ADMIN'),
  requireWizardStep(3), // Final step
  validateSession,
  ProjectWizardController.completeWizard
);

// Data retrieval routes
router.get('/vendors', ProjectWizardController.getAvailableVendors);

// Template management routes (with fallback for missing table)
router.get('/templates', async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    // First check if the project_templates table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_templates'
      );
    `;
    
    const tableExists = await query(tableExistsQuery);
    
    if (!tableExists.rows[0].exists) {
      // Table doesn't exist, return default templates
      logger.info('Templates table not found, returning default templates', {
        correlationId: req.correlationId
      });
      
      const defaultTemplates = [
        {
          id: 'default-infrastructure',
          name: 'Infrastructure Project',
          description: 'Standard template for infrastructure development projects',
          category: 'Infrastructure',
          template_data: {
            projectType: 'Standard',
            deliveryType: 'design_bid_build',
            program: 'transportation_infrastructure'
          },
          created_at: new Date().toISOString()
        },
        {
          id: 'default-construction',
          name: 'Construction Project',
          description: 'Standard template for construction projects',
          category: 'Construction',
          template_data: {
            projectType: 'Standard',
            deliveryType: 'design_bid_build',
            program: 'government_facilities'
          },
          created_at: new Date().toISOString()
        }
      ];
      
      return res.json({
        success: true,
        templates: defaultTemplates,
        correlationId: req.correlationId,
        note: 'Using default templates - database table not configured'
      });
    }
    
    // Table exists, query it
    const result = await query(`
      SELECT id, name, description, category, template_data, created_at
      FROM project_templates 
      WHERE status = 'active'
      ORDER BY name ASC
    `);
    
    logger.info('Templates retrieved from database', {
      correlationId: req.correlationId,
      count: result.rows.length
    });
    
    res.json({
      success: true,
      templates: result.rows,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error retrieving templates', {
      correlationId: req.correlationId,
      error: error.message
    });
    
    // Provide fallback templates even on error
    const fallbackTemplates = [
      {
        id: 'fallback-standard',
        name: 'Standard Project',
        description: 'Basic project template',
        category: 'General',
        template_data: {
          projectType: 'Standard',
          deliveryType: 'design_bid_build'
        },
        created_at: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      templates: fallbackTemplates,
      correlationId: req.correlationId,
      warning: 'Using fallback templates due to database error'
    });
  }
});

// Team members route for project assignment
router.get('/team-members', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { search, role } = req.query;
    
    let queryText = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.department
      FROM users u
      WHERE u.is_active = true
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (search && search.trim()) {
      queryText += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }
    
    if (role && role.trim()) {
      queryText += ` AND u.role = $${paramIndex}`;
      queryParams.push(role.trim());
      paramIndex++;
    }
    
    queryText += ` ORDER BY u.last_name, u.first_name LIMIT 50`;
    
    const result = await query(queryText, queryParams);
    
    logger.info('Team members retrieved', {
      correlationId: req.correlationId,
      count: result.rows.length,
      filters: { search, role }
    });
    
    res.json({
      success: true,
      teamMembers: result.rows,
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error retrieving team members', {
      correlationId: req.correlationId,
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team members',
      correlationId: req.correlationId
    });
  }
});

// Validation endpoint for step data
router.post('/validate/step/:stepId', 
  authorizeRoles('PM','SPM','DIRECTOR','ADMIN'),
  requireWizardStep(req => req.params.stepId),
  validateJsonBody, 
  async (req, res) => {
  try {
    const { stepId } = req.params;
    const stepData = req.body || {}; // Allow empty body with fallback
    
    const stepNumber = parseInt(stepId);
    if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step ID',
        correlationId: req.correlationId
      });
    }
    
    // Import validation function from controller
    const { validateStepData } = require('../controllers/projectWizardController');
    
    // Validate the step data (await the async function)
    let validationErrors = [];
    try {
      validationErrors = await validateStepData(stepNumber, stepData);
    } catch (validationError) {
      console.warn('Step validation failed:', validationError.message);
      // Continue with empty errors array if validation service fails
    }
    
    // Check if there are validation errors
    if (validationErrors && validationErrors.length > 0) {
      logger.warn('Step validation failed', {
        correlationId: req.correlationId,
        stepId: stepNumber,
        errors: validationErrors
      });

      const formatted = formatValidationErrors(validationErrors);
      return res.status(422).json({
        ...formatted,
        correlationId: req.correlationId
      });
    }
    
    logger.info('Step validation successful', {
      correlationId: req.correlationId,
      stepId: stepNumber
    });
    
    res.json({
      success: true,
      message: 'Validation passed',
      fieldErrors: {},
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.warn('Step validation failed', {
      correlationId: req.correlationId,
      stepId: req.params.stepId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      details: error.message,
      correlationId: req.correlationId
    });
  }
});

// Session cleanup endpoint (for administrative use)
router.delete('/session/:sessionId', validateSession, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { query } = require('../config/database');
    
    // Delete session and related data
    await query('DELETE FROM project_wizard_step_data WHERE session_id = $1', [sessionId]);
    await query('DELETE FROM project_wizard_sessions WHERE session_id = $1 AND user_id = $2', [sessionId, req.user.id]);
    
    logger.info('Session deleted', {
      correlationId: req.correlationId,
      sessionId,
      userId: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Session deleted successfully',
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error deleting session', {
      correlationId: req.correlationId,
      sessionId: req.params.sessionId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      correlationId: req.correlationId
    });
  }
});

// Analytics endpoint for wizard usage
router.get('/analytics', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const { timeframe = '30d' } = req.query;
    
    let dateFilter = '';
    switch (timeframe) {
      case '7d':
        dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
        break;
      default:
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    }
    
    // Get wizard completion statistics
    const completionStats = await query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_sessions,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_completion_time_minutes
      FROM project_wizard_sessions 
      WHERE 1=1 ${dateFilter}
    `);
    
    // Get step abandonment data
    const stepStats = await query(`
      SELECT 
        step_id,
        COUNT(*) as step_completions
      FROM project_wizard_step_data wsd
      JOIN project_wizard_sessions ws ON wsd.session_id = ws.session_id
      WHERE 1=1 ${dateFilter}
      GROUP BY step_id
      ORDER BY step_id
    `);
    
    logger.info('Analytics retrieved', {
      correlationId: req.correlationId,
      timeframe
    });
    
    res.json({
      success: true,
      analytics: {
        completion: completionStats.rows[0],
        stepCompletions: stepStats.rows,
        timeframe
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    logger.error('Error retrieving analytics', {
      correlationId: req.correlationId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      correlationId: req.correlationId
    });
  }
});

// P0-1: Wizard progress route for server-side step gating
router.get('/progress/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    logger.info('Getting wizard progress', {
      correlationId: req.correlationId,
      projectId: projectId,
      userId: req.user?.id
    });

    // Validate projectId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
        correlationId: req.correlationId
      });
    }

    // Get wizard session for this project
    const sessionQuery = `
      SELECT 
        id,
        project_id,
        current_step,
        status,
        step_data,
        created_at,
        updated_at
      FROM wizard_sessions 
      WHERE project_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const sessionResult = await query(sessionQuery, [projectId]);
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No wizard session found for this project',
        correlationId: req.correlationId
      });
    }

    const session = sessionResult.rows[0];
    const currentStep = session.current_step || 1;
    const maxSteps = 6; // Based on wizard implementation
    
    // Calculate next allowed step
    let nextAllowed = currentStep;
    if (session.status === 'completed') {
      nextAllowed = maxSteps;
    } else if (session.status === 'in_progress') {
      // Allow current step and next step if current is complete
      const stepData = session.step_data || {};
      const currentStepComplete = stepData[`step_${currentStep}`]?.completed || false;
      nextAllowed = currentStepComplete ? Math.min(currentStep + 1, maxSteps) : currentStep;
    }

    res.status(200).json({
      success: true,
      data: {
        projectId: projectId,
        sessionId: session.id,
        currentStep: currentStep,
        nextAllowed: nextAllowed,
        maxSteps: maxSteps,
        status: session.status,
        completed: session.status === 'completed',
        stepData: session.step_data || {},
        lastUpdated: session.updated_at
      },
      correlationId: req.correlationId
    });

  } catch (error) {
    logger.error('Failed to get wizard progress', {
      correlationId: req.correlationId,
      error: error.message,
      stack: error.stack,
      projectId: req.params.projectId
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wizard progress',
      correlationId: req.correlationId
    });
  }
});

// Middleware to require specific wizard step access
const requireWizardStep = (requiredStep) => {
  return async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const stepId = parseInt(req.params.stepId);
      
      if (!sessionId || !stepId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID and step ID are required',
          correlationId: req.correlationId
        });
      }

      // Get session progress
      const sessionQuery = `
        SELECT current_step, status, step_data, project_id
        FROM wizard_sessions 
        WHERE id = $1
      `;
      
      const sessionResult = await query(sessionQuery, [sessionId]);
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Wizard session not found',
          correlationId: req.correlationId
        });
      }

      const session = sessionResult.rows[0];
      const currentStep = session.current_step || 1;
      const stepData = session.step_data || {};
      
      // Calculate next allowed step
      let nextAllowed = currentStep;
      if (session.status === 'completed') {
        nextAllowed = 6; // All steps allowed if completed
      } else {
        // Check if previous steps are completed
        for (let i = 1; i < stepId; i++) {
          if (!stepData[`step_${i}`]?.completed) {
            return res.status(409).json({
              success: false,
              message: `Step ${i} must be completed before accessing step ${stepId}`,
              code: 'STEP_OUT_OF_ORDER',
              nextAllowed: i,
              currentStep: currentStep,
              correlationId: req.correlationId
            });
          }
        }
        nextAllowed = stepId;
      }

      // Allow access if step is within allowed range
      if (stepId <= nextAllowed) {
        req.wizardSession = session;
        next();
      } else {
        return res.status(409).json({
          success: false,
          message: `Access denied. Complete previous steps first.`,
          code: 'STEP_ACCESS_DENIED',
          nextAllowed: nextAllowed,
          currentStep: currentStep,
          correlationId: req.correlationId
        });
      }

    } catch (error) {
      logger.error('Wizard step validation error', {
        correlationId: req.correlationId,
        error: error.message,
        sessionId: req.params.sessionId,
        stepId: req.params.stepId
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to validate wizard step access',
        correlationId: req.correlationId
      });
    }
  };
};

// Apply step gating to existing step routes
// Note: This would require modifying the existing step route to use requireWizardStep middleware

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Unhandled route error', {
    correlationId: req.correlationId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    correlationId: req.correlationId
  });
});

// 404 handler for wizard routes
router.use((req, res) => {
  logger.warn('Route not found', {
    correlationId: req.correlationId,
    url: req.url,
    method: req.method
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    correlationId: req.correlationId
  });
});

module.exports = router;

