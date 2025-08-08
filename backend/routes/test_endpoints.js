const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Test endpoint to verify projects with project_name
router.get('/projects', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                id, 
                project_name, 
                project_status, 
                project_phase,
                created_at,
                updated_at
            FROM projects 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                projects: result.rows,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint to verify contract payments with payment_amount and amount alias
router.get('/contract-payments', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                cp.id,
                cp.contract_id,
                cp.payment_amount,
                cp.payment_amount AS amount,
                cp.payment_date,
                cp.status,
                cp.payment_type,
                cp.description,
                c.contract_number,
                v.name as vendor_name
            FROM contract_payments cp
            LEFT JOIN contracts c ON cp.contract_id = c.id
            LEFT JOIN vendors v ON c.vendor_id = v.id
            ORDER BY cp.payment_date DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                payments: result.rows,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching contract payments:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint to verify budget transfers
router.get('/budget-transfers', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                bt.*,
                sp.project_name as source_project_name,
                tp.project_name as target_project_name,
                u1.first_name || ' ' || u1.last_name as approved_by_name,
                u2.first_name || ' ' || u2.last_name as requested_by_name
            FROM budget_transfers bt
            LEFT JOIN projects sp ON bt.source_project_id = sp.id
            LEFT JOIN projects tp ON bt.target_project_id = tp.id
            LEFT JOIN users u1 ON bt.approved_by = u1.id
            LEFT JOIN users u2 ON bt.requested_by = u2.id
            ORDER BY bt.created_at DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                transfers: result.rows,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching budget transfers:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint to verify gate meetings with type/status joins
router.get('/gate-meetings', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                gm.*,
                p.project_name,
                gmt.name as meeting_type_name,
                gms.name as meeting_status_name
            FROM gate_meetings gm
            LEFT JOIN projects p ON gm.project_id = p.id
            LEFT JOIN gate_meeting_types gmt ON gm.meeting_type_id = gmt.id
            LEFT JOIN gate_meeting_statuses gms ON gm.status_id = gms.id
            ORDER BY gm.planned_date DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                meetings: result.rows,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching gate meetings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint to verify audit logs with user joins
router.get('/audit-logs', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                al.*,
                u.first_name || ' ' || u.last_name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON COALESCE(al.user_id, al.changed_by) = u.id
            ORDER BY COALESCE(al.changed_at, al.timestamp) DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                logs: result.rows,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint to verify system configs
router.get('/system-configs', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                config_key,
                config_value,
                description,
                updated_at
            FROM system_configs
            ORDER BY config_key
        `);
        
        res.json({
            success: true,
            data: {
                configs: result.rows,
                count: result.rows.length
            }
        });
    } catch (error) {
        console.error('Error fetching system configs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint to verify UUID generation
router.get('/uuid-test', async (req, res) => {
    try {
        const result = await query('SELECT uuid_generate_v4() as new_uuid');
        
        res.json({
            success: true,
            data: {
                uuid: result.rows[0].new_uuid,
                valid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result.rows[0].new_uuid)
            }
        });
    } catch (error) {
        console.error('Error generating UUID:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint to verify database connection and table counts
router.get('/database-status', async (req, res) => {
    try {
        const tables = [
            'users', 'projects', 'vendors', 'contracts', 'contract_payments',
            'budget_transfers', 'gate_meetings', 'audit_logs', 'system_configs',
            'gate_meeting_types', 'gate_meeting_statuses', 'organizational_roles'
        ];
        
        const counts = {};
        
        for (const table of tables) {
            try {
                const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
                counts[table] = parseInt(result.rows[0].count);
            } catch (error) {
                counts[table] = `Error: ${error.message}`;
            }
        }
        
        res.json({
            success: true,
            data: {
                table_counts: counts,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error checking database status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

