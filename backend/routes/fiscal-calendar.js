const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');

const router = express.Router();

// Use existing database configuration
const { pool } = require('../config/database');

// Import existing middleware
const { authenticateToken } = require('../middleware/auth');

// Middleware for manager/admin authorization
const requireManagerOrAdmin = (req, res, next) => {
    if (!req.user || !['manager', 'admin', 'pmi', 'pm', 'director'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Manager or admin access required' });
    }
    next();
};

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/fiscal-calendar';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Helper function to get fiscal year info
const getFiscalYearInfo = (date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    
    if (month >= 4) {
        return {
            fiscal_year: year,
            fiscal_month: month - 3,
            start_date: new Date(year, 3, 1), // April 1st
            end_date: new Date(year + 1, 2, 31) // March 31st next year
        };
    } else {
        return {
            fiscal_year: year - 1,
            fiscal_month: month + 9,
            start_date: new Date(year - 1, 3, 1), // April 1st previous year
            end_date: new Date(year, 2, 31) // March 31st current year
        };
    }
};

// Email configuration
const createEmailTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'localhost',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// GET /api/fiscal-calendar/dashboard - Get dashboard statistics
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM fiscal_calendar_dashboard 
            WHERE fiscal_year = (SELECT fiscal_year FROM fiscal_years WHERE is_current = true)
        `);
        
        const eventsByType = await pool.query(`
            SELECT fcet.name, fcet.color, COUNT(fce.id) as count
            FROM fiscal_calendar_event_types fcet
            LEFT JOIN fiscal_calendar_events fce ON fcet.id = fce.event_type_id
            WHERE fce.fiscal_year = (SELECT fiscal_year FROM fiscal_years WHERE is_current = true)
            GROUP BY fcet.id, fcet.name, fcet.color, fcet.sort_order
            ORDER BY fcet.sort_order
        `);

        const eventsByStatus = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM fiscal_calendar_events
            WHERE fiscal_year = (SELECT fiscal_year FROM fiscal_years WHERE is_current = true)
            GROUP BY status
        `);

        res.json({
            success: true,
            data: {
                summary: result.rows[0] || {},
                events_by_type: eventsByType.rows,
                events_by_status: eventsByStatus.rows
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
    }
});

