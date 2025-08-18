const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pfmt_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Helper function for database operations
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

/**
 * Notifications Controller
 * Handles user notifications for workflow handoffs and system events
 */

/**
 * Get notifications for current user
 */
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unread_only = false } = req.query;

    let whereClause = 'WHERE user_id = $1';
    const params = [userId];
    
    if (unread_only === 'true') {
      whereClause += ' AND read_at IS NULL';
    }

    const result = await query(
      `SELECT id, type, title, message, payload, read_at, created_at
       FROM notifications
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Get unread count
    const unreadResult = await query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );

    res.json({
      success: true,
      notifications: result.rows,
      unread_count: parseInt(unreadResult.rows[0].unread_count),
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to fetch notifications', 
        code: 'FETCH_FAILED',
        details: error.message
      }
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE notifications 
       SET read_at = NOW() 
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Notification not found or already read', code: 'NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      notification: result.rows[0],
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to mark notification as read', 
        code: 'UPDATE_FAILED',
        details: error.message
      }
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `UPDATE notifications 
       SET read_at = NOW() 
       WHERE user_id = $1 AND read_at IS NULL
       RETURNING COUNT(*) as updated_count`,
      [userId]
    );

    res.json({
      success: true,
      updated_count: result.rowCount,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to mark all notifications as read', 
        code: 'UPDATE_FAILED',
        details: error.message
      }
    });
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Notification not found', code: 'NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to delete notification', 
        code: 'DELETE_FAILED',
        details: error.message
      }
    });
  }
};

/**
 * Get notification statistics
 */
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT 
         COUNT(*) as total_notifications,
         COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread_count,
         COUNT(CASE WHEN type = 'project_submitted' THEN 1 END) as project_submitted,
         COUNT(CASE WHEN type = 'project_assigned' THEN 1 END) as project_assigned,
         COUNT(CASE WHEN type = 'project_finalized' THEN 1 END) as project_finalized
       FROM notifications 
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      stats: result.rows[0]
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to fetch notification statistics', 
        code: 'FETCH_FAILED',
        details: error.message
      }
    });
  }
};

/**
 * Create notification (for system use)
 */
const createNotification = async ({ userId, type, title, message, payload }) => {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, payload)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, JSON.stringify(payload)]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Bulk create notifications (for system use)
 */
const createBulkNotifications = async (notifications) => {
  try {
    const values = notifications.map((notif, index) => {
      const baseIndex = index * 5;
      return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`;
    }).join(', ');

    const params = notifications.flatMap(notif => [
      notif.userId,
      notif.type,
      notif.title,
      notif.message,
      JSON.stringify(notif.payload)
    ]);

    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, payload)
       VALUES ${values}
       RETURNING *`,
      params
    );

    return result.rows;
  } catch (error) {
    console.error('Bulk create notifications error:', error);
    throw error;
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createNotification,
  createBulkNotifications
};

