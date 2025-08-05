const express = require('express');
const router = express.Router();
const phase1Controller = require('../controllers/phase1_enhancements');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Project Financial Summary Routes (for Reports tab)
router.get('/projects/:projectId/financial-summary', phase1Controller.getProjectFinancialSummary);

// Contract Payments Routes
router.get('/projects/:projectId/payments', phase1Controller.getContractPayments);
router.post('/projects/:projectId/payments', phase1Controller.addContractPayment);

// Budget Transfer Ledger Routes
router.get('/projects/:projectId/budget-transfers', phase1Controller.getBudgetTransferLedger);

// Approval History Routes
router.get('/projects/:projectId/approval-history', phase1Controller.getApprovalHistory);

// Vendor Performance Routes
router.get('/vendors/:vendorId/performance', phase1Controller.getVendorPerformance);

// Enhanced Gate Meetings Routes
router.get('/projects/:projectId/gate-meetings', phase1Controller.getProjectGateMeetings);
router.post('/gate-meetings/:meetingId/notes', phase1Controller.addMeetingNote);

module.exports = router;

