/**
 * Report Model
 * Handles project reporting and documentation for Team A integration
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');

class Report {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.projectId = data.projectId;
        this.type = data.type;
        this.title = data.title;
        this.content = data.content;
        this.status = data.status || 'Draft';
        this.createdBy = data.createdBy;
        this.approvedBy = data.approvedBy;
        this.submittedAt = data.submittedAt;
        this.approvedAt = data.approvedAt;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Create Report instance from database row
     */
    static fromDb(row = {}) {
        if (!row) return null;
        return new Report({
            id: row.id,
            projectId: row.project_id,
            type: row.type,
            title: row.title,
            content: row.content,
            status: row.status,
            createdBy: row.created_by,
            approvedBy: row.approved_by,
            submittedAt: row.submitted_at,
            approvedAt: row.approved_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Convert Report instance to database format
     */
    toDb() {
        return {
            id: this.id,
            project_id: this.projectId,
            type: this.type,
            title: this.title,
            content: this.content,
            status: this.status,
            created_by: this.createdBy,
            approved_by: this.approvedBy,
            submitted_at: this.submittedAt,
            approved_at: this.approvedAt
        };
    }

    /**
     * Find all reports with optional filtering
     */
    static async findAll(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            // Add filters
            if (options.projectId) {
                whereClause += ` AND r.project_id = $${++paramCount}`;
                params.push(options.projectId);
            }

            if (options.type) {
                whereClause += ` AND r.type = $${++paramCount}`;
                params.push(options.type);
            }

            if (options.status) {
                whereClause += ` AND r.status = $${++paramCount}`;
                params.push(options.status);
            }

            if (options.createdBy) {
                whereClause += ` AND r.created_by = $${++paramCount}`;
                params.push(options.createdBy);
            }

            // Add sorting
            const orderBy = options.orderBy || 'r.created_at DESC';
            
            // Add pagination
            let limitClause = '';
            if (options.limit) {
                limitClause += ` LIMIT $${++paramCount}`;
                params.push(options.limit);
                
                if (options.offset) {
                    limitClause += ` OFFSET $${++paramCount}`;
                    params.push(options.offset);
                }
            }

            const queryText = `
                SELECT 
                    r.*,
                    p.project_name,
                    u1.first_name || ' ' || u1.last_name as created_by_name,
                    u2.first_name || ' ' || u2.last_name as approved_by_name
                FROM reports r
                LEFT JOIN projects p ON r.project_id = p.id
                LEFT JOIN users u1 ON r.created_by = u1.id
                LEFT JOIN users u2 ON r.approved_by = u2.id
                ${whereClause}
                ORDER BY ${orderBy}
                ${limitClause}
            `;

            const result = await query(queryText, params);
            return result.rows.map(row => ({
                ...Report.fromDb(row),
                projectName: row.project_name,
                createdByName: row.created_by_name,
                approvedByName: row.approved_by_name
            }));
        } catch (error) {
            console.error('Error finding reports:', error);
            throw error;
        }
    }

    /**
     * Find report by ID
     */
    static async findById(id) {
        try {
            const queryText = `
                SELECT 
                    r.*,
                    p.project_name,
                    u1.first_name || ' ' || u1.last_name as created_by_name,
                    u2.first_name || ' ' || u2.last_name as approved_by_name
                FROM reports r
                LEFT JOIN projects p ON r.project_id = p.id
                LEFT JOIN users u1 ON r.created_by = u1.id
                LEFT JOIN users u2 ON r.approved_by = u2.id
                WHERE r.id = $1
            `;

            const result = await query(queryText, [id]);
            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                ...Report.fromDb(row),
                projectName: row.project_name,
                createdByName: row.created_by_name,
                approvedByName: row.approved_by_name
            };
        } catch (error) {
            console.error('Error finding report by ID:', error);
            throw error;
        }
    }

    /**
     * Find reports by project ID
     */
    static async findByProject(projectId) {
        return await Report.findAll({ projectId });
    }

    /**
     * Find reports by type
     */
    static async findByType(type) {
        return await Report.findAll({ type });
    }

    /**
     * Save report (create or update)
     */
    async save(userId = null) {
        try {
            const dbData = this.toDb();
            
            if (this.createdAt) {
                // Update existing report
                const queryText = `
                    UPDATE reports 
                    SET 
                        project_id = $2,
                        type = $3,
                        title = $4,
                        content = $5,
                        status = $6,
                        approved_by = $7,
                        submitted_at = $8,
                        approved_at = $9,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.project_id,
                    dbData.type,
                    dbData.title,
                    dbData.content,
                    dbData.status,
                    dbData.approved_by,
                    dbData.submitted_at,
                    dbData.approved_at
                ];

                const result = await query(queryText, params);
                const updatedReport = Report.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('UPDATE', 'report', this.id, userId, {
                        title: this.title,
                        type: this.type,
                        status: this.status
                    });
                }

                return updatedReport;
            } else {
                // Create new report
                const queryText = `
                    INSERT INTO reports (
                        id, project_id, type, title, content, status, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.project_id,
                    dbData.type,
                    dbData.title,
                    dbData.content,
                    dbData.status,
                    userId || dbData.created_by
                ];

                const result = await query(queryText, params);
                const newReport = Report.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('CREATE', 'report', this.id, userId, {
                        title: this.title,
                        type: this.type
                    });
                }

                return newReport;
            }
        } catch (error) {
            console.error('Error saving report:', error);
            throw error;
        }
    }

    /**
     * Update report data
     */
    async update(data, userId = null) {
        try {
            // Update instance properties
            Object.keys(data).forEach(key => {
                if (this.hasOwnProperty(key) && key !== 'id') {
                    this[key] = data[key];
                }
            });

            return await this.save(userId);
        } catch (error) {
            console.error('Error updating report:', error);
            throw error;
        }
    }

    /**
     * Delete report
     */
    async delete(userId = null) {
        try {
            const queryText = 'DELETE FROM reports WHERE id = $1 RETURNING *';
            const result = await query(queryText, [this.id]);
            
            if (result.rows.length === 0) {
                throw new Error('Report not found');
            }

            // Audit log
            if (userId) {
                auditLogger('DELETE', 'report', this.id, userId, {
                    title: this.title,
                    type: this.type
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting report:', error);
            throw error;
        }
    }

    /**
     * Submit report for approval
     */
    async submit(userId) {
        try {
            this.status = 'Submitted';
            this.submittedAt = new Date().toISOString();
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('SUBMIT', 'report', this.id, userId, {
                title: this.title,
                type: this.type,
                previousStatus: 'Draft',
                newStatus: 'Submitted'
            });

            return result;
        } catch (error) {
            console.error('Error submitting report:', error);
            throw error;
        }
    }

    /**
     * Approve report
     */
    async approve(userId) {
        try {
            this.status = 'Approved';
            this.approvedBy = userId;
            this.approvedAt = new Date().toISOString();
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('APPROVE', 'report', this.id, userId, {
                title: this.title,
                type: this.type,
                previousStatus: 'Submitted',
                newStatus: 'Approved'
            });

            return result;
        } catch (error) {
            console.error('Error approving report:', error);
            throw error;
        }
    }

    /**
     * Reject report
     */
    async reject(userId, reason = null) {
        try {
            this.status = 'Rejected';
            this.approvedBy = userId;
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('REJECT', 'report', this.id, userId, {
                title: this.title,
                type: this.type,
                previousStatus: 'Submitted',
                newStatus: 'Rejected',
                reason: reason
            });

            return result;
        } catch (error) {
            console.error('Error rejecting report:', error);
            throw error;
        }
    }

    /**
     * Get report statistics
     */
    static async getStatistics(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            if (options.projectId) {
                whereClause += ` AND project_id = $${++paramCount}`;
                params.push(options.projectId);
            }

            if (options.type) {
                whereClause += ` AND type = $${++paramCount}`;
                params.push(options.type);
            }

            const queryText = `
                SELECT 
                    COUNT(*) as total_reports,
                    COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_reports,
                    COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted_reports,
                    COUNT(CASE WHEN status = 'Under Review' THEN 1 END) as under_review_reports,
                    COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_reports,
                    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_reports,
                    COUNT(DISTINCT type) as report_types,
                    COUNT(DISTINCT project_id) as projects_with_reports
                FROM reports
                ${whereClause}
            `;

            const result = await query(queryText, params);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting report statistics:', error);
            throw error;
        }
    }

    /**
     * Get report types
     */
    static async getReportTypes() {
        try {
            const queryText = `
                SELECT DISTINCT type, COUNT(*) as count
                FROM reports
                GROUP BY type
                ORDER BY count DESC, type ASC
            `;

            const result = await query(queryText);
            return result.rows;
        } catch (error) {
            console.error('Error getting report types:', error);
            throw error;
        }
    }

    /**
     * Validate report data
     */
    validate() {
        const errors = [];

        if (!this.projectId) errors.push('Project ID is required');
        if (!this.type) errors.push('Report type is required');
        if (!this.title) errors.push('Title is required');
        
        const validStatuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push('Invalid status');
        }

        if (this.title && this.title.length > 255) {
            errors.push('Title cannot exceed 255 characters');
        }

        if (this.type && this.type.length > 100) {
            errors.push('Report type cannot exceed 100 characters');
        }

        return errors;
    }
}

module.exports = Report;

