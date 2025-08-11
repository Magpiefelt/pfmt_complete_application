const { query, pool } = require('../config/database');
const rateLimit = require('express-rate-limit');
const { 
  validateWizardData, 
  validateBasicProjectInfo, 
  formatValidationErrors,
  ValidationError 
} = require('../utils/validation');

// Rate limiting for wizard operations
const wizardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many wizard requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

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
      const templateId = req.body.templateId || null; // Optional template selection
      const sessionId = `wizard_${userId}_${Date.now()}`;
      
      console.log('Initializing wizard for user:', userId, 'sessionId:', sessionId, 'templateId:', templateId);
      
      // Create wizard session in database
      const queryText = `
        INSERT INTO project_wizard_sessions (session_id, user_id, current_step, template_id, created_at, updated_at)
        VALUES ($1, $2, 1, $3, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await query(queryText, [sessionId, userId, templateId]);
      
      res.json({
        success: true,
        sessionId: sessionId,
        currentStep: 1,
        totalSteps: 5,
        templateId: templateId,
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

  // Save wizard step data - ENHANCED WITH VALIDATION
  async saveStepData(req, res) {
    console.log('🔧 saveStepData called with params:', req.params);
    console.log('🔧 saveStepData body:', req.body);
    console.log('🔧 saveStepData user:', req.user);
    
    try {
      const { sessionId, stepId } = req.params;
      const stepData = req.body;
      const userId = req.user?.id;

      console.log('🔧 Extracted params - sessionId:', sessionId, 'stepId:', stepId, 'userId:', userId);

      if (!userId) {
        console.error('❌ No user ID found in request');
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // Validate session belongs to user
      const sessionQuery = `
        SELECT * FROM project_wizard_sessions 
        WHERE session_id = $1 AND user_id = $2
      `;
      
      console.log('🔧 Checking session with query:', sessionQuery, [sessionId, userId]);
      const sessionResult = await query(sessionQuery, [sessionId, userId]);
      console.log('🔧 Session query result:', sessionResult.rows.length, 'rows');
      
      if (sessionResult.rows.length === 0) {
        console.error('❌ Wizard session not found for sessionId:', sessionId, 'userId:', userId);
        return res.status(404).json({ 
          success: false, 
          message: 'Wizard session not found' 
        });
      }

      // Validate step data based on step ID
      let validationErrors = [];
      try {
        validationErrors = await validateStepData(parseInt(stepId), stepData);
      } catch (validationError) {
        console.warn('Step validation failed, continuing without validation:', validationError);
        // Continue without validation if validation service fails
      }
      
      if (validationErrors.length > 0) {
        console.log('🔧 Validation errors found:', validationErrors);
        return res.status(400).json(formatValidationErrors(validationErrors));
      }

      // Save step data
      const saveQuery = `
        INSERT INTO project_wizard_step_data (session_id, step_id, step_data, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (session_id, step_id) 
        DO UPDATE SET step_data = $3, updated_at = NOW()
        RETURNING *
      `;
      
      console.log('🔧 Saving step data with query:', saveQuery);
      const saveResult = await query(saveQuery, [
        sessionId, 
        parseInt(stepId), 
        JSON.stringify(stepData)
      ]);
      console.log('🔧 Step data saved successfully:', saveResult.rows[0]);

      // Update current step in session
      const updateSessionQuery = `
        UPDATE project_wizard_sessions 
        SET current_step = $1, updated_at = NOW()
        WHERE session_id = $2
      `;
      await query(updateSessionQuery, [parseInt(stepId), sessionId]);
      console.log('🔧 Session current step updated to:', stepId);

      res.json({
        success: true,
        message: 'Step data saved successfully',
        data: saveResult.rows[0]
      });
    } catch (error) {
      console.error('❌ Error saving step data:', error);
      console.error('❌ Error stack:', error);
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          field: error.field,
          code: error.code
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Failed to save step data',
        error: error.message 
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

  // Complete wizard and create project - ENHANCED WITH DEBUGGING
  async completeWizard(req, res) {
    console.log('🔧 completeWizard called with sessionId:', req.params.sessionId);
    console.log('🔧 completeWizard user:', req.user);
    
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
      
      console.log('Searching for wizard session:', {
        sessionId,
        userId,
        query: sessionQuery
      });
      
      const sessionResult = await client.query(sessionQuery, [sessionId, userId]);
      
      console.log('Session query result:', {
        rowCount: sessionResult.rows.length,
        rows: sessionResult.rows.length > 0 ? sessionResult.rows[0] : 'No rows found'
      });
      
      if (sessionResult.rows.length === 0) {
        // Try to find session without user restriction to debug
        const debugQuery = `SELECT * FROM project_wizard_sessions WHERE session_id = $1`;
        const debugResult = await client.query(debugQuery, [sessionId]);
        console.log('Debug - Session exists without user filter:', {
          found: debugResult.rows.length > 0,
          session: debugResult.rows[0] || 'Not found'
        });
        
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

      // Validate required steps - Updated for new wizard structure
      const requiredSteps = [1, 2, 3, 4]; // Details, Location, Vendors, Budget
      for (const step of requiredSteps) {
        if (!stepData[step]) {
          console.warn(`Missing data for step ${step}, using empty object`);
          stepData[step] = {};
        }
      }

      // Comprehensive validation of all wizard data
      console.log('🔧 Validating complete wizard data...');
      let validationErrors = [];
      try {
        validationErrors = await validateWizardData(stepData);
      } catch (validationError) {
        console.warn('Wizard validation failed, continuing without validation:', validationError);
        // Continue without validation if validation service fails
      }
      
      if (validationErrors.length > 0) {
        console.log('🔧 Wizard validation errors found:', validationErrors);
        return res.status(400).json(formatValidationErrors(validationErrors));
      }

      // Create project from wizard data - Updated for new structure
      const detailsInfo = stepData[1] || {}; // Project Details Step
      const locationInfo = stepData[2] || {}; // Location Step  
      const vendorsInfo = stepData[3] || {}; // Vendors Step
      const budgetInfo = stepData[4] || {}; // Budget Step

      console.log('Creating project with data:', {
        projectName: detailsInfo.projectName,
        category: detailsInfo.category,
        location: locationInfo.location,
        totalBudget: budgetInfo.totalBudget,
        currentUserId: userId
      });

      // Additional business logic validation
      if (!detailsInfo.projectName || !detailsInfo.description) {
        throw new Error('Project name and description are required');
      }

      // Check for duplicate project names
      const duplicateCheck = await client.query(
        'SELECT id FROM projects WHERE LOWER(project_name) = LOWER($1)',
        [detailsInfo.projectName]
      );
      
      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'A project with this name already exists',
          errors: {
            projectName: [{
              message: 'A project with this name already exists',
              code: 'DUPLICATE_PROJECT_NAME'
            }]
          }
        });
      }

      // Insert project
      const projectQuery = `
        INSERT INTO projects (
          project_name, project_description, project_status, project_phase, project_type, 
          delivery_type, program, geographic_region, cpd_number, approval_year,
          project_category, funded_to_complete, modified_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *
      `;

      // Generate a unique CPD number for the project
      const cpdNumber = `CPD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const currentYear = new Date().getFullYear().toString();

      // Prepare parameters with proper data types - Updated for new structure
      const projectParams = [
        detailsInfo.projectName,                         // $1: project_name (text)
        detailsInfo.description,                         // $2: project_description (text)
        'underway',                                      // $3: project_status (text)
        'planning',                                      // $4: project_phase (text)
        detailsInfo.projectType || 'new_construction',  // $5: project_type (text)
        detailsInfo.deliveryType || 'design_bid_build', // $6: delivery_type (text)
        detailsInfo.program || 'government_facilities', // $7: program (text)
        locationInfo.location || 'central',             // $8: geographic_region (text)
        cpdNumber,                                       // $9: cpd_number (text)
        currentYear,                                     // $10: approval_year (text)
        detailsInfo.category || 'construction',         // $11: project_category (text)
        Boolean(detailsInfo.fundedToComplete || false), // $12: funded_to_complete (boolean)
        userId                                           // $13: modified_by (UUID) - associates project with creating user
      ];

      console.log('Project parameters:', projectParams.map((param, index) => 
        `$${index + 1}: ${param} (${typeof param})`
      ));

      const projectResult = await client.query(projectQuery, projectParams);

      const projectId = projectResult.rows[0].id;

      // Create project location if provided - Updated for new structure
      if (locationInfo.location || locationInfo.municipality) {
        const locationQuery = `
          INSERT INTO project_locations (
            project_id, location, municipality, urban_rural, address, building_name, constituency
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await client.query(locationQuery, [
          projectId,
          locationInfo.location || '',
          locationInfo.municipality || '',
          locationInfo.urbanRural || '',
          locationInfo.address || '',
          locationInfo.buildingName || detailsInfo.projectName,
          locationInfo.constituency || ''
        ]);
      }

      // Create project team entry with current user as project manager
      const teamQuery = `
        INSERT INTO project_teams (
          project_id, project_manager_id, director_id
        ) VALUES ($1, $2, $3)
      `;
      await client.query(teamQuery, [
        projectId,
        userId, // Use current user as project manager
        userId  // Use current user as director for now
      ]);

      // Clean up wizard session
      await client.query('DELETE FROM project_wizard_step_data WHERE session_id = $1', [sessionId]);
      await client.query('DELETE FROM project_wizard_sessions WHERE session_id = $1', [sessionId]);

      await client.query('COMMIT');

      console.log('Project created successfully:', {
        projectId: projectResult.rows[0].id,
        projectName: projectResult.rows[0].project_name,
        assignedProjectManager: userId,
        createdBy: userId
      });

      // Ensure response is sent properly
      const response = {
        success: true,
        message: 'Project created successfully',
        project: {
          ...projectResult.rows[0],
          // Add normalized name field for frontend compatibility
          name: projectResult.rows[0].project_name,
          projectName: projectResult.rows[0].project_name
        }
      };

      console.log('✅ Sending success response:', response);
      return res.json(response);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error completing wizard:', error);
      console.error('❌ Error stack:', error.stack);
      
      const errorResponse = { 
        success: false, 
        message: error.message || 'Failed to create project',
        error: error.message,
        correlationId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      console.log('❌ Sending error response:', errorResponse);
      return res.status(500).json(errorResponse);
    } finally {
      client.release();
    }
  }

  // Get available team members for assignment
  async getAvailableTeamMembers(req, res) {
    try {
      const queryText = `
        SELECT 
          id, 
          first_name || ' ' || last_name as name, 
          email, 
          role
        FROM users 
        WHERE is_active = true 
        AND role IN ('Project Manager', 'Senior Project Manager', 'Team Lead', 'Specialist')
        ORDER BY first_name, last_name
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
          name: req.user.first_name && req.user.last_name 
            ? `${req.user.first_name} ${req.user.last_name}` 
            : req.user.name || 'Current User',
          email: req.user.email || '',
          role: 'Project Manager',
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
          name: req.user.first_name && req.user.last_name 
            ? `${req.user.first_name} ${req.user.last_name}` 
            : req.user.name || 'Current User',
          email: req.user.email || '',
          role: 'Project Manager',
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

  // Get available vendors - NEW METHOD (optional, with fallback)
  async getAvailableVendors(req, res) {
    try {
      const queryText = `
        SELECT 
          id,
          vendor_name,
          vendor_type,
          contact_email,
          contact_phone,
          specialties,
          is_active,
          rating
        FROM vendors 
        WHERE is_active = true
        ORDER BY vendor_name
      `;
      
      const result = await query(queryText);
      
      res.json({
        success: true,
        vendors: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      // Provide fallback if vendors table doesn't exist
      res.json({ 
        success: true, 
        vendors: [],
        count: 0,
        message: 'Vendors table not available'
      });
    }
  }

  // Health check endpoint - NEW METHOD (optional)
  async healthCheck(req, res) {
    try {
      const startTime = Date.now();
      
      // Test database connection
      const dbResult = await query('SELECT NOW() as current_time, version() as version');
      const dbDuration = Date.now() - startTime;
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          duration: `${dbDuration}ms`,
          version: dbResult.rows[0].version.split(' ')[0] + ' ' + dbResult.rows[0].version.split(' ')[1]
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
}

/**
 * Validates step data based on step ID
 */
async function validateStepData(stepId, stepData) {
  const errors = [];
  
  try {
    switch (stepId) {
      case 1: // Template selection
        // Template step validation is minimal
        break;
        
      case 2: // Basic information
        const basicErrors = await validateBasicProjectInfo(stepData);
        errors.push(...basicErrors);
        break;
        
      case 3: // Budget information
        const { validateBudgetInfo } = require('../utils/validation');
        const budgetErrors = validateBudgetInfo(stepData);
        errors.push(...budgetErrors);
        break;
        
      case 4: // Team assignment
        const { validateTeamInfo } = require('../utils/validation');
        const teamErrors = validateTeamInfo(stepData);
        errors.push(...teamErrors);
        break;
        
      case 5: // Location information (if separate step)
        const { validateLocationInfo } = require('../utils/validation');
        const locationErrors = validateLocationInfo(stepData);
        errors.push(...locationErrors);
        break;
        
      default:
        // Unknown step, no validation
        break;
    }
  } catch (error) {
    console.error('Error during step validation:', error);
    errors.push({
      field: 'general',
      message: 'Validation error occurred',
      code: 'VALIDATION_ERROR'
    });
  }
  
  return errors;
}

module.exports = { 
  ProjectWizardController: new ProjectWizardController(),
  wizardRateLimit
};

