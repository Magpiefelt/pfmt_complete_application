const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');

// Flexible authentication middleware that supports both JWT and user context headers
const flexibleAuth = async (req, res, next) => {
    try {
        // First try JWT authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Verify user still exists and is active
                const userResult = await query(
                    'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
                    [decoded.userId]
                );

                if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
                    req.user = userResult.rows[0];
                    return next();
                }
            } catch (jwtError) {
                console.log('JWT verification failed, trying user context headers');
            }
        }
        
        // Fallback to user context headers (for demo/development mode)
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const userName = req.headers['x-user-name'];
        
        if (userId && userRole && userName) {
            // Convert integer user IDs to UUID format for database compatibility
            let userUuid;
            
            if (uuidValidate(userId)) {
                // Already a valid UUID
                userUuid = userId;
                console.log('🔧 FlexibleAuth: Using provided UUID:', userUuid);
            } else {
                // Convert integer or other format to UUID
                // Use a deterministic UUID based on the user ID for consistency
                const userIdNum = parseInt(userId) || 1;
                const uuidMap = {
                    1: '550e8400-e29b-41d4-a716-446655440001',
                    2: '550e8400-e29b-41d4-a716-446655440002', 
                    3: '550e8400-e29b-41d4-a716-446655440003',
                    4: '550e8400-e29b-41d4-a716-446655440004',
                    5: '550e8400-e29b-41d4-a716-446655440005'
                };
                userUuid = uuidMap[userIdNum] || '550e8400-e29b-41d4-a716-446655440002';
                console.log(`🔧 FlexibleAuth: Converted user ID ${userId} to UUID: ${userUuid}`);
            }
            
            req.user = {
                id: userUuid,
                username: userName.toLowerCase().replace(/\s+/g, ''),
                email: `${userName.toLowerCase().replace(/\s+/g, '.')}@gov.ab.ca`,
                role: mapFrontendRoleToBackend(userRole),
                is_active: true,
                name: userName
            };
            return next();
        }
        
        // No valid authentication found
        return res.status(401).json({
            error: {
                message: 'Authentication required. Please provide either a valid JWT token or user context headers.',
                status: 401
            }
        });
        
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            error: {
                message: 'Authentication system error',
                status: 500
            }
        });
    }
};

// Map frontend role names to backend role names
const mapFrontendRoleToBackend = (frontendRole) => {
    const roleMap = {
        'Project Manager': 'PM',
        'Senior Project Manager': 'SPM',
        'Director': 'Director',
        'Vendor': 'Vendor',
        'Admin': 'Admin'
    };
    
    return roleMap[frontendRole] || 'PM';
};

// Flexible role authorization that works with both auth methods
const flexibleAuthorizeRoles = (...roles) => {
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

module.exports = {
    flexibleAuth,
    flexibleAuthorizeRoles,
    mapFrontendRoleToBackend
};

