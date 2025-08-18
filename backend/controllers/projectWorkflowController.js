const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'pfmt_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Helper functions for database operations
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Project Workflow Controller
 * Handles the multi-step project creation workflow:
 * PM&I initiates → Director assigns team → PM/SPM finalizes
 */

/**
 * PM&I: Create project initiation
 * Creates a new project with 'initiated' status
 */
const createProjectInitiation = async (req, res) => {
  const correlationId = req.correlationId || `init_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const {
      name,
      description,
      program_id,
      client_ministry_id,
      estimated_budget,
      start_date,
      end_date,
      project_type,
      delivery_method,
      project_category,
      geographic_region
    } = req.body;

    const projectId = uuidv4();
    const userId = req.user.id;

    console.log('Creating project initiation', { projectId, userId, correlationId });

    await transaction(async (client) => {
      // Create project with 'initiated' workflow status
      await client.query(
        `INSERT INTO projects (
          id, project_name, project_description, estimated_budget, start_date, end_date, 
          project_type, delivery_method, project_category, geographic_region,
          project_status, workflow_status, lifecycle_status, created_by, workflow_updated_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW(), NOW())`,
        [
          projectId, name, description, estimated_budget, start_date, end_date, 
          project_type, delivery_method, project_category, geographic_region,
          'active', 'initiated', 'planning', userId
        ]
      );

      // Create notifications for all directors
      const directors = await client.query(
        "SELECT id, first_name, last_name FROM users WHERE role = 'director' AND is_active = true"
      );

      for (const director of directors.rows) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, payload)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            director.id,
            'project_submitted',
            'New Project Awaiting Assignment',
            `Project "${name}" has been submitted by PM&I and requires team assignment.`,
            JSON.stringify({ 
              project_id: projectId, 
              project_name: name,
              submitted_by: req.user.first_name + ' ' + req.user.last_name
            })
          ]
        );
      }
    });

    // Return created project
    const projectResult = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
    const project = projectResult.rows[0];
    
    res.status(201).json({
      success: true,
      data: {
        project_id: projectId,
        workflow_status: 'initiated',
        lifecycle_status: 'planning'
      },
      message: 'Project initiated successfully',
      correlationId
    });

  } catch (error) {
    console.error('Project initiation error:', { error: error.message, correlationId });
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to create project', 
        code: 'PROJECT_CREATE_FAILED',
        details: error.message
      },
      correlationId
    });
  }
};

/**
 * Director: Assign team to project
 * Updates project status from 'initiated' to 'assigned'
 */
const assignProjectTeam = async (req, res) => {
  const correlationId = req.correlationId || `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { id } = req.params;
    const { assigned_pm, assigned_spm } = req.body;
    const userId = req.user.id;

    console.log('Assigning project team', { projectId: id, assigned_pm, assigned_spm, userId, correlationId });

    // Validate project exists and is in correct status
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = projectResult.rows[0];
    
    if (project.workflow_status !== 'initiated') {
      return res.status(400).json({
        error: { 
          message: 'Project must be in initiated status for assignment',
          code: 'INVALID_PROJECT_STATUS',
          current_status: project.workflow_status
        }
      });
    }

    await transaction(async (client) => {
      // Update project with assignments
      await client.query(
        `UPDATE projects 
         SET assigned_pm = $1, assigned_spm = $2, assigned_by = $3, 
             workflow_status = 'assigned', workflow_updated_at = NOW(), updated_at = NOW()
         WHERE id = $4`,
        [assigned_pm, assigned_spm, userId, id]
      );

      // Notify assigned team members
      const notifications = [];
      
      if (assigned_pm) {
        const pmResult = await client.query(
          'SELECT first_name, last_name FROM users WHERE id = $1',
          [assigned_pm]
        );
        
        if (pmResult.rows.length > 0) {
          notifications.push([
            assigned_pm,
            'project_assigned',
            'Project Assigned to You',
            `You have been assigned as PM for project "${project.project_name}".`,
            JSON.stringify({ 
              project_id: id, 
              project_name: project.project_name, 
              role: 'pm',
              assigned_by: req.user.first_name + ' ' + req.user.last_name
            })
          ]);
        }
      }

      if (assigned_spm) {
        const spmResult = await client.query(
          'SELECT first_name, last_name FROM users WHERE id = $1',
          [assigned_spm]
        );
        
        if (spmResult.rows.length > 0) {
          notifications.push([
            assigned_spm,
            'project_assigned',
            'Project Assigned to You',
            `You have been assigned as SPM for project "${project.project_name}".`,
            JSON.stringify({ 
              project_id: id, 
              project_name: project.project_name, 
              role: 'spm',
              assigned_by: req.user.first_name + ' ' + req.user.last_name
            })
          ]);
        }
      }

      // Insert notifications
      for (const notification of notifications) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, payload)
           VALUES ($1, $2, $3, $4, $5)`,
          notification
        );
      }
    });

    // Return updated project
    const updatedProjectResult = await query('SELECT * FROM projects WHERE id = $1', [id]);
    const updatedProject = updatedProjectResult.rows[0];
    
    res.json({
      success: true,
      data: {
        project_id: id,
        workflow_status: 'assigned',
        assigned_pm,
        assigned_spm
      },
      message: 'Team assigned successfully',
      correlationId
    });

  } catch (error) {
    console.error('Team assignment error:', { error: error.message, correlationId });
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to assign team', 
        code: 'TEAM_ASSIGN_FAILED',
        details: error.message
      },
      correlationId
    });
  }
};

/**
 * PM/SPM: Finalize project setup
 * Updates project status from 'assigned' to 'active'
 */
const finalizeProjectSetup = async (req, res) => {
  const correlationId = req.correlationId || `finalize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      milestones,
      vendors,
      budget_breakdown,
      detailed_description,
      risk_assessment
    } = req.body;

    console.log('Finalizing project setup', { projectId: id, userId, correlationId });

    // Validate project exists and user is authorized
    const projectResult = await query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = projectResult.rows[0];
    
    if (project.workflow_status !== 'assigned') {
      return res.status(400).json({
        error: { 
          message: 'Project must be in assigned status for finalization',
          code: 'INVALID_PROJECT_STATUS',
          current_status: project.workflow_status
        }
      });
    }

    // Verify user is assigned to this project
    if (project.assigned_pm !== userId && project.assigned_spm !== userId) {
      return res.status(403).json({
        error: { message: 'Not authorized to finalize this project', code: 'NOT_AUTHORIZED' }
      });
    }

    await transaction(async (client) => {
      // Update project status and finalization details with dual status system
      await client.query(
        `UPDATE projects 
         SET workflow_status = 'finalized', lifecycle_status = 'active', finalized_by = $1, finalized_at = NOW(),
             project_description = COALESCE($2, project_description),
             workflow_updated_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [userId, detailed_description, id]
      );

      // Insert milestones if provided
      if (milestones && milestones.length > 0) {
        for (const milestone of milestones) {
          await client.query(
            `INSERT INTO milestones (id, project_id, title, description, planned_start, planned_finish, gate_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              uuidv4(),
              id,
              milestone.title,
              milestone.description,
              milestone.planned_start,
              milestone.planned_finish,
              milestone.gate_type
            ]
          );
        }
      }

      // Notify director and initiator
      const notifications = [];
      
      if (project.assigned_by) {
        notifications.push([
          project.assigned_by,
          'project_finalized',
          'Project Setup Completed',
          `Project "${project.project_name}" has been finalized and is now active.`,
          JSON.stringify({ 
            project_id: id, 
            project_name: project.project_name,
            finalized_by: req.user.first_name + ' ' + req.user.last_name
          })
        ]);
      }
      
      if (project.created_by && project.created_by !== project.assigned_by) {
        notifications.push([
          project.created_by,
          'project_finalized',
          'Your Project is Now Active',
          `Project "${project.project_name}" has completed setup and is now active.`,
          JSON.stringify({ 
            project_id: id, 
            project_name: project.project_name,
            finalized_by: req.user.first_name + ' ' + req.user.last_name
          })
        ]);
      }

      // Insert notifications
      for (const notification of notifications) {
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, payload)
           VALUES ($1, $2, $3, $4, $5)`,
          notification
        );
      }
    });

    // Return finalized project
    const finalizedProjectResult = await query('SELECT * FROM projects WHERE id = $1', [id]);
    const finalizedProject = finalizedProjectResult.rows[0];
    
    res.json({
      success: true,
      data: {
        project_id: id,
        workflow_status: 'finalized',
        lifecycle_status: 'active'
      },
      message: 'Project finalized successfully',
      correlationId
    });

  } catch (error) {
    console.error('Project finalization error:', { error: error.message, correlationId });
    res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to finalize project', 
        code: 'PROJECT_FINALIZE_FAILED',
        details: error.message
      },
      correlationId
    });
  }
};

/**
 * Get projects pending assignment (for Directors)
 */
const getPendingAssignments = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.first_name, u.last_name, u.email as creator_email
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.workflow_status = 'initiated'
       ORDER BY p.created_at ASC`
    );

    const projects = result.rows;
    
    res.json({
      success: true,
      projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Get pending assignments error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to fetch pending assignments', 
        code: 'FETCH_FAILED',
        details: error.message
      }
    });
  }
};