// GET /api/fiscal-calendar/events - Get fiscal calendar events
router.get('/events', authenticateToken, async (req, res) => {
    try {
        const { 
            start_date, 
            end_date, 
            event_type_id, 
            status, 
            fiscal_year, 
            assigned_to,
            page = 1,
            limit = 100
        } = req.query;

        let query = `
            SELECT * FROM fiscal_calendar_events_detailed
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (start_date) {
            paramCount++;
            query += ` AND start_date >= $${paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND end_date <= $${paramCount}`;
            params.push(end_date);
        }

        if (event_type_id) {
            paramCount++;
            query += ` AND event_type_id = $${paramCount}`;
            params.push(event_type_id);
        }

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        if (fiscal_year) {
            paramCount++;
            query += ` AND fiscal_year = $${paramCount}`;
            params.push(fiscal_year);
        }

        if (assigned_to) {
            paramCount++;
            query += ` AND assigned_to = $${paramCount}`;
            params.push(assigned_to);
        }

        query += ` ORDER BY start_date ASC, created_at DESC`;
        
        // Add pagination
        const offset = (page - 1) * limit;
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
        
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await pool.query(query, params);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total FROM fiscal_calendar_events_detailed
            WHERE 1=1
        `;
        const countParams = [];
        let countParamCount = 0;

        if (start_date) {
            countParamCount++;
            countQuery += ` AND start_date >= $${countParamCount}`;
            countParams.push(start_date);
        }

        if (end_date) {
            countParamCount++;
            countQuery += ` AND end_date <= $${countParamCount}`;
            countParams.push(end_date);
        }

        if (event_type_id) {
            countParamCount++;
            countQuery += ` AND event_type_id = $${countParamCount}`;
            countParams.push(event_type_id);
        }

        if (status) {
            countParamCount++;
            countQuery += ` AND status = $${countParamCount}`;
            countParams.push(status);
        }

        if (fiscal_year) {
            countParamCount++;
            countQuery += ` AND fiscal_year = $${countParamCount}`;
            countParams.push(fiscal_year);
        }

        if (assigned_to) {
            countParamCount++;
            countQuery += ` AND assigned_to = $${countParamCount}`;
            countParams.push(assigned_to);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Events fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch events' });
    }
});

// POST /api/fiscal-calendar/events - Create new event
router.post('/events', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            start_date,
            end_date,
            event_type_id,
            priority = 'medium',
            assigned_to,
            reporting_deadline,
            is_recurring = false,
            recurrence_pattern,
            metadata = {}
        } = req.body;

        // Validate required fields
        if (!title || !start_date || !end_date || !event_type_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, start_date, end_date, event_type_id'
            });
        }

        // Get fiscal year info
        const fiscalInfo = getFiscalYearInfo(new Date(start_date));

        // Check if event type requires approval
        const eventTypeResult = await pool.query(
            'SELECT requires_approval FROM fiscal_calendar_event_types WHERE id = $1',
            [event_type_id]
        );

        if (eventTypeResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid event type'
            });
        }

        const requiresApproval = eventTypeResult.rows[0].requires_approval;
        const approvalStatus = requiresApproval ? 'pending' : 'approved';

        const result = await pool.query(`
            INSERT INTO fiscal_calendar_events (
                title, description, start_date, end_date, event_type_id,
                priority, assigned_to, created_by, reporting_deadline,
                fiscal_year, fiscal_month, is_recurring, recurrence_pattern,
                metadata, approval_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `, [
            title, description, start_date, end_date, event_type_id,
            priority, assigned_to, req.user.id, reporting_deadline,
            fiscalInfo.fiscal_year, fiscalInfo.fiscal_month, is_recurring,
            recurrence_pattern, JSON.stringify(metadata), approvalStatus
        ]);

        const newEvent = result.rows[0];

        // Create notification for approval if required
        if (requiresApproval) {
            await pool.query(`
                INSERT INTO fiscal_calendar_notifications (
                    user_id, event_id, type, title, message, priority
                ) 
                SELECT u.id, $1, 'approval_required', $2, $3, 'high'
                FROM users u 
                WHERE u.role IN ('admin', 'director', 'pmi')
            `, [
                newEvent.id,
                'Event Approval Required',
                `Event "${title}" requires approval. Please review and approve.`
            ]);
        }

        // Send email notification to assigned user if specified
        if (assigned_to) {
            const userResult = await pool.query(
                'SELECT email, first_name, last_name FROM users WHERE id = $1',
                [assigned_to]
            );

            if (userResult.rows.length > 0) {
                const user = userResult.rows[0];
                try {
                    const transporter = createEmailTransporter();
                    await transporter.sendMail({
                        from: process.env.FROM_EMAIL || 'noreply@prs.gov.ab.ca',
                        to: user.email,
                        subject: `New Event Assignment: ${title}`,
                        html: `
                            <h2>New Event Assignment</h2>
                            <p>Hello ${user.first_name} ${user.last_name},</p>
                            <p>You have been assigned to a new event:</p>
                            <ul>
                                <li><strong>Title:</strong> ${title}</li>
                                <li><strong>Start Date:</strong> ${start_date}</li>
                                <li><strong>End Date:</strong> ${end_date}</li>
                                <li><strong>Priority:</strong> ${priority}</li>
                                ${reporting_deadline ? `<li><strong>Reporting Deadline:</strong> ${reporting_deadline}</li>` : ''}
                            </ul>
                            ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
                            <p>Please log in to the PRS system to view more details.</p>
                        `
                    });
                } catch (emailError) {
                    console.error('Email notification error:', emailError);
                }
            }
        }

        res.status(201).json({
            success: true,
            data: newEvent,
            message: requiresApproval ? 'Event created and pending approval' : 'Event created successfully'
        });
    } catch (error) {
        console.error('Event creation error:', error);
        res.status(500).json({ success: false, error: 'Failed to create event' });
    }
});

// GET /api/fiscal-calendar/events/:id - Get specific event
router.get('/events/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM fiscal_calendar_events_detailed WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Event fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch event' });
    }
});

