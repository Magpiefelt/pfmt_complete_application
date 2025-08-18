/**
 * Contract Model
 * Handles contract management and tracking for Team A integration
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');

class Contract {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.projectId = data.projectId;
        this.vendorId = data.vendorId;
        this.contractNumber = data.contractNumber;
        this.title = data.title;
        this.description = data.description;
        this.value = data.value;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.status = data.status || 'Draft';
        this.performanceMetrics = data.performanceMetrics;
        this.createdBy = data.createdBy;
        this.approvedBy = data.approvedBy;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Create Contract instance from database row
     */
    static fromDb(row = {}) {
        if (!row) return null;
        return new Contract({
            id: row.id,
            projectId: row.project_id,
            vendorId: row.vendor_id,
            contractNumber: row.contract_number,
            title: row.title,
            description: row.description,
            value: row.value,
            startDate: row.start_date,
            endDate: row.end_date,
            status: row.status,
            performanceMetrics: row.performance_metrics,
            createdBy: row.created_by,
            approvedBy: row.approved_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Convert Contract instance to database format
     */
    toDb() {
        return {
            id: this.id,
            project_id: this.projectId,
            vendor_id: this.vendorId,
            contract_number: this.contractNumber,
            title: this.title,
            description: this.description,
            value: this.value,
            start_date: this.startDate,
            end_date: this.endDate,
            status: this.status,
            performance_metrics: this.performanceMetrics,
            created_by: this.createdBy,
            approved_by: this.approvedBy
        };
    }

    /**
     * Find all contracts with optional filtering
     */
    static async findAll(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            // Add filters
            if (options.projectId) {
                whereClause += ` AND project_id = $${++paramCount}`;
                params.push(options.projectId);
            }

            if (options.vendorId) {
                whereClause += ` AND vendor_id = $${++paramCount}`;
                params.push(options.vendorId);
            }

            if (options.status) {
                whereClause += ` AND status = $${++paramCount}`;
                params.push(options.status);
            }

            // Add sorting
            const orderBy = options.orderBy || 'created_at DESC';
            
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
                    c.*,
                    p.project_name,
                    v.name as vendor_name,
                    u1.first_name || ' ' || u1.last_name as created_by_name,
                    u2.first_name || ' ' || u2.last_name as approved_by_name
                FROM contracts c
                LEFT JOIN projects p ON c.project_id = p.id
                LEFT JOIN vendors v ON c.vendor_id = v.id
                LEFT JOIN users u1 ON c.created_by = u1.id
                LEFT JOIN users u2 ON c.approved_by = u2.id
                ${whereClause}
                ORDER BY ${orderBy}
                ${limitClause}
            `;

            const result = await query(queryText, params);
            return result.rows.map(row => ({
                ...Contract.fromDb(row),
                projectName: row.project_name,
                vendorName: row.vendor_name,
                createdByName: row.created_by_name,
                approvedByName: row.approved_by_name
            }));
        } catch (error) {
            console.error('Error finding contracts:', error);
            throw error;
        }
    }

    /**
     * Find contract by ID
     */
    static async findById(id) {
        try {
            const queryText = `
                SELECT 
                    c.*,
                    p.project_name,
                    v.name as vendor_name,
                    u1.first_name || ' ' || u1.last_name as created_by_name,
                    u2.first_name || ' ' || u2.last_name as approved_by_name
                FROM contracts c
                LEFT JOIN projects p ON c.project_id = p.id
                LEFT JOIN vendors v ON c.vendor_id = v.id
                LEFT JOIN users u1 ON c.created_by = u1.id
                LEFT JOIN users u2 ON c.approved_by = u2.id
                WHERE c.id = $1
            `;

            const result = await query(queryText, [id]);
            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                ...Contract.fromDb(row),
                projectName: row.project_name,
                vendorName: row.vendor_name,
                createdByName: row.created_by_name,
                approvedByName: row.approved_by_name
            };
        } catch (error) {
            console.error('Error finding contract by ID:', error);
            throw error;
        }
    }

    /**
     * Find contracts by project ID
     */
    static async findByProject(projectId) {
        return await Contract.findAll({ projectId });
    }

    /**
     * Find contracts by vendor ID
     */
    static async findByVendor(vendorId) {
        return await Contract.findAll({ vendorId });
    }

    /**
     * Save contract (create or update)
     */
    async save(userId = null) {
        try {
            const dbData = this.toDb();
            
            if (this.createdAt) {
                // Update existing contract
                const queryText = `
                    UPDATE contracts 
                    SET 
                        project_id = $2,
                        vendor_id = $3,
                        contract_number = $4,
                        title = $5,
                        description = $6,
                        value = $7,
                        start_date = $8,
                        end_date = $9,
                        status = $10,
                        performance_metrics = $11,
                        approved_by = $12,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.project_id,
                    dbData.vendor_id,
                    dbData.contract_number,
                    dbData.title,
                    dbData.description,
                    dbData.value,
                    dbData.start_date,
                    dbData.end_date,
                    dbData.status,
                    JSON.stringify(dbData.performance_metrics),
                    dbData.approved_by
                ];

                const result = await query(queryText, params);
                const updatedContract = Contract.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('UPDATE', 'contract', this.id, userId, {
                        title: this.title,
                        status: this.status,
                        value: this.value
                    });
                }

                return updatedContract;
            } else {
                // Create new contract
                const queryText = `
                    INSERT INTO contracts (
                        id, project_id, vendor_id, contract_number, title, description,
                        value, start_date, end_date, status, performance_metrics, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.project_id,
                    dbData.vendor_id,
                    dbData.contract_number,
                    dbData.title,
                    dbData.description,
                    dbData.value,
                    dbData.start_date,
                    dbData.end_date,
                    dbData.status,
                    JSON.stringify(dbData.performance_metrics),
                    userId || dbData.created_by
                ];

                const result = await query(queryText, params);
                const newContract = Contract.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('CREATE', 'contract', this.id, userId, {
                        title: this.title,
                        contractNumber: this.contractNumber,
                        value: this.value
                    });
                }

                return newContract;
            }
        } catch (error) {
            console.error('Error saving contract:', error);
            throw error;
        }
    }

    /**
     * Update contract data
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
            console.error('Error updating contract:', error);
            throw error;
        }
    }

    /**
     * Delete contract
     */
    async delete(userId = null) {
        try {
            const queryText = 'DELETE FROM contracts WHERE id = $1 RETURNING *';
            const result = await query(queryText, [this.id]);
            
            if (result.rows.length === 0) {
                throw new Error('Contract not found');
            }

            // Audit log
            if (userId) {
                auditLogger('DELETE', 'contract', this.id, userId, {
                    title: this.title,
                    contractNumber: this.contractNumber
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting contract:', error);
            throw error;
        }
    }

    /**
     * Approve contract
     */
    async approve(userId) {
        try {
            this.status = 'Active';
            this.approvedBy = userId;
            
            const result = await this.save(userId);
            
            // Audit log
            auditLogger('APPROVE', 'contract', this.id, userId, {
                title: this.title,
                contractNumber: this.contractNumber,
                previousStatus: 'Draft',
                newStatus: 'Active'
            });

            return result;
        } catch (error) {
            console.error('Error approving contract:', error);
            throw error;
        }
    }

    /**
     * Get contract statistics
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

            const queryText = `
                SELECT 
                    COUNT(*) as total_contracts,
                    COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft_contracts,
                    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_contracts,
                    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_contracts,
                    COUNT(CASE WHEN status = 'Terminated' THEN 1 END) as terminated_contracts,
                    COALESCE(SUM(value), 0) as total_value,
                    COALESCE(AVG(value), 0) as average_value
                FROM contracts
                ${whereClause}
            `;

            const result = await query(queryText, params);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting contract statistics:', error);
            throw error;
        }
    }

    /**
     * Validate contract data
     */
    validate() {
        const errors = [];

        if (!this.projectId) errors.push('Project ID is required');
        if (!this.vendorId) errors.push('Vendor ID is required');
        if (!this.contractNumber) errors.push('Contract number is required');
        if (!this.title) errors.push('Title is required');
        
        if (this.value && this.value < 0) errors.push('Contract value cannot be negative');
        
        if (this.startDate && this.endDate && new Date(this.startDate) > new Date(this.endDate)) {
            errors.push('Start date cannot be after end date');
        }

        const validStatuses = ['Draft', 'Active', 'Completed', 'Terminated', 'Expired'];
        if (this.status && !validStatuses.includes(this.status)) {
            errors.push('Invalid status');
        }

        return errors;
    }
}

module.exports = Contract;

