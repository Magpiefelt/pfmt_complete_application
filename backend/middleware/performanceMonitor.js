const { Pool } = require('pg');

/**
 * Performance monitoring middleware with database pool statistics
 * Provides detailed performance metrics and database connection monitoring
 */

/**
 * Get database pool statistics
 */
const getPoolStats = (pool) => {
    if (!pool || typeof pool.totalCount !== 'number') {
        return {
            totalConnections: 0,
            idleConnections: 0,
            waitingClients: 0,
            error: 'Pool not available or invalid'
        };
    }
    
    return {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount,
        maxConnections: pool.options?.max || 'unknown'
    };
};

/**
 * Performance monitoring middleware
 */
const performanceMonitorMiddleware = (pool) => {
    return (req, res, next) => {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        const correlationId = req.correlationId || 'unknown';
        
        // Track database queries for this request
        let dbQueryCount = 0;
        let dbQueryTime = 0;
        
        // Override the original query method to track performance
        if (pool && typeof pool.query === 'function') {
            const originalQuery = pool.query.bind(pool);
            req.dbStats = {
                queryCount: 0,
                totalTime: 0,
                queries: []
            };
            
            // Temporarily override pool.query for this request
            pool.query = async (...args) => {
                const queryStart = process.hrtime.bigint();
                dbQueryCount++;
                
                try {
                    const result = await originalQuery(...args);
                    const queryEnd = process.hrtime.bigint();
                    const queryDuration = Number(queryEnd - queryStart) / 1000000; // Convert to milliseconds
                    
                    dbQueryTime += queryDuration;
                    req.dbStats.queryCount++;
                    req.dbStats.totalTime += queryDuration;
                    req.dbStats.queries.push({
                        query: typeof args[0] === 'string' ? args[0].substring(0, 100) + '...' : 'Unknown',
                        duration: queryDuration,
                        timestamp: new Date().toISOString()
                    });
                    
                    return result;
                } catch (error) {
                    const queryEnd = process.hrtime.bigint();
                    const queryDuration = Number(queryEnd - queryStart) / 1000000;
                    
                    req.dbStats.queryCount++;
                    req.dbStats.totalTime += queryDuration;
                    req.dbStats.queries.push({
                        query: typeof args[0] === 'string' ? args[0].substring(0, 100) + '...' : 'Unknown',
                        duration: queryDuration,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    throw error;
                }
            };
            
            // Restore original query method after response
            res.on('finish', () => {
                pool.query = originalQuery;
            });
        }
        
        // Override res.json to capture performance metrics
        const originalJson = res.json;
        res.json = function(data) {
            const endTime = process.hrtime.bigint();
            const endMemory = process.memoryUsage();
            const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            
            // Calculate memory delta
            const memoryDelta = {
                rss: endMemory.rss - startMemory.rss,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                external: endMemory.external - startMemory.external
            };
            
            // Get current pool statistics
            const poolStats = getPoolStats(pool);
            
            // Performance metrics
            const metrics = {
                correlationId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
                memoryDelta,
                currentMemory: endMemory,
                database: {
                    queryCount: req.dbStats?.queryCount || 0,
                    totalQueryTime: Math.round((req.dbStats?.totalTime || 0) * 100) / 100,
                    poolStats
                },
                timestamp: new Date().toISOString()
            };
            
            // Log performance metrics for slow requests or high resource usage
            const isSlowRequest = duration > 1000; // > 1 second
            const isHighMemoryUsage = memoryDelta.heapUsed > 50 * 1024 * 1024; // > 50MB
            const hasMultipleQueries = (req.dbStats?.queryCount || 0) > 5;
            
            if (isSlowRequest || isHighMemoryUsage || hasMultipleQueries) {
                console.warn(`[${correlationId}] Performance Alert:`, {
                    reason: {
                        slow: isSlowRequest,
                        highMemory: isHighMemoryUsage,
                        multipleQueries: hasMultipleQueries
                    },
                    metrics
                });
            }
            
            // Always log performance for non-health endpoints
            if (!req.path.startsWith('/health')) {
                console.log(`[${correlationId}] Performance:`, {
                    duration: metrics.duration + 'ms',
                    queries: metrics.database.queryCount,
                    queryTime: metrics.database.totalQueryTime + 'ms',
                    memoryDelta: Math.round(memoryDelta.heapUsed / 1024 / 1024 * 100) / 100 + 'MB',
                    poolConnections: `${poolStats.totalConnections}/${poolStats.maxConnections}`
                });
            }
            
            // Add performance headers to response
            res.setHeader('x-response-time', duration + 'ms');
            res.setHeader('x-db-queries', req.dbStats?.queryCount || 0);
            res.setHeader('x-db-time', Math.round((req.dbStats?.totalTime || 0) * 100) / 100 + 'ms');
            
            return originalJson.call(this, data);
        };
        
        next();
    };
};

/**
 * System performance metrics endpoint
 */
const createPerformanceEndpoint = (pool) => {
    return (req, res) => {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const uptime = process.uptime();
        const poolStats = getPoolStats(pool);
        
        const metrics = {
            system: {
                uptime: Math.round(uptime),
                memory: {
                    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100 + ' MB',
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100 + ' MB',
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100 + ' MB',
                    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100 + ' MB'
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                }
            },
            database: {
                pool: poolStats,
                connectionUtilization: poolStats.totalConnections && poolStats.maxConnections 
                    ? Math.round((poolStats.totalConnections / poolStats.maxConnections) * 100) + '%'
                    : 'unknown'
            },
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: metrics
        });
    };
};

/**
 * Database pool health check
 */
const createPoolHealthCheck = (pool) => {
    return async (req, res) => {
        try {
            const poolStats = getPoolStats(pool);
            const isHealthy = poolStats.totalConnections !== undefined && 
                             poolStats.waitingClients < 10; // Arbitrary threshold
            
            res.status(isHealthy ? 200 : 503).json({
                status: isHealthy ? 'healthy' : 'degraded',
                pool: poolStats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(503).json({
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    };
};

module.exports = {
    performanceMonitorMiddleware,
    createPerformanceEndpoint,
    createPoolHealthCheck,
    getPoolStats
};

