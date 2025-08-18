const { Pool } = require('pg');
require('dotenv').config();

// Database configuration - enhanced for stability
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pfmt_integrated',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: 5000, // Increased timeout for stability
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Additional stability settings
    statement_timeout: 30000, // 30 seconds
    query_timeout: 30000, // 30 seconds
    application_name: 'pfmt_application'
};

// Create connection pool
const pool = new Pool(dbConfig);

// Enhanced pool error handling
pool.on('error', (err, client) => {
    console.error('🚨 Unexpected error on idle client:', err);
    
    if (process.env.NODE_ENV === 'production') {
        // In production, exit on database errors
        console.error('💥 Exiting due to database error in production');
        process.exit(-1);
    } else {
        // In development, log the error but continue running for debugging
        console.error('🔄 Continuing in development mode for debugging...');
        console.error('💡 Check your database connection and configuration');
    }
});

// Enhanced connection monitoring
pool.on('connect', (client) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('🔗 New client connected to database');
    }
});

pool.on('acquire', (client) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Client acquired from pool');
    }
});

pool.on('remove', (client) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Client removed from pool');
    }
});

// Test database connection with enhanced validation
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        
        // Test query with additional validation
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version, current_database() as db_name');
        console.log('📊 Database info:', {
            time: result.rows[0].current_time,
            version: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1],
            database: result.rows[0].db_name
        });
        
        // Test table existence
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('projects', 'project_locations', 'vendors', 'project_vendors')
        `);
        
        console.log('📋 Core tables found:', tableCheck.rows.map(row => row.table_name));
        
        client.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return false;
    }
};

// Execute query with enhanced error handling and retry logic
const query = async (text, params, retries = 1) => {
    const start = Date.now();
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const result = await pool.query(text, params);
            const duration = Date.now() - start;
            
            if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Query executed:', {
                    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                    duration: `${duration}ms`,
                    rows: result.rowCount,
                    attempt: attempt + 1
                });
            }
            
            return result;
        } catch (error) {
            lastError = error;
            
            // Check if error is retryable
            const retryableErrors = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'];
            const isRetryable = retryableErrors.some(code => error.code === code);
            
            if (attempt < retries && isRetryable) {
                console.warn(`⚠️ Retrying query (attempt ${attempt + 2}/${retries + 1}):`, error.message);
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
                continue;
            }
            
            console.error('❌ Database query error:', {
                error: error.message,
                code: error.code,
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                params: params,
                attempts: attempt + 1
            });
            break;
        }
    }
    
    throw lastError;
};

// Enhanced transaction wrapper with better error handling
const transaction = async (callback) => {
    const client = await pool.connect();
    let result;
    
    try {
        await client.query('BEGIN');
        console.log('🔄 Transaction started');
        
        result = await callback(client);
        
        await client.query('COMMIT');
        console.log('✅ Transaction committed');
        
        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
            console.log('🔙 Transaction rolled back');
        } catch (rollbackError) {
            console.error('❌ Error during rollback:', rollbackError.message);
        }
        
        console.error('❌ Transaction failed:', error.message);
        throw error;
    } finally {
        client.release();
        console.log('🔓 Transaction client released');
    }
};

// Set user context for audit logging
const setUserContext = async (userId) => {
    if (userId) {
        try {
            await query('SELECT set_config($1, $2, false)', ['app.current_user_id', userId]);
            if (process.env.NODE_ENV === 'development') {
                console.log('👤 User context set:', userId);
            }
        } catch (error) {
            console.error('❌ Failed to set user context:', error.message);
        }
    }
};

// Get enhanced connection pool stats
const getPoolStats = () => {
    const stats = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
        config: {
            max: pool.options.max,
            host: pool.options.host,
            database: pool.options.database,
            port: pool.options.port
        }
    };
    
    if (process.env.NODE_ENV === 'development') {
        console.log('📊 Pool stats:', stats);
    }
    
    return stats;
};

// Health check for database
const healthCheck = async () => {
    try {
        const start = Date.now();
        const result = await query('SELECT 1 as health_check');
        const duration = Date.now() - start;
        
        return {
            status: 'healthy',
            responseTime: duration,
            timestamp: new Date().toISOString(),
            poolStats: getPoolStats()
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
            poolStats: getPoolStats()
        };
    }
};

// Graceful shutdown with enhanced cleanup
const closePool = async () => {
    try {
        console.log('📴 Closing database pool...');
        
        // Wait for active connections to finish (with timeout)
        const timeout = setTimeout(() => {
            console.warn('⚠️ Force closing database pool due to timeout');
            pool.end();
        }, 10000); // 10 second timeout
        
        await pool.end();
        clearTimeout(timeout);
        
        console.log('✅ Database pool closed gracefully');
    } catch (error) {
        console.error('❌ Error closing database pool:', error.message);
    }
};

// Handle process termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

// Export enhanced database interface
module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    setUserContext,
    getPoolStats,
    healthCheck,
    closePool
};