/**
 * Get my assigned projects (for PM/SPM)
 */
const getMyProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let statusCondition = '';
    const params = [userId, userId];
    
    if (status && status !== 'all') {
      statusCondition = 'AND p.workflow_status = $3';
      params.push(status);
    }

    const result = await query(
      `SELECT p.*, 
              pm.first_name as pm_first_name, pm.last_name as pm_last_name,
              spm.first_name as spm_first_name, spm.last_name as spm_last_name,
              creator.first_name as creator_first_name, creator.last_name as creator_last_name
       FROM projects p
       LEFT JOIN users pm ON p.assigned_pm = pm.id
       LEFT JOIN users spm ON p.assigned_spm = spm.id
       LEFT JOIN users creator ON p.created_by = creator.id
       WHERE (p.assigned_pm = $1 OR p.assigned_spm = $2) ${statusCondition}
       ORDER BY p.updated_at DESC`,
      params
    );

    const projects = result.rows;
    
    res.json({
      success: true,
      projects,
      count: projects.length
    });

  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to fetch projects', 
        code: 'FETCH_FAILED',
        details: error.message
      }
    });
  }
};

/**
 * Get workflow status for a project
 */
const getProjectWorkflowStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.id, p.project_name, p.workflow_status, p.created_at, p.updated_at,
              p.created_by, p.assigned_pm, p.assigned_spm, p.assigned_by,
              p.finalized_by, p.finalized_at,
              creator.first_name as creator_first_name, creator.last_name as creator_last_name,
              pm.first_name as pm_first_name, pm.last_name as pm_last_name,
              spm.first_name as spm_first_name, spm.last_name as spm_last_name,
              director.first_name as director_first_name, director.last_name as director_last_name,
              finalizer.first_name as finalizer_first_name, finalizer.last_name as finalizer_last_name
       FROM projects p
       LEFT JOIN users creator ON p.created_by = creator.id
       LEFT JOIN users pm ON p.assigned_pm = pm.id
       LEFT JOIN users spm ON p.assigned_spm = spm.id
       LEFT JOIN users director ON p.assigned_by = director.id
       LEFT JOIN users finalizer ON p.finalized_by = finalizer.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = result.rows[0];
    
    res.json({
      success: true,
      workflow: {
        project_id: project.id,
        project_name: project.project_name,
        status: project.workflow_status,
        steps: {
          initiation: {
            completed: true,
            completed_at: project.created_at,
            completed_by: project.creator_first_name + ' ' + project.creator_last_name
          },
          assignment: {
            completed: ['assigned', 'finalized'].includes(project.workflow_status),
            completed_at: project.workflow_status !== 'initiated' ? project.updated_at : null,
            completed_by: project.director_first_name ? project.director_first_name + ' ' + project.director_last_name : null,
            assigned_pm: project.pm_first_name ? project.pm_first_name + ' ' + project.pm_last_name : null,
            assigned_spm: project.spm_first_name ? project.spm_first_name + ' ' + project.spm_last_name : null
          },
          finalization: {
            completed: project.workflow_status === 'finalized',
            completed_at: project.finalized_at,
            completed_by: project.finalizer_first_name ? project.finalizer_first_name + ' ' + project.finalizer_last_name : null
          }
        }
      }
    });

  } catch (error) {
    console.error('Get workflow status error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to fetch workflow status', 
        code: 'FETCH_FAILED',
        details: error.message
      }
    });
  }
};

