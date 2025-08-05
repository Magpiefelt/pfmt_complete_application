const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', [authenticateToken, requireAdmin], async (req, res) => {
    try {
        const { role, active, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
            SELECT id, username, email, first_name, last_name, role, is_active, created_at
            FROM users
            WHERE 1=1
        `;
        
        const queryParams = [];
        let paramCount = 0;

        if (role) {
            paramCount++;
            queryText += ` AND role = $${paramCount}`;
            queryParams.push(role);
        }

        if (active !== undefined) {
            paramCount++;
            queryText += ` AND is_active = $${paramCount}`;
            queryParams.push(active === 'true');
        }

        if (search) {
            paramCount++;
            queryText += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR username ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        queryText += ` ORDER BY first_name, last_name`;
        
        paramCount++;
        queryText += ` LIMIT $${paramCount}`;
        queryParams.push(limit);
        
        paramCount++;
        queryText += ` OFFSET $${paramCount}`;
        queryParams.push(offset);

        const result = await query(queryText, queryParams);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: result.rows.length
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get users for project assignment (simplified list)
router.get('/for-assignment', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT id, username, first_name, last_name, email, role
            FROM users
            WHERE is_active = true
            ORDER BY first_name, last_name
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get users for assignment error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get single user by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT id, username, email, first_name, last_name, role, is_active, created_at
            FROM users
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'User not found',
                    status: 404
                }
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Update user (admin only)
router.put('/:id', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Check if user exists
        const existingUser = await query('SELECT * FROM users WHERE id = $1', [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'User not found',
                    status: 404
                }
            });
        }

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramCount = 0;

        const allowedFields = ['first_name', 'last_name', 'email', 'role', 'is_active'];
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && allowedFields.includes(key)) {
                paramCount++;
                updateFields.push(`${key} = $${paramCount}`);
                updateValues.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: {
                    message: 'No valid fields to update',
                    status: 400
                }
            });
        }

        paramCount++;
        updateValues.push(id);

        const updateQuery = `
            UPDATE users 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING id, username, email, first_name, last_name, role, is_active, updated_at
        `;

        const result = await query(updateQuery, updateValues);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Deactivate user (admin only)
router.delete('/:id', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE users 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, username, email, first_name, last_name
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'User not found',
                    status: 404
                }
            });
        }

        res.json({
            success: true,
            message: 'User deactivated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

module.exports = router;

