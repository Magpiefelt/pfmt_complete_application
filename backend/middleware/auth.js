const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
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
            'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
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

        req.user = user;
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
    requireAdmin
};