/**
 * Get next step for user based on role and project status (for dual-wizard system)
 */
const getNextStepForUser = (project, userRole) => {
  const status = project.workflow_status;
  
  // If project is finalized, go to project details
  if (['finalized', 'active', 'complete'].includes(status)) {
    return { 
      name: 'project-details', 
      params: { id: project.id },
      message: 'Project is ready for management'
    };
  }

  // If project is assigned and user is PM/SPM, go to configuration
  if (status === 'assigned' && ['pm', 'spm'].includes(userRole)) {
    return { 
      name: 'wizard-config', 
      params: { projectId: project.id, substep: 'overview' },
      message: 'Configure project details'
    };
  }

  // If project is initiated and user is director, go to assignment
  if (status === 'initiated' && userRole === 'director') {
    return { 
      name: 'wizard-assign', 
      params: { projectId: project.id },
      message: 'Assign project team'
    };
  }

  // If user is PMI, they can initiate new projects
  if (userRole === 'pmi') {
    return { 
      name: 'wizard-initiate',
      message: 'Initiate new project'
    };
  }

  // Default fallback to project details
  return { 
    name: 'project-details', 
    params: { id: project.id },
    message: 'View project details'
  };
};

/**
 * Get available users for team assignment
 */
const getAvailableUsers = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        id, 
        first_name || ' ' || last_name as name, 
        email, 
        role
      FROM users 
      WHERE is_active = true 
      AND role IN ('pm', 'spm', 'project_manager', 'senior_project_manager')
      ORDER BY role, first_name, last_name
    `;
    
    const result = await query(queryText);
    
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching available users:', error);
    
    // Provide fallback data
    res.json({
      success: true,
      users: req.user ? [{
        id: req.user.id,
        name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Current User',
        email: req.user.email || '',
        role: req.user.role || 'pm'
      }] : [],
      message: 'Using fallback data due to database error'
    });
  }
};

/**
 * Get available vendors
 */
const getAvailableVendors = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        id, name, capabilities, certification_level, performance_rating
      FROM vendors 
      WHERE status = 'active'
      ORDER BY name
    `;
    
    const result = await query(queryText);
    
    res.json({
      success: true,
      vendors: result.rows
    });
  } catch (error) {
    console.error('Error fetching available vendors:', error);
    
    res.json({
      success: true,
      vendors: [],
      message: 'Could not load vendors from database'
    });
  }
};

