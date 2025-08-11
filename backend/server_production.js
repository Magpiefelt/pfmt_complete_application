const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { testConnection } = require('./config/database');
const { devAuthMiddleware } = require('./middleware/devAuth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🚀 Starting PFMT Production Server...');

// Security middleware - optimized for stability
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS configuration - optimized for development and production
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role', 'x-user-name'],
    exposedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role', 'x-user-name']
}));

// Rate limiting - optimized to prevent hanging
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased limit to prevent blocking during development
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path.startsWith('/health')
});
app.use('/api/', limiter);

// Body parsing middleware - optimized limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware - simplified for stability
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
} else {
    app.use(morgan('combined'));
}

// Development authentication middleware (before routes)
app.use(devAuthMiddleware);

// Static file serving for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'PFMT Production API Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        user: req.user ? req.user.id : 'none'
    });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
    try {
        const isConnected = await testConnection();
        res.status(200).json({
            status: isConnected ? 'OK' : 'ERROR',
            message: isConnected ? 'Database connection successful' : 'Database connection failed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes - All original routes preserved
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/project-wizard', require('./routes/projectWizard'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/vendor-portal', require('./routes/vendorPortal'));
app.use('/api/vendor-qualification', require('./routes/vendorQualification'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/reporting', require('./routes/reporting'));
app.use('/api/approval', require('./routes/approval'));
app.use('/api/fiscal-calendar', require('./routes/fiscal-calendar'));
app.use('/api/gate-meetings', require('./routes/gateMeetings'));
app.use('/api/workflow', require('./routes/workflow'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/migration', require('./routes/migration'));

// Phase 1 Enhancement Routes
app.use('/api/phase1', require('./routes/phase1'));

// Phase 2 Enhancement Routes
app.use('/api/phase2', require('./routes/phase2'));

// Phase 3 & 4 Enhancement Routes
app.use('/api/phase3-4', require('./routes/phase3_4'));

// Scheduled Submissions Routes
app.use('/api/scheduled-submissions', require('./routes/scheduledSubmissions'));

// Test endpoints for manual verification (development only)
if (process.env.NODE_ENV === 'development') {
    app.use('/api/test', require('./routes/test_endpoints'));
}

// Enhanced project routes for versioning and enhanced features
// Note: Using existing projects route for now, can add versioning later
// app.use('/api/projects-v2', require('./routes/projectVersions'));

// Vendor sub-routes are handled within the vendors route file

// Error handling middleware - enhanced for stability
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle specific error types
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large',
            message: 'File size must be less than 50MB'
        });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            error: 'Invalid file',
            message: 'Only Excel files are allowed'
        });
    }

    // Handle database connection errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        return res.status(503).json({
            error: 'Database connection error',
            message: 'Unable to connect to database',
            status: 503,
            timestamp: new Date().toISOString()
        });
    }
    
    // Generic error response
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            status: err.status || 500,
            timestamp: new Date().toISOString()
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            status: 404,
            timestamp: new Date().toISOString()
        }
    });
});

// Initialize database connection and start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Server not started.');
            process.exit(1);
        }

        // Initialize scheduled task service with error handling
        try {
            const scheduledTaskService = require('./services/scheduledTaskService');
            await scheduledTaskService.initialize();
            console.log('✅ Scheduled task service initialized');
        } catch (error) {
            console.error('⚠️ Failed to initialize scheduled task service:', error.message);
            console.log('🔄 Server will continue without scheduled tasks');
        }

        // Start server with enhanced error handling
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 PFMT Production API Server is running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🗄️  Database health: http://localhost:${PORT}/health/db`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
        });

        // Handle server errors
        server.on('error', (error) => {
            console.error('❌ Server error:', error.message);
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Please use a different port.`);
            }
            process.exit(1);
        });

        // Set server timeout to prevent hanging
        server.timeout = 30000; // 30 seconds

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown - enhanced
const gracefulShutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    try {
        const scheduledTaskService = require('./services/scheduledTaskService');
        scheduledTaskService.stopAllJobs();
        console.log('✅ Scheduled tasks stopped');
    } catch (error) {
        console.error('⚠️ Error stopping scheduled tasks:', error.message);
    }
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();

module.exports = app;

