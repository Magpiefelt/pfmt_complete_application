const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = 3005;

console.log('🚀 Starting PFMT Fixed Server...');

// Basic middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role', 'x-user-name']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Simple auth middleware
app.use((req, res, next) => {
    // Add a default user for development
    req.user = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        username: 'devuser',
        email: 'dev.user@gov.ab.ca',
        role: 'PM',
        is_active: true,
        name: 'Dev User'
    };
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.status(200).json({
        status: 'OK',
        message: 'PFMT Fixed Server is running',
        timestamp: new Date().toISOString(),
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

// Simple project wizard health endpoint
app.get('/api/project-wizard/health', (req, res) => {
    console.log('Project wizard health check requested');
    res.json({
        success: true,
        message: 'Project Wizard API is healthy',
        timestamp: new Date().toISOString()
    });
});

// Fixed project wizard completion endpoint
app.post('/api/project-wizard/complete', async (req, res) => {
    try {
        console.log('Project wizard completion requested');
        const { details, location, vendors, budget } = req.body;
        
        if (!details || !details.name) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        // Import database transaction function
        const { transaction } = require('./config/database');
        const { v4: uuidv4 } = require('uuid');
        
        const projectId = uuidv4();
        
        // Use transaction wrapper to ensure proper connection handling
        const result = await transaction(async (client) => {
            // Insert project
            const projectQuery = `
                INSERT INTO projects (id, name, code, description, status, budget_total, budget_currency, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;
            
            const projectResult = await client.query(projectQuery, [
                projectId,
                details.name,
                details.code || `PROJ-${Date.now()}`,
                details.description || '',
                'Active',
                budget?.total || 0,
                budget?.currency || 'CAD',
                req.user.id
            ]);
            
            // Insert location if provided
            if (location && (location.municipality || location.addressLine1)) {
                const locationQuery = `
                    INSERT INTO project_locations (project_id, address_line1, address_line2, municipality, province, postal_code, country)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;
                
                await client.query(locationQuery, [
                    projectId,
                    location.addressLine1 || '',
                    location.addressLine2 || '',
                    location.municipality || '',
                    location.province || '',
                    location.postalCode || '',
                    location.country || 'Canada'
                ]);
            }
            
            // Insert vendors if provided
            const vendorResults = [];
            if (vendors && Array.isArray(vendors) && vendors.length > 0) {
                for (const vendor of vendors) {
                    if (vendor.name) {
                        const vendorId = uuidv4();
                        
                        // Insert vendor
                        const vendorQuery = `
                            INSERT INTO vendors (id, name, contact_name, contact_email, contact_phone)
                            VALUES ($1, $2, $3, $4, $5)
                            RETURNING *
                        `;
                        
                        const vendorResult = await client.query(vendorQuery, [
                            vendorId,
                            vendor.name,
                            vendor.contactName || '',
                            vendor.contactEmail || '',
                            vendor.contactPhone || ''
                        ]);
                        
                        // Link vendor to project
                        const linkQuery = `
                            INSERT INTO project_vendors (project_id, vendor_id)
                            VALUES ($1, $2)
                        `;
                        
                        await client.query(linkQuery, [projectId, vendorId]);
                        vendorResults.push(vendorResult.rows[0]);
                    }
                }
            }
            
            return {
                project: projectResult.rows[0],
                vendors: vendorResults
            };
        });
        
        console.log(`Project created successfully: ${projectId}`);
        
        res.json({
            success: true,
            message: 'Project created successfully',
            project: {
                id: projectId,
                name: details.name,
                code: details.code || `PROJ-${Date.now()}`,
                description: details.description || '',
                status: 'Active',
                budget: {
                    total: budget?.total || 0,
                    currency: budget?.currency || 'CAD'
                },
                location: location || null,
                vendors: result.vendors || []
            }
        });
        
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create project',
            error: error.message
        });
    }
});

// Get project details endpoint
app.get('/api/projects/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        console.log(`Fetching project details for: ${projectId}`);
        
        const { query } = require('./config/database');
        
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

// Start server
const server = app.listen(PORT, () => {
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

module.exports = app;

