const express = require('express');
const router = express.Router();
const gateMeetingController = require('../controllers/gateMeetingController');
// const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
// router.use(authenticateToken);

// Gate Meeting CRUD routes
router.get('/', gateMeetingController.getAllGateMeetings);
router.get('/dashboard', gateMeetingController.getGateMeetingDashboard);
router.get('/upcoming', gateMeetingController.getUpcomingGateMeetings);
router.get('/calendar', gateMeetingController.getFiscalYearCalendar);
router.get('/:id', gateMeetingController.getGateMeetingById);
router.post('/', gateMeetingController.createGateMeeting);
router.put('/:id', gateMeetingController.updateGateMeeting);
router.delete('/:id', gateMeetingController.deleteGateMeeting);

// Lookup data routes
router.get('/types/all', gateMeetingController.getGateMeetingTypes);
router.get('/statuses/all', gateMeetingController.getGateMeetingStatuses);
router.get('/roles/all', gateMeetingController.getOrganizationalRoles);

module.exports = router;

