/**
 * ChangeOrder Model
 * Handles change orders for project modifications and budget adjustments for Team A integration
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');

class ChangeOrder {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.projectId = data.projectId;
        this.contractId = data.contractId;
        this.changeOrderNumber = data.changeOrderNumber;
        this.title = data.title;
        this.description = data.description;
        this.reason = data.reason;
        this.costImpact = data.costImpact || 0;
        this.scheduleImpact = data.scheduleImpact;
        this.status = data.status || 'Draft';
        this.requestedBy = data.requestedBy;
        this.approvedBy = data.approvedBy;
        this.submittedAt = data.submittedAt;
        this.approvedAt = data.approvedAt;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Create ChangeOrder instance from database row
     */
    static fromDb(row = {}) {
        if (!row) return null;
        return new ChangeOrder({
            id: row.id,
            projectId: row.project_id,
            contractId: row.contract_id,
            changeOrderNumber: row.change_order_number,
            title: row.title,
            description: row.description,
            reason: row.reason,
            costImpact: row.cost_impact,
            scheduleImpact: row.schedule_impact,
            status: row.status,
            requestedBy: row.requested_by,
            approvedBy: row.approved_by,
            submittedAt: row.submitted_at,
            approvedAt: row.approved_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Convert ChangeOrder instance to database format
     */
    toDb() {
        return {
            id: this.id,
            project_id: this.projectId,
            contract_id: this.contractId,
            change_order_number: this.changeOrderNumber,
            title: this.title,
            description: this.description,
            reason: this.reason,
            cost_impact: this.costImpact,
            schedule_impact: this.scheduleImpact,
            status: this.status,
            requested_by: this.requestedBy,
            approved_by: this.approvedBy,
            submitted_at: this.submittedAt,
            approved_at: this.approvedAt
        };
    }

    /**
     * Find all change orders with optional filtering
     */
    static async findAll(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            // Add filters
            if (options.projectId) {
                whereClause += ` AND co.project_id = $${++paramCount}`;
                params.push(options.projectId);
            }

            if (options.contractId) {
                whereClause += ` AND co.contract_id = $${++paramCount}`;
                params.push(options.contractId);
            }

            if (options.status) {
                whereClause += ` AND co.status = $${++paramCount}`;
                params.push(options.status);
            }

            if (options.requestedBy) {
                whereClause += ` AND co.requested_by = $${++paramCount}`;
                params.push(options.requestedBy);
            }

            if (options.costImpactMin !== undefined) {
                whereClause += ` AND co.cost_impact >= $${++paramCount}`;
                params.push(options.costImpactMin);
            }

            if (options.costImpactMax !== undefined) {
                whereClause += ` AND co.cost_impact <= $${++paramCount}`;
                params.push(options.costImpactMax);
            }

            if (options.search) {
                whereClause += ` AND (co.title ILIKE $${++paramCount} OR co.description ILIKE $${++paramCount})`;
                params.push(`%${options.search}%`);
                params.push(`%${options.search}%`);
                paramCount++; // Account for the second parameter
            }

            // Add sorting
            const orderBy = options.orderBy || 'co.created_at DESC';
            
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
                    co.*,
                    p.project_name,
                    c.title as contract_title,
                    c.contract_number,
                    u1.first_name || ' ' || u1.last_name as requested_by_name,
                    u2.first_name || ' ' || u2.last_name as approved_by_name
                FROM change_orders co
                LEFT JOIN projects p ON co.project_id = p.id
                LEFT JOIN contracts c ON co.contract_id = c.id
                LEFT JOIN users u1 ON co.requested_by = u1.id
                LEFT JOIN users u2 ON co.approved_by = u2.id
                ${whereClause}
                ORDER BY ${orderBy}
                ${limitClause}
            `;

            const result = await query(queryText, params);
            return result.rows.map(row => ({
                ...ChangeOrder.fromDb(row),
                projectName: row.project_name,
                contractTitle: row.contract_title,
                contractNumber: row.contract_number,
                requestedByName: row.requested_by_name,
                approvedByName: row.approved_by_name
            }));
        } catch (error) {
            console.error('Error finding change orders:', error);
            throw error;
        }
    }

    /**
     * Find change order by ID
     */
    static async findById(id) {
        try {
            const queryText = `
                SELECT 
                    co.*,
                    p.project_name,
                    c.title as contract_title,
                    c.contract_number,
                    u1.first_name || ' ' || u1.last_name as requested_by_name,
                    u2.first_name || ' ' || u2.last_name as approved_by_name
                FROM change_orders co
                LEFT JOIN projects p ON co.project_id = p.id
                LEFT JOIN contracts c ON co.contract_id = c.id
                LEFT JOIN users u1 ON co.requested_by = u1.id
                LEFT JOIN users u2 ON co.approved_by = u2.id
                WHERE co.id = $1
            `;

            const result = await query(queryText, [id]);
            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                ...ChangeOrder.fromDb(row),
                projectName: row.project_name,
                contractTitle: row.contract_title,
                contractNumber: row.contract_number,
                requestedByName: row.requested_by_name,
                approvedByName: row.approved_by_name
            };
        } catch (error) {
            console.error('Error finding change order by ID:', error);
            throw error;
        }
    }

    /**
     * Find change orders by project ID
     */
    static async findByProject(projectId) {
        return await ChangeOrder.findAll({ projectId });
    }

    /**
     * Find change orders by contract ID
     */
    static async findByContract(contractId) {
        return await ChangeOrder.findAll({ contractId });
    }

    /**
     * Generate next change order number for a project
     */
    static async generateChangeOrderNumber(projectId) {
        try {
            const queryText = `
                SELECT COUNT(*) + 1 as next_number
                FROM change_orders
                WHERE project_id = $1
            `;

            const result = await query(queryText, [projectId]);
            const nextNumber = result.rows[0].next_number;
            
            // Get project code for formatting
            const projectQuery = 'SELECT code FROM projects WHERE id = $1';
            const projectResult = await query(projectQuery, [projectId]);
            const projectCode = projectResult.rows[0]?.code || 'PROJ';
            
            return `${projectCode}-CO-${String(nextNumber).padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating change order number:', error);
            throw error;
        }
    }

    /**
     * Save change order (create or update)
     */
    async save(userId = null) {
        try {
            const dbData = this.toDb();
            
            if (this.createdAt) {
                // Update existing change order
                const queryText = `
                    UPDATE change_orders 
                    SET 
                        project_id = $2,
                        contract_id = $3,
                        change_order_number = $4,
                        title = $5,
                        description = $6,
                        reason = $7,
                        cost_impact = $8,
                        schedule_impact = $9,
                        status = $10,
                        approved_by = $11,
                        submitted_at = $12,
                        approved_at = $13,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.project_id,
                    dbData.contract_id,
                    dbData.change_order_number,
                    dbData.title,
                    dbData.description,
                    dbData.reason,
                    dbData.cost_impact,
                    dbData.schedule_impact,
                    dbData.status,
                    dbData.approved_by,
                    dbData.submitted_at,
                    dbData.approved_at
                ];

                const result = await query(queryText, params);
                const updatedChangeOrder = ChangeOrder.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('UPDATE', 'change_order', this.id, userId, {
                        title: this.title,
                        status: this.status,
                        costImpact: this.costImpact
                    });
                }

                return updatedChangeOrder;
            } else {
                // Generate change order number if not provided
                if (!this.changeOrderNumber) {
                    this.changeOrderNumber = await ChangeOrder.generateChangeOrderNumber(this.projectId);
                    dbData.change_order_number = this.changeOrderNumber;
                }

                // Create new change order
                const queryText = `
                    INSERT INTO change_orders (
                        id, project_id, contract_id, change_order_number, title, description,
                        reason, cost_impact, schedule_impact, status, requested_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.project_id,
                    dbData.contract_id,
                    dbData.change_order_number,
                    dbData.title,
                    dbData.description,
                    dbData.reason,
                    dbData.cost_impact,
                    dbData.schedule_impact,
                    dbData.status,
                    userId || dbData.requested_by
                ];

                const result = await query(queryText, params);
                const newChangeOrder = ChangeOrder.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('CREATE', 'change_order', this.id, userId, {
                        title: this.title,
                        changeOrderNumber: this.changeOrderNumber,
                        costImpact: this.costImpact
                    });
                }

                return newChangeOrder;
            }
        } catch (error) {
            console.error('Error saving change order:', error);
            throw error;
        }
    }

    /**
     * Update change order data
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
            console.error('Error updating change order:', error);
            throw error;
        }
    }

    /**
     * Delete change order
     */
    async delete(userId = null) {
        try {
            const queryText = 'DELETE FROM change_orders WHERE id = $1 RETURNING *';
            const result = await query(queryText, [this.id]);
            
            if (result.rows.length === 0) {
                throw new Error('Change order not found');
            }

            // Audit log
            if (userId) {
                auditLogger('DELETE', 'change_order', this.id, userId, {
                    title: this.title,
                    changeOrderNumber: this.changeOrderNumber
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting change order:', error);
            throw error;
        }
    }

    /**
     * Submit change order for approval
     */
    async submit(userId) {
        try {
            this.status = 'Submitted';
            this.submittedAt = new Date().toISOString();
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('SUBMIT', 'change_order', this.id, userId, {
                title: this.title,
                changeOrderNumber: this.changeOrderNumber,
                previousStatus: 'Draft',
                newStatus: 'Submitted',
                costImpact: this.costImpact
            });

            return result;
        } catch (error) {
            console.error('Error submitting change order:', error);
            throw error;
        }
    }

    /**
     * Approve change order
     */
    async approve(userId) {
        try {
            this.status = 'Approved';
            this.approvedBy = userId;
            this.approvedAt = new Date().toISOString();
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('APPROVE', 'change_order', this.id, userId, {
                title: this.title,
                changeOrderNumber: this.changeOrderNumber,
                previousStatus: 'Submitted',
                newStatus: 'Approved',
                costImpact: this.costImpact
            });

            return result;
        } catch (error) {
            console.error('Error approving change order:', error);
            throw error;
        }
    }

    /**
     * Reject change order
     */
    async reject(userId, reason = null) {
        try {
            this.status = 'Rejected';
            this.approvedBy = userId;
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('REJECT', 'change_order', this.id, userId, {
                title: this.title,
                changeOrderNumber: this.changeOrderNumber,
                previousStatus: 'Submitted',
                newStatus: 'Rejected',
                reason: reason,
                costImpact: this.costImpact
            });

            return result;
        } catch (error) {
            console.error('Error rejecting change order:', error);
            throw error;
        }
    }

    /**
     * Implement change order (mark as implemented)
     */
    async implement(userId) {
        try {
            this.status = 'Implemented';
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('IMPLEMENT', 'change_order', this.id, userId, {
                title: this.title,
                changeOrderNumber: this.changeOrderNumber,
                previousStatus: 'Approved',
                newStatus: 'Implemented',
                costImpact: this.costImpact
            });

            return result;
        } catch (error) {
            console.error('Error implementing change order:', error);
            throw error;
        }
    }

    /**
     * Get change order statistics
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

            if (options.contractId) {
                whereClause += ` AND contract_id = $${++paramCount}`;
                params.push(options.contractId);
            }

            const queryText = `
                SELECT 
                    COUNT(*) as total_change_orders,
                    COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_change_orders,
                    COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted_change_orders,
                    COUNT(CASE WHEN status = 'Under Review' THEN 1 END) as under_review_change_orders,
                    COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_change_orders,
                    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_change_orders,
                    COUNT(CASE WHEN status = 'Implemented' THEN 1 END) as implemented_change_orders,
                    COALESCE(SUM(cost_impact), 0) as total_cost_impact,
                    COALESCE(SUM(CASE WHEN status = 'Approved' THEN cost_impact ELSE 0 END), 0) as approved_cost_impact,
                    COALESCE(AVG(cost_impact), 0) as average_cost_impact
                FROM change_orders
                ${whereClause}
            `;

            const result = await query(queryText, params);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting change order statistics:', error);
            throw error;
        }
    }

    /**
     * Get change order reasons
     */
    static async getChangeOrderReasons() {
        try {
            const queryText = `
                SELECT DISTINCT reason, COUNT(*) as count
                FROM change_orders
                WHERE reason IS NOT NULL
                GROUP BY reason
                ORDER BY count DESC, reason ASC
            `;

            const result = await query(queryText);
            return result.rows;
        } catch (error) {
            console.error('Error getting change order reasons:', error);
            throw error;
        }
    }

    /**
     * Validate change order data
     */
    validate() {
        const errors = [];

        if (!this.projectId) errors.push('Project ID is required');
        if (!this.title) errors.push('Title is required');
        if (!this.description) errors.push('Description is required');
        if (!this.reason) errors.push('Reason is required');
        
        const validStatuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push('Invalid status');
        }

        if (this.costImpact !== null && this.costImpact !== undefined && isNaN(this.costImpact)) {
            errors.push('Cost impact must be a number');
        }

        if (this.title && this.title.length > 255) {
            errors.push('Title cannot exceed 255 characters');
        }

        if (this.changeOrderNumber && this.changeOrderNumber.length > 50) {
            errors.push('Change order number cannot exceed 50 characters');
        }

        return errors;
    }
}

module.exports = ChangeOrder;

