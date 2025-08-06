const express = require('express');
const router = express.Router();
const { query, transaction, setUserContext } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all vendors
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0, search, status, capability } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            whereClause += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (status) {
            paramCount++;
            whereClause += ` AND status = $${paramCount}`;
            params.push(status);
        }

        if (capability) {
            paramCount++;
            whereClause += ` AND capabilities ILIKE $${paramCount}`;
            params.push(`%${capability}%`);
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
                capabilities,
                contact_email,
                contact_phone,
                website,
                address,
                certification_level,
                performance_rating,
                status,
                created_at,
                updated_at
            FROM vendors
            ${whereClause}
            ORDER BY name ASC
            ${limitClause} ${offsetClause}
        `;

        const result = await query(queryText, params);
        
        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM vendors ${whereClause}`;
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
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendors',
            message: error.message
        });
    }
});

// Get vendor by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const queryText = `
            SELECT 
                id,
                name,
                description,
                capabilities,
                contact_email,
                contact_phone,
                website,
                address,
                certification_level,
                performance_rating,
                status,
                created_at,
                updated_at
            FROM vendors
            WHERE id = $1
        `;

        const result = await query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor',
            message: error.message
        });
    }
});

// Create new vendor
router.post('/', async (req, res) => {
    try {
        const {
            name,
            description,
            capabilities,
            contactEmail,
            contactPhone,
            website,
            address,
            certificationLevel,
            performanceRating,
            status = 'active'
        } = req.body;

        // Basic validation
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Vendor name is required'
            });
        }

        const userId = req.user?.id || req.headers['x-user-id'];
        await setUserContext(userId);

        const id = uuidv4();
        const queryText = `
            INSERT INTO vendors (
                id, name, description, capabilities, contact_email,
                contact_phone, website, address, certification_level,
                performance_rating, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            ) RETURNING *
        `;

        const values = [
            id, name, description, capabilities, contactEmail,
            contactPhone, website, address, certificationLevel,
            performanceRating, status
        ];

        const result = await query(queryText, values);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Vendor created successfully'
        });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create vendor',
            message: error.message
        });
    }
});

// Update vendor
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            capabilities,
            contactEmail,
            contactPhone,
            website,
            address,
            certificationLevel,
            performanceRating,
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
        if (capabilities !== undefined) {
            paramCount++;
            updateFields.push(`capabilities = $${paramCount}`);
            values.push(capabilities);
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
        if (address !== undefined) {
            paramCount++;
            updateFields.push(`address = $${paramCount}`);
            values.push(address);
        }
        if (certificationLevel !== undefined) {
            paramCount++;
            updateFields.push(`certification_level = $${paramCount}`);
            values.push(certificationLevel);
        }
        if (performanceRating !== undefined) {
            paramCount++;
            updateFields.push(`performance_rating = $${paramCount}`);
            values.push(performanceRating);
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
            UPDATE vendors 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Vendor updated successfully'
        });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update vendor',
            message: error.message
        });
    }
});

// Delete vendor
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.headers['x-user-id'];
        await setUserContext(userId);

        const result = await query(
            'DELETE FROM vendors WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            message: 'Vendor deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting vendor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete vendor',
            message: error.message
        });
    }
});

// Get vendor statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_vendors,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vendors,
                COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_vendors,
                AVG(performance_rating) as avg_performance_rating
            FROM vendors
        `;

        const result = await query(statsQuery);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching vendor statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor statistics',
            message: error.message
        });
    }
});

// Project-specific vendor routes
const projectVendorRouter = express.Router({ mergeParams: true });

// Get vendors for a specific project
projectVendorRouter.get('/', async (req, res) => {
    try {
        const { projectId } = req.params;

        const queryText = `
            SELECT 
                v.*,
                pv.role,
                pv.contract_value,
                pv.start_date,
                pv.end_date,
                pv.status as project_vendor_status
            FROM vendors v
            INNER JOIN project_vendors pv ON v.id = pv.vendor_id
            WHERE pv.project_id = $1
            ORDER BY v.name ASC
        `;

        const result = await query(queryText, [projectId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching project vendors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch project vendors',
            message: error.message
        });
    }
});

