const jwt = require('jsonwebtoken');
const { query } = require('../config/database-enhanced');

/**
 * Consolidated Authentication Middleware
 * Combines functionality from auth.js, devAuth.js, and flexibleAuth.js
 * Preserves all existing authentication patterns while providing unified interface
 */

// Enhanced middleware to verify JWT token with flexible authentication
const authenticateToken = async (req, res, next) => {
    try {
        // Development mode bypass (preserves existing devAuth functionality)
        if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
            return await handleDevelopmentAuth(req, res, next);
        }

        // Production JWT authentication
        return await handleJWTAuth(req, res, next);
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            error: {
                message: 'Authentication service error',
                status: 500
            }
        });
    }
};

// Handle development authentication (preserves devAuth.js functionality)
const handleDevelopmentAuth = async (req, res, next) => {
    try {
        // Try to get the first user from the database for development
        const userResult = await query('SELECT id, username, email, role, is_active, first_name, last_name FROM users LIMIT 1');
        
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
                name: `${user.first_name} ${user.last_name}`
            };
            console.log(`🔓 Development auth: Using database user ${user.username}`);
        } else {
            // Fallback if no users exist (preserves existing fallback)
            req.user = {
                id: '00000000-0000-0000-0000-000000000001',
                username: 'sarah.johnson',
                email: 'sarah.johnson@gov.ab.ca',
                role: 'project_manager',
                is_active: true,
                name: 'Sarah Johnson'
            };
            console.log('🔓 Development auth: Using fallback user');
        }
        
        return next();
    } catch (error) {
        console.error('Error in development auth:', error);
        // Ultimate fallback user
        req.user = {
            id: '00000000-0000-0000-0000-000000000001',
            username: 'dev.user',
            email: 'dev.user@gov.ab.ca',
            role: 'project_manager',
            is_active: true,
            name: 'Development User'
        };
        console.log('🔓 Development auth: Using ultimate fallback user');
        return next();
    }
};

// Handle JWT authentication (preserves auth.js functionality)
const handleJWTAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: {
                message: 'Access token is required',
                status: 401
            }
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user still exists and is active
        const userResult = await query(
            'SELECT id, username, email, role, is_active, first_name, last_name FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: {
                    message: 'User not found',
                    status: 401
                }
            });
        }

        const user = userResult.rows[0];
        if (!user.is_active) {
            return res.status(401).json({
                error: {
                    message: 'User account is deactivated',
                    status: 401
                }
            });
        }

        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            name: `${user.first_name} ${user.last_name}`
        };
        
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({
            error: {
                message: 'Invalid or expired token',
                status: 403
            }
        });
    }
};

// Flexible authentication middleware (preserves flexibleAuth.js functionality)
const flexibleAuth = async (req, res, next) => {
    // Check for various authentication methods
    const token = req.headers['authorization']?.split(' ')[1];
    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'];

    try {
        // Method 1: JWT Token
        if (token) {
            return await handleJWTAuth(req, res, next);
        }

        // Method 2: Header-based auth (for development/testing)
        if (userId) {
            // Look up user role from database instead of relying on header
            const userResult = await query('SELECT role FROM users WHERE id = $1', [userId]);
            const userRole = userResult.rows.length > 0 ? userResult.rows[0].role : 'PM'; // Default to PM
            
            req.user = {
                id: userId,
                username: userName || 'header-user',
                email: `${userName || 'header-user'}@gov.ab.ca`,
                role: userRole,
                is_active: true,
                name: userName || 'Header User'
            };
            console.log(`🔓 Flexible auth: Using header-based auth for ${userName || userId}`);
            return next();
        }

        // Method 3: Development bypass
        if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
            return await handleDevelopmentAuth(req, res, next);
        }

        // No valid authentication method found
        return res.status(401).json({
            error: {
                message: 'Authentication required',
                status: 401
            }
        });
    } catch (error) {
        console.error('Flexible authentication error:', error);
        return res.status(500).json({
            error: {
                message: 'Authentication service error',
                status: 500
            }
        });
    }
};

// Middleware to check user roles (preserves existing role checking)
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

        // Normalize role names for comparison
        const userRole = req.user.role?.toLowerCase();
        const allowedRoles = roles.map(role => role.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
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

// Convenience middleware functions (preserves existing patterns)
const requirePMOrPMI = authorizeRoles('pm', 'pmi', 'admin', 'project_manager');
const requireDirectorOrAdmin = authorizeRoles('director', 'admin');
const requireAdmin = authorizeRoles('admin');
const requireRole = authorizeRoles; // Alias for backward compatibility

// Enhanced user context middleware
const setUserContext = async (req, res, next) => {
    if (req.user && req.user.id) {
        try {
            // Set user context for audit logging
            await query('SELECT set_config($1, $2, false)', ['app.current_user_id', req.user.id]);
            console.log(`👤 User context set: ${req.user.username} (${req.user.id})`);
        } catch (error) {
            console.error('Failed to set user context:', error.message);
        }
    }
    next();
};

// Middleware to ensure user exists in database (for development)
const ensureUserExists = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next();
    }

    try {
        const userResult = await query(
            'SELECT id FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            console.log(`⚠️ User ${req.user.id} not found in database, creating...`);
            
            // Create user if it doesn't exist
            await query(`
                INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (id) DO NOTHING
            `, [
                req.user.id,
                req.user.username || 'unknown',
                req.user.email || 'unknown@gov.ab.ca',
                req.user.name?.split(' ')[0] || 'Unknown',
                req.user.name?.split(' ')[1] || 'User',
                req.user.role || 'user',
                '$2b$10$defaulthash', // Default hash
                true
            ]);
            
            console.log(`✅ User ${req.user.username} created in database`);
        }
    } catch (error) {
        console.error('Error ensuring user exists:', error);
        // Continue anyway - don't block the request
    }

    next();
};

module.exports = {
    // Main authentication functions
    authenticateToken,
    flexibleAuth,
    
    // Role-based authorization
    authorizeRoles,
    requireRole,
    requirePMOrPMI,
    requireDirectorOrAdmin,
    requireAdmin,
    
    // Utility functions
    setUserContext,
    ensureUserExists,
    
    // Internal functions (for testing)
    handleDevelopmentAuth,
    handleJWTAuth
};