// PUT /api/fiscal-calendar/events/:id - Update event
router.put('/events/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            start_date,
            end_date,
            event_type_id,
            status,
            priority,
            assigned_to,
            reporting_deadline,
            metadata = {}
        } = req.body;

        // Check if event exists and user has permission to edit
        const existingEvent = await pool.query(
            'SELECT * FROM fiscal_calendar_events WHERE id = $1',
            [id]
        );

        if (existingEvent.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const event = existingEvent.rows[0];

        // Check permissions - only creator, assigned user, or admin/manager can edit
        if (event.created_by !== req.user.id && 
            event.assigned_to !== req.user.id && 
            !['admin', 'director', 'pmi', 'pm'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Permission denied'
            });
        }

        // Get fiscal year info if dates are being updated
        let fiscalInfo = null;
        if (start_date) {
            fiscalInfo = getFiscalYearInfo(new Date(start_date));
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramCount = 0;

        if (title !== undefined) {
            paramCount++;
            updateFields.push(`title = $${paramCount}`);
            updateValues.push(title);
        }

        if (description !== undefined) {
            paramCount++;
            updateFields.push(`description = $${paramCount}`);
            updateValues.push(description);
        }

        if (start_date !== undefined) {
            paramCount++;
            updateFields.push(`start_date = $${paramCount}`);
            updateValues.push(start_date);
        }

        if (end_date !== undefined) {
            paramCount++;
            updateFields.push(`end_date = $${paramCount}`);
            updateValues.push(end_date);
        }

        if (event_type_id !== undefined) {
            paramCount++;
            updateFields.push(`event_type_id = $${paramCount}`);
            updateValues.push(event_type_id);
        }

        if (status !== undefined) {
            paramCount++;
            updateFields.push(`status = $${paramCount}`);
            updateValues.push(status);
        }

        if (priority !== undefined) {
            paramCount++;
            updateFields.push(`priority = $${paramCount}`);
            updateValues.push(priority);
        }

        if (assigned_to !== undefined) {
            paramCount++;
            updateFields.push(`assigned_to = $${paramCount}`);
            updateValues.push(assigned_to);
        }

        if (reporting_deadline !== undefined) {
            paramCount++;
            updateFields.push(`reporting_deadline = $${paramCount}`);
            updateValues.push(reporting_deadline);
        }

        if (fiscalInfo) {
            paramCount++;
            updateFields.push(`fiscal_year = $${paramCount}`);
            updateValues.push(fiscalInfo.fiscal_year);

            paramCount++;
            updateFields.push(`fiscal_month = $${paramCount}`);
            updateValues.push(fiscalInfo.fiscal_month);
        }

        if (metadata !== undefined) {
            paramCount++;
            updateFields.push(`metadata = $${paramCount}`);
            updateValues.push(JSON.stringify(metadata));
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        paramCount++;
        updateValues.push(id);

        const updateQuery = `
            UPDATE fiscal_calendar_events 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(updateQuery, updateValues);

        // Create notification for update
        await pool.query(`
            INSERT INTO fiscal_calendar_notifications (
                user_id, event_id, type, title, message, priority
            ) VALUES ($1, $2, 'event_updated', $3, $4, 'medium')
        `, [
            event.created_by,
            id,
            'Event Updated',
            `Event "${title || event.title}" has been updated.`
        ]);

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Event updated successfully'
        });
    } catch (error) {
        console.error('Event update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update event' });
    }
});

// DELETE /api/fiscal-calendar/events/:id - Delete event
router.delete('/events/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if event exists and user has permission to delete
        const existingEvent = await pool.query(
            'SELECT * FROM fiscal_calendar_events WHERE id = $1',
            [id]
        );

        if (existingEvent.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const event = existingEvent.rows[0];

        // Check permissions - only creator or admin/manager can delete
        if (event.created_by !== req.user.id && 
            !['admin', 'director', 'pmi'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Permission denied'
            });
        }

        await pool.query('DELETE FROM fiscal_calendar_events WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Event deletion error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete event' });
    }
});

// POST /api/fiscal-calendar/events/:id/approve - Approve/reject event
router.post('/events/:id/approve', authenticateToken, requireManagerOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, comments } = req.body; // action: 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Must be "approve" or "reject"'
            });
        }

        const result = await pool.query(`
            UPDATE fiscal_calendar_events 
            SET approval_status = $1, approved_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND approval_status = 'pending'
            RETURNING *
        `, [action === 'approve' ? 'approved' : 'rejected', req.user.id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found or not pending approval'
            });
        }

        const event = result.rows[0];

        // Create notification for the event creator
        await pool.query(`
            INSERT INTO fiscal_calendar_notifications (
                user_id, event_id, type, title, message, priority
            ) VALUES ($1, $2, $3, $4, $5, 'high')
        `, [
            event.created_by,
            id,
            action === 'approve' ? 'event_approved' : 'event_rejected',
            `Event ${action === 'approve' ? 'Approved' : 'Rejected'}`,
            `Your event "${event.title}" has been ${action}d.${comments ? ` Comments: ${comments}` : ''}`
        ]);

        // Add comment if provided
        if (comments) {
            await pool.query(`
                INSERT INTO fiscal_calendar_comments (
                    event_id, user_id, comment, is_internal
                ) VALUES ($1, $2, $3, true)
            `, [id, req.user.id, `Approval ${action}: ${comments}`]);
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: `Event ${action}d successfully`
        });
    } catch (error) {
        console.error('Event approval error:', error);
        res.status(500).json({ success: false, error: 'Failed to process approval' });
    }
});

// GET /api/fiscal-calendar/event-types - Get all event types
router.get('/event-types', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM fiscal_calendar_event_types 
            WHERE is_active = true 
            ORDER BY sort_order, name
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Event types fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch event types' });
    }
});

// GET /api/fiscal-calendar/events/:id/comments - Get event comments
router.get('/events/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                fcc.*,
                u.username,
                u.first_name || ' ' || u.last_name as user_name
            FROM fiscal_calendar_comments fcc
            JOIN users u ON fcc.user_id = u.id
            WHERE fcc.event_id = $1
            AND (fcc.is_internal = false OR $2 IN ('admin', 'director', 'pmi', 'pm'))
            ORDER BY fcc.created_at ASC
        `, [id, req.user.role]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Comments fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch comments' });
    }
});

