#!/usr/bin/env node

/**
 * PFMT Production Server
 * Updated to use single factory pattern as per HP-3 specification
 * Removes CORS configuration - handled by createApp factory
 */

const { createApp } = require('./app'); // ensure app.js exports createApp()
require('dotenv').config();

console.log('🚀 Starting PFMT Production Server...');

// Create app using factory pattern
const app = createApp();

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const server = app.listen(PORT, HOST, () => {
    console.log('🚀 PFMT Production Server started successfully!');
    console.log(`   📍 Server running on: http://${HOST}:${PORT}`);
    console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`   🔐 Auth bypass: ${process.env.BYPASS_AUTH === 'true' ? 'enabled' : 'disabled'}`);
    console.log('\n📋 Available endpoints:');
    console.log(`   🏥 Health Check: http://${HOST}:${PORT}/health`);
    console.log(`   🏥 Database Health: http://${HOST}:${PORT}/health/db`);
    console.log(`   🔧 Ready Check: http://${HOST}:${PORT}/ready`);
    console.log('\n✅ Production server ready to accept connections');
    console.log('💡 HP-3: CORS consolidation implemented');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
        if (err) {
            console.error('❌ Error during server shutdown:', err);
            process.exit(1);
        }
        
        console.log('✅ HTTP server closed');
        console.log('👋 Graceful shutdown completed');
        process.exit(0);
    });
    
    setTimeout(() => {
        console.error('⏰ Forced shutdown after 30 seconds');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

module.exports = server;

