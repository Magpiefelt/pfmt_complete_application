const express = require('express');
const router = express.Router();
const { controller, upload, authenticateVendor } = require('../controllers/vendorPortalController');

// Public routes (no authentication required)
router.post('/register', controller.registerVendor);
router.post('/login', controller.loginVendor);

// Protected routes (require vendor authentication)
router.use(authenticateVendor);

// Vendor dashboard
router.get('/dashboard', controller.getVendorDashboard);

// Profile management
router.put('/profile', controller.updateVendorProfile);

// Document management
router.get('/documents', controller.getVendorDocuments);
router.post('/documents/upload', upload.single('document'), controller.uploadDocument);

// Qualification status
router.get('/qualification', controller.getQualificationStatus);

module.exports = router;

