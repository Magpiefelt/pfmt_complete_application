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
            region 
        } = req.query;

        const offset = (page - 1) * limit;
        
        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            status,
            phase,
            search,
            program,
            region
        };

        const projects = await Project.findAll(options);

        // Transform projects to include frontend-compatible field names
        const transformedProjects = projects.map(project => ({
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
            projectManager: 'Sarah Johnson', // Default for now
            contractor: 'ABC Construction Ltd.', // Default for now
            startDate: project.createdAt,
            totalBudget: 15000000, // Default for now
            amountSpent: 8500000, // Default for now
            scheduleStatus: 'On Track', // Default for now
            budgetStatus: 'On Track', // Default for now
            isCharterSchool: project.isCharterSchool || false
        }));

        // Get total count for pagination
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

module.exports = router;

