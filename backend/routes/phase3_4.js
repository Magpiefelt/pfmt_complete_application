const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const phase34Controller = require('../controllers/phase3_4_enhancements');

// Phase 3 Routes - Financial Clarity, Rollups, Exports & Print

// Project financial summary and rollups
router.get('/projects/:projectId/financial-summary', 
  authenticateToken, 
  phase34Controller.getProjectFinancialSummary
);

// Contract financial rollup
router.get('/contracts/:contractId/financial-rollup', 
  authenticateToken, 
  phase34Controller.getContractFinancialRollup
);

// Export data to CSV
router.post('/export/csv', 
  authenticateToken, 
  phase34Controller.exportToCSV
);

// Audit logs (admin only)
router.get('/audit-logs', 
  authenticateToken, 
  phase34Controller.getAuditLogs
);

// Phase 4 Routes - UX Polish, Bulk Ops, Seeds & Coverage

// Bulk operations
router.post('/bulk/archive', 
  authenticateToken, 
  phase34Controller.bulkArchiveEntities
);

router.post('/bulk/status-update', 
  authenticateToken, 
  phase34Controller.bulkUpdateStatus
);

// Inline editing
router.post('/inline-edit', 
  authenticateToken, 
  phase34Controller.inlineEditField
);

router.post('/inline-edit/auto-save', 
  authenticateToken, 
  phase34Controller.autoSaveInlineEdit
);

// User preferences
router.get('/user/preferences', 
  authenticateToken, 
  phase34Controller.getUserPreferences
);

router.put('/user/preferences', 
  authenticateToken, 
  phase34Controller.updateUserPreferences
);

module.exports = router;

