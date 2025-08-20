/**
 * Wizard Progress Service
 * Pure service for computing wizard progress and next allowed steps
 * HP-2: Server-Side Wizard Step Gating implementation
 */

const { query } = require('../config/database-enhanced');

/**
 * Get wizard progress for a project
 * @param {string} projectId - The project ID
 * @returns {Promise<{completedSteps: number[], nextAllowed: number}>}
 */
async function getProgressForProject(projectId) {
    try {
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        // Get project workflow status and lifecycle status
        const projectResult = await query(`
            SELECT 
                workflow_status,
                lifecycle_status,
                created_at,
                assigned_pm,
                assigned_spm
            FROM projects 
            WHERE id = $1
        `, [projectId]);

        if (projectResult.rows.length === 0) {
            throw new Error('Project not found');
        }

        const project = projectResult.rows[0];
        const completedSteps = [];
        let nextAllowed = 1;

        // Determine completed steps based on workflow status
        switch (project.workflow_status) {
            case 'initiated':
                completedSteps.push(1); // Step 1: Project initiation
                nextAllowed = 2; // Next: Team assignment
                break;
                
            case 'assigned':
                completedSteps.push(1, 2); // Steps 1-2: Initiation + Assignment
                nextAllowed = 3; // Next: Configuration/Finalization
                break;
                
            case 'finalized':
                completedSteps.push(1, 2, 3); // Steps 1-3: All wizard steps
                nextAllowed = 4; // Next: Post-wizard management (if applicable)
                break;
                
            default:
                // For new/draft projects
                nextAllowed = 1;
                break;
        }

        // Additional validation based on lifecycle status
        if (project.lifecycle_status === 'active' && project.workflow_status === 'finalized') {
            // Project is fully configured and active
            completedSteps.push(1, 2, 3);
            nextAllowed = Math.max(nextAllowed, 4);
        }

        // Check for wizard session data to get more granular progress
        const sessionResult = await query(`
            SELECT 
                current_step,
                step_data,
                is_completed
            FROM project_wizard_sessions 
            WHERE project_id = $1 
            ORDER BY updated_at DESC 
            LIMIT 1
        `, [projectId]);

        if (sessionResult.rows.length > 0) {
            const session = sessionResult.rows[0];
            
            // If there's an active session, use its current step
            if (!session.is_completed) {
                nextAllowed = Math.max(nextAllowed, session.current_step);
            }
            
            // Add completed steps from session data
            if (session.step_data) {
                const stepData = typeof session.step_data === 'string' 
                    ? JSON.parse(session.step_data) 
                    : session.step_data;
                
                // Check which steps have been completed based on data presence
                if (stepData.step1 || stepData.basicInfo) {
                    if (!completedSteps.includes(1)) completedSteps.push(1);
                }
                if (stepData.step2 || stepData.teamAssignment) {
                    if (!completedSteps.includes(2)) completedSteps.push(2);
                }
                if (stepData.step3 || stepData.configuration) {
                    if (!completedSteps.includes(3)) completedSteps.push(3);
                }
            }
        }

        // Ensure completedSteps is sorted
        completedSteps.sort((a, b) => a - b);

        return {
            completedSteps,
            nextAllowed
        };

    } catch (error) {
        console.error('Error getting wizard progress for project:', projectId, error);
        throw error;
    }
}

/**
 * Resolve project ID from session ID
 * @param {string} sessionId - The wizard session ID
 * @returns {Promise<string|null>} - The project ID or null if not found
 */
async function resolveProjectIdFromSession(sessionId) {
    try {
        if (!sessionId) {
            return null;
        }

        const result = await query(`
            SELECT project_id 
            FROM project_wizard_sessions 
            WHERE session_id = $1 OR id = $1
            ORDER BY updated_at DESC 
            LIMIT 1
        `, [sessionId]);

        return result.rows.length > 0 ? result.rows[0].project_id : null;
    } catch (error) {
        console.error('Error resolving project ID from session:', sessionId, error);
        return null;
    }
}

/**
 * Check if a step is allowed for a project
 * @param {string} projectId - The project ID
 * @param {number} step - The step number to check
 * @returns {Promise<boolean>} - Whether the step is allowed
 */
async function isStepAllowed(projectId, step) {
    try {
        const progress = await getProgressForProject(projectId);
        return step <= progress.nextAllowed;
    } catch (error) {
        console.error('Error checking if step is allowed:', error);
        return false;
    }
}

module.exports = {
    getProgressForProject,
    resolveProjectIdFromSession,
    isStepAllowed
};