// Add vendor to project
projectVendorRouter.post('/', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { vendorId, role, contractValue, startDate, endDate } = req.body;

        const userId = req.user?.id || req.headers['x-user-id'];
        await setUserContext(userId);

        const id = uuidv4();
        const queryText = `
            INSERT INTO project_vendors (
                id, project_id, vendor_id, role, contract_value,
                start_date, end_date, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, 'active'
            ) RETURNING *
        `;

        const values = [id, projectId, vendorId, role, contractValue, startDate, endDate];
        const result = await query(queryText, values);

        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Vendor added to project successfully'
        });
    } catch (error) {
        console.error('Error adding vendor to project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add vendor to project',
            message: error.message
        });
    }
});

// Company-specific vendor routes
const companyVendorRouter = express.Router({ mergeParams: true });

// Get vendors for a specific company
companyVendorRouter.get('/', async (req, res) => {
    try {
        const { companyId } = req.params;

        const queryText = `
            SELECT 
                v.*,
                cv.relationship_type,
                cv.start_date,
                cv.end_date,
                cv.status as company_vendor_status
            FROM vendors v
            INNER JOIN company_vendors cv ON v.id = cv.vendor_id
            WHERE cv.company_id = $1
            ORDER BY v.name ASC
        `;

        const result = await query(queryText, [companyId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching company vendors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company vendors',
            message: error.message
        });
    }
});

module.exports = router;
module.exports.projectVendorRouter = projectVendorRouter;
module.exports.companyVendorRouter = companyVendorRouter;


// Get projects assigned to a vendor
router.get('/:id/projects', async (req, res) => {
    try {
        const { id } = req.params;

        const queryText = `
            SELECT 
                pv.id as assignment_id,
                pv.role,
                pv.contract_value,
                pv.start_date,
                pv.end_date,
                pv.status as assignment_status,
                p.id as project_id,
                p.project_name,
                p.project_status,
                p.project_phase,
                p.program,
                p.geographic_region,
                p.project_type
            FROM project_vendors pv
            JOIN projects p ON pv.project_id = p.id
            WHERE pv.vendor_id = $1
            ORDER BY pv.created_at DESC
        `;

        const result = await query(queryText, [id]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching vendor projects:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendor projects',
            message: error.message
        });
    }
});

// Assign vendor to project (alternative endpoint from vendor side)
router.post('/:id/assign-to-project', 
    [
        body('project_id').isUUID().withMessage('Valid project ID is required'),
        body('role').notEmpty().withMessage('Role is required'),
        body('contract_value').optional().isNumeric().withMessage('Contract value must be numeric'),
        body('start_date').optional().isISO8601().withMessage('Start date must be valid date'),
        body('end_date').optional().isISO8601().withMessage('End date must be valid date')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Validation failed',
                        details: errors.array()
                    }
                });
            }

            const { id: vendor_id } = req.params;
            const { project_id, role, contract_value, start_date, end_date } = req.body;

            // Check if vendor is already assigned to this project with the same role
            const existingAssignment = await query(
                'SELECT id FROM project_vendors WHERE project_id = $1 AND vendor_id = $2 AND role = $3',
                [project_id, vendor_id, role]
            );

            if (existingAssignment.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: {
                        message: 'Vendor is already assigned to this project with the same role',
                        code: 'DUPLICATE_ASSIGNMENT'
                    }
                });
            }

            // Verify project exists
            const projectCheck = await query('SELECT id, project_name FROM projects WHERE id = $1', [project_id]);
            if (projectCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Project not found'
                    }
                });
            }

            // Verify vendor exists
            const vendorCheck = await query('SELECT id, name FROM vendors WHERE id = $1', [vendor_id]);
            if (vendorCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Vendor not found'
                    }
                });
            }

            // Insert the assignment
            const insertQuery = `
                INSERT INTO project_vendors (project_id, vendor_id, role, contract_value, start_date, end_date)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, created_at
            `;

            const result = await query(insertQuery, [
                project_id,
                vendor_id,
                role,
                contract_value || null,
                start_date || null,
                end_date || null
            ]);

            res.status(201).json({
                success: true,
                data: {
                    assignment_id: result.rows[0].id,
                    message: `Vendor ${vendorCheck.rows[0].name} assigned to project ${projectCheck.rows[0].project_name} successfully`
                }
            });

        } catch (error) {
            console.error('Assign vendor to project error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to assign vendor to project',
                    details: error.message
                }
            });
        }
    }
);

