const express = require('express');
const router = express.Router();
const projectWizardController = require('../controllers/projectWizardController');
const { flexibleAuth } = require('../middleware/flexibleAuth');

// Apply flexible authentication middleware to all routes
router.use(flexibleAuth);

// Add debug middleware to log all requests
router.use((req, res, next) => {
  console.log('🔧 ProjectWizard Route:', req.method, req.path);
  console.log('🔧 ProjectWizard Params:', req.params);
  console.log('🔧 ProjectWizard Query:', req.query);
  console.log('🔧 ProjectWizard User:', req.user?.id);
  next();
});

// Initialize new project wizard session
router.post('/init', projectWizardController.initializeWizard);

// Get project templates
router.get('/templates', projectWizardController.getProjectTemplates);

// Get wizard session data
router.get('/session/:sessionId', projectWizardController.getWizardSession);

// Save step data - ENHANCED ROUTE
router.post('/session/:sessionId/step/:stepId', (req, res, next) => {
  console.log('🔧 Step data route hit - sessionId:', req.params.sessionId, 'stepId:', req.params.stepId);
  next();
}, projectWizardController.saveStepData);

// Validate step data
router.post('/validate/step/:stepId', projectWizardController.validateStep);

// Get available team members
router.get('/team-members', projectWizardController.getAvailableTeamMembers);

// Complete wizard and create project
router.post('/session/:sessionId/complete', (req, res, next) => {
  console.log('🔧 Complete wizard route hit - sessionId:', req.params.sessionId);
  next();
}, projectWizardController.completeWizard);

module.exports = router;

