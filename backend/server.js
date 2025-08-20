#!/usr/bin/env node

/**
 * PFMT Clean Server
 * Updated to use single factory pattern as per HP-1 specification
 * Removes direct header parsing and uses createApp factory
 */

const { createApp } = require('./app'); // ensure app.js exports createApp()

// Load environment variables manually to avoid dotenv issues
const fs = require('fs');
const path = require('path');

// Simple .env parser
const loadEnv = () => {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            });
        }
    } catch (error) {
        console.warn('Could not load .env file:', error.message);
    }
};

loadEnv();

// Create app using factory pattern
const app = createApp();

// Server configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const server = app.listen(PORT, HOST, () => {
    console.log('🚀 PFMT Server started successfully!');
    console.log(`   📍 Server running on: http://${HOST}:${PORT}`);
    console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   🔐 Auth bypass: ${process.env.BYPASS_AUTH === 'true' ? 'enabled' : 'disabled'}`);
    console.log('\n📋 Available endpoints:');
    console.log(`   🏥 Health Check: http://${HOST}:${PORT}/health`);
    console.log(`   🏥 Database Health: http://${HOST}:${PORT}/health/db`);
    console.log(`   🔧 Ready Check: http://${HOST}:${PORT}/ready`);
    console.log('\n✅ Server ready to accept connections');
    console.log('💡 HP-1: Auth hardening and RBAC consolidation implemented');
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

