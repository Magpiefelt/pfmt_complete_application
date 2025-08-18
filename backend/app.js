const express = require('express');
const cors = require('cors');
const { query } = require('./config/database-enhanced');
const { registerRoutes, createRoutesStatusRouter } = require('./config/routes');
const { requestLogger, performanceMonitor } = require('./middleware/logging');
const { authenticateToken } = require('./middleware/auth-consolidated');
const { errorHandler } = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 Configuring PFMT Application...');

// Configuration logging
console.log('🔧 Application Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'pfmt_integrated'}`);
console.log(`   PORT: ${PORT}`);

// Security and CORS middleware - UPDATED FOR PROPER ALLOWLIST
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080', 'http://127.0.0.1:3000'];

console.log('🔧 CORS Configuration:');
console.log(`   Allowed Origins: ${allowedOrigins.join(', ')}`);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`❌ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'x-user-id', 
        'x-user-name', 
        'x-correlation-id',
        'Accept',
        'Origin',
        'X-Requested-With'
    ]
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced logging and monitoring middleware
app.use(requestLogger);
app.use(performanceMonitor);

// ENHANCED: Auth middleware that ensures user exists in database
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

// ENHANCED: Dynamic route registration system
console.log('🔄 Loading available API routes...');
const { loadedRoutes, failedRoutes } = registerRoutes(app);

// Routes status endpoint
app.use('/api/routes', createRoutesStatusRouter());

console.log('✅ Route loading completed');
console.log(`   Loaded: ${loadedRoutes.length} routes`);
console.log(`   Failed: ${failedRoutes.length} routes`);

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.status(200).json({
        status: 'OK',
        message: 'PFMT Application is running',
        timestamp: new Date().toISOString(),
        user: req.user ? req.user.id : 'none',
        routes: {
            loaded: loadedRoutes.length,
            failed: failedRoutes.length
        }
    });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
    try {
        console.log('Database health check requested');
        const { healthCheck } = require('./config/database-enhanced');
        const result = await healthCheck();
        
        res.status(result.status === 'healthy' ? 200 : 503).json({
            status: result.status === 'healthy' ? 'OK' : 'ERROR',
            message: result.status === 'healthy' ? 'Database connection successful' : 'Database connection failed',
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

// Get project details endpoint (preserved from original server.js)
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

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler (must be after error handler)
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
        status: 'ERROR',
        message: 'Route not found',
        path: req.path,
        availableRoutes: loadedRoutes.map(r => r.mount)
    });
});

module.exports = app;

