const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requirePMOrPMI } = require('../middleware/auth');

const router = express.Router();

// Get all PFMT templates
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { templateType, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
            SELECT pt.*, 
                   u.first_name || ' ' || u.last_name as created_by_name
            FROM pfmt_templates pt
            LEFT JOIN users u ON pt.created_by = u.id
            WHERE pt.is_active = true
        `;
        
        const queryParams = [];
        let paramCount = 0;

        if (templateType) {
            paramCount++;
            queryText += ` AND pt.template_type = $${paramCount}`;
            queryParams.push(templateType);
        }

        if (search) {
            paramCount++;
            queryText += ` AND (pt.template_name ILIKE $${paramCount} OR pt.description ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        queryText += ` ORDER BY pt.template_type, pt.template_name`;
        
        paramCount++;
        queryText += ` LIMIT $${paramCount}`;
        queryParams.push(limit);
        
        paramCount++;
        queryText += ` OFFSET $${paramCount}`;
        queryParams.push(offset);

        const result = await query(queryText, queryParams);

        res.json({
            templates: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get PFMT templates error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get templates by type
router.get('/by-type/:type', authenticateToken, async (req, res) => {
    try {
        const { type } = req.params;

        const result = await query(`
            SELECT pt.*, 
                   u.first_name || ' ' || u.last_name as created_by_name
            FROM pfmt_templates pt
            LEFT JOIN users u ON pt.created_by = u.id
            WHERE pt.template_type = $1 AND pt.is_active = true
            ORDER BY pt.template_name
        `, [type]);

        res.json({
            templates: result.rows
        });

    } catch (error) {
        console.error('Get templates by type error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get template types
router.get('/types', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT DISTINCT template_type, COUNT(*) as count
            FROM pfmt_templates
            WHERE is_active = true
            GROUP BY template_type
            ORDER BY template_type
        `);

        res.json({
            templateTypes: result.rows
        });

    } catch (error) {
        console.error('Get template types error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Get single template by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT pt.*, 
                   u.first_name || ' ' || u.last_name as created_by_name
            FROM pfmt_templates pt
            LEFT JOIN users u ON pt.created_by = u.id
            WHERE pt.id = $1 AND pt.is_active = true
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'Template not found',
                    status: 404
                }
            });
        }

        res.json({
            template: result.rows[0]
        });

    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Create new template
router.post('/', [
    authenticateToken,
    requirePMOrPMI,
    body('templateName').notEmpty().withMessage('Template name is required'),
    body('templateType').notEmpty().withMessage('Template type is required'),
    body('version').optional().isLength({ min: 1 }).withMessage('Version must be specified')
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
            templateName,
            templateType,
            description,
            filePath,
            version
        } = req.body;

        const result = await query(`
            INSERT INTO pfmt_templates (
                template_name, template_type, description, file_path, version, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            templateName,
            templateType,
            description,
            filePath,
            version || 'v1.0',
            req.user.id
        ]);

        res.status(201).json({
            message: 'Template created successfully',
            template: result.rows[0]
        });

    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Update template
router.put('/:id', [
    authenticateToken,
    requirePMOrPMI
], async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Check if template exists
        const existingTemplate = await query('SELECT * FROM pfmt_templates WHERE id = $1', [id]);
        if (existingTemplate.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'Template not found',
                    status: 404
                }
            });
        }

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];
        let paramCount = 0;

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined && key !== 'id') {
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
            UPDATE pfmt_templates 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(updateQuery, updateValues);

        res.json({
            message: 'Template updated successfully',
            template: result.rows[0]
        });

    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

// Deactivate template
router.delete('/:id', [
    authenticateToken,
    requirePMOrPMI
], async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE pfmt_templates 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    message: 'Template not found',
                    status: 404
                }
            });
        }

        res.json({
            message: 'Template deactivated successfully'
        });

    } catch (error) {
        console.error('Deactivate template error:', error);
        res.status(500).json({
            error: {
                message: 'Internal server error',
                status: 500
            }
        });
    }
});

module.exports = router;

