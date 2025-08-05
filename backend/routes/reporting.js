const express = require('express');
const router = express.Router();
const reportingController = require('../controllers/reportingController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Dashboard and overview routes
router.get('/dashboard', reportingController.getFinancialDashboard);

// Report generation routes
router.get('/variance', reportingController.generateVarianceReport);
router.get('/cash-flow', reportingController.generateCashFlowReport);
router.get('/vendor-spending', reportingController.generateVendorSpendingReport);

// Saved reports management
router.get('/saved', reportingController.getSavedReports);
router.post('/saved', reportingController.saveCustomReport);
router.get('/saved/:reportId/execute', reportingController.executeSavedReport);

module.exports = router;

