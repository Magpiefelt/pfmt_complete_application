const app = require('./app');
const { testConnection } = require('./config/database');
require('dotenv').config();

// FIXED: Use environment variable for port with fallback to 3002 (Docker expects 3002)
const PORT = process.env.PORT || 3002;

console.log('🚀 Starting PFMT Server...');
console.log(`   PORT: ${PORT}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

// Start server - FIXED: Listen on 0.0.0.0 for Docker compatibility
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PFMT Server running on port ${PORT}`);
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

// ENHANCED: Graceful shutdown handling
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = server;

