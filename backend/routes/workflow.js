const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
// const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
// router.use(authenticateToken);

// Workflow state routes
router.get('/gate-meetings/:gate_meeting_id/workflow', workflowController.getWorkflowState);
router.post('/gate-meetings/:gate_meeting_id/workflow', workflowController.updateWorkflowState);

// Action items routes
router.get('/gate-meetings/:gate_meeting_id/action-items', workflowController.getActionItems);
router.post('/gate-meetings/:gate_meeting_id/action-items', workflowController.createActionItem);
router.put('/action-items/:action_item_id', workflowController.updateActionItem);
router.delete('/action-items/:action_item_id', workflowController.deleteActionItem);

// Participants routes
router.get('/gate-meetings/:gate_meeting_id/participants', workflowController.getParticipants);
router.post('/gate-meetings/:gate_meeting_id/participants', workflowController.addParticipant);
router.put('/participants/:participant_id/attendance', workflowController.updateParticipantAttendance);
router.delete('/participants/:participant_id', workflowController.removeParticipant);

// Statistics
router.get('/statistics', workflowController.getWorkflowStatistics);

module.exports = router;

