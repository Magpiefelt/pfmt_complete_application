const express = require('express');
const router = express.Router();
const vendorQualificationController = require('../controllers/vendorQualificationController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Qualification criteria management
router.get('/criteria', vendorQualificationController.getQualificationCriteria);
router.post('/criteria', vendorQualificationController.createQualificationCriteria);

// Vendor assessment
router.post('/assess/:vendorId', vendorQualificationController.submitAssessment);
router.get('/assessments/:vendorId', vendorQualificationController.getVendorAssessments);
router.get('/status/:vendorId', vendorQualificationController.getQualificationStatus);

// Vendor approval/rejection
router.post('/approve/:vendorId', vendorQualificationController.approveVendor);
router.post('/reject/:vendorId', vendorQualificationController.rejectVendor);

// Pending registrations
router.get('/pending', vendorQualificationController.getPendingRegistrations);

module.exports = router;

