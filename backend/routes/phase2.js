const express = require('express');
const router = express.Router();
const phase2Controller = require('../controllers/phase2_enhancements');
const { flexibleAuth, flexibleAuthorizeRoles } = require('../middleware/flexibleAuth');
const {
  validateCreateVersion,
  validateSubmitVersion,
  validateApproveVersion,
  validateRejectVersion,
  validateCompareVersions,
  validateCreateCalendarEvent,
  validateCreateMeetingAgenda,
  validateUpdateWorkflowState,
  validateNotificationAction,
  validateProjectId,
  validateGateMeetingId
} = require('../middleware/validation');

// Apply flexible authentication middleware to all routes
router.use(flexibleAuth);

// Project Versions Routes
router.get('/projects/:projectId/versions', validateProjectId, phase2Controller.getProjectVersions);
router.post('/projects/:projectId/versions', validateCreateVersion, phase2Controller.createProjectVersion);
router.put('/versions/:versionId/submit', validateSubmitVersion, phase2Controller.submitVersionForApproval);
router.put('/versions/:versionId/approve', validateApproveVersion, flexibleAuthorizeRoles('SPM', 'Director', 'Admin'), phase2Controller.approveVersion);
router.put('/versions/:versionId/reject', validateRejectVersion, flexibleAuthorizeRoles('SPM', 'Director', 'Admin'), phase2Controller.rejectVersion);
router.get('/projects/:projectId/versions/compare', validateCompareVersions, phase2Controller.compareVersions);

// Calendar Events Routes
router.get('/projects/:projectId/calendar-events', validateProjectId, phase2Controller.getCalendarEvents);
router.get('/calendar-events', phase2Controller.getCalendarEvents); // For all projects
router.post('/projects/:projectId/calendar-events', validateCreateCalendarEvent, phase2Controller.createCalendarEvent);

// Guidance Notifications Routes
router.get('/projects/:projectId/guidance-notifications', validateProjectId, phase2Controller.getGuidanceNotifications);
router.get('/guidance-notifications', phase2Controller.getGuidanceNotifications); // For all projects
router.put('/guidance-notifications/:notificationId/read', validateNotificationAction, phase2Controller.markNotificationRead);
router.put('/guidance-notifications/:notificationId/dismiss', validateNotificationAction, phase2Controller.dismissNotification);

// Meeting Agendas Routes
router.get('/gate-meetings/:gateMeetingId/agendas', validateGateMeetingId, phase2Controller.getMeetingAgendas);
router.post('/gate-meetings/:gateMeetingId/agendas', validateCreateMeetingAgenda, phase2Controller.createMeetingAgenda);

// Workflow States Routes
router.get('/projects/:projectId/workflow-state', validateProjectId, phase2Controller.getProjectWorkflowState);
router.put('/projects/:projectId/workflow-state', validateUpdateWorkflowState, phase2Controller.updateProjectWorkflowState);

module.exports = router;

