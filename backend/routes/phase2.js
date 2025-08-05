const express = require('express');
const router = express.Router();
const phase2Controller = require('../controllers/phase2_enhancements');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Project Versions Routes
router.get('/projects/:projectId/versions', phase2Controller.getProjectVersions);
router.post('/projects/:projectId/versions', phase2Controller.createProjectVersion);
router.put('/versions/:versionId/submit', phase2Controller.submitVersionForApproval);
router.put('/versions/:versionId/approve', authorizeRoles(['SPM', 'Director', 'Admin']), phase2Controller.approveVersion);
router.put('/versions/:versionId/reject', authorizeRoles(['SPM', 'Director', 'Admin']), phase2Controller.rejectVersion);
router.get('/projects/:projectId/versions/compare', phase2Controller.compareVersions);

// Calendar Events Routes
router.get('/projects/:projectId/calendar-events', phase2Controller.getCalendarEvents);
router.get('/calendar-events', phase2Controller.getCalendarEvents); // For all projects
router.post('/projects/:projectId/calendar-events', phase2Controller.createCalendarEvent);

// Guidance Notifications Routes
router.get('/projects/:projectId/guidance-notifications', phase2Controller.getGuidanceNotifications);
router.get('/guidance-notifications', phase2Controller.getGuidanceNotifications); // For all projects
router.put('/guidance-notifications/:notificationId/read', phase2Controller.markNotificationRead);
router.put('/guidance-notifications/:notificationId/dismiss', phase2Controller.dismissNotification);

// Meeting Agendas Routes
router.get('/gate-meetings/:gateMeetingId/agendas', phase2Controller.getMeetingAgendas);
router.post('/gate-meetings/:gateMeetingId/agendas', phase2Controller.createMeetingAgenda);

// Workflow States Routes
router.get('/projects/:projectId/workflow-state', phase2Controller.getProjectWorkflowState);
router.put('/projects/:projectId/workflow-state', phase2Controller.updateProjectWorkflowState);

module.exports = router;

