const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { query } = require('../config/database');
const { authenticateToken, requirePMOrPMI } = require('../middleware/auth');
const { auditLog, captureOriginalData, getAuditLogs } = require('../middleware/audit');

const router = express.Router();

// Get all projects with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { 
            status, 
            phase, 
            search, 
            page = 1, 
            limit = 20,
            program,
            region,
            ownerId,
            userId,
            userRole,
            reportStatus,
            approvedOnly,
            includePendingDrafts,
            includeVersions
        } = req.query;

        const offset = (page - 1) * limit;
        
        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            status,
            phase,
            search,
            program,
            region,
            ownerId: ownerId || undefined, // Keep as UUID string, don't parse as integer
            userId: userId || undefined,   // Keep as UUID string, don't parse as integer
            userRole,
            reportStatus,
            approvedOnly: approvedOnly === 'true',
            includePendingDrafts: includePendingDrafts === 'true',
            includeVersions: includeVersions === 'true'
        };

        const projects = await Project.findAll(options);

        // FIXED: Transform projects to include actual data instead of hardcoded values
        const transformedProjects = projects.map(project => {
            // Get actual project manager name from project data
            const projectManagerName = project.assignedProjectManager ? 
                (project.projectManagerFirstName && project.projectManagerLastName ? 
                    `${project.projectManagerFirstName} ${project.projectManagerLastName}` : 
                    project.projectManagerName || 'TBD') : 'TBD';

            // Get actual contractor name from project data
            const contractorName = project.primaryContractorName || 
                                 project.contractorName || 
                                 'TBD';

            // Calculate actual budget values from current version or project data
            const totalBudget = project.currentVersionTotalFunding || 
                              project.totalApprovedFunding || 
                              project.totalBudget || 
                              0;

            const amountSpent = project.currentVersionAmountSpent || 
                              project.amountSpent || 
                              0;

            // Calculate schedule status based on actual project data
            const scheduleStatus = calculateScheduleStatus(project);
            const budgetStatus = calculateBudgetStatus(amountSpent, totalBudget);

            return {
                id: project.id,
                // PostgreSQL field names
                project_name: project.projectName,
                project_status: project.projectStatus,
                project_phase: project.projectPhase,
                report_status: project.reportStatus,
                program: project.program,
                geographic_region: project.geographicRegion,
                project_type: project.projectType,
                delivery_type: project.deliveryType,
                cpd_number: project.cpdNumber,
                approval_year: project.approvalYear,
                project_description: project.projectDescription,
                created_at: project.createdAt,
                updated_at: project.updatedAt,
                modified_date: project.modifiedDate,
                // Frontend-compatible field names for backward compatibility
                name: project.projectName,
                status: project.projectStatus,
                phase: project.projectPhase,
                reportStatus: project.reportStatus,
                region: project.geographicRegion,
                // FIXED: Use actual data instead of hardcoded values
                projectManager: projectManagerName,
                contractor: contractorName,
                startDate: project.createdAt,
                totalBudget: totalBudget,
                amountSpent: amountSpent,
                scheduleStatus: scheduleStatus,
                budgetStatus: budgetStatus,
                isCharterSchool: project.isCharterSchool || false
            };
        });

        // Get total count for pagination - use same filters as main query
        let countQuery = 'SELECT COUNT(*) FROM projects WHERE 1=1';
        const countParams = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            countQuery += ` AND project_status = $${paramCount}`;
            countParams.push(status);
        }

        if (phase) {
            paramCount++;
            countQuery += ` AND project_phase = $${paramCount}`;
            countParams.push(phase);
        }

        if (search) {
            paramCount++;
            countQuery += ` AND (project_name ILIKE $${paramCount} OR cpd_number ILIKE $${paramCount})`;
            countParams.push(`%${search}%`);
        }

        if (program) {
            paramCount++;
            countQuery += ` AND program = $${paramCount}`;
            countParams.push(program);
        }

        if (region) {
            paramCount++;
            countQuery += ` AND geographic_region = $${paramCount}`;
            countParams.push(region);
        }

        if (reportStatus) {
            paramCount++;
            countQuery += ` AND report_status = $${paramCount}`;
            countParams.push(reportStatus);
        }

        // User-based filtering for "My Projects" - same logic as in model
        if (ownerId || userId) {
            paramCount++;
            countQuery += ` AND modified_by = $${paramCount}`;
            countParams.push(ownerId || userId);
        }

        // Handle approvedOnly filter
        if (approvedOnly === 'true') {
            paramCount++;
            countQuery += ` AND report_status = $${paramCount}`;
            countParams.push('approved');
        }

        // Handle includePendingDrafts filter
        if (includePendingDrafts === 'false') {
            countQuery += ` AND report_status NOT IN ('draft', 'update_required')`;
        }

        const countResult = await query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: {
                projects: transformedProjects,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve projects',
                details: error.message
            }
        });
    }
});

