const express = require('express');
const cors = require('cors');
const { query } = require('./config/database-enhanced');
const { registerRoutes, createRoutesStatusRouter } = require('./config/routes');
const { requestLogger, performanceMonitor } = require('./middleware/logging');
const { authenticateToken } = require('./middleware/auth-consolidated');
const { errorHandler } = require('./middleware/errorHandler');
require('dotenv').config();

// P1-1: Export createApp function for centralized middleware
function createApp() {
    const app = express();
    
    console.log('🔧 Configuring PFMT Application...');

    // Configuration logging
    console.log('🔧 Application Configuration:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME || 'pfmt_integrated'}`);

    // HP-3: CORS Consolidation - Single policy as per spec
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001,http://localhost:3000,http://frontend:3000')
      .split(',').map(s => s.trim());

    console.log('🔧 CORS Configuration:');
    console.log(`   Allowed Origins: ${allowed.join(', ')}`);

    app.use(cors({
        origin(origin, cb) {
            if (!origin || allowed.includes(origin)) return cb(null, true);
            return cb(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
        allowedHeaders: ['Content-Type','Authorization','x-user-id','x-user-name','x-correlation-id']
    }));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Enhanced logging and monitoring middleware
    app.use(requestLogger);
    app.use(performanceMonitor);

    // HP-1: Auth Hardening & RBAC Consolidation - Mount consolidated auth first
    const { devAuthMiddleware } = require('./middleware/devAuth');
    
    app.use(authenticateToken);

    if (process.env.NODE_ENV !== 'production' && process.env.BYPASS_AUTH === 'true') {
        app.use(devAuthMiddleware); // maps x-user-* → req.user for dev convenience
    }

    // HP-5: Rate Limiting for Mutations
    const rateLimit = require('express-rate-limit');
    app.set('trust proxy', 1);
    const writeLimiter = rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
        max: Number(process.env.RATE_LIMIT_MAX || 300),
        standardHeaders: true, 
        legacyHeaders: false,
    });
    app.use(['/api/project-wizard','/api/projects','/api/vendors'], writeLimiter);

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

    // P0-4: Add /ready endpoint for better readiness probing
    app.get('/ready', async (req, res) => {
        try {
            const { healthCheck } = require('./config/database-enhanced');
            const result = await healthCheck();
            
            if (result.status === 'healthy') {
                res.status(200).json({
                    status: 'ready',
                    message: 'Application is ready to serve requests',
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(503).json({
                    status: 'not_ready',
                    message: 'Database connection is not healthy',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Readiness check failed:', error);
            res.status(503).json({
                status: 'not_ready',
                message: 'Readiness check failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Continue with existing routes and middleware...
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
                                'vendor_name', v.vendor_name,
                                'contact_email', v.contact_email,
                                'contact_phone', v.contact_phone,
                                'is_active', v.is_active
                            )
                        ) FILTER (WHERE v.id IS NOT NULL), '[]'::json
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
                    status: 'ERROR',
                    message: 'Project not found'
                });
            }
            
            const project = result.rows[0];
            console.log(`✅ Project found: ${project.name || project.project_name}`);
            
            res.json({
                status: 'OK',
                data: project
            });
            
        } catch (error) {
            console.error('Error fetching project details:', error);
            res.status(500).json({
                status: 'ERROR',
                message: 'Failed to fetch project details',
                error: error.message
            });
        }
    });

    // 404 handler for all other routes
    app.use((req, res) => {
        console.log(`404 - Route not found: ${req.method} ${req.path}`);
        res.status(404).json({
            status: 'ERROR',
            message: 'Route not found',
            path: req.path,
            availableRoutes: loadedRoutes.map(r => r.mount)
        });
    });
    
    return app;
}

// For backward compatibility and direct execution
const app = createApp();

module.exports = { createApp, app };



