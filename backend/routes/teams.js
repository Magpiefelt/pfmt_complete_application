const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Get project team
router.get('/projects/:projectId/team', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get team assignments
    const teamQuery = `
      SELECT 
        pt.*,
        ed.name as executive_director_name,
        ed.email as executive_director_email,
        d.name as director_name,
        d.email as director_email,
        spm.name as sr_project_manager_name,
        spm.email as sr_project_manager_email,
        pm.name as project_manager_name,
        pm.email as project_manager_email,
        pc.name as project_coordinator_name,
        pc.email as project_coordinator_email,
        csa.name as contract_services_analyst_name,
        csa.email as contract_services_analyst_email,
        pia.name as program_integration_analyst_name,
        pia.email as program_integration_analyst_email
      FROM project_teams pt
      LEFT JOIN users ed ON pt.executive_director_id = ed.id
      LEFT JOIN users d ON pt.director_id = d.id
      LEFT JOIN users spm ON pt.sr_project_manager_id = spm.id
      LEFT JOIN users pm ON pt.project_manager_id = pm.id
      LEFT JOIN users pc ON pt.project_coordinator_id = pc.id
      LEFT JOIN users csa ON pt.contract_services_analyst_id = csa.id
      LEFT JOIN users pia ON pt.program_integration_analyst_id = pia.id
      WHERE pt.project_id = $1
    `;
    
    const teamResult = await pool.query(teamQuery, [projectId]);
    
    // Get additional team members
    const additionalQuery = `
      SELECT 
        atm.*,
        u.name,
        u.email,
        u.avatar
      FROM additional_team_members atm
      JOIN users u ON atm.user_id = u.id
      WHERE atm.project_id = $1 AND atm.status = 'active'
      ORDER BY atm.created_at
    `;
    
    const additionalResult = await pool.query(additionalQuery, [projectId]);
    
    // Get historical team members
    const historicalQuery = `
      SELECT 
        htm.*,
        u.name,
        u.email,
        u.avatar
      FROM historical_team_members htm
      JOIN users u ON htm.user_id = u.id
      WHERE htm.project_id = $1
      ORDER BY htm.end_date DESC
    `;
    
    const historicalResult = await pool.query(historicalQuery, [projectId]);
    
    const team = teamResult.rows[0] || {};
    team.additional_members = additionalResult.rows;
    team.historical_members = historicalResult.rows;
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error fetching project team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project team'
    });
  }
});

// Update project team
router.put('/projects/:projectId/team', authenticateToken, requireRole(['PM', 'SPM', 'Director', 'Admin']), auditLog, async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      executive_director_id,
      director_id,
      sr_project_manager_id,
      project_manager_id,
      project_coordinator_id,
      contract_services_analyst_id,
      program_integration_analyst_id
    } = req.body;
    
    // Check if team record exists
    const existingQuery = 'SELECT id FROM project_teams WHERE project_id = $1';
    const existingResult = await pool.query(existingQuery, [projectId]);
    
    let query;
    let values;
    
    if (existingResult.rows.length > 0) {
      // Update existing team
      query = `
        UPDATE project_teams 
        SET 
          executive_director_id = $2,
          director_id = $3,
          sr_project_manager_id = $4,
          project_manager_id = $5,
          project_coordinator_id = $6,
          contract_services_analyst_id = $7,
          program_integration_analyst_id = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE project_id = $1
        RETURNING *
      `;
      values = [
        projectId,
        executive_director_id,
        director_id,
        sr_project_manager_id,
        project_manager_id,
        project_coordinator_id,
        contract_services_analyst_id,
        program_integration_analyst_id
      ];
    } else {
      // Create new team
      query = `
        INSERT INTO project_teams (
          project_id,
          executive_director_id,
          director_id,
          sr_project_manager_id,
          project_manager_id,
          project_coordinator_id,
          contract_services_analyst_id,
          program_integration_analyst_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      values = [
        projectId,
        executive_director_id,
        director_id,
        sr_project_manager_id,
        project_manager_id,
        project_coordinator_id,
        contract_services_analyst_id,
        program_integration_analyst_id
      ];
    }
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Project team updated successfully'
    });
  } catch (error) {
    console.error('Error updating project team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project team'
    });
  }
});

// Add additional team member
router.post('/projects/:projectId/team/additional', authenticateToken, requireRole(['PM', 'SPM', 'Director', 'Admin']), auditLog, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { user_id, role } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if user is already an additional member
    const existingQuery = `
      SELECT id FROM additional_team_members 
      WHERE project_id = $1 AND user_id = $2 AND status = 'active'
    `;
    const existingResult = await pool.query(existingQuery, [projectId, user_id]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User is already an additional team member'
      });
    }
    
    const query = `
      INSERT INTO additional_team_members (project_id, user_id, role, added_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [projectId, user_id, role, req.user.id]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Additional team member added successfully'
    });
  } catch (error) {
    console.error('Error adding additional team member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add additional team member'
    });
  }
});

// Remove additional team member
router.delete('/projects/:projectId/team/additional/:memberId', authenticateToken, requireRole(['PM', 'SPM', 'Director', 'Admin']), auditLog, async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    
    const query = `
      UPDATE additional_team_members 
      SET status = 'removed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND project_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [memberId, projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Additional team member not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Additional team member removed successfully'
    });
  } catch (error) {
    console.error('Error removing additional team member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove additional team member'
    });
  }
});

// Search users for team assignment
router.get('/users/search', authenticateToken, async (req, res) => {
  try {
    const { q, role, department, limit = 20 } = req.query;
    
    let query = `
      SELECT 
        id,
        name,
        email,
        department,
        role,
        status,
        avatar
      FROM users 
      WHERE status = 'active'
    `;
    
    const values = [];
    let paramCount = 0;
    
    if (q) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      values.push(`%${q}%`);
    }
    
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      values.push(role);
    }
    
    if (department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      values.push(department);
    }
    
    query += ` ORDER BY name LIMIT $${paramCount + 1}`;
    values.push(parseInt(limit));
    
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

// Get user details
router.get('/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        id,
        name,
        email,
        department,
        role,
        status,
        avatar
      FROM users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

module.exports = router;

