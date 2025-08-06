const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { testConnection } = require('./config/database');
require('dotenv').config();

// Enhanced error handling for development
if (process.env.NODE_ENV !== 'production') {
    // Handle unhandled promise rejections in development
    process.on('unhandledRejection', (reason, promise) => {
        console.error('🚨 Unhandled Promise Rejection at:', promise, 'reason:', reason);
        // In development, log the error but don't exit to allow debugging
        console.error('Stack trace:', reason.stack || reason);
    });

    // Handle uncaught exceptions in development
    process.on('uncaughtException', (error) => {
        console.error('🚨 Uncaught Exception:', error);
        console.error('Stack trace:', error.stack);
        // In development, log but continue running for debugging
        console.log('🔄 Server continuing in development mode for debugging...');
    });
}

const app = express();
const PORT = process.env.PORT || 3002;

// Environment validation and logging for development
if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Development Environment Configuration:');
    console.log('   📊 Port:', PORT);
    console.log('   🗄️  DB Host:', process.env.DB_HOST || 'localhost (default)');
    console.log('   🗄️  DB Port:', process.env.DB_PORT || '5432 (default)');
    console.log('   🗄️  DB Name:', process.env.DB_NAME || 'pfmt_integrated (default)');
    console.log('   🗄️  DB User:', process.env.DB_USER || 'postgres (default)');
    console.log('   🔐 DB Password:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET - using default]');
    console.log('');
}

// Security middleware
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

// CORS configuration - allow all origins for development
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(morgan('combined'));

// Static file serving for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'PFMT Integrated API Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
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

// API Routes - Integrated from both applications
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
app.use('/api/reports', require('./routes/reports'));
app.use('/api/approval', require('./routes/approval'));
app.use('/api/fiscal-calendar', require('./routes/fiscal-calendar'));
app.use('/api/gate-meetings', require('./routes/gateMeetings'));
app.use('/api/workflow', require('./routes/workflow'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/migration', require('./routes/migration'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/pfmt', require('./routes/pfmt'));

// Phase 1 Enhancement Routes
app.use('/api/phase1', require('./routes/phase1'));

// Phase 2 Enhancement Routes
app.use('/api/phase2', require('./routes/phase2'));

// Phase 3 & 4 Enhancement Routes
app.use('/api/phase3-4', require('./routes/phase3_4'));

// Scheduled Submissions Routes
app.use('/api/scheduled-submissions', require('./routes/scheduledSubmissions'));

// Enhanced project routes for versioning and enhanced features
// Note: Using existing projects route for now, can add versioning later
// app.use('/api/projects-v2', require('./routes/projectVersions'));

// Vendor sub-routes are handled within the vendors route file

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
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
            if (process.env.NODE_ENV === 'production') {
                console.error('❌ Failed to connect to database. Server not started.');
                process.exit(1);
            } else {
                console.error('⚠️ Failed to connect to database in development mode.');
                console.error('🔄 Server will start anyway for debugging. Some features may not work.');
                console.error('💡 Please check your database configuration and ensure PostgreSQL is running.');
            }
        }

        // Initialize scheduled task service
        try {
            const scheduledTaskService = require('./services/scheduledTaskService');
            await scheduledTaskService.initialize();
            console.log('✅ Scheduled task service initialized');
        } catch (error) {
            console.error('⚠️ Failed to initialize scheduled task service:', error.message);
            console.log('🔄 Server will continue without scheduled tasks');
        }

        // Start server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 PFMT Integrated API Server is running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🗄️  Database health: http://localhost:${PORT}/health/db`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    try {
        const scheduledTaskService = require('./services/scheduledTaskService');
        scheduledTaskService.stopAllJobs();
        console.log('✅ Scheduled tasks stopped');
    } catch (error) {
        console.error('⚠️ Error stopping scheduled tasks:', error.message);
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    try {
        const scheduledTaskService = require('./services/scheduledTaskService');
        scheduledTaskService.stopAllJobs();
        console.log('✅ Scheduled tasks stopped');
    } catch (error) {
        console.error('⚠️ Error stopping scheduled tasks:', error.message);
    }
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;

