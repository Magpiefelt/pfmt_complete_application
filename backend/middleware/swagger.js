const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger API documentation configuration
 * Only enabled when ENABLE_SWAGGER=true
 */

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PFMT API Documentation',
            version: '2.0.0',
            description: 'Professional Financial Management Tool API',
            contact: {
                name: 'PFMT Development Team',
                email: 'pfmt-dev@gov.ab.ca'
            }
        },
        servers: [
            {
                url: process.env.API_BASE_URL || 'http://localhost:3002',
                description: 'Development server'
            },
            {
                url: 'https://pfmt-api.gov.ab.ca',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                },
                userHeaders: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-user-id',
                    description: 'User ID for development authentication'
                }
            },
            schemas: {
                Project: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        project_name: { type: 'string' },
                        project_description: { type: 'string' },
                        project_status: { 
                            type: 'string',
                            enum: ['planning', 'design', 'procurement', 'construction', 'commissioning', 'complete', 'on_hold', 'cancelled']
                        },
                        project_category: {
                            type: 'string',
                            enum: ['construction', 'renovation', 'maintenance', 'planning', 'other']
                        },
                        budget_total: { type: 'number', minimum: 0 },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Vendor: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        contact_email: { type: 'string', format: 'email' },
                        contact_phone: { type: 'string' },
                        status: { 
                            type: 'string',
                            enum: ['active', 'inactive', 'suspended']
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        first_name: { type: 'string' },
                        last_name: { type: 'string' },
                        role: {
                            type: 'string',
                            enum: ['VENDOR', 'ANALYST', 'PMI', 'PM', 'SPM', 'DIRECTOR', 'ADMIN', 'SUPER_ADMIN']
                        },
                        is_active: { type: 'boolean' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                                code: { type: 'string' },
                                status: { type: 'integer' }
                            }
                        }
                    }
                }
            }
        },
        security: [
            { bearerAuth: [] },
            { userHeaders: [] }
        ]
    },
    apis: [
        './routes/*.js',
        './controllers/*.js'
    ]
};

/**
 * Initialize Swagger documentation
 */
const initializeSwagger = (app) => {
    if (process.env.ENABLE_SWAGGER === 'true') {
        console.log('📚 Enabling Swagger API documentation');
        
        const specs = swaggerJsdoc(swaggerOptions);
        
        // Serve swagger docs at /api/docs
        app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'PFMT API Documentation'
        }));
        
        // Serve swagger JSON at /api/docs.json
        app.get('/api/docs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(specs);
        });
        
        console.log('📚 Swagger documentation available at /api/docs');
    } else {
        console.log('📚 Swagger documentation disabled (set ENABLE_SWAGGER=true to enable)');
    }
};

/**
 * Common Swagger annotations for routes
 */
const swaggerAnnotations = {
    // Health endpoints
    health: `
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Application health check
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Application is healthy
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: ok
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     */
    `,
    
    healthDb: `
    /**
     * @swagger
     * /health/db:
     *   get:
     *     summary: Database health check
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Database health status
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   enum: [ok, degraded]
     *                 database:
     *                   type: string
     *                   enum: [connected, disconnected, query_failed]
     */
    `,
    
    // Project endpoints
    getProjects: `
    /**
     * @swagger
     * /api/projects:
     *   get:
     *     summary: Get all projects
     *     tags: [Projects]
     *     security:
     *       - bearerAuth: []
     *       - userHeaders: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *         description: Items per page
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *         description: Filter by project status
     *     responses:
     *       200:
     *         description: List of projects
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Project'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    `
};

module.exports = {
    initializeSwagger,
    swaggerAnnotations
};

