/**
 * Project Wizard Service
 * Business logic for project creation wizard functionality
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');
const { 
  validateWizardData, 
  validateBasicProjectInfo, 
  formatValidationErrors,
  ValidationError 
} = require('../utils/validation');

class ProjectWizardService {
    /**
     * Initialize a new wizard session
     */
    static async initializeWizardSession(userId, templateId = null) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const sessionId = `wizard_${userId}_${Date.now()}`;
            
            console.log('Initializing wizard for user:', userId, 'sessionId:', sessionId, 'templateId:', templateId);
            
            // Create wizard session in database
            const queryText = `
                INSERT INTO project_wizard_sessions (session_id, user_id, current_step, template_id, created_at, updated_at)
                VALUES ($1, $2, 1, $3, NOW(), NOW())
                RETURNING *
            `;
            
            const result = await query(queryText, [sessionId, userId, templateId]);
            
            // Load template data if provided
            let templateData = null;
            if (templateId) {
                templateData = await this.getTemplateData(templateId);
            }
            
            // Audit log
            auditLogger('WIZARD_INIT', 'project_wizard_session', sessionId, userId, {
                templateId,
                sessionId
            });
            
            return {
                sessionId,
                currentStep: 1,
                templateData,
                session: result.rows[0]
            };
        } catch (error) {
            console.error('Error initializing wizard session:', error);
            throw error;
        }
    }

    /**
     * Get wizard session by ID
     */
    static async getWizardSession(sessionId, userId = null) {
        try {
            let queryText = `
                SELECT pws.*, pt.template_name, pt.template_data
                FROM project_wizard_sessions pws
                LEFT JOIN project_templates pt ON pws.template_id = pt.id
                WHERE pws.session_id = $1
            `;
            const params = [sessionId];
            
            if (userId) {
                queryText += ` AND pws.user_id = $2`;
                params.push(userId);
            }
            
            const result = await query(queryText, params);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error getting wizard session:', error);
            throw error;
        }
    }

    /**
     * Update wizard session step and data
     */
    static async updateWizardSession(sessionId, userId, stepData) {
        try {
            const session = await this.getWizardSession(sessionId, userId);
            if (!session) {
                throw new Error('Wizard session not found');
            }

            // Validate step data
            const validationErrors = await this.validateStepData(session.current_step, stepData);
            if (validationErrors.length > 0) {
                throw new ValidationError('Step validation failed', validationErrors);
            }

            // Update session data
            const queryText = `
                UPDATE project_wizard_sessions 
                SET 
                    step_data = COALESCE(step_data, '{}'::jsonb) || $1::jsonb,
                    updated_at = NOW()
                WHERE session_id = $2 AND user_id = $3
                RETURNING *
            `;
            
            const result = await query(queryText, [JSON.stringify(stepData), sessionId, userId]);
            
            // Audit log
            auditLogger('WIZARD_UPDATE', 'project_wizard_session', sessionId, userId, {
                step: session.current_step,
                dataKeys: Object.keys(stepData)
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating wizard session:', error);
            throw error;
        }
    }

    /**
     * Advance wizard to next step
     */
    static async advanceWizardStep(sessionId, userId, currentStepData = null) {
        try {
            const session = await this.getWizardSession(sessionId, userId);
            if (!session) {
                throw new Error('Wizard session not found');
            }

            // Update current step data if provided
            if (currentStepData) {
                await this.updateWizardSession(sessionId, userId, currentStepData);
            }

            // Advance to next step
            const nextStep = session.current_step + 1;
            const maxSteps = await this.getMaxWizardSteps();
            
            if (nextStep > maxSteps) {
                throw new Error('Cannot advance beyond final step');
            }

            const queryText = `
                UPDATE project_wizard_sessions 
                SET 
                    current_step = $1,
                    updated_at = NOW()
                WHERE session_id = $2 AND user_id = $3
                RETURNING *
            `;
            
            const result = await query(queryText, [nextStep, sessionId, userId]);
            
            // Audit log
            auditLogger('WIZARD_ADVANCE', 'project_wizard_session', sessionId, userId, {
                fromStep: session.current_step,
                toStep: nextStep
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error advancing wizard step:', error);
            throw error;
        }
    }

    /**
     * Go back to previous wizard step
     */
    static async previousWizardStep(sessionId, userId) {
        try {
            const session = await this.getWizardSession(sessionId, userId);
            if (!session) {
                throw new Error('Wizard session not found');
            }

            if (session.current_step <= 1) {
                throw new Error('Cannot go back from first step');
            }

            const previousStep = session.current_step - 1;

            const queryText = `
                UPDATE project_wizard_sessions 
                SET 
                    current_step = $1,
                    updated_at = NOW()
                WHERE session_id = $2 AND user_id = $3
                RETURNING *
            `;
            
            const result = await query(queryText, [previousStep, sessionId, userId]);
            
            // Audit log
            auditLogger('WIZARD_PREVIOUS', 'project_wizard_session', sessionId, userId, {
                fromStep: session.current_step,
                toStep: previousStep
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error going to previous wizard step:', error);
            throw error;
        }
    }

    /**
     * Complete wizard and create project
     */
    static async completeWizard(sessionId, userId) {
        try {
            const session = await this.getWizardSession(sessionId, userId);
            if (!session) {
                throw new Error('Wizard session not found');
            }

            // Validate all wizard data
            const validationErrors = await this.validateCompleteWizardData(session);
            if (validationErrors.length > 0) {
                throw new ValidationError('Wizard completion validation failed', validationErrors);
            }

            // Create project using transaction
            const projectId = await transaction(async (client) => {
                // Create the project
                const project = await this.createProjectFromWizardData(session, client);
                
                // Mark wizard session as completed
                await client.query(`
                    UPDATE project_wizard_sessions 
                    SET 
                        status = 'completed',
                        project_id = $1,
                        completed_at = NOW(),
                        updated_at = NOW()
                    WHERE session_id = $2
                `, [project.id, sessionId]);
                
                return project.id;
            });

            // Audit log
            auditLogger('WIZARD_COMPLETE', 'project_wizard_session', sessionId, userId, {
                projectId,
                sessionId
            });

            return projectId;
        } catch (error) {
            console.error('Error completing wizard:', error);
            throw error;
        }
    }

    /**
     * Cancel wizard session
     */
    static async cancelWizard(sessionId, userId, reason = null) {
        try {
            const session = await this.getWizardSession(sessionId, userId);
            if (!session) {
                throw new Error('Wizard session not found');
            }

            const queryText = `
                UPDATE project_wizard_sessions 
                SET 
                    status = 'cancelled',
                    cancellation_reason = $1,
                    cancelled_at = NOW(),
                    updated_at = NOW()
                WHERE session_id = $2 AND user_id = $3
                RETURNING *
            `;
            
            const result = await query(queryText, [reason, sessionId, userId]);
            
            // Audit log
            auditLogger('WIZARD_CANCEL', 'project_wizard_session', sessionId, userId, {
                reason,
                step: session.current_step
            });
            
            return result.rows[0];
        } catch (error) {
            console.error('Error cancelling wizard:', error);
            throw error;
        }
    }

    /**
     * Get available project templates
     */
    static async getProjectTemplates(userId = null) {
        try {
            let queryText = `
                SELECT id, template_name, description, category, is_active, template_data
                FROM project_templates
                WHERE is_active = true
            `;
            const params = [];
            
            // Add user-specific templates if userId provided
            if (userId) {
                queryText += ` AND (is_public = true OR created_by = $1)`;
                params.push(userId);
            } else {
                queryText += ` AND is_public = true`;
            }
            
            queryText += ` ORDER BY category, template_name`;
            
            const result = await query(queryText, params);
            return result.rows;
        } catch (error) {
            console.error('Error getting project templates:', error);
            throw error;
        }
    }

    /**
     * Get template data by ID
     */
    static async getTemplateData(templateId) {
        try {
            const queryText = `
                SELECT template_data, template_name, description
                FROM project_templates
                WHERE id = $1 AND is_active = true
            `;
            
            const result = await query(queryText, [templateId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error getting template data:', error);
            throw error;
        }
    }

    /**
     * Validate step data based on current step
     */
    static async validateStepData(step, stepData) {
        const errors = [];
        
        try {
            switch (step) {
                case 1:
                    // Basic project information
                    const basicErrors = validateBasicProjectInfo(stepData);
                    errors.push(...basicErrors);
                    break;
                    
                case 2:
                    // Project details and scope
                    if (!stepData.projectDescription || stepData.projectDescription.trim().length < 10) {
                        errors.push('Project description must be at least 10 characters');
                    }
                    if (!stepData.projectScope || stepData.projectScope.trim().length < 10) {
                        errors.push('Project scope must be at least 10 characters');
                    }
                    break;
                    
                case 3:
                    // Budget and timeline
                    if (!stepData.estimatedBudget || stepData.estimatedBudget <= 0) {
                        errors.push('Estimated budget must be greater than 0');
                    }
                    if (!stepData.startDate) {
                        errors.push('Start date is required');
                    }
                    if (!stepData.endDate) {
                        errors.push('End date is required');
                    }
                    if (stepData.startDate && stepData.endDate && new Date(stepData.startDate) >= new Date(stepData.endDate)) {
                        errors.push('End date must be after start date');
                    }
                    break;
                    
                case 4:
                    // Team and stakeholders
                    if (!stepData.projectManager) {
                        errors.push('Project manager is required');
                    }
                    if (!stepData.stakeholders || !Array.isArray(stepData.stakeholders) || stepData.stakeholders.length === 0) {
                        errors.push('At least one stakeholder is required');
                    }
                    break;
                    
                case 5:
                    // Risk assessment and mitigation
                    if (!stepData.riskAssessment || !Array.isArray(stepData.riskAssessment)) {
                        errors.push('Risk assessment is required');
                    }
                    break;
                    
                default:
                    // No specific validation for other steps
                    break;
            }
        } catch (error) {
            console.error('Error validating step data:', error);
            errors.push('Validation error occurred');
        }
        
        return errors;
    }

    /**
     * Validate complete wizard data before project creation
     */
    static async validateCompleteWizardData(session) {
        const errors = [];
        const stepData = session.step_data || {};
        
        try {
            // Validate all required fields across all steps
            if (!stepData.projectName || stepData.projectName.trim().length < 3) {
                errors.push('Project name must be at least 3 characters');
            }
            
            if (!stepData.projectDescription || stepData.projectDescription.trim().length < 10) {
                errors.push('Project description must be at least 10 characters');
            }
            
            if (!stepData.estimatedBudget || stepData.estimatedBudget <= 0) {
                errors.push('Estimated budget must be greater than 0');
            }
            
            if (!stepData.startDate || !stepData.endDate) {
                errors.push('Start date and end date are required');
            }
            
            if (!stepData.projectManager) {
                errors.push('Project manager is required');
            }
            
            // Check if project name already exists
            const existingProject = await query(
                'SELECT id FROM projects WHERE project_name = $1',
                [stepData.projectName]
            );
            
            if (existingProject.rows.length > 0) {
                errors.push('Project name already exists');
            }
            
        } catch (error) {
            console.error('Error validating complete wizard data:', error);
            errors.push('Validation error occurred');
        }
        
        return errors;
    }

    /**
     * Create project from wizard data
     */
    static async createProjectFromWizardData(session, client = null) {
        try {
            const stepData = session.step_data || {};
            const queryClient = client || query;
            
            // Generate project code
            const projectCode = await this.generateProjectCode(stepData.projectName, queryClient);
            
            // Create project
            const projectQueryText = `
                INSERT INTO projects (
                    project_name, project_code, project_description, project_scope,
                    estimated_budget, start_date, end_date, project_manager_id,
                    status, priority, created_by, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                RETURNING *
            `;
            
            const projectParams = [
                stepData.projectName,
                projectCode,
                stepData.projectDescription,
                stepData.projectScope,
                stepData.estimatedBudget,
                stepData.startDate,
                stepData.endDate,
                stepData.projectManager,
                'Planning',
                stepData.priority || 'Medium',
                session.user_id
            ];
            
            const projectResult = await queryClient(projectQueryText, projectParams);
            const project = projectResult.rows[0];
            
            // Add stakeholders
            if (stepData.stakeholders && Array.isArray(stepData.stakeholders)) {
                for (const stakeholder of stepData.stakeholders) {
                    await queryClient(`
                        INSERT INTO project_stakeholders (project_id, user_id, role, created_at)
                        VALUES ($1, $2, $3, NOW())
                    `, [project.id, stakeholder.userId, stakeholder.role]);
                }
            }
            
            // Add risk assessments
            if (stepData.riskAssessment && Array.isArray(stepData.riskAssessment)) {
                for (const risk of stepData.riskAssessment) {
                    await queryClient(`
                        INSERT INTO project_risks (project_id, risk_description, impact_level, probability, mitigation_strategy, created_by, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    `, [project.id, risk.description, risk.impact, risk.probability, risk.mitigation, session.user_id]);
                }
            }
            
            return project;
        } catch (error) {
            console.error('Error creating project from wizard data:', error);
            throw error;
        }
    }

    /**
     * Generate unique project code
     */
    static async generateProjectCode(projectName, queryClient = query) {
        try {
            // Generate base code from project name
            const baseCode = projectName
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .substring(0, 6);
            
            // Find next available number
            let counter = 1;
            let projectCode;
            
            do {
                projectCode = `${baseCode}${counter.toString().padStart(3, '0')}`;
                const result = await queryClient(
                    'SELECT id FROM projects WHERE project_code = $1',
                    [projectCode]
                );
                
                if (result.rows.length === 0) {
                    break;
                }
                
                counter++;
            } while (counter <= 999);
            
            if (counter > 999) {
                throw new Error('Unable to generate unique project code');
            }
            
            return projectCode;
        } catch (error) {
            console.error('Error generating project code:', error);
            throw error;
        }
    }

    /**
     * Get maximum wizard steps
     */
    static async getMaxWizardSteps() {
        // This could be configurable in the future
        return 6;
    }

    /**
     * Get wizard session statistics
     */
    static async getWizardStatistics(userId = null) {
        try {
            let queryText = `
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_sessions,
                    AVG(CASE WHEN completed_at IS NOT NULL THEN 
                        EXTRACT(EPOCH FROM (completed_at - created_at))/60 
                    END) as avg_completion_time_minutes
                FROM project_wizard_sessions
            `;
            const params = [];
            
            if (userId) {
                queryText += ` WHERE user_id = $1`;
                params.push(userId);
            }
            
            const result = await query(queryText, params);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting wizard statistics:', error);
            throw error;
        }
    }
}

module.exports = ProjectWizardService;