// POST /api/fiscal-calendar/events/:id/comments - Add comment
router.post('/events/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { comment, is_internal = false, parent_comment_id } = req.body;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Comment text is required'
            });
        }

        // Check if event exists
        const eventExists = await pool.query(
            'SELECT id FROM fiscal_calendar_events WHERE id = $1',
            [id]
        );

        if (eventExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        const result = await pool.query(`
            INSERT INTO fiscal_calendar_comments (
                event_id, user_id, comment, is_internal, parent_comment_id
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [id, req.user.id, comment.trim(), is_internal, parent_comment_id]);

        // Create notification for event creator and assigned user
        const eventResult = await pool.query(
            'SELECT created_by, assigned_to, title FROM fiscal_calendar_events WHERE id = $1',
            [id]
        );

        if (eventResult.rows.length > 0) {
            const event = eventResult.rows[0];
            const notificationUsers = [event.created_by];
            if (event.assigned_to && event.assigned_to !== event.created_by) {
                notificationUsers.push(event.assigned_to);
            }

            for (const userId of notificationUsers) {
                if (userId !== req.user.id) { // Don't notify the comment author
                    await pool.query(`
                        INSERT INTO fiscal_calendar_notifications (
                            user_id, event_id, type, title, message, priority
                        ) VALUES ($1, $2, 'comment_added', $3, $4, 'medium')
                    `, [
                        userId,
                        id,
                        'New Comment Added',
                        `A new comment was added to event "${event.title}".`
                    ]);
                }
            }
        }

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Comment added successfully'
        });
    } catch (error) {
        console.error('Comment creation error:', error);
        res.status(500).json({ success: false, error: 'Failed to add comment' });
    }
});

// GET /api/fiscal-calendar/notifications - Get user notifications
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, unread_only = false } = req.query;

        let query = `
            SELECT 
                fcn.*,
                fce.title as event_title
            FROM fiscal_calendar_notifications fcn
            LEFT JOIN fiscal_calendar_events fce ON fcn.event_id = fce.id
            WHERE fcn.user_id = $1
        `;
        const params = [req.user.id];

        if (unread_only === 'true') {
            query += ` AND fcn.is_read = false`;
        }

        query += ` ORDER BY fcn.created_at DESC`;

        // Add pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT $2 OFFSET $3`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM fiscal_calendar_notifications 
            WHERE user_id = $1
        `;
        const countParams = [req.user.id];

        if (unread_only === 'true') {
            countQuery += ` AND is_read = false`;
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Notifications fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
});

// PUT /api/fiscal-calendar/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE fiscal_calendar_notifications 
            SET is_read = true, read_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `, [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Notification update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update notification' });
    }
});

