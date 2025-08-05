const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Approval workflow routes
router.post('/budget/:budgetId/submit', approvalController.submitBudgetApproval);
router.post('/process/:approvalId', approvalController.processApprovalDecision);

// Approval management routes
router.get('/pending', approvalController.getPendingApprovals);
router.get('/history', approvalController.getApprovalHistory);
router.get('/statistics', approvalController.getApprovalStatistics);

// Audit trail routes
router.get('/audit-trail', approvalController.getAuditTrail);

module.exports = router;

