const pool = require('../config/database');
const jwt = require('jsonwebtoken');

class ProjectWizardController {
  // Initialize wizard session
  async initializeWizard(req, res) {
    try {
      const userId = req.user.id;
      const sessionId = `wizard_${userId}_${Date.now()}`;
      
      // Create wizard session in database
      const query = `
        INSERT INTO project_wizard_sessions (session_id, user_id, current_step, created_at, updated_at)
        VALUES ($1, $2, 1, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [sessionId, userId]);
      
      res.json({
        success: true,
        sessionId: sessionId,
        currentStep: 1,
        totalSteps: 5,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error initializing wizard:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to initialize project wizard' 
      });
    }
  }

  // Get project templates
  async getProjectTemplates(req, res) {
    try {
      const query = `
        SELECT 
          id,
          name,
          description,
          category,
          default_budget,
          estimated_duration,
          required_roles,
          template_data,
          is_active
        FROM project_templates 
        WHERE is_active = true
        ORDER BY category, name
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        templates: result.rows
      });
    } catch (error) {
      console.error('Error fetching project templates:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch project templates' 
      });
    }
  }

  // Save wizard step data
  async saveStepData(req, res) {
    try {
      const { sessionId, stepId } = req.params;
      const stepData = req.body;
      const userId = req.user.id;

      // Validate session belongs to user
      const sessionQuery = `
        SELECT * FROM project_wizard_sessions 
        WHERE session_id = $1 AND user_id = $2
      `;
      const sessionResult = await pool.query(sessionQuery, [sessionId, userId]);
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Wizard session not found' 
        });
      }

      // Save step data
      const saveQuery = `
        INSERT INTO project_wizard_step_data (session_id, step_id, step_data, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (session_id, step_id) 
        DO UPDATE SET step_data = $3, updated_at = NOW()
        RETURNING *
      `;
      
      const saveResult = await pool.query(saveQuery, [
        sessionId, 
        parseInt(stepId), 
        JSON.stringify(stepData)
      ]);

      // Update current step in session
      const updateSessionQuery = `
        UPDATE project_wizard_sessions 
        SET current_step = $1, updated_at = NOW()
        WHERE session_id = $2
      `;
      await pool.query(updateSessionQuery, [parseInt(stepId), sessionId]);

      res.json({
        success: true,
        message: 'Step data saved successfully',
        data: saveResult.rows[0]
      });
    } catch (error) {
      console.error('Error saving step data:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to save step data' 
      });
    }
  }

  // Get wizard session data
  async getWizardSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get session info
      const sessionQuery = `
        SELECT * FROM project_wizard_sessions 
        WHERE session_id = $1 AND user_id = $2
      `;
      const sessionResult = await pool.query(sessionQuery, [sessionId, userId]);
      
      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Wizard session not found' 
        });
      }

      // Get all step data
      const stepDataQuery = `
        SELECT step_id, step_data 
        FROM project_wizard_step_data 
        WHERE session_id = $1
        ORDER BY step_id
      `;
      const stepDataResult = await pool.query(stepDataQuery, [sessionId]);

      const stepData = {};
      stepDataResult.rows.forEach(row => {
        stepData[row.step_id] = JSON.parse(row.step_data);
      });

      res.json({
        success: true,
        session: sessionResult.rows[0],
        stepData: stepData
      });
    } catch (error) {
      console.error('Error fetching wizard session:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch wizard session' 
      });
    }
  }

  // Complete wizard and create project
  async completeWizard(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Get session and all step data
      const sessionQuery = `
        SELECT pws.*, pwsd.step_id, pwsd.step_data
        FROM project_wizard_sessions pws
        LEFT JOIN project_wizard_step_data pwsd ON pws.session_id = pwsd.session_id
        WHERE pws.session_id = $1 AND pws.user_id = $2
      `;
      const sessionResult = await client.query(sessionQuery, [sessionId, userId]);
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Wizard session not found');
      }

      // Organize step data
      const stepData = {};
      sessionResult.rows.forEach(row => {
        if (row.step_id && row.step_data) {
          stepData[row.step_id] = JSON.parse(row.step_data);
        }
      });

      // Validate required steps
      const requiredSteps = [1, 2, 3, 4]; // Basic Info, Budget, Team, Review
      for (const step of requiredSteps) {
        if (!stepData[step]) {
          throw new Error(`Missing data for step ${step}`);
        }
      }

      // Create project from wizard data
      const basicInfo = stepData[1];
      const budgetInfo = stepData[2];
      const teamInfo = stepData[3];

      // Insert project
      const projectQuery = `
        INSERT INTO projects (
          name, description, category, project_type, region, ministry,
          total_approved_funding, current_budget, project_phase,
          start_date, expected_completion, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `;

      const projectResult = await client.query(projectQuery, [
        basicInfo.projectName,
        basicInfo.description,
        basicInfo.category,
        basicInfo.projectType || 'Standard',
        basicInfo.region || 'Alberta',
        basicInfo.ministry || 'Infrastructure',
        budgetInfo.totalBudget,
        budgetInfo.initialBudget || budgetInfo.totalBudget,
        'Planning',
        basicInfo.startDate || new Date(),
        basicInfo.expectedCompletion,
        userId
      ]);

      const projectId = projectResult.rows[0].id;

      // Create initial project version
      const versionQuery = `
        INSERT INTO project_versions (
          project_id, version_number, name, description, category,
          total_approved_funding, current_budget, status, created_by, created_at
        ) VALUES ($1, 1, $2, $3, $4, $5, $6, 'Draft', $7, NOW())
        RETURNING *
      `;

      await client.query(versionQuery, [
        projectId,
        basicInfo.projectName,
        basicInfo.description,
        basicInfo.category,
        budgetInfo.totalBudget,
        budgetInfo.initialBudget || budgetInfo.totalBudget,
        userId
      ]);

      // Assign team members if provided
      if (teamInfo.teamMembers && teamInfo.teamMembers.length > 0) {
        for (const member of teamInfo.teamMembers) {
          const assignmentQuery = `
            INSERT INTO project_team_assignments (
              project_id, user_id, role, assigned_at, assigned_by
            ) VALUES ($1, $2, $3, NOW(), $4)
          `;
          await client.query(assignmentQuery, [
            projectId, member.userId, member.role, userId
          ]);
        }
      }

      // Create initial workflow state
      const workflowQuery = `
        INSERT INTO gate_meeting_workflow_states (
          project_id, current_state, state_entered_at, entered_by
        ) VALUES ($1, 'Planning Required', NOW(), $2)
      `;
      await client.query(workflowQuery, [projectId, userId]);

      // Clean up wizard session
      await client.query('DELETE FROM project_wizard_step_data WHERE session_id = $1', [sessionId]);
      await client.query('DELETE FROM project_wizard_sessions WHERE session_id = $1', [sessionId]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Project created successfully',
        project: projectResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error completing wizard:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to create project' 
      });
    } finally {
      client.release();
    }
  }

  // Get available team members for assignment
  async getAvailableTeamMembers(req, res) {
    try {
      const query = `
        SELECT 
          id, name, email, role,
          department, expertise_areas
        FROM users 
        WHERE is_active = true 
        AND role IN ('Project Manager', 'Senior Project Manager', 'Team Lead', 'Specialist')
        ORDER BY name
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        teamMembers: result.rows
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch team members' 
      });
    }
  }

  // Validate wizard step
  async validateStep(req, res) {
    try {
      const { stepId } = req.params;
      const stepData = req.body;

      let validation = { isValid: true, errors: [] };

      switch (parseInt(stepId)) {
        case 1: // Basic Information
          if (!stepData.projectName || stepData.projectName.trim().length < 3) {
            validation.errors.push('Project name must be at least 3 characters');
          }
          if (!stepData.description || stepData.description.trim().length < 10) {
            validation.errors.push('Description must be at least 10 characters');
          }
          if (!stepData.category) {
            validation.errors.push('Project category is required');
          }
          break;

        case 2: // Budget Setup
          if (!stepData.totalBudget || stepData.totalBudget <= 0) {
            validation.errors.push('Total budget must be greater than 0');
          }
          if (stepData.initialBudget && stepData.initialBudget > stepData.totalBudget) {
            validation.errors.push('Initial budget cannot exceed total budget');
          }
          break;

        case 3: // Team Assignment
          if (!stepData.projectManager) {
            validation.errors.push('Project manager is required');
          }
          break;

        case 4: // Review
          // Final validation of all data
          break;
      }

      validation.isValid = validation.errors.length === 0;

      res.json({
        success: true,
        validation: validation
      });
    } catch (error) {
      console.error('Error validating step:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to validate step' 
      });
    }
  }
}

module.exports = new ProjectWizardController();

