const { Pool } = require('pg');
const scheduledTaskService = require('../services/scheduledTaskService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pfmt_integrated',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

class ScheduledSubmissionController {
    /**
     * Get scheduled submission configuration
     */
    async getConfiguration(req, res) {
        try {
            const configQuery = `
                SELECT key, value, description 
                FROM system_config 
                WHERE key LIKE 'auto_submission%'
                ORDER BY key
            `;
            
            const result = await pool.query(configQuery);
            
            const config = {};
            result.rows.forEach(row => {
                config[row.key] = {
                    value: row.value,
                    description: row.description
                };
            });

            // Add job status
            const jobStatus = scheduledTaskService.getJobStatus();

            res.json({
                success: true,
                data: {
                    configuration: config,
                    jobStatus: jobStatus,
                    isServiceInitialized: scheduledTaskService.isInitialized
                }
            });

        } catch (error) {
            console.error('Error getting scheduled submission configuration:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get configuration',
                error: error.message
            });
        }
    }

    /**
     * Update scheduled submission configuration
     */
    async updateConfiguration(req, res) {
        try {
            const { auto_submission_enabled, auto_submission_cron, auto_submission_min_age_days } = req.body;

            // Validate inputs
            if (auto_submission_enabled !== undefined && typeof auto_submission_enabled !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'auto_submission_enabled must be a boolean'
                });
            }

            if (auto_submission_cron && !this.isValidCronExpression(auto_submission_cron)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid cron expression'
                });
            }

            if (auto_submission_min_age_days !== undefined && (!Number.isInteger(auto_submission_min_age_days) || auto_submission_min_age_days < 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'auto_submission_min_age_days must be a non-negative integer'
                });
            }

            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');

                // Update configuration values
                const updates = [];
                if (auto_submission_enabled !== undefined) {
                    updates.push(['auto_submission_enabled', auto_submission_enabled.toString()]);
                }
                if (auto_submission_cron) {
                    updates.push(['auto_submission_cron', auto_submission_cron]);
                }
                if (auto_submission_min_age_days !== undefined) {
                    updates.push(['auto_submission_min_age_days', auto_submission_min_age_days.toString()]);
                }

                for (const [key, value] of updates) {
                    await client.query(
                        'UPDATE system_config SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
                        [value, key]
                    );
                }

                await client.query('COMMIT');

                // Restart scheduled service if cron expression changed
                if (auto_submission_cron) {
                    scheduledTaskService.stopAllJobs();
                    await scheduledTaskService.initialize();
                }

                res.json({
                    success: true,
                    message: 'Configuration updated successfully'
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Error updating scheduled submission configuration:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update configuration',
                error: error.message
            });
        }
    }

    /**
     * Get scheduled submission history
     */
    async getSubmissionHistory(req, res) {
        try {
            const { page = 1, limit = 20, status, project_id } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = '';
            const queryParams = [limit, offset];
            let paramIndex = 3;

            if (status) {
                whereClause += ` AND ss.status = $${paramIndex}`;
                queryParams.push(status);
                paramIndex++;
            }

            if (project_id) {
                whereClause += ` AND ss.project_id = $${paramIndex}`;
                queryParams.push(project_id);
                paramIndex++;
            }

            const historyQuery = `
                SELECT 
                    ss.id,
                    ss.project_id,
                    ss.version_id,
                    ss.status,
                    ss.error_message,
                    ss.created_at,
                    p.name as project_name,
                    pv.version_number
                FROM scheduled_submissions ss
                INNER JOIN projects p ON ss.project_id = p.id
                INNER JOIN project_versions pv ON ss.version_id = pv.id
                WHERE 1=1 ${whereClause}
                ORDER BY ss.created_at DESC
                LIMIT $1 OFFSET $2
            `;

            const countQuery = `
                SELECT COUNT(*) as total
                FROM scheduled_submissions ss
                INNER JOIN projects p ON ss.project_id = p.id
                INNER JOIN project_versions pv ON ss.version_id = pv.id
                WHERE 1=1 ${whereClause}
            `;

            const [historyResult, countResult] = await Promise.all([
                pool.query(historyQuery, queryParams),
                pool.query(countQuery, queryParams.slice(2)) // Remove limit and offset for count
            ]);

            const total = parseInt(countResult.rows[0].total);
            const totalPages = Math.ceil(total / limit);

            res.json({
                success: true,
                data: {
                    submissions: historyResult.rows,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        totalPages
                    }
                }
            });

        } catch (error) {
            console.error('Error getting submission history:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get submission history',
                error: error.message
            });
        }
    }

    /**
     * Get projects eligible for auto-submission
     */
    async getEligibleProjects(req, res) {
        try {
            const eligibleQuery = `
                SELECT DISTINCT 
                    p.id as project_id,
                    p.name as project_name,
                    p.auto_submission_enabled,
                    pv.id as version_id,
                    pv.version_number,
                    pv.created_at as version_created_at,
                    pv.status,
                    CASE 
                        WHEN ss.id IS NOT NULL THEN true 
                        ELSE false 
                    END as submitted_this_month
                FROM projects p
                INNER JOIN project_versions pv ON p.id = pv.project_id
                LEFT JOIN scheduled_submissions ss ON pv.id = ss.version_id 
                    AND DATE_TRUNC('month', ss.created_at) = DATE_TRUNC('month', CURRENT_DATE)
                WHERE pv.status = 'draft'
                    AND pv.is_current = true
                    AND p.auto_submission_enabled = true
                ORDER BY p.name, pv.version_number DESC
            `;

            const result = await pool.query(eligibleQuery);

            res.json({
                success: true,
                data: {
                    projects: result.rows
                }
            });

        } catch (error) {
            console.error('Error getting eligible projects:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get eligible projects',
                error: error.message
            });
        }
    }

    /**
     * Manually trigger auto-submission (for testing)
     */
    async triggerAutoSubmission(req, res) {
        try {
            // Check if user has admin role
            if (req.user.role !== 'admin' && req.user.role !== 'director') {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to trigger auto-submission'
                });
            }

            await scheduledTaskService.triggerAutoSubmission();

            res.json({
                success: true,
                message: 'Auto-submission triggered successfully'
            });

        } catch (error) {
            console.error('Error triggering auto-submission:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to trigger auto-submission',
                error: error.message
            });
        }
    }

    /**
     * Update project auto-submission setting
     */
    async updateProjectAutoSubmission(req, res) {
        try {
            const { project_id } = req.params;
            const { auto_submission_enabled } = req.body;

            if (typeof auto_submission_enabled !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'auto_submission_enabled must be a boolean'
                });
            }

            // Check if user has permission to modify this project
            const permissionQuery = `
                SELECT id FROM projects 
                WHERE id = $1 AND (
                    project_manager_id = $2 OR 
                    senior_project_manager_id = $2 OR
                    $3 IN ('admin', 'director')
                )
            `;

            const permissionResult = await pool.query(permissionQuery, [
                project_id, 
                req.user.id, 
                req.user.role
            ]);

            if (permissionResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to modify this project'
                });
            }

            // Update the project
            const updateQuery = `
                UPDATE projects 
                SET auto_submission_enabled = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING id, name, auto_submission_enabled
            `;

            const result = await pool.query(updateQuery, [auto_submission_enabled, project_id]);

            res.json({
                success: true,
                message: 'Project auto-submission setting updated',
                data: result.rows[0]
            });

        } catch (error) {
            console.error('Error updating project auto-submission:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update project setting',
                error: error.message
            });
        }
    }

    /**
     * Validate cron expression (basic validation)
     */
    isValidCronExpression(cron) {
        // Basic cron validation - should have 5 parts (minute hour day month dayOfWeek)
        const parts = cron.trim().split(/\s+/);
        return parts.length === 5;
    }
}

module.exports = new ScheduledSubmissionController();

