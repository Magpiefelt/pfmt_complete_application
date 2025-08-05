const { query } = require('../config/database');

// Audit logging middleware
const auditLog = (action, tableName) => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json;
        
        res.json = function(data) {
            // Log the audit entry after successful operation
            if (res.statusCode >= 200 && res.statusCode < 300) {
                logAuditEntry(req, action, tableName, data).catch(error => {
                    console.error('Audit logging error:', error);
                });
            }
            
            // Call original res.json
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Function to log audit entries
const logAuditEntry = async (req, action, tableName, responseData) => {
    try {
        const userId = req.user ? req.user.id : null;
        const userAgent = req.get('User-Agent') || null;
        const ipAddress = req.ip || req.connection.remoteAddress || null;
        
        let recordId = null;
        let oldValues = null;
        let newValues = null;

        // Extract record ID and values based on action and response
        if (action === 'INSERT' && responseData.data && responseData.data.project) {
            recordId = responseData.data.project.id;
            newValues = responseData.data.project;
        } else if (action === 'UPDATE' && responseData.data && responseData.data.project) {
            recordId = responseData.data.project.id;
            newValues = responseData.data.project;
            // For updates, we could store the old values if we had them
            oldValues = req.originalData || null;
        } else if (action === 'DELETE' && req.params && req.params.id) {
            recordId = req.params.id;
            oldValues = req.originalData || null;
        }

        if (recordId) {
            await query(`
                INSERT INTO audit_logs (
                    table_name, record_id, action, old_values, new_values,
                    changed_by, ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                tableName,
                recordId,
                action,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null,
                userId,
                ipAddress,
                userAgent
            ]);

            console.log(`📝 Audit log: ${action} on ${tableName} by user ${userId}`);
        }
    } catch (error) {
        console.error('Failed to create audit log entry:', error);
    }
};

// Middleware to capture original data before updates/deletes
const captureOriginalData = (model, idParam = 'id') => {
    return async (req, res, next) => {
        try {
            const id = req.params[idParam];
            if (id && model && model.findById) {
                const originalData = await model.findById(id);
                req.originalData = originalData ? originalData.toJSON() : null;
            }
        } catch (error) {
            console.error('Error capturing original data:', error);
        }
        next();
    };
};

// Get audit logs for a specific record
const getAuditLogs = async (tableName, recordId, limit = 50) => {
    try {
        const result = await query(`
            SELECT 
                al.*,
                u.first_name || ' ' || u.last_name as changed_by_name,
                u.email as changed_by_email
            FROM audit_logs al
            LEFT JOIN users u ON al.changed_by = u.id
            WHERE al.table_name = $1 AND al.record_id = $2
            ORDER BY al.changed_at DESC
            LIMIT $3
        `, [tableName, recordId, limit]);

        return result.rows;
    } catch (error) {
        console.error('Error retrieving audit logs:', error);
        throw error;
    }
};

// Get audit logs for a user
const getUserAuditLogs = async (userId, limit = 100) => {
    try {
        const result = await query(`
            SELECT 
                al.*,
                u.first_name || ' ' || u.last_name as changed_by_name
            FROM audit_logs al
            LEFT JOIN users u ON al.changed_by = u.id
            WHERE al.changed_by = $1
            ORDER BY al.changed_at DESC
            LIMIT $2
        `, [userId, limit]);

        return result.rows;
    } catch (error) {
        console.error('Error retrieving user audit logs:', error);
        throw error;
    }
};

// Get recent audit activity
const getRecentActivity = async (limit = 20) => {
    try {
        const result = await query(`
            SELECT 
                al.*,
                u.first_name || ' ' || u.last_name as changed_by_name,
                CASE 
                    WHEN al.table_name = 'projects' AND al.new_values IS NOT NULL 
                    THEN al.new_values->>'project_name'
                    ELSE 'Unknown'
                END as record_name
            FROM audit_logs al
            LEFT JOIN users u ON al.changed_by = u.id
            ORDER BY al.changed_at DESC
            LIMIT $1
        `, [limit]);

        return result.rows;
    } catch (error) {
        console.error('Error retrieving recent activity:', error);
        throw error;
    }
};

// Audit statistics
const getAuditStatistics = async (days = 30) => {
    try {
        const result = await query(`
            SELECT 
                COUNT(*) as total_actions,
                COUNT(CASE WHEN action = 'INSERT' THEN 1 END) as inserts,
                COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as updates,
                COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as deletes,
                COUNT(DISTINCT changed_by) as active_users,
                COUNT(DISTINCT table_name) as affected_tables
            FROM audit_logs
            WHERE changed_at >= NOW() - INTERVAL '${days} days'
        `);

        return result.rows[0];
    } catch (error) {
        console.error('Error retrieving audit statistics:', error);
        throw error;
    }
};

module.exports = {
    auditLog,
    captureOriginalData,
    logAuditEntry,
    getAuditLogs,
    getUserAuditLogs,
    getRecentActivity,
    getAuditStatistics
};