// Helper functions for status calculations
function calculateScheduleStatus(project) {
    // Simple logic - can be enhanced based on actual milestone data
    if (!project.createdAt) return 'Unknown';
    
    const createdDate = new Date(project.createdAt);
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    
    // Basic heuristic - projects over 365 days might be delayed
    if (daysSinceCreation > 365 && project.projectStatus !== 'complete') {
        return 'At Risk';
    } else if (daysSinceCreation > 180) {
        return 'Monitor';
    } else {
        return 'On Track';
    }
}

function calculateBudgetStatus(amountSpent, totalBudget) {
    if (!totalBudget || totalBudget === 0) return 'Unknown';
    
    const utilization = (amountSpent / totalBudget) * 100;
    
    if (utilization > 90) {
        return 'At Risk';
    } else if (utilization > 75) {
        return 'Monitor';
    } else {
        return 'On Track';
    }
}

// Get project statistics for dashboard
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const stats = await Project.getStatistics();
        
        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get project statistics error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve project statistics',
                details: error.message
            }
        });
    }
});

// Get single project by ID with full details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findByIdWithDetails(id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Project not found',
                    status: 404
                }
            });
        }

        res.json({
            success: true,
            data: {
                project: project.toJSON()
            }
        });

    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve project',
                details: error.message
            }
        });
    }
});

// Create new project (PM/PMI only)
router.post('/', [
    authenticateToken,
    requirePMOrPMI,
    auditLog('INSERT', 'projects'),
    body('projectName').notEmpty().withMessage('Project name is required'),
    body('cpdNumber').notEmpty().withMessage('CPD number is required'),
    body('projectStatus').isIn(['underway', 'complete', 'on_hold', 'cancelled']).withMessage('Valid project status is required'),
    body('projectPhase').isIn(['planning', 'design', 'construction', 'post_construction', 'financial_closeout', 'completed']).withMessage('Valid project phase is required'),
    body('projectCategory').isIn(['planning_only', 'design_only', 'construction']).withMessage('Valid project category is required'),
    body('approvalYear').notEmpty().withMessage('Approval year is required'),
    body('fundedToComplete').notEmpty().withMessage('Funded to complete is required')
], async (req, res) => {
    try {
        // Check validation errors
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

        // Check if CPD number already exists
        const existingProject = await query(
            'SELECT id FROM projects WHERE cpd_number = $1',
            [req.body.cpdNumber]
        );

        if (existingProject.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'CPD number already exists',
                    status: 409
                }
            });
        }

        // Create new project instance
        const projectData = {
            ...req.body,
            modifiedBy: req.user.id
        };

        const project = new Project(projectData);
        const savedProject = await project.save(req.user.id);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: {
                project: savedProject.toJSON()
            }
        });

    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create project',
                details: error.message
            }
        });
    }
});

// Update project
router.put('/:id', [
    authenticateToken,
    requirePMOrPMI,
    captureOriginalData(Project),
    auditLog('UPDATE', 'projects')
], async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Check if project exists
        const existingProject = await Project.findById(id);
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Project not found',
                    status: 404
                }
            });
        }

        // Update project
        const updatedProject = await existingProject.update(req.user.id, updates);

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: {
                project: updatedProject.toJSON()
            }
        });

    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update project',
                details: error.message
            }
        });
    }
});

