const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * Notification Routes
 */

// Get my notifications
router.get('/',
  notificationsController.getMyNotifications
);

// Get notification statistics
router.get('/stats',
  notificationsController.getNotificationStats
);

// Mark notification as read
router.patch('/:id/read',
  notificationsController.markAsRead
);

// Mark all notifications as read
router.patch('/read-all',
  notificationsController.markAllAsRead
);

// Delete notification
router.delete('/:id',
  notificationsController.deleteNotification
);

module.exports = router;

