const express = require('express');
const router = express.Router();
const { query, transaction, setUserContext } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all companies
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0, search } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            whereClause += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        paramCount++;
        const limitClause = `LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        const offsetClause = `OFFSET $${paramCount}`;
        params.push(offset);

        const queryText = `
            SELECT 
                id,
                name,
                description,
                industry,
                size,
                location,
                contact_email,
                contact_phone,
                website,
                status,
                created_at,
                updated_at
            FROM companies
            ${whereClause}
            ORDER BY name ASC
            ${limitClause} ${offsetClause}
        `;

        const result = await query(queryText, params);
        
        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM companies ${whereClause}`;
        const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset params
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: Math.floor(offset / limit) + 1,
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: offset + limit < total,
                hasPrev: offset > 0
            }
        });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch companies',
            message: error.message
        });
    }
});

// Get company by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const queryText = `
            SELECT 
                id,
                name,
                description,
                industry,
                size,
                location,
                contact_email,
                contact_phone,
                website,
                status,
                created_at,
                updated_at
            FROM companies
            WHERE id = $1
        `;

        const result = await query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company',
            message: error.message
        });
    }
});

// Create new company
router.post('/', async (req, res) => {
    try {
        const {
            name,
            description,
            industry,
            size,
            location,
            contactEmail,
            contactPhone,
            website,
            status = 'active'
        } = req.body;

        // Basic validation
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Company name is required'
            });
        }

        const userId = req.user?.id || req.headers['x-user-id'];
        await setUserContext(userId);

        const id = uuidv4();
        const queryText = `
            INSERT INTO companies (
                id, name, description, industry, size, location,
                contact_email, contact_phone, website, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            ) RETURNING *
        `;

        const values = [
            id, name, description, industry, size, location,
            contactEmail, contactPhone, website, status
        ];

        const result = await query(queryText, values);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Company created successfully'
        });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create company',
            message: error.message
        });
    }
});

// Update company
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            industry,
            size,
            location,
            contactEmail,
            contactPhone,
            website,
            status
        } = req.body;

        const userId = req.user?.id || req.headers['x-user-id'];
        await setUserContext(userId);

        // Build dynamic update query
        const updateFields = [];
        const values = [];
        let paramCount = 0;

        if (name !== undefined) {
            paramCount++;
            updateFields.push(`name = $${paramCount}`);
            values.push(name);
        }
        if (description !== undefined) {
            paramCount++;
            updateFields.push(`description = $${paramCount}`);
            values.push(description);
        }
        if (industry !== undefined) {
            paramCount++;
            updateFields.push(`industry = $${paramCount}`);
            values.push(industry);
        }
        if (size !== undefined) {
            paramCount++;
            updateFields.push(`size = $${paramCount}`);
            values.push(size);
        }
        if (location !== undefined) {
            paramCount++;
            updateFields.push(`location = $${paramCount}`);
            values.push(location);
        }
        if (contactEmail !== undefined) {
            paramCount++;
            updateFields.push(`contact_email = $${paramCount}`);
            values.push(contactEmail);
        }
        if (contactPhone !== undefined) {
            paramCount++;
            updateFields.push(`contact_phone = $${paramCount}`);
            values.push(contactPhone);
        }
        if (website !== undefined) {
            paramCount++;
            updateFields.push(`website = $${paramCount}`);
            values.push(website);
        }
        if (status !== undefined) {
            paramCount++;
            updateFields.push(`status = $${paramCount}`);
            values.push(status);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        paramCount++;
        values.push(id);

        const queryText = `
            UPDATE companies 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Company updated successfully'
        });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update company',
            message: error.message
        });
    }
});

// Delete company
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.headers['x-user-id'];
        await setUserContext(userId);

        const result = await query(
            'DELETE FROM companies WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }

        res.json({
            success: true,
            message: 'Company deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete company',
            message: error.message
        });
    }
});

// Get company statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_companies,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_companies,
                COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_companies,
                COUNT(DISTINCT industry) as unique_industries
            FROM companies
        `;

        const result = await query(statsQuery);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching company statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company statistics',
            message: error.message
        });
    }
});

module.exports = router;