// GET /api/fiscal-calendar/fiscal-years - Get fiscal years
router.get('/fiscal-years', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM fiscal_years 
            ORDER BY fiscal_year DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Fiscal years fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch fiscal years' });
    }
});

// GET /api/fiscal-calendar/export/pdf - Export calendar to PDF
router.get('/export/pdf', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date, event_type_id } = req.query;

        // Fetch events for export
        let query = `
            SELECT * FROM fiscal_calendar_events_detailed
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (start_date) {
            paramCount++;
            query += ` AND start_date >= $${paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND end_date <= $${paramCount}`;
            params.push(end_date);
        }

        if (event_type_id) {
            paramCount++;
            query += ` AND event_type_id = $${paramCount}`;
            params.push(event_type_id);
        }

        query += ` ORDER BY start_date ASC`;

        const result = await pool.query(query, params);
        const events = result.rows;

        // Create PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="fiscal-calendar.pdf"');

        doc.pipe(res);

        // Add title
        doc.fontSize(20).text('Fiscal Year Calendar', 50, 50);
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);

        let yPosition = 120;

        events.forEach((event, index) => {
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }

            doc.fontSize(14).text(`${index + 1}. ${event.title}`, 50, yPosition);
            yPosition += 20;

            doc.fontSize(10)
                .text(`Type: ${event.event_type_name}`, 70, yPosition)
                .text(`Start: ${new Date(event.start_date).toLocaleDateString()}`, 250, yPosition)
                .text(`End: ${new Date(event.end_date).toLocaleDateString()}`, 400, yPosition);
            yPosition += 15;

            if (event.description) {
                doc.text(`Description: ${event.description}`, 70, yPosition);
                yPosition += 15;
            }

            doc.text(`Status: ${event.status}`, 70, yPosition)
                .text(`Priority: ${event.priority}`, 200, yPosition);
            yPosition += 25;
        });

        doc.end();
    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).json({ success: false, error: 'Failed to export PDF' });
    }
});

// GET /api/fiscal-calendar/export/excel - Export calendar to Excel
router.get('/export/excel', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date, event_type_id } = req.query;

        // Fetch events for export
        let query = `
            SELECT * FROM fiscal_calendar_events_detailed
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (start_date) {
            paramCount++;
            query += ` AND start_date >= $${paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND end_date <= $${paramCount}`;
            params.push(end_date);
        }

        if (event_type_id) {
            paramCount++;
            query += ` AND event_type_id = $${paramCount}`;
            params.push(event_type_id);
        }

        query += ` ORDER BY start_date ASC`;

        const result = await pool.query(query, params);
        const events = result.rows;

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Fiscal Calendar');

        // Add headers
        worksheet.columns = [
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Event Type', key: 'event_type_name', width: 20 },
            { header: 'Start Date', key: 'start_date', width: 15 },
            { header: 'End Date', key: 'end_date', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Priority', key: 'priority', width: 15 },
            { header: 'Assigned To', key: 'assigned_to_name', width: 20 },
            { header: 'Created By', key: 'created_by_name', width: 20 },
            { header: 'Description', key: 'description', width: 40 }
        ];

        // Add data
        events.forEach(event => {
            worksheet.addRow({
                title: event.title,
                event_type_name: event.event_type_name,
                start_date: new Date(event.start_date).toLocaleDateString(),
                end_date: new Date(event.end_date).toLocaleDateString(),
                status: event.status,
                priority: event.priority,
                assigned_to_name: event.assigned_to_name || '',
                created_by_name: event.created_by_name || '',
                description: event.description || ''
            });
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="fiscal-calendar.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({ success: false, error: 'Failed to export Excel' });
    }
});

module.exports = router;

