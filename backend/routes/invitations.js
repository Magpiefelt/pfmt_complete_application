const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    sendMeetingInvitation,
    previewInvitation,
    healthCheck
} = require('../controllers/invitationController');

// Health check endpoint
router.get('/health', healthCheck);

// Send meeting invitation
router.post('/send-invitation', sendMeetingInvitation);

// Preview invitation email template
router.post('/preview-invitation', previewInvitation);

module.exports = router;