// Delete project
router.delete('/:id', [
    authenticateToken,
    requirePMOrPMI,
    captureOriginalData(Project),
    auditLog('DELETE', 'projects')
], async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Project.delete(id, req.user.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Project not found',
                    status: 404
                }
            });
        }

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });

    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete project',
                details: error.message
            }
        });
    }
});

// Get lookup data for dropdowns
router.get('/lookups/all', authenticateToken, async (req, res) => {
    try {
        const [capitalPlanLines, clientMinistries, schoolJurisdictions, pfmtFiles] = await Promise.all([
            query('SELECT * FROM capital_plan_lines WHERE is_active = true ORDER BY name'),
            query('SELECT * FROM client_ministries WHERE is_active = true ORDER BY name'),
            query('SELECT * FROM school_jurisdictions WHERE is_active = true ORDER BY name'),
            query('SELECT * FROM pfmt_files WHERE status = \'active\' ORDER BY project_name')
        ]);

        res.json({
            success: true,
            data: {
                capitalPlanLines: capitalPlanLines.rows,
                clientMinistries: clientMinistries.rows,
                schoolJurisdictions: schoolJurisdictions.rows,
                pfmtFiles: pfmtFiles.rows
            }
        });

    } catch (error) {
        console.error('Get lookup data error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve lookup data',
                details: error.message
            }
        });
    }
});

// Get users for team assignment
router.get('/lookups/users', authenticateToken, async (req, res) => {
    try {
        const { role } = req.query;
        
        let userQuery = `
            SELECT id, first_name, last_name, email, role, department
            FROM users 
            WHERE is_active = true
        `;
        
        const params = [];
        if (role) {
            userQuery += ' AND role = $1';
            params.push(role);
        }
        
        userQuery += ' ORDER BY first_name, last_name';

        const result = await query(userQuery, params);

        res.json({
            success: true,
            data: {
                users: result.rows
            }
        });

    } catch (error) {
        console.error('Get users lookup error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve users',
                details: error.message
            }
        });
    }
});

// Get audit logs for a specific project
router.get('/:id/audit-logs', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50 } = req.query;

        const auditLogs = await getAuditLogs('projects', id, parseInt(limit));

        res.json({
            success: true,
            data: {
                auditLogs
            }
        });

    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve audit logs',
                details: error.message
            }
        });
    }
});

// Get vendors assigned to a project
router.get('/:id/vendors', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const queryText = `
            SELECT 
                pv.id as assignment_id,
                pv.role,
                pv.contract_value,
                pv.start_date,
                pv.end_date,
                pv.status,
                v.id as vendor_id,
                v.name as company_name,
                v.contact_email,
                v.contact_phone,
                v.description,
                v.capabilities,
                v.certification_level,
                v.performance_rating
            FROM project_vendors pv
            JOIN vendors v ON pv.vendor_id = v.id
            WHERE pv.project_id = $1
            ORDER BY pv.created_at DESC
        `;

        const result = await query(queryText, [id]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get project vendors error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve project vendors',
                details: error.message
            }
        });
    }
});

