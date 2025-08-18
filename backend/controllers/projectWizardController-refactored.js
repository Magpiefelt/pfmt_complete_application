/**
 * Project Wizard Controller (Refactored)
 * HTTP request handling for project creation wizard functionality
 * Business logic delegated to ProjectWizardService
 */

const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');
const ProjectWizardService = require('../services/ProjectWizardService');
const { logger } = require('../middleware/logging');

// Rate limiting for wizard operations
const wizardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many wizard requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

class ProjectWizardController {
  /**
   * Initialize wizard session
   */
  static async initializeWizard(req, res) {
    try {
      // Validate authentication
      if (!req.user || !req.user.id) {
        logger.warn('Wizard initialization attempted without authentication');
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const userId = req.user.id;
      const templateId = req.body.templateId || null;
      
      logger.info('Initializing wizard', { userId, templateId });
      
      // Delegate to service
      const result = await ProjectWizardService.initializeWizardSession(userId, templateId);
      
      res.json({
        success: true,
        sessionId: result.sessionId,
        currentStep: result.currentStep,
        totalSteps: await ProjectWizardService.getMaxWizardSteps(),
        templateId: templateId,
        templateData: result.templateData,
        data: result.session
      });
    } catch (error) {
      logger.error('Error initializing wizard', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to initialize project wizard',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get project templates
   */
  static async getProjectTemplates(req, res) {
    try {
      const userId = req.user?.id;
      
      logger.info('Getting project templates', { userId });
      
      // Delegate to service
      const templates = await ProjectWizardService.getProjectTemplates(userId);
      
      res.json({
        success: true,
        templates,
        count: templates.length
      });
    } catch (error) {
      logger.error('Error getting project templates', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get project templates',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get wizard session
   */
  static async getWizardSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }
      
      logger.info('Getting wizard session', { sessionId, userId });
      
      // Delegate to service
      const session = await ProjectWizardService.getWizardSession(sessionId, userId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Wizard session not found'
        });
      }
      
      res.json({
        success: true,
        session,
        totalSteps: await ProjectWizardService.getMaxWizardSteps()
      });
    } catch (error) {
      logger.error('Error getting wizard session', { 
        error: error.message, 
        sessionId: req.params.sessionId,
        userId: req.user?.id 
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get wizard session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update wizard session step data
   */
  static async updateWizardSession(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const userId = req.user.id;
      const stepData = req.body;
      
      logger.info('Updating wizard session', { sessionId, userId, stepDataKeys: Object.keys(stepData) });
      
      // Delegate to service
      const updatedSession = await ProjectWizardService.updateWizardSession(sessionId, userId, stepData);
      
      res.json({
        success: true,
        message: 'Wizard session updated successfully',
        session: updatedSession
      });
    } catch (error) {
      logger.error('Error updating wizard session', { 
        error: error.message, 
        sessionId: req.params.sessionId,
        userId: req.user?.id 
      });
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update wizard session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Advance wizard to next step
   */
  static async advanceWizardStep(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      const currentStepData = req.body;
      
      logger.info('Advancing wizard step', { sessionId, userId });
      
      // Delegate to service
      const updatedSession = await ProjectWizardService.advanceWizardStep(sessionId, userId, currentStepData);
      
      res.json({
        success: true,
        message: 'Advanced to next step',
        session: updatedSession,
        currentStep: updatedSession.current_step,
        totalSteps: await ProjectWizardService.getMaxWizardSteps()
      });
    } catch (error) {
      logger.error('Error advancing wizard step', { 
        error: error.message, 
        sessionId: req.params.sessionId,
        userId: req.user?.id 
      });
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to advance wizard step',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Go back to previous wizard step
   */
  static async previousWizardStep(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      logger.info('Going to previous wizard step', { sessionId, userId });
      
      // Delegate to service
      const updatedSession = await ProjectWizardService.previousWizardStep(sessionId, userId);
      
      res.json({
        success: true,
        message: 'Returned to previous step',
        session: updatedSession,
        currentStep: updatedSession.current_step,
        totalSteps: await ProjectWizardService.getMaxWizardSteps()
      });
    } catch (error) {
      logger.error('Error going to previous wizard step', { 
        error: error.message, 
        sessionId: req.params.sessionId,
        userId: req.user?.id 
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to go to previous step',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Complete wizard and create project
   */
  static async completeWizard(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      logger.info('Completing wizard', { sessionId, userId });
      
      // Delegate to service
      const projectId = await ProjectWizardService.completeWizard(sessionId, userId);
      
      res.json({
        success: true,
        message: 'Project created successfully',
        projectId,
        redirectUrl: `/projects/${projectId}`
      });
    } catch (error) {
      logger.error('Error completing wizard', { 
        error: error.message, 
        sessionId: req.params.sessionId,
        userId: req.user?.id 
      });
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to complete wizard and create project',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cancel wizard session
   */
  static async cancelWizard(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;
      
      logger.info('Cancelling wizard', { sessionId, userId, reason });
      
      // Delegate to service
      const cancelledSession = await ProjectWizardService.cancelWizard(sessionId, userId, reason);
      
      res.json({
        success: true,
        message: 'Wizard session cancelled',
        session: cancelledSession
      });
    } catch (error) {
      logger.error('Error cancelling wizard', { 
        error: error.message, 
        sessionId: req.params.sessionId,
        userId: req.user?.id 
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to cancel wizard session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get wizard statistics
   */
  static async getWizardStatistics(req, res) {
    try {
      const userId = req.user?.id;
      const includeUserStats = req.query.includeUserStats === 'true';
      
      logger.info('Getting wizard statistics', { userId, includeUserStats });
      
      // Delegate to service
      const statistics = await ProjectWizardService.getWizardStatistics(
        includeUserStats ? userId : null
      );
      
      res.json({
        success: true,
        statistics
      });
    } catch (error) {
      logger.error('Error getting wizard statistics', { 
        error: error.message, 
        userId: req.user?.id 
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get wizard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Validate wizard step data
   */
  static async validateStepData(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      const stepData = req.body;
      
      // Get current session to determine step
      const session = await ProjectWizardService.getWizardSession(sessionId, userId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Wizard session not found'
        });
      }
      
      // Validate step data
      const validationErrors = await ProjectWizardService.validateStepData(session.current_step, stepData);
      
      res.json({
        success: validationErrors.length === 0,
        valid: validationErrors.length === 0,
        errors: validationErrors
      });
    } catch (error) {
      logger.error('Error validating step data', { 
        error: error.message, 
        sessionId: req.params.sessionId,
        userId: req.user?.id 
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to validate step data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get template data by ID
   */
  static async getTemplateData(req, res) {
    try {
      const { templateId } = req.params;
      
      logger.info('Getting template data', { templateId });
      
      // Delegate to service
      const templateData = await ProjectWizardService.getTemplateData(templateId);
      
      if (!templateData) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        template: templateData
      });
    } catch (error) {
      logger.error('Error getting template data', { 
        error: error.message, 
        templateId: req.params.templateId 
      });
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get template data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// Export rate limiting middleware along with controller
module.exports = {
  ProjectWizardController,
  wizardRateLimit
};

