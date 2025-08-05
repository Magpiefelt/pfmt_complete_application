const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Budget management routes
router.get('/project/:projectId', budgetController.getProjectBudget);
router.post('/project/:projectId', budgetController.createOrUpdateBudget);
router.post('/project/:projectId/entries', budgetController.addBudgetEntry);
router.post('/project/:projectId/transfer', budgetController.transferBudget);

// Budget analysis routes
router.get('/project/:projectId/variance', budgetController.getBudgetVarianceAnalysis);
router.get('/project/:projectId/forecast', budgetController.getBudgetForecast);

module.exports = router;

