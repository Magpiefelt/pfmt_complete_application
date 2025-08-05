const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireDirectorOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all reports
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { reportType, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
            SELECT r.*, 
                   u.first_name || ' ' || u.last_name as created_by_name
            FROM reports r
            LEFT JOIN users u ON r.created_by = u.id
            WHERE r.is_active = true
        `;
        
        const queryParams = [];
        let paramCount = 0;

        if (reportType) {
            paramCount++;
            queryText += ` AND r.report_type = $${paramCount}`;
            queryParams.push(reportType);
        }

        if (search) {
            paramCount++;
            queryText += ` AND (r.report_name ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        queryText += ` ORDER BY r.created_at DESC`;
        
        paramCount++;
        queryText += ` LIMIT $${paramCount}`;
        queryParams.push(limit);
        
        paramCount++;
        queryText += ` OFFSET $${paramCount}`;
        queryParams.push(offset);

        const result = await query(queryText, queryParams);

        res.json({
            reports: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get project status dashboard data
router.get('/dashboard/project-status', authenticateToken, async (req, res) => {
    try {
        // Get project counts by status
        const statusResult = await query(`
            SELECT status, COUNT(*) as count
            FROM projects
            GROUP BY status
            ORDER BY status
        `);

        // Get project counts by priority
        const priorityResult = await query(`
            SELECT priority, COUNT(*) as count
            FROM projects
            WHERE priority IS NOT NULL
            GROUP BY priority
            ORDER BY priority
        `);

        // Get recent projects
        const recentProjectsResult = await query(`
            SELECT p.project_name, p.project_code, p.status, p.priority, p.created_at,
                   u.first_name || ' ' || u.last_name as manager_name
            FROM projects p
            LEFT JOIN users u ON p.project_manager_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 10
        `);

        // Get upcoming gate meetings
        const upcomingMeetingsResult = await query(`
            SELECT gm.gate_name, gm.scheduled_date, gm.status,
                   p.project_name, p.project_code
            FROM gate_meetings gm
            JOIN projects p ON gm.project_id = p.id
            WHERE gm.scheduled_date >= CURRENT_DATE AND gm.status = 'Scheduled'
            ORDER BY gm.scheduled_date
            LIMIT 10
        `);

        res.json({
            projectsByStatus: statusResult.rows,
            projectsByPriority: priorityResult.rows,
            recentProjects: recentProjectsResult.rows,
            upcomingMeetings: upcomingMeetingsResult.rows
        });

    } catch (error) {
        console.error('Get dashboard data error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get monthly project summary
router.get('/monthly-summary', [authenticateToken, requireDirectorOrAdmin], async (req, res) => {
    try {
        const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

        // Projects created this month
        const newProjectsResult = await query(`
            SELECT COUNT(*) as count
            FROM projects
            WHERE EXTRACT(YEAR FROM created_at) = $1 
            AND EXTRACT(MONTH FROM created_at) = $2
        `, [year, month]);

        // Projects completed this month
        const completedProjectsResult = await query(`
            SELECT COUNT(*) as count
            FROM projects
            WHERE status = 'Completed'
            AND EXTRACT(YEAR FROM updated_at) = $1 
            AND EXTRACT(MONTH FROM updated_at) = $2
        `, [year, month]);

        // Gate meetings held this month
        const gateMeetingsResult = await query(`
            SELECT COUNT(*) as count
            FROM gate_meetings
            WHERE actual_date IS NOT NULL
            AND EXTRACT(YEAR FROM actual_date) = $1 
            AND EXTRACT(MONTH FROM actual_date) = $2
        `, [year, month]);

        // Budget summary
        const budgetResult = await query(`
            SELECT 
                SUM(budget) as total_budget,
                SUM(actual_cost) as total_actual_cost,
                COUNT(*) as active_projects
            FROM projects
            WHERE status IN ('Planning', 'Active')
        `);

        res.json({
            period: { year: parseInt(year), month: parseInt(month) },
            newProjects: parseInt(newProjectsResult.rows[0].count),
            completedProjects: parseInt(completedProjectsResult.rows[0].count),
            gateMeetingsHeld: parseInt(gateMeetingsResult.rows[0].count),
            budget: budgetResult.rows[0]
        });

    } catch (error) {
        console.error('Get monthly summary error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get resource utilization report
router.get('/resource-utilization', [authenticateToken, requireDirectorOrAdmin], async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                u.id,
                u.first_name || ' ' || u.last_name as name,
                u.role,
                u.department,
                COUNT(ptm.project_id) as active_projects,
                STRING_AGG(p.project_name, ', ') as project_names
            FROM users u
            LEFT JOIN project_team_members ptm ON u.id = ptm.user_id AND ptm.is_active = true
            LEFT JOIN projects p ON ptm.project_id = p.id AND p.status IN ('Planning', 'Active')
            WHERE u.is_active = true
            GROUP BY u.id, u.first_name, u.last_name, u.role, u.department
            ORDER BY active_projects DESC, u.first_name, u.last_name
        `);

        res.json({
            resourceUtilization: result.rows
        });

    } catch (error) {
        console.error('Get resource utilization error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get gate meeting tracking report
router.get('/gate-meeting-tracking', authenticateToken, async (req, res) => {
    try {
        const { projectId, status, startDate, endDate } = req.query;

        let queryText = `
            SELECT 
                gm.*,
                p.project_name,
                p.project_code,
                u.first_name || ' ' || u.last_name as created_by_name,
                COUNT(gma.user_id) as attendee_count
            FROM gate_meetings gm
            JOIN projects p ON gm.project_id = p.id
            LEFT JOIN users u ON gm.created_by = u.id
            LEFT JOIN gate_meeting_attendees gma ON gm.id = gma.gate_meeting_id
            WHERE 1=1
        `;

        const queryParams = [];
        let paramCount = 0;

        if (projectId) {
            paramCount++;
            queryText += ` AND gm.project_id = $${paramCount}`;
            queryParams.push(projectId);
        }

        if (status) {
            paramCount++;
            queryText += ` AND gm.status = $${paramCount}`;
            queryParams.push(status);
        }

        if (startDate) {
            paramCount++;
            queryText += ` AND gm.scheduled_date >= $${paramCount}`;
            queryParams.push(startDate);
        }

        if (endDate) {
            paramCount++;
            queryText += ` AND gm.scheduled_date <= $${paramCount}`;
            queryParams.push(endDate);
        }

        queryText += ` GROUP BY gm.id, p.project_name, p.project_code, u.first_name, u.last_name ORDER BY gm.scheduled_date DESC`;

        const result = await query(queryText, queryParams);

        res.json({
            gateMeetings: result.rows
        });

    } catch (error) {
        console.error('Get gate meeting tracking error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Create custom report
router.post('/', [
    authenticateToken,
    requireDirectorOrAdmin,
    body('reportName').notEmpty().withMessage('Report name is required'),
    body('reportType').notEmpty().withMessage('Report type is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: {
                    message: 'Validation failed',
                    details: errors.array()
                }
            });
        }

        const {
            reportName,
            reportType,
            description,
            parameters
        } = req.body;

        const result = await query(`
            INSERT INTO reports (report_name, report_type, description, parameters, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            reportName,
            reportType,
            description,
            JSON.stringify(parameters),
            req.user.id
        ]);

        res.status(201).json({
            message: 'Report created successfully',
            report: result.rows[0]
        });

    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

module.exports = router;