// Assign vendor to project
router.post('/:id/vendors', 
    authenticateToken, 
    requirePMOrPMI,
    [
        body('vendor_id').isUUID().withMessage('Valid vendor ID is required'),
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

            const { id: project_id } = req.params;
            const { vendor_id, role, contract_value, start_date, end_date } = req.body;

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
            const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [project_id]);
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

            // Log the assignment
            await auditLog(req, 'project_vendors', result.rows[0].id, 'INSERT', null, {
                project_id,
                vendor_id,
                role,
                contract_value,
                start_date,
                end_date
            });

            res.status(201).json({
                success: true,
                data: {
                    assignment_id: result.rows[0].id,
                    message: `Vendor ${vendorCheck.rows[0].name} assigned to project successfully`
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

// Remove vendor from project
router.delete('/:id/vendors/:vendorId', 
    authenticateToken, 
    requirePMOrPMI,
    async (req, res) => {
        try {
            const { id: project_id, vendorId: vendor_id } = req.params;

            // Get the assignment details before deletion for audit log
            const assignmentQuery = await query(
                'SELECT * FROM project_vendors WHERE project_id = $1 AND vendor_id = $2',
                [project_id, vendor_id]
            );

            if (assignmentQuery.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Vendor assignment not found'
                    }
                });
            }

            const assignment = assignmentQuery.rows[0];

            // Delete the assignment
            await query(
                'DELETE FROM project_vendors WHERE project_id = $1 AND vendor_id = $2',
                [project_id, vendor_id]
            );

            // Log the removal
            await auditLog(req, 'project_vendors', assignment.id, 'DELETE', assignment, null);

            res.json({
                success: true,
                data: {
                    message: 'Vendor removed from project successfully'
                }
            });

        } catch (error) {
            console.error('Remove vendor from project error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to remove vendor from project',
                    details: error.message
                }
            });
        }
    }
);

// Update vendor assignment in project
router.put('/:id/vendors/:vendorId', 
    authenticateToken, 
    requirePMOrPMI,
    captureOriginalData('project_vendors', 'id'),
    [
        body('role').optional().notEmpty().withMessage('Role cannot be empty'),
        body('contract_value').optional().isNumeric().withMessage('Contract value must be numeric'),
        body('start_date').optional().isISO8601().withMessage('Start date must be valid date'),
        body('end_date').optional().isISO8601().withMessage('End date must be valid date'),
        body('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('Invalid status')
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

            const { id: project_id, vendorId: vendor_id } = req.params;
            const { role, contract_value, start_date, end_date, status } = req.body;

            // Check if assignment exists
            const assignmentCheck = await query(
                'SELECT id FROM project_vendors WHERE project_id = $1 AND vendor_id = $2',
                [project_id, vendor_id]
            );

            if (assignmentCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Vendor assignment not found'
                    }
                });
            }

            const assignmentId = assignmentCheck.rows[0].id;

            // Build update query dynamically
            const updateFields = [];
            const updateValues = [];
            let paramCount = 0;

            if (role !== undefined) {
                paramCount++;
                updateFields.push(`role = $${paramCount}`);
                updateValues.push(role);
            }

            if (contract_value !== undefined) {
                paramCount++;
                updateFields.push(`contract_value = $${paramCount}`);
                updateValues.push(contract_value);
            }

            if (start_date !== undefined) {
                paramCount++;
                updateFields.push(`start_date = $${paramCount}`);
                updateValues.push(start_date);
            }

            if (end_date !== undefined) {
                paramCount++;
                updateFields.push(`end_date = $${paramCount}`);
                updateValues.push(end_date);
            }

            if (status !== undefined) {
                paramCount++;
                updateFields.push(`status = $${paramCount}`);
                updateValues.push(status);
            }

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'No fields to update'
                    }
                });
            }

            // Add updated_at field
            paramCount++;
            updateFields.push(`updated_at = $${paramCount}`);
            updateValues.push(new Date());

            // Add WHERE clause parameters
            paramCount++;
            updateValues.push(project_id);
            paramCount++;
            updateValues.push(vendor_id);

            const updateQuery = `
                UPDATE project_vendors 
                SET ${updateFields.join(', ')}
                WHERE project_id = $${paramCount - 1} AND vendor_id = $${paramCount}
                RETURNING *
            `;

            const result = await query(updateQuery, updateValues);

            // Log the update
            await auditLog(req, 'project_vendors', assignmentId, 'UPDATE', req.originalData, result.rows[0]);

            res.json({
                success: true,
                data: {
                    assignment: result.rows[0],
                    message: 'Vendor assignment updated successfully'
                }
            });

        } catch (error) {
            console.error('Update vendor assignment error:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to update vendor assignment',
                    details: error.message
                }
            });
        }
    }
);

module.exports = router;

