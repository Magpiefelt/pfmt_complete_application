const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Canonical roles for validation
const VALID_ROLES = ['admin', 'pmi', 'director', 'pm', 'spm', 'analyst', 'executive', 'vendor'];

// Legacy role mapping for backward compatibility
const LEGACY_ROLE_MAPPING = {
    'project_manager': 'pm',
    'senior_project_manager': 'spm',
    'project_initiator': 'pmi',
    'contract_analyst': 'analyst',
    'administrator': 'admin',
    'cfo': 'executive'
};

/**
 * Validate if a role is in the canonical role set
 * @param {string} role - Role to validate
 * @returns {boolean} True if role is valid
 */
const validateRole = (role) => {
    return VALID_ROLES.includes(role) || Object.keys(LEGACY_ROLE_MAPPING).includes(role);
};

/**
 * Normalize role to canonical format
 * @param {string} role - Role to normalize
 * @returns {string} Canonical role
 */
const normalizeRole = (role) => {
    // If already canonical, return as-is
    if (VALID_ROLES.includes(role)) {
        return role;
    }
    
    // Check legacy mapping
    const normalized = LEGACY_ROLE_MAPPING[role];
    if (normalized) {
        return normalized;
    }
    
    // Default fallback with warning
    console.warn(`Unknown role: ${role}, defaulting to 'pm'`);
    return 'pm';
};

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    // Development mode bypass - only allow in development with explicit flag
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        console.warn('⚠️  AUTH BYPASS ENABLED - Development mode only');
        // Get the first user from the database for development
        try {
            const userResult = await query('SELECT id, username, email, role, is_active, last_login_at FROM users WHERE is_active = true LIMIT 1');
            if (userResult.rows.length > 0) {
                const user = userResult.rows[0];
                // Normalize role to canonical format
                user.role = normalizeRole(user.role);
                req.user = user;
            } else {
                // Fallback if no users exist - use canonical role
                req.user = {
                    id: '00000000-0000-0000-0000-000000000001',
                    username: 'sarah.johnson',
                    email: 'sarah.johnson@gov.ab.ca',
                    role: 'pm', // Use canonical role
                    is_active: true
                };
            }
        } catch (error) {
            console.error('Error getting user for auth bypass:', error);
            // Fallback user with canonical role
            req.user = {
                id: '00000000-0000-0000-0000-000000000001',
                username: 'sarah.johnson',
                email: 'sarah.johnson@gov.ab.ca',
                role: 'pm', // Use canonical role
                is_active: true
            };
        }
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: {
                message: 'Access token required',
                code: 'TOKEN_MISSING'
            }
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get fresh user data from database (ensures role changes are immediate)
        const userResult = await query(
            'SELECT id, username, email, role, is_active, last_login_at, first_name, last_name FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        const user = userResult.rows[0];
        
        if (!user.is_active) {
            return res.status(401).json({
                error: {
                    message: 'Account deactivated',
                    code: 'ACCOUNT_DEACTIVATED'
                }
            });
        }

        // Validate role against canonical roles
        if (!validateRole(user.role)) {
            console.error(`Invalid user role detected: ${user.role} for user ${user.id}`);
            return res.status(401).json({
                error: {
                    message: 'Invalid user role',
                    code: 'INVALID_ROLE'
                }
            });
        }

        // Normalize role to ensure consistency
        user.role = normalizeRole(user.role);
        
        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: {
                    message: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                }
            });
        }
        
        console.error('Token verification error:', error);
        return res.status(403).json({
            error: {
                message: 'Invalid token',
                code: 'TOKEN_INVALID'
            }
        });
    }
};

// Middleware to check user roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: {
                    message: 'Authentication required',
                    status: 401
                }
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: {
                    message: 'Insufficient permissions',
                    status: 403,
                    requiredRoles: roles,
                    userRole: req.user.role
                }
            });
        }

        next();
    };
};

// Middleware to check if user is PM or PMI
const requirePMOrPMI = authorizeRoles('pm', 'pmi', 'admin');

// Middleware to check if user is Director or Admin
const requireDirectorOrAdmin = authorizeRoles('director', 'admin');

// Middleware to check if user is Admin
const requireAdmin = authorizeRoles('admin');

// Alias for authorizeRoles for backward compatibility
const requireRole = authorizeRoles;

module.exports = {
    authenticateToken,
    authorizeRoles,
    requireRole,
    requirePMOrPMI,
    requireDirectorOrAdmin,
    requireAdmin,
    validateRole,
    normalizeRole,
    VALID_ROLES
};

