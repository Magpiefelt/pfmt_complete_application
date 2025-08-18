const { query } = require('../config/database');

// Enhanced audit logging middleware for workflow actions
const auditLog = (action, entity = 'unknown') => {
    return async (req, res, next) => {
        // Store original response methods
        const originalSend = res.send;
        const originalJson = res.json;

        // Capture request details
        const auditData = {
            user_id: req.user?.id,
            entity,
            entity_id: req.params.id || null,
            action,
            details: {
                method: req.method,
                path: req.path,
                body: sanitizeBody(req.body),
                query: req.query,
                params: req.params,
                timestamp: new Date().toISOString()
            },
            ip_address: getClientIP(req),
            user_agent: req.get('User-Agent')
        };

        // Override response methods to capture success/failure
        res.send = function(data) {
            logWorkflowAuditEntry(auditData, res.statusCode, data);
            originalSend.call(this, data);
        };

        res.json = function(data) {
            logWorkflowAuditEntry(auditData, res.statusCode, data);
            originalJson.call(this, data);
        };

        next();
    };
};

// Legacy audit logging middleware (preserved for backward compatibility)
const legacyAuditLog = (action, tableName) => {
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

// Enhanced workflow audit logging function
const logWorkflowAuditEntry = async (auditData, statusCode, responseData) => {
    try {
        // Only log successful operations and errors (skip redirects, etc.)
        if (statusCode >= 200 && statusCode < 300) {
            auditData.details.status = 'success';
            auditData.details.status_code = statusCode;
            
            // Extract relevant response data (avoid logging sensitive info)
            if (responseData && typeof responseData === 'object') {
                auditData.details.response_summary = extractResponseSummary(responseData);
            }
        } else if (statusCode >= 400) {
            auditData.details.status = 'error';
            auditData.details.status_code = statusCode;
            auditData.details.error = sanitizeError(responseData);
        } else {
            return; // Skip other status codes (redirects, etc.)
        }

        // Insert audit log entry into new audit_log table
        await query(
            `INSERT INTO audit_log (user_id, entity, entity_id, action, details, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                auditData.user_id,
                auditData.entity,
                auditData.entity_id,
                auditData.action,
                JSON.stringify(auditData.details),
                auditData.ip_address,
                auditData.user_agent
            ]
        );

    } catch (error) {
        console.error('Workflow audit logging failed:', error);
        // Don't fail the request if audit logging fails
    }
};

// Helper functions for audit logging
const sanitizeBody = (body) => {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    return sanitized;
};

const extractResponseSummary = (responseData) => {
    if (!responseData || typeof responseData !== 'object') {
        return null;
    }

    const summary = {};
    
    // Extract key fields that are useful for audit
    if (responseData.success !== undefined) {
        summary.success = responseData.success;
    }
    
    if (responseData.message) {
        summary.message = responseData.message;
    }
    
    if (responseData.project && responseData.project.id) {
        summary.project_id = responseData.project.id;
        summary.project_status = responseData.project.workflow_status || responseData.project.status;
    }
    
    if (responseData.count !== undefined) {
        summary.count = responseData.count;
    }

    return Object.keys(summary).length > 0 ? summary : null;
};

const sanitizeError = (errorData) => {
    if (!errorData) {
        return null;
    }

    if (typeof errorData === 'string') {
        return { message: errorData };
    }

    if (typeof errorData === 'object' && errorData.error) {
        return {
            message: errorData.error.message,
            code: errorData.error.code
        };
    }

    return { message: 'Unknown error' };
};

const getClientIP = (req) => {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
};

// Create audit log entry directly (for use outside middleware)
const createWorkflowAuditLog = async ({ userId, entity, entityId, action, details, ipAddress, userAgent }) => {
    try {
        await query(
            `INSERT INTO audit_log (user_id, entity, entity_id, action, details, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                userId,
                entity,
                entityId,
                action,
                JSON.stringify(details),
                ipAddress,
                userAgent
            ]
        );
    } catch (error) {
        console.error('Direct workflow audit logging failed:', error);
    }
};

// Get workflow audit logs for a specific entity
const getWorkflowAuditLogs = async (entity, entityId, options = {}) => {
    try {
        const { limit = 50, offset = 0 } = options;
        
        const result = await query(
            `SELECT al.*, u.first_name, u.last_name, u.email
             FROM audit_log al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE al.entity = $1 AND al.entity_id = $2
             ORDER BY al.created_at DESC
             LIMIT $3 OFFSET $4`,
            [entity, entityId, limit, offset]
        );

        return result.rows;
    } catch (error) {
        console.error('Error fetching workflow audit logs:', error);
        return [];
    }
};

module.exports = {
    auditLog,
    legacyAuditLog,
    captureOriginalData,
    logAuditEntry,
    logWorkflowAuditEntry,
    createWorkflowAuditLog,
    getAuditLogs,
    getWorkflowAuditLogs,
    getUserAuditLogs,
    getRecentActivity,
    getAuditStatistics,
    sanitizeBody,
    extractResponseSummary
};