/**
 * Get project with enhanced status information for dual-wizard system
 */
const getProjectWithStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*, 
              COALESCE(p.lifecycle_status, 'active') as lifecycle_status,
              pm.first_name as pm_first_name, pm.last_name as pm_last_name,
              spm.first_name as spm_first_name, spm.last_name as spm_last_name,
              creator.first_name as creator_first_name, creator.last_name as creator_last_name
       FROM projects p
       LEFT JOIN users pm ON p.assigned_pm = pm.id
       LEFT JOIN users spm ON p.assigned_spm = spm.id
       LEFT JOIN users creator ON p.created_by = creator.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Project not found', code: 'PROJECT_NOT_FOUND' }
      });
    }

    const project = result.rows[0];
    
    // Add normalized fields for frontend compatibility
    project.name = project.project_name;
    project.projectName = project.project_name;
    
    res.json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Get project with status error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to fetch project', 
        code: 'FETCH_FAILED',
        details: error.message
      }
    });
  }
};

module.exports = {
  createProjectInitiation,
  assignProjectTeam,
  finalizeProjectSetup,
  getPendingAssignments,
  getMyProjects,
  getProjectWorkflowStatus,
  getNextStepForUser,
  getAvailableUsers,
  getAvailableVendors,
  getProjectWithStatus
};

