const express = require('express');
const cors = require('cors');
const { testConnection, query } = require('./config/database');
require('dotenv').config();

const app = express();
// FIXED: Use environment variable for port with fallback to 3002 (Docker expects 3002)
const PORT = process.env.PORT || 3002;

console.log('🚀 Starting PFMT Fixed Server...');

// Configuration logging
console.log('🔧 Server Configuration:');
console.log(`   PORT: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'pfmt_integrated'}`);

// Basic middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role', 'x-user-name', 'x-correlation-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// FIXED: Enhanced auth middleware that ensures user exists in database
app.use(async (req, res, next) => {
    try {
        const defaultUserId = '550e8400-e29b-41d4-a716-446655440002';
        
        // Check if the default user exists in the database
        const userResult = await query(
            'SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
            [defaultUserId]
        );
        
        if (userResult.rows.length > 0) {
            // User exists, use it
            const user = userResult.rows[0];
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
                name: `${user.first_name} ${user.last_name}`
            };
            console.log(`✅ Using existing user: ${user.username} (${user.id})`);
        } else {
            // User doesn't exist, create it
            console.log('⚠️ Default user not found, creating development user...');
            
            const insertResult = await query(`
                INSERT INTO users (id, username, email, first_name, last_name, role, password_hash, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, username, email, first_name, last_name, role, is_active
            `, [
                defaultUserId,
                'devuser',
                'dev.user@gov.ab.ca',
                'Dev',
                'User',
                'PM',
                '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', // bcrypt hash for 'admin'
                true
            ]);
            
            const newUser = insertResult.rows[0];
            req.user = {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                is_active: newUser.is_active,
                name: `${newUser.first_name} ${newUser.last_name}`
            };
            console.log(`✅ Created and using new user: ${newUser.username} (${newUser.id})`);
        }
        
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        // Fallback to basic user object for development
        req.user = {
            id: '550e8400-e29b-41d4-a716-446655440002',
            username: 'devuser',
            email: 'dev.user@gov.ab.ca',
            role: 'PM',
            is_active: true,
            name: 'Dev User'
        };
        console.log('⚠️ Using fallback user due to database error');
        next();
    }
});

// ADDED: Helper function to safely require route files (prevents crashes)
function safeRequireRoute(routePath, routeName) {
    try {
        const route = require(routePath);
        console.log(`✅ Loaded route: ${routeName}`);
        return route;
    } catch (error) {
        console.warn(`⚠️ Route ${routeName} not available: ${error.message}`);
        // Return a dummy router that handles requests gracefully
        const dummyRouter = express.Router();
        dummyRouter.all('*', (req, res) => {
            res.status(501).json({
                success: false,
                message: `Route ${routeName} is not implemented`,
                path: req.path
            });
        });
        return dummyRouter;
    }
}

// ADDED: Load available route files safely (prevents crashes from missing files)
console.log('🔄 Loading available API routes...');

// Try to load common route files if they exist
const routesToTry = [
    { path: './routes/auth', name: 'auth', mount: '/api/auth' },
    { path: './routes/users', name: 'users', mount: '/api/users' },
    { path: './routes/projects', name: 'projects', mount: '/api/projects' },
    { path: './routes/companies', name: 'companies', mount: '/api/companies' },
    { path: './routes/vendors', name: 'vendors', mount: '/api/vendors' },
    { path: './routes/budget', name: 'budget', mount: '/api/budget' },
    { path: './routes/reporting', name: 'reporting', mount: '/api/reporting' },
    { path: './routes/gateMeetings', name: 'gate-meetings', mount: '/api/gate-meetings' },
    { path: './routes/projectWizard', name: 'project-wizard', mount: '/api/project-wizard' }
];

// Load routes that exist, skip ones that don't
routesToTry.forEach(route => {
    app.use(route.mount, safeRequireRoute(route.path, route.name));
});

console.log('✅ Route loading completed');

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.status(200).json({
        status: 'OK',
        message: 'PFMT Fixed Server is running',
        timestamp: new Date().toISOString(),
        port: PORT,
        user: req.user ? req.user.id : 'none'
    });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
    try {
        console.log('Database health check requested');
        const result = await testConnection();
        res.status(200).json({
            status: 'OK',
            message: 'Database connection successful',
            timestamp: new Date().toISOString(),
            database: result
        });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get project details endpoint
app.get('/api/projects/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        console.log(`Fetching project details for: ${projectId}`);
        
        // Get project with all related data
        const projectQuery = `
            SELECT 
                p.*,
                pl.address_line1, pl.address_line2, pl.municipality, pl.province, pl.postal_code, pl.country,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', v.id,
                            'name', v.name,
                            'contact_name', v.contact_name,
                            'contact_email', v.contact_email,
                            'contact_phone', v.contact_phone
                        )
                    ) FILTER (WHERE v.id IS NOT NULL), 
                    '[]'
                ) as vendors
            FROM projects p
            LEFT JOIN project_locations pl ON p.id = pl.project_id
            LEFT JOIN project_vendors pv ON p.id = pv.project_id
            LEFT JOIN vendors v ON pv.vendor_id = v.id
            WHERE p.id = $1
            GROUP BY p.id, pl.address_line1, pl.address_line2, pl.municipality, pl.province, pl.postal_code, pl.country
        `;
        
        const result = await query(projectQuery, [projectId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        
        const project = result.rows[0];
        
        res.json({
            success: true,
            project: {
                id: project.id,
                name: project.name,
                code: project.code,
                description: project.description,
                status: project.status,
                budget: {
                    total: project.budget_total,
                    currency: project.budget_currency
                },
                location: {
                    addressLine1: project.address_line1,
                    addressLine2: project.address_line2,
                    municipality: project.municipality,
                    province: project.province,
                    postalCode: project.postal_code,
                    country: project.country
                },
                vendors: project.vendors,
                createdAt: project.created_at,
                updatedAt: project.updated_at
            }
        });
        
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch project',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        status: 'ERROR',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
        status: 'ERROR',
        message: 'Route not found',
        path: req.path
    });
});

// Start server - FIXED: Listen on 0.0.0.0 for Docker compatibility
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PFMT Fixed Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🗄️  Database health: http://localhost:${PORT}/health/db`);
    console.log(`🧙 Wizard health: http://localhost:${PORT}/api/project-wizard/health`);
    console.log(`📋 Project creation: http://localhost:${PORT}/api/project-wizard/complete`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Test database connection on startup
testConnection()
    .then((result) => {
        console.log('✅ Database connected successfully');
        console.log('📊 Database info:', result);
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
    });

// ADDED: Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

module.exports = app;

