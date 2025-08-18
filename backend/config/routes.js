/**
 * Dynamic Route Registration System
 * Automatically loads and registers available routes while handling missing files gracefully
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { logger } = require('../middleware/logging');

/**
 * Route configuration with metadata
 */
const routeConfigs = [
    // Authentication and user management
    { path: './routes/auth', name: 'auth', mount: '/api/auth', description: 'Authentication endpoints' },
    { path: './routes/users', name: 'users', mount: '/api/users', description: 'User management' },
    
    // Core project management (Team B)
    { path: './routes/projects', name: 'projects', mount: '/api/projects', description: 'Project management' },
    { path: './routes/projectWorkflow', name: 'project-workflow', mount: '/api/project-workflow', description: 'Project workflow management' },
    { path: './routes/companies', name: 'companies', mount: '/api/companies', description: 'Company management' },
    { path: './routes/vendors', name: 'vendors', mount: '/api/vendors', description: 'Vendor management' },
    { path: './routes/budget', name: 'budget', mount: '/api/budget', description: 'Budget management' },
    { path: './routes/reporting', name: 'reporting', mount: '/api/reporting', description: 'Reporting system' },
    { path: './routes/projectWizard', name: 'project-wizard', mount: '/api/project-wizard', description: 'Project creation wizard' },
    
    // Team A features (integrated)
    { path: './routes/contracts', name: 'contracts', mount: '/api/contracts', description: 'Contract management' },
    { path: './routes/team-a-reports', name: 'team-a-reports', mount: '/api/team-a-reports', description: 'Team A report management' },
    { path: './routes/gate-meetings', name: 'gate-meetings', mount: '/api/gate-meetings', description: 'Gate meeting management' },
    { path: './routes/tasks', name: 'tasks', mount: '/api/tasks', description: 'Enhanced task management' },
    { path: './routes/change-orders', name: 'change-orders', mount: '/api/change-orders', description: 'Change order management' },
    { path: './routes/file-uploads', name: 'file-uploads', mount: '/api/file-uploads', description: 'File upload management' },
    
    // Additional routes
    { path: './routes/notifications', name: 'notifications', mount: '/api/notifications', description: 'Notification system' },
    { path: './routes/audit', name: 'audit', mount: '/api/audit', description: 'Audit logging' },
    { path: './routes/admin', name: 'admin', mount: '/api/admin', description: 'Administrative functions' }
];

/**
 * Safely require a route file with error handling
 */
function safeRequireRoute(routePath, routeName, description) {
    try {
        // Check if file exists first
        const fullPath = path.resolve(__dirname, '..', routePath + '.js');
        if (!fs.existsSync(fullPath)) {
            logger.warn(`Route file not found: ${routeName}`, { path: fullPath });
            return createPlaceholderRouter(routeName, description);
        }

        const route = require(routePath);
        logger.info(`✅ Loaded route: ${routeName}`, { description });
        return route;
    } catch (error) {
        logger.error(`Failed to load route: ${routeName}`, { 
            error: error.message, 
            path: routePath 
        });
        return createPlaceholderRouter(routeName, description, error.message);
    }
}

/**
 * Create a placeholder router for missing or failed routes
 */
function createPlaceholderRouter(routeName, description, errorMessage = null) {
    const router = express.Router();
    
    // Health check endpoint for the route
    router.get('/health', (req, res) => {
        res.status(errorMessage ? 503 : 501).json({
            success: false,
            message: errorMessage ? 
                `Route ${routeName} failed to load: ${errorMessage}` :
                `Route ${routeName} is not implemented yet`,
            route: routeName,
            description,
            status: errorMessage ? 'error' : 'not_implemented',
            timestamp: new Date().toISOString()
        });
    });
    
    // Catch-all handler for other endpoints
    router.all('*', (req, res) => {
        res.status(errorMessage ? 503 : 501).json({
            success: false,
            message: errorMessage ? 
                `Route ${routeName} is unavailable due to an error` :
                `Endpoint not implemented in ${routeName}`,
            route: routeName,
            description,
            path: req.path,
            method: req.method,
            status: errorMessage ? 'error' : 'not_implemented',
            timestamp: new Date().toISOString()
        });
    });
    
    return router;
}

/**
 * Register all routes with an Express app
 */
function registerRoutes(app) {
    logger.info('🔄 Starting route registration...');
    
    const loadedRoutes = [];
    const failedRoutes = [];
    
    routeConfigs.forEach(config => {
        try {
            const router = safeRequireRoute(config.path, config.name, config.description);
            app.use(config.mount, router);
            
            loadedRoutes.push({
                name: config.name,
                mount: config.mount,
                description: config.description,
                status: 'loaded'
            });
            
        } catch (error) {
            logger.error(`Failed to register route: ${config.name}`, { error: error.message });
            failedRoutes.push({
                name: config.name,
                mount: config.mount,
                description: config.description,
                status: 'failed',
                error: error.message
            });
        }
    });
    
    logger.info(`✅ Route registration completed`, {
        loaded: loadedRoutes.length,
        failed: failedRoutes.length,
        total: routeConfigs.length
    });
    
    return { loadedRoutes, failedRoutes };
}

/**
 * Get route status information
 */
function getRouteStatus() {
    const routeStatus = routeConfigs.map(config => {
        const fullPath = path.resolve(__dirname, '..', config.path + '.js');
        const exists = fs.existsSync(fullPath);
        
        return {
            name: config.name,
            mount: config.mount,
            description: config.description,
            exists,
            path: config.path,
            status: exists ? 'available' : 'missing'
        };
    });
    
    return {
        routes: routeStatus,
        summary: {
            total: routeStatus.length,
            available: routeStatus.filter(r => r.exists).length,
            missing: routeStatus.filter(r => !r.exists).length
        }
    };
}

/**
 * Create a routes status endpoint
 */
function createRoutesStatusRouter() {
    const router = express.Router();
    
    router.get('/', (req, res) => {
        const status = getRouteStatus();
        res.json({
            success: true,
            message: 'Route status information',
            data: status,
            timestamp: new Date().toISOString()
        });
    });
    
    router.get('/health', (req, res) => {
        const status = getRouteStatus();
        const allAvailable = status.summary.missing === 0;
        
        res.status(allAvailable ? 200 : 206).json({
            success: true,
            message: allAvailable ? 'All routes available' : 'Some routes missing',
            status: allAvailable ? 'healthy' : 'partial',
            summary: status.summary,
            timestamp: new Date().toISOString()
        });
    });
    
    return router;
}

/**
 * Auto-discover routes in the routes directory
 */
function discoverRoutes() {
    const routesDir = path.resolve(__dirname, '..', 'routes');
    
    if (!fs.existsSync(routesDir)) {
        logger.warn('Routes directory not found', { path: routesDir });
        return [];
    }
    
    const files = fs.readdirSync(routesDir)
        .filter(file => file.endsWith('.js'))
        .map(file => file.replace('.js', ''));
    
    logger.info('Discovered route files', { files });
    return files;
}

module.exports = {
    registerRoutes,
    getRouteStatus,
    createRoutesStatusRouter,
    discoverRoutes,
    safeRequireRoute,
    routeConfigs
};

