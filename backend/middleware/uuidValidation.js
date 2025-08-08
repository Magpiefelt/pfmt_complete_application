/**
 * UUID Validation Middleware
 * Validates UUID format in request parameters and returns 400 for invalid formats
 */

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 * @param {string} uuid - The UUID string to validate
 * @returns {boolean} - True if valid UUID, false otherwise
 */
const isValidUUID = (uuid) => {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }
    return uuidRegex.test(uuid);
};

/**
 * Middleware to validate UUID parameters in routes
 * @param {string|string[]} paramNames - Parameter name(s) to validate
 * @returns {Function} Express middleware function
 */
const validateUUID = (paramNames) => {
    const params = Array.isArray(paramNames) ? paramNames : [paramNames];
    
    return (req, res, next) => {
        for (const paramName of params) {
            const paramValue = req.params[paramName];
            
            if (paramValue && !isValidUUID(paramValue)) {
                return res.status(400).json({
                    error: 'Invalid UUID format',
                    message: `Parameter '${paramName}' must be a valid UUID`,
                    parameter: paramName,
                    value: paramValue,
                    timestamp: new Date().toISOString()
                });
            }
        }
        next();
    };
};

/**
 * Middleware to validate UUID in request body fields
 * @param {string|string[]} fieldNames - Field name(s) to validate
 * @param {boolean} required - Whether the fields are required
 * @returns {Function} Express middleware function
 */
const validateUUIDInBody = (fieldNames, required = false) => {
    const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
    
    return (req, res, next) => {
        for (const fieldName of fields) {
            const fieldValue = req.body[fieldName];
            
            if (fieldValue) {
                if (!isValidUUID(fieldValue)) {
                    return res.status(400).json({
                        error: 'Invalid UUID format',
                        message: `Field '${fieldName}' must be a valid UUID`,
                        field: fieldName,
                        value: fieldValue,
                        timestamp: new Date().toISOString()
                    });
                }
            } else if (required) {
                return res.status(400).json({
                    error: 'Missing required field',
                    message: `Field '${fieldName}' is required and must be a valid UUID`,
                    field: fieldName,
                    timestamp: new Date().toISOString()
                });
            }
        }
        next();
    };
};

/**
 * Middleware to validate UUID in query parameters
 * @param {string|string[]} queryNames - Query parameter name(s) to validate
 * @returns {Function} Express middleware function
 */
const validateUUIDInQuery = (queryNames) => {
    const queries = Array.isArray(queryNames) ? queryNames : [queryNames];
    
    return (req, res, next) => {
        for (const queryName of queries) {
            const queryValue = req.query[queryName];
            
            if (queryValue && !isValidUUID(queryValue)) {
                return res.status(400).json({
                    error: 'Invalid UUID format',
                    message: `Query parameter '${queryName}' must be a valid UUID`,
                    parameter: queryName,
                    value: queryValue,
                    timestamp: new Date().toISOString()
                });
            }
        }
        next();
    };
};

/**
 * Validates user ID from headers (x-user-id)
 * @param {boolean} required - Whether user ID is required
 * @returns {Function} Express middleware function
 */
const validateUserID = (required = true) => {
    return (req, res, next) => {
        const userId = req.headers['x-user-id'];
        
        if (userId) {
            if (!isValidUUID(userId)) {
                return res.status(400).json({
                    error: 'Invalid user ID format',
                    message: 'x-user-id header must be a valid UUID',
                    timestamp: new Date().toISOString()
                });
            }
        } else if (required) {
            return res.status(401).json({
                error: 'Missing user ID',
                message: 'x-user-id header is required',
                timestamp: new Date().toISOString()
            });
        }
        next();
    };
};

/**
 * Generic UUID validation function for use in controllers
 * @param {string} uuid - UUID to validate
 * @param {string} fieldName - Name of the field for error messages
 * @throws {Error} Throws error with 400 status if invalid
 */
const validateUUIDOrThrow = (uuid, fieldName = 'id') => {
    if (!isValidUUID(uuid)) {
        const error = new Error(`Invalid UUID format for ${fieldName}`);
        error.status = 400;
        error.field = fieldName;
        error.value = uuid;
        throw error;
    }
};

module.exports = {
    isValidUUID,
    validateUUID,
    validateUUIDInBody,
    validateUUIDInQuery,
    validateUserID,
    validateUUIDOrThrow
};

