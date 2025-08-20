const { Pool } = require('pg');
require('dotenv').config();

// Simple query logger to avoid circular dependencies
const queryLogger = (text, params, duration) => {
    if (process.env.NODE_ENV === 'development' && process.env.LOG_QUERIES === 'true') {
        console.log(`🔍 Query executed in ${duration}ms:`, {
            query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            params: params.length > 0 ? `${params.length} parameters` : 'no parameters'
        });
    }
};

// Enhanced database configuration with monitoring and optimization
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pfmt_integrated',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    
    // Connection pool optimization
    max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum number of clients in the pool
    min: parseInt(process.env.DB_POOL_MIN) || 2,  // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: 10000, // How long to wait for a connection
    
    // Query timeouts
    statement_timeout: 30000, // 30 seconds
    query_timeout: 30000, // 30 seconds
    
    // SSL configuration
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    
    // Application identification
    application_name: 'pfmt_application',
    
    // Additional PostgreSQL settings
    options: process.env.DB_OPTIONS || ''
};

console.log('🔧 Database Configuration:');
console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Pool Size: ${dbConfig.min}-${dbConfig.max}`);
console.log(`   SSL: ${dbConfig.ssl ? 'enabled' : 'disabled'}`);

// Create connection pool with enhanced monitoring
const pool = new Pool(dbConfig);

// Pool statistics tracking
let poolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingClients: 0,
    totalQueries: 0,
    errorCount: 0,
    slowQueryCount: 0
};

// Enhanced pool event handlers
pool.on('error', (err, client) => {
    poolStats.errorCount++;
    console.error('🚨 Unexpected error on idle client:', {
        error: err.message,
        code: err.code,
        timestamp: new Date().toISOString(),
        totalErrors: poolStats.errorCount
    });
    
    if (process.env.NODE_ENV === 'production') {
        console.error('💥 Critical database error in production');
        // Don't exit immediately, allow graceful shutdown
        setTimeout(() => {
            console.error('🛑 Exiting due to database error');
            process.exit(-1);
        }, 5000);
    }
});

pool.on('connect', (client) => {
    poolStats.totalConnections++;
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 New client connected (Total: ${poolStats.totalConnections})`);
    }
});

pool.on('acquire', (client) => {
    poolStats.activeConnections++;
    if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 Client acquired (Active: ${poolStats.activeConnections})`);
    }
});

pool.on('release', (client) => {
    poolStats.activeConnections--;
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Client released (Active: ${poolStats.activeConnections})`);
    }
});

// Enhanced query function with logging and monitoring
const query = async (text, params = []) => {
    const startTime = Date.now();
    let client;
    
    try {
        poolStats.totalQueries++;
        client = await pool.connect();
        
        // Log query in development mode
        if (process.env.NODE_ENV === 'development' && process.env.LOG_QUERIES === 'true') {
            console.log('🔍 Executing query:', {
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                params: params.length > 0 ? `${params.length} parameters` : 'no parameters'
            });
        }
        
        const result = await client.query(text, params);
        const duration = Date.now() - startTime;
        
        // Log slow queries
        if (duration > 1000) {
            poolStats.slowQueryCount++;
            console.warn('🐌 Slow query detected:', {
                duration: `${duration}ms`,
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                rowCount: result.rowCount
            });
        }
        
        // Use the query logger
        queryLogger(text, params, duration);
        
        return result;
    } catch (error) {
        poolStats.errorCount++;
        const duration = Date.now() - startTime;
        
        console.error('❌ Query error:', {
            error: error.message,
            code: error.code,
            duration: `${duration}ms`,
            query: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        });
        
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
};

// Transaction helper function
const transaction = async (callback) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// Enhanced connection test function
const testConnection = async () => {
    try {
        const startTime = Date.now();
        const result = await query('SELECT NOW() as current_time, version() as version');
        const duration = Date.now() - startTime;
        
        return {
            success: true,
            timestamp: result.rows[0].current_time,
            version: result.rows[0].version,
            duration: `${duration}ms`,
            poolStats: getPoolStats()
        };
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        throw error;
    }
};

// Get current pool statistics
const getPoolStats = () => {
    return {
        ...poolStats,
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
    };
};

// Health check function
const healthCheck = async () => {
    try {
        const connectionTest = await testConnection();
        const stats = getPoolStats();
        
        return {
            status: 'healthy',
            database: connectionTest,
            pool: stats,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            pool: getPoolStats(),
            timestamp: new Date().toISOString()
        };
    }
};

// Graceful shutdown function
const shutdown = async () => {
    console.log('🛑 Shutting down database connections...');
    try {
        await pool.end();
        console.log('✅ Database connections closed successfully');
    } catch (error) {
        console.error('❌ Error closing database connections:', error.message);
    }
};

// Periodic pool statistics logging (every 5 minutes in development)
if (process.env.NODE_ENV === 'development' && process.env.LOG_POOL_STATS === 'true') {
    setInterval(() => {
        const stats = getPoolStats();
        console.log('📊 Pool Statistics:', stats);
    }, 5 * 60 * 1000); // 5 minutes
}

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    healthCheck,
    getPoolStats,
    shutdown
};

