const { v4: uuidv4, validate: uuidValidate } = require('uuid');

// Development-only authentication middleware that injects mock users with proper UUIDs
// This solves the UUID mismatch issue where the database expects UUID but gets integer IDs
const devAuthMiddleware = (req, res, next) => {
    // Only activate in non-production environments
    if (process.env.NODE_ENV === 'production') {
        return next();
    }

    // Skip if user is already authenticated (e.g., via JWT)
    if (req.user) {
        return next();
    }

    console.log('🔧 DevAuth: Checking for development user headers...');

    // Check for development user headers
    const devUserId = req.headers['x-user-id'];
    const devUserName = req.headers['x-user-name'];
    const devUserRole = req.headers['x-user-role'];

    if (devUserId) {
        // Validate that the provided user ID is a proper UUID
        if (uuidValidate(devUserId)) {
            req.user = {
                id: devUserId,
                username: (devUserName || 'Dev User').toLowerCase().replace(/\s+/g, ''),
                email: `${(devUserName || 'dev.user').toLowerCase().replace(/\s+/g, '.')}@gov.ab.ca`,
                role: mapFrontendRoleToBackend(devUserRole || 'Project Manager'),
                is_active: true,
                name: devUserName || 'Dev User'
            };
            console.log(`✅ DevAuth: Using user ${req.user.id} (${req.user.name})`);
            return next();
        } else {
            console.error('❌ DevAuth: Invalid x-user-id UUID format:', devUserId);
            return res.status(400).json({
                error: 'Invalid x-user-id; must be a valid UUID string (e.g., 550e8400-e29b-41d4-a716-446655440002)'
            });
        }
    } else {
        // No user ID header provided – use a default fallback user for convenience
        const defaultUserId = '550e8400-e29b-41d4-a716-446655440002'; // Standard example UUID
        req.user = {
            id: defaultUserId,
            username: 'localdevuser',
            email: 'local.dev.user@gov.ab.ca',
            role: 'PM',
            is_active: true,
            name: 'Local Dev User'
        };
        console.warn('⚠️  DevAuth: No x-user-id provided, using default dev user:', defaultUserId);
        return next();
    }
};

// Map frontend role names to backend role names (same as flexibleAuth)
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

module.exports = {
    devAuthMiddleware,
    mapFrontendRoleToBackend
};

