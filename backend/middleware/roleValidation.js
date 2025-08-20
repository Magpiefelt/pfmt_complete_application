const { body, validationResult } = require('express-validator');

/**
 * Role validation middleware for project assignments
 * Validates that assigned users have appropriate roles for their positions
 */

// Valid roles for different positions
const VALID_ROLES = {
    PM: ['PM', 'SPM', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN'],
    SPM: ['SPM', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN'],
    DIRECTOR: ['DIRECTOR', 'ADMIN', 'SUPER_ADMIN'],
    TEAM_MEMBER: ['ANALYST', 'PMI', 'PM', 'SPM', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN']
};

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Role validation failed',
                code: 'INVALID_ROLE_ASSIGNMENT',
                details: errors.array().map(error => ({
                    field: error.path,
                    message: error.msg,
                    value: error.value,
                    validRoles: error.validRoles
                }))
            }
        });
    }
    next();
};

/**
 * Validate that a user has a valid role for PM assignment
 */
const validatePMRole = async (userId) => {
    if (!userId) return true; // Optional field
    
    try {
        const { query } = require('../config/database-enhanced');
        const result = await query(
            'SELECT role FROM users WHERE id = $1 AND is_active = true',
            [userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('User not found or inactive');
        }
        
        const userRole = result.rows[0].role.toUpperCase();
        if (!VALID_ROLES.PM.includes(userRole)) {
            const error = new Error(`User with role '${userRole}' cannot be assigned as Project Manager`);
            error.validRoles = VALID_ROLES.PM;
            error.code = 'INVALID_PM_ASSIGNMENT';
            throw error;
        }
        
        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Validate that a user has a valid role for SPM assignment
 */
const validateSPMRole = async (userId) => {
    if (!userId) return true; // Optional field
    
    try {
        const { query } = require('../config/database-enhanced');
        const result = await query(
            'SELECT role FROM users WHERE id = $1 AND is_active = true',
            [userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('User not found or inactive');
        }
        
        const userRole = result.rows[0].role.toUpperCase();
        if (!VALID_ROLES.SPM.includes(userRole)) {
            const error = new Error(`User with role '${userRole}' cannot be assigned as Senior Project Manager`);
            error.validRoles = VALID_ROLES.SPM;
            error.code = 'INVALID_SPM_ASSIGNMENT';
            throw error;
        }
        
        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Validate team member roles
 */
const validateTeamMemberRoles = async (teamMemberIds) => {
    if (!teamMemberIds || !Array.isArray(teamMemberIds) || teamMemberIds.length === 0) {
        return true; // Optional field
    }
    
    try {
        const { query } = require('../config/database-enhanced');
        const result = await query(
            'SELECT id, role FROM users WHERE id = ANY($1) AND is_active = true',
            [teamMemberIds]
        );
        
        if (result.rows.length !== teamMemberIds.length) {
            throw new Error('One or more team members not found or inactive');
        }
        
        for (const user of result.rows) {
            const userRole = user.role.toUpperCase();
            if (!VALID_ROLES.TEAM_MEMBER.includes(userRole)) {
                const error = new Error(`User with role '${userRole}' cannot be assigned as team member`);
                error.validRoles = VALID_ROLES.TEAM_MEMBER;
                error.code = 'INVALID_TEAM_MEMBER_ASSIGNMENT';
                error.userId = user.id;
                throw error;
            }
        }
        
        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Express-validator middleware for PM assignment validation
 */
const validateAssignedPM = [
    body('pm_id')
        .optional()
        .custom(validatePMRole)
        .withMessage('Invalid PM assignment'),
    body('assigned_project_manager')
        .optional()
        .custom(validatePMRole)
        .withMessage('Invalid PM assignment'),
    handleValidationErrors
];

/**
 * Express-validator middleware for SPM assignment validation
 */
const validateAssignedSPM = [
    body('spm_id')
        .optional()
        .custom(validateSPMRole)
        .withMessage('Invalid SPM assignment'),
    body('assigned_senior_project_manager')
        .optional()
        .custom(validateSPMRole)
        .withMessage('Invalid SPM assignment'),
    handleValidationErrors
];

/**
 * Express-validator middleware for team member assignment validation
 */
const validateAssignedTeamMembers = [
    body('team_members')
        .optional()
        .isArray()
        .withMessage('Team members must be an array')
        .custom(validateTeamMemberRoles)
        .withMessage('Invalid team member assignment'),
    handleValidationErrors
];

/**
 * Combined validation middleware for all user assignments
 */
const validateAssignedUsers = [
    body('pm_id')
        .optional()
        .custom(validatePMRole)
        .withMessage('Invalid PM assignment'),
    body('assigned_project_manager')
        .optional()
        .custom(validatePMRole)
        .withMessage('Invalid PM assignment'),
    body('spm_id')
        .optional()
        .custom(validateSPMRole)
        .withMessage('Invalid SPM assignment'),
    body('assigned_senior_project_manager')
        .optional()
        .custom(validateSPMRole)
        .withMessage('Invalid SPM assignment'),
    body('team_members')
        .optional()
        .isArray()
        .withMessage('Team members must be an array')
        .custom(validateTeamMemberRoles)
        .withMessage('Invalid team member assignment'),
    handleValidationErrors
];

/**
 * Validate role hierarchy - ensure user has sufficient privileges
 */
const validateRoleHierarchy = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Authentication required',
                    code: 'AUTHENTICATION_REQUIRED'
                }
            });
        }
        
        const userRole = req.user.role.toUpperCase();
        const allowedRoles = requiredRoles.map(role => role.toUpperCase());
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Insufficient privileges',
                    code: 'INSUFFICIENT_PRIVILEGES',
                    userRole: userRole,
                    requiredRoles: allowedRoles
                }
            });
        }
        
        next();
    };
};

module.exports = {
    VALID_ROLES,
    handleValidationErrors,
    validatePMRole,
    validateSPMRole,
    validateTeamMemberRoles,
    validateAssignedPM,
    validateAssignedSPM,
    validateAssignedTeamMembers,
    validateAssignedUsers,
    validateRoleHierarchy
};

