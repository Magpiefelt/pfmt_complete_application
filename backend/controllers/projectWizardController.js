const { query, pool } = require('../config/database');

class ProjectWizardController {
  // Initialize wizard session
  async initializeWizard(req, res) {
    try {
      // Validate that user exists and has proper UUID
      if (!req.user || !req.user.id) {
        console.error('No user ID found in request');
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const userId = req.user.id;
      const sessionId = `wizard_${userId}_${Date.now()}`;
      
      console.log('Initializing wizard for user:', userId, 'sessionId:', sessionId);
      
      // Create wizard session in database
      const queryText = `
        INSERT INTO project_wizard_sessions (session_id, user_id, current_step, created_at, updated_at)
        VALUES ($1, $2, 1, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await query(queryText, [sessionId, userId]);
      
      res.json({
        success: true,
        sessionId: sessionId,
        currentStep: 1,
        totalSteps: 5,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error initializing wizard:', error);
      console.error('User object:', req.user);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to initialize project wizard' 
      });
    }
  }

  // Get project templates
  async getProjectTemplates(req, res) {
    try {
      const queryText = `
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
      
      const result = await query(queryText);
      
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
      const sessionResult = await query(sessionQuery, [sessionId, userId]);
      
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
      
      const saveResult = await query(saveQuery, [
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
      await query(updateSessionQuery, [parseInt(stepId), sessionId]);

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
      const sessionResult = await query(sessionQuery, [sessionId, userId]);
      
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
      const stepDataResult = await query(stepDataQuery, [sessionId]);

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
          try {
            // Check if step_data is already an object or needs parsing
            if (typeof row.step_data === 'string') {
              stepData[row.step_id] = JSON.parse(row.step_data);
            } else if (typeof row.step_data === 'object') {
              stepData[row.step_id] = row.step_data;
            } else {
              console.warn(`Unexpected step_data type for step ${row.step_id}:`, typeof row.step_data);
              stepData[row.step_id] = row.step_data;
            }
          } catch (parseError) {
            console.error(`Error parsing step data for step ${row.step_id}:`, parseError);
            console.error('Raw step_data:', row.step_data);
            throw new Error(`Invalid step data format for step ${row.step_id}`);
          }
        }
      });

      // Validate required steps
      const requiredSteps = [1, 2, 3, 4]; // Template, Basic Info, Budget, Team
      for (const step of requiredSteps) {
        if (!stepData[step]) {
          throw new Error(`Missing data for step ${step}`);
        }
      }

      // Create project from wizard data
      const templateInfo = stepData[1];
      const basicInfo = stepData[2];
      const budgetInfo = stepData[3];
      const teamInfo = stepData[4];

      console.log('Creating project with team info:', {
        projectManager: teamInfo.projectManager,
        teamMembersCount: teamInfo.teamMembers?.length || 0,
        currentUserId: userId
      });

      // Insert project
      const projectQuery = `
        INSERT INTO projects (
          project_name, project_description, project_status, project_phase, project_type, 
          delivery_type, program, geographic_region, cpd_number, approval_year,
          project_category, funded_to_complete, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `;

      // Generate a unique CPD number for the project
      const cpdNumber = `CPD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const currentYear = new Date().getFullYear().toString();

      const projectResult = await client.query(projectQuery, [
        basicInfo.projectName,
        basicInfo.description,
        'underway', // project_status (must match CHECK constraint)
        'planning', // project_phase (must match CHECK constraint)
        basicInfo.projectType || 'new_construction', // project_type
        basicInfo.deliveryType || 'design_bid_build', // delivery_type
        basicInfo.program || 'government_facilities', // program
        basicInfo.region || 'central', // geographic_region
        cpdNumber, // cpd_number (required unique field)
        currentYear, // approval_year (required field)
        'construction', // project_category (required field)
        'construction' // funded_to_complete (required field)
      ]);

      const projectId = projectResult.rows[0].id;

      // Create project location if provided
      if (basicInfo.location || basicInfo.municipality) {
        const locationQuery = `
          INSERT INTO project_locations (
            project_id, location, municipality, building_name
          ) VALUES ($1, $2, $3, $4)
        `;
        await client.query(locationQuery, [
          projectId,
          basicInfo.location || '',
          basicInfo.municipality || '',
          basicInfo.buildingName || basicInfo.projectName
        ]);
      }

      // Create project team entry with enhanced fallback logic
      let projectManagerId = teamInfo.projectManager;
      
      // If no project manager is specified, use current user as fallback
      if (!projectManagerId) {
        console.log('No project manager specified, using current user as fallback');
        projectManagerId = userId;
      }
      
      // Ensure the project manager ID is valid
      if (!projectManagerId) {
        throw new Error('Unable to determine project manager - no user context available');
      }
      
      const teamQuery = `
        INSERT INTO project_teams (
          project_id, project_manager_id, director_id
        ) VALUES ($1, $2, $3)
      `;
      await client.query(teamQuery, [
        projectId,
        projectManagerId,
        teamInfo.director || userId
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

      // Clean up wizard session
      await client.query('DELETE FROM project_wizard_step_data WHERE session_id = $1', [sessionId]);
      await client.query('DELETE FROM project_wizard_sessions WHERE session_id = $1', [sessionId]);

      await client.query('COMMIT');

      console.log('Project created successfully:', {
        projectId: projectResult.rows[0].id,
        projectName: projectResult.rows[0].project_name,
        assignedProjectManager: projectManagerId,
        createdBy: userId
      });

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
      const queryText = `
        SELECT 
          id, name, email, role,
          department, expertise_areas
        FROM users 
        WHERE is_active = true 
        AND role IN ('Project Manager', 'Senior Project Manager', 'Team Lead', 'Specialist')
        ORDER BY name
      `;
      
      const result = await query(queryText);
      let teamMembers = result.rows;
      
      // If no Project Managers found, add current user as an option
      const projectManagers = teamMembers.filter(member => 
        member.role === 'Project Manager' || member.role === 'Senior Project Manager'
      );
      
      if (projectManagers.length === 0 && req.user) {
        // Add current user as a Project Manager option
        const currentUserAsManager = {
          id: req.user.id,
          name: req.user.name || 'Current User',
          email: req.user.email || '',
          role: 'Project Manager',
          department: req.user.department || 'Infrastructure',
          expertise_areas: ['Project Management'],
          isCurrentUser: true
        };
        
        // Check if current user is not already in the list
        const userExists = teamMembers.find(member => member.id === req.user.id);
        if (!userExists) {
          teamMembers.unshift(currentUserAsManager); // Add at the beginning
        }
      }
      
      res.json({
        success: true,
        data: teamMembers
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
      
      // Provide fallback data if database query fails
      let fallbackMembers = [];
      
      // If we have user context, add them as a fallback Project Manager
      if (req.user) {
        fallbackMembers.push({
          id: req.user.id,
          name: req.user.name || 'Current User',
          email: req.user.email || '',
          role: 'Project Manager',
          department: req.user.department || 'Infrastructure',
          expertise_areas: ['Project Management'],
          isCurrentUser: true
        });
      }
      
      res.json({
        success: true,
        data: fallbackMembers,
        message: 'Using fallback data due to database error'
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
        case 1: // Template Selection
          if (!stepData.selectedTemplate) {
            validation.errors.push('Please select a project template');
          }
          break;

        case 2: // Basic Information
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

        case 3: // Budget Setup
          if (!stepData.totalBudget || stepData.totalBudget <= 0) {
            validation.errors.push('Total budget must be greater than 0');
          }
          if (stepData.initialBudget && stepData.initialBudget > stepData.totalBudget) {
            validation.errors.push('Initial budget cannot exceed total budget');
          }
          break;

        case 4: // Team Assignment
          if (!stepData.projectManager) {
            validation.errors.push('Project manager is required');
          }
          break;

        case 5: // Review
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

