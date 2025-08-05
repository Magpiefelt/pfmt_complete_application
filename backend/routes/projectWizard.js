const express = require('express');
const router = express.Router();
const projectWizardController = require('../controllers/projectWizardController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Initialize new project wizard session
router.post('/init', projectWizardController.initializeWizard);

// Get project templates
router.get('/templates', projectWizardController.getProjectTemplates);

// Get wizard session data
router.get('/session/:sessionId', projectWizardController.getWizardSession);

// Save step data
router.post('/session/:sessionId/step/:stepId', projectWizardController.saveStepData);

// Validate step data
router.post('/validate/step/:stepId', projectWizardController.validateStep);

// Get available team members
router.get('/team-members', projectWizardController.getAvailableTeamMembers);

// Complete wizard and create project
router.post('/session/:sessionId/complete', projectWizardController.completeWizard);

module.exports = router;

