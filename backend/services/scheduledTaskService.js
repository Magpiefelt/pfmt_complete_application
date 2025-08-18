const cron = require('node-cron');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
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

class ScheduledTaskService {
    constructor() {
        this.jobs = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the scheduled task service
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('Scheduled task service already initialized');
            return;
        }

        try {
            // Test database connection
            await pool.query('SELECT NOW()');
            console.log('✅ Scheduled task service database connection established');

            // Start scheduled jobs
            this.startAutoSubmissionJob();
            this.startCleanupJob();

            this.isInitialized = true;
            console.log('✅ Scheduled task service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize scheduled task service:', error);
            throw error;
        }
    }

    /**
     * Start the monthly auto-submission job
     * Runs on the last day of each month at 9:00 AM Edmonton time
     */
    startAutoSubmissionJob() {
        // Cron expression: 0 9 L * * (9 AM on last day of each month)
        // Note: L means "last day of month" but not all cron implementations support it
        // Using a more compatible approach: run daily and check if it's the last day
        const cronExpression = process.env.AUTO_SUBMISSION_CRON || '0 9 * * *';
        
        const job = cron.schedule(cronExpression, async () => {
            // Check if today is the last day of the month
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            // If tomorrow is in a different month, today is the last day
            if (tomorrow.getMonth() !== today.getMonth()) {
                console.log('🔄 Starting monthly auto-submission job (last day of month)...');
                await this.performAutoSubmission();
            }
        }, {
            scheduled: true,
            timezone: 'America/Edmonton'
        });

        this.jobs.set('autoSubmission', job);
        console.log(`✅ Auto-submission job scheduled: ${cronExpression} (America/Edmonton) - runs on last day of each month`);
    }

    /**
     * Start the cleanup job for old logs
     * Runs daily at 2:00 AM to clean up old submission logs
     */
    startCleanupJob() {
        const cronExpression = '0 2 * * *'; // Daily at 2 AM
        
        const job = cron.schedule(cronExpression, async () => {
            console.log('🧹 Starting cleanup job...');
            await this.cleanupOldLogs();
        }, {
            scheduled: true,
            timezone: 'America/Edmonton'
        });

        this.jobs.set('cleanup', job);
        console.log(`✅ Cleanup job scheduled: ${cronExpression} (America/Edmonton)`);
    }

    /**
     * Perform auto-submission of eligible project versions
     */
    async performAutoSubmission() {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Find projects with draft versions that are eligible for auto-submission
            const eligibleProjectsQuery = `
                SELECT DISTINCT 
                    p.id as project_id,
                    p.name as project_name,
                    pv.id as version_id,
                    pv.version_number,
                    pv.created_at as version_created_at,
                    p.project_manager_id,
                    p.senior_project_manager_id
                FROM projects p
                INNER JOIN project_versions pv ON p.id = pv.project_id
                LEFT JOIN scheduled_submissions ss ON pv.id = ss.version_id 
                    AND DATE_TRUNC('month', ss.created_at) = DATE_TRUNC('month', CURRENT_DATE)
                WHERE pv.status = 'draft'
                    AND pv.is_current = true
                    AND ss.id IS NULL  -- Not already submitted this month
                    AND p.auto_submission_enabled = true
                    AND pv.created_at < CURRENT_DATE - INTERVAL '7 days'  -- At least 7 days old
                ORDER BY p.id, pv.version_number DESC
            `;

            const eligibleProjects = await client.query(eligibleProjectsQuery);
            
            console.log(`📋 Found ${eligibleProjects.rows.length} eligible projects for auto-submission`);

            let successCount = 0;
            let errorCount = 0;

            for (const project of eligibleProjects.rows) {
                try {
                    // Submit the version for approval
                    await this.submitVersionForApproval(client, project);
                    
                    // Log the submission
                    await this.logScheduledSubmission(client, project, 'success');
                    
                    successCount++;
                    console.log(`✅ Auto-submitted version ${project.version_number} for project: ${project.project_name}`);
                    
                } catch (error) {
                    console.error(`❌ Failed to auto-submit project ${project.project_name}:`, error);
                    
                    // Log the error
                    await this.logScheduledSubmission(client, project, 'error', error.message);
                    errorCount++;
                }
            }

            await client.query('COMMIT');
            
            console.log(`🎯 Auto-submission completed: ${successCount} successful, ${errorCount} errors`);
            
            // Send notification email if configured
            if (process.env.NOTIFICATION_EMAIL) {
                await this.sendNotificationEmail(successCount, errorCount, eligibleProjects.rows);
            }

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Auto-submission job failed:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Submit a project version for approval
     */
    async submitVersionForApproval(client, project) {
        // Update version status to 'pending_approval'
        const updateVersionQuery = `
            UPDATE project_versions 
            SET status = 'pending_approval',
                submitted_at = CURRENT_TIMESTAMP,
                submitted_by = 'system_auto_submission'
            WHERE id = $1
        `;
        
        await client.query(updateVersionQuery, [project.version_id]);

        // Create approval workflow entry
        const createApprovalQuery = `
            INSERT INTO approval_workflows (
                project_id,
                version_id,
                status,
                submitted_by,
                submitted_at,
                created_at,
                updated_at
            ) VALUES ($1, $2, 'pending', 'system_auto_submission', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        await client.query(createApprovalQuery, [project.project_id, project.version_id]);

        // Create notification for directors
        const notificationQuery = `
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data,
                created_at
            )
            SELECT 
                u.id,
                'approval_required',
                'Auto-Submission: Project Requires Approval',
                $1,
                $2,
                CURRENT_TIMESTAMP
            FROM users u
            WHERE u.role = 'director'
        `;
        
        const notificationMessage = `Project "${project.project_name}" version ${project.version_number} has been automatically submitted for approval.`;
        const notificationData = JSON.stringify({
            project_id: project.project_id,
            version_id: project.version_id,
            submission_type: 'auto_submission'
        });
        
        await client.query(notificationQuery, [notificationMessage, notificationData]);
    }

    /**
     * Log scheduled submission attempt
     */
    async logScheduledSubmission(client, project, status, errorMessage = null) {
        const logQuery = `
            INSERT INTO scheduled_submissions (
                project_id,
                version_id,
                status,
                error_message,
                created_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `;
        
        await client.query(logQuery, [
            project.project_id,
            project.version_id,
            status,
            errorMessage
        ]);
    }

    /**
     * Clean up old submission logs (older than 6 months)
     */
    async cleanupOldLogs() {
        try {
            const cleanupQuery = `
                DELETE FROM scheduled_submissions 
                WHERE created_at < CURRENT_DATE - INTERVAL '6 months'
            `;
            
            const result = await pool.query(cleanupQuery);
            console.log(`🧹 Cleaned up ${result.rowCount} old submission logs`);
            
        } catch (error) {
            console.error('❌ Failed to cleanup old logs:', error);
        }
    }

    /**
     * Send notification email about auto-submission results
     */
    async sendNotificationEmail(successCount, errorCount, projects) {
        const to = process.env.NOTIFICATION_EMAIL;
        if (!to) {
            console.log(`📧 Email notification: ${successCount} successful submissions, ${errorCount} errors`);
            return;
        }

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'localhost',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: process.env.SMTP_USER ? {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                } : undefined
            });

            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com',
                to,
                subject: 'Scheduled Submission Results',
                text: `Auto-submission completed: ${successCount} success, ${errorCount} errors.`
            });

            console.log(`📧 Notification email sent: ${info.messageId}`);
        } catch (error) {
            console.error('❌ Failed to send notification email:', error);
        }
    }

    /**
     * Stop all scheduled jobs
     */
    stopAllJobs() {
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`⏹️ Stopped job: ${name}`);
        });
        this.jobs.clear();
        this.isInitialized = false;
    }

    /**
     * Get status of all scheduled jobs
     */
    getJobStatus() {
        const status = {};
        this.jobs.forEach((job, name) => {
            status[name] = {
                running: job.running,
                scheduled: job.scheduled
            };
        });
        return status;
    }

    /**
     * Manually trigger auto-submission (for testing)
     */
    async triggerAutoSubmission() {
        console.log('🔄 Manually triggering auto-submission...');
        await this.performAutoSubmission();
    }
}

// Create singleton instance
const scheduledTaskService = new ScheduledTaskService();

module.exports = scheduledTaskService;

