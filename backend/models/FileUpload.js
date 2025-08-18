/**
 * FileUpload Model
 * Handles file uploads and document management for Team A integration
 */

const { query, transaction } = require('../config/database-enhanced');
const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../middleware/logging');
const fs = require('fs').promises;
const path = require('path');

class FileUpload {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.filename = data.filename;
        this.originalName = data.originalName;
        this.mimeType = data.mimeType;
        this.size = data.size;
        this.path = data.path;
        this.relatedEntityType = data.relatedEntityType;
        this.relatedEntityId = data.relatedEntityId;
        this.uploadedBy = data.uploadedBy;
        this.description = data.description;
        this.tags = data.tags || [];
        this.isPublic = data.isPublic || false;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * Create FileUpload instance from database row
     */
    static fromDb(row = {}) {
        if (!row) return null;
        return new FileUpload({
            id: row.id,
            filename: row.filename,
            originalName: row.original_name,
            mimeType: row.mime_type,
            size: row.size,
            path: row.path,
            relatedEntityType: row.related_entity_type,
            relatedEntityId: row.related_entity_id,
            uploadedBy: row.uploaded_by,
            description: row.description,
            tags: row.tags || [],
            isPublic: row.is_public,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    /**
     * Convert FileUpload instance to database format
     */
    toDb() {
        return {
            id: this.id,
            filename: this.filename,
            original_name: this.originalName,
            mime_type: this.mimeType,
            size: this.size,
            path: this.path,
            related_entity_type: this.relatedEntityType,
            related_entity_id: this.relatedEntityId,
            uploaded_by: this.uploadedBy,
            description: this.description,
            tags: this.tags,
            is_public: this.isPublic
        };
    }

    /**
     * Find all file uploads with optional filtering
     */
    static async findAll(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            // Add filters
            if (options.relatedEntityType) {
                whereClause += ` AND fu.related_entity_type = $${++paramCount}`;
                params.push(options.relatedEntityType);
            }

            if (options.relatedEntityId) {
                whereClause += ` AND fu.related_entity_id = $${++paramCount}`;
                params.push(options.relatedEntityId);
            }

            if (options.uploadedBy) {
                whereClause += ` AND fu.uploaded_by = $${++paramCount}`;
                params.push(options.uploadedBy);
            }

            if (options.mimeType) {
                whereClause += ` AND fu.mime_type = $${++paramCount}`;
                params.push(options.mimeType);
            }

            if (options.mimeTypeCategory) {
                whereClause += ` AND fu.mime_type LIKE $${++paramCount}`;
                params.push(`${options.mimeTypeCategory}/%`);
            }

            if (options.isPublic !== undefined) {
                whereClause += ` AND fu.is_public = $${++paramCount}`;
                params.push(options.isPublic);
            }

            if (options.search) {
                whereClause += ` AND (fu.original_name ILIKE $${++paramCount} OR fu.description ILIKE $${++paramCount})`;
                params.push(`%${options.search}%`);
                params.push(`%${options.search}%`);
                paramCount++; // Account for the second parameter
            }

            if (options.tags && options.tags.length > 0) {
                whereClause += ` AND fu.tags && $${++paramCount}`;
                params.push(JSON.stringify(options.tags));
            }

            if (options.sizeMin !== undefined) {
                whereClause += ` AND fu.size >= $${++paramCount}`;
                params.push(options.sizeMin);
            }

            if (options.sizeMax !== undefined) {
                whereClause += ` AND fu.size <= $${++paramCount}`;
                params.push(options.sizeMax);
            }

            // Add sorting
            const orderBy = options.orderBy || 'fu.created_at DESC';
            
            // Add pagination
            let limitClause = '';
            if (options.limit) {
                limitClause += ` LIMIT $${++paramCount}`;
                params.push(options.limit);
                
                if (options.offset) {
                    limitClause += ` OFFSET $${++paramCount}`;
                    params.push(options.offset);
                }
            }

            const queryText = `
                SELECT 
                    fu.*,
                    u.first_name || ' ' || u.last_name as uploaded_by_name,
                    u.email as uploaded_by_email,
                    CASE 
                        WHEN fu.related_entity_type = 'project' THEN p.project_name
                        WHEN fu.related_entity_type = 'contract' THEN c.title
                        WHEN fu.related_entity_type = 'report' THEN r.title
                        WHEN fu.related_entity_type = 'change_order' THEN co.title
                        ELSE NULL
                    END as related_entity_name
                FROM file_uploads fu
                LEFT JOIN users u ON fu.uploaded_by = u.id
                LEFT JOIN projects p ON fu.related_entity_type = 'project' AND fu.related_entity_id = p.id
                LEFT JOIN contracts c ON fu.related_entity_type = 'contract' AND fu.related_entity_id = c.id
                LEFT JOIN reports r ON fu.related_entity_type = 'report' AND fu.related_entity_id = r.id
                LEFT JOIN change_orders co ON fu.related_entity_type = 'change_order' AND fu.related_entity_id = co.id
                ${whereClause}
                ORDER BY ${orderBy}
                ${limitClause}
            `;

            const result = await query(queryText, params);
            return result.rows.map(row => ({
                ...FileUpload.fromDb(row),
                uploadedByName: row.uploaded_by_name,
                uploadedByEmail: row.uploaded_by_email,
                relatedEntityName: row.related_entity_name
            }));
        } catch (error) {
            console.error('Error finding file uploads:', error);
            throw error;
        }
    }

    /**
     * Find file upload by ID
     */
    static async findById(id) {
        try {
            const queryText = `
                SELECT 
                    fu.*,
                    u.first_name || ' ' || u.last_name as uploaded_by_name,
                    u.email as uploaded_by_email,
                    CASE 
                        WHEN fu.related_entity_type = 'project' THEN p.project_name
                        WHEN fu.related_entity_type = 'contract' THEN c.title
                        WHEN fu.related_entity_type = 'report' THEN r.title
                        WHEN fu.related_entity_type = 'change_order' THEN co.title
                        ELSE NULL
                    END as related_entity_name
                FROM file_uploads fu
                LEFT JOIN users u ON fu.uploaded_by = u.id
                LEFT JOIN projects p ON fu.related_entity_type = 'project' AND fu.related_entity_id = p.id
                LEFT JOIN contracts c ON fu.related_entity_type = 'contract' AND fu.related_entity_id = c.id
                LEFT JOIN reports r ON fu.related_entity_type = 'report' AND fu.related_entity_id = r.id
                LEFT JOIN change_orders co ON fu.related_entity_type = 'change_order' AND fu.related_entity_id = co.id
                WHERE fu.id = $1
            `;

            const result = await query(queryText, [id]);
            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                ...FileUpload.fromDb(row),
                uploadedByName: row.uploaded_by_name,
                uploadedByEmail: row.uploaded_by_email,
                relatedEntityName: row.related_entity_name
            };
        } catch (error) {
            console.error('Error finding file upload by ID:', error);
            throw error;
        }
    }

    /**
     * Find file uploads by related entity
     */
    static async findByRelatedEntity(entityType, entityId, options = {}) {
        return await FileUpload.findAll({ 
            ...options, 
            relatedEntityType: entityType, 
            relatedEntityId: entityId 
        });
    }

    /**
     * Find file uploads by user
     */
    static async findByUser(userId, options = {}) {
        return await FileUpload.findAll({ ...options, uploadedBy: userId });
    }

    /**
     * Save file upload (create or update)
     */
    async save(userId = null) {
        try {
            const dbData = this.toDb();
            
            if (this.createdAt) {
                // Update existing file upload
                const queryText = `
                    UPDATE file_uploads 
                    SET 
                        filename = $2,
                        original_name = $3,
                        mime_type = $4,
                        size = $5,
                        path = $6,
                        related_entity_type = $7,
                        related_entity_id = $8,
                        description = $9,
                        tags = $10,
                        is_public = $11,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.filename,
                    dbData.original_name,
                    dbData.mime_type,
                    dbData.size,
                    dbData.path,
                    dbData.related_entity_type,
                    dbData.related_entity_id,
                    dbData.description,
                    JSON.stringify(dbData.tags),
                    dbData.is_public
                ];

                const result = await query(queryText, params);
                const updatedFileUpload = FileUpload.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('UPDATE', 'file_upload', this.id, userId, {
                        filename: this.originalName,
                        size: this.size,
                        relatedEntity: `${this.relatedEntityType}:${this.relatedEntityId}`
                    });
                }

                return updatedFileUpload;
            } else {
                // Create new file upload
                const queryText = `
                    INSERT INTO file_uploads (
                        id, filename, original_name, mime_type, size, path,
                        related_entity_type, related_entity_id, uploaded_by, description, tags, is_public
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *
                `;

                const params = [
                    this.id,
                    dbData.filename,
                    dbData.original_name,
                    dbData.mime_type,
                    dbData.size,
                    dbData.path,
                    dbData.related_entity_type,
                    dbData.related_entity_id,
                    userId || dbData.uploaded_by,
                    dbData.description,
                    JSON.stringify(dbData.tags),
                    dbData.is_public
                ];

                const result = await query(queryText, params);
                const newFileUpload = FileUpload.fromDb(result.rows[0]);
                
                // Audit log
                if (userId) {
                    auditLogger('CREATE', 'file_upload', this.id, userId, {
                        filename: this.originalName,
                        size: this.size,
                        mimeType: this.mimeType
                    });
                }

                return newFileUpload;
            }
        } catch (error) {
            console.error('Error saving file upload:', error);
            throw error;
        }
    }

    /**
     * Update file upload data
     */
    async update(data, userId = null) {
        try {
            // Update instance properties (excluding file-specific fields)
            const allowedFields = ['description', 'tags', 'isPublic', 'relatedEntityType', 'relatedEntityId'];
            Object.keys(data).forEach(key => {
                if (allowedFields.includes(key)) {
                    this[key] = data[key];
                }
            });

            return await this.save(userId);
        } catch (error) {
            console.error('Error updating file upload:', error);
            throw error;
        }
    }

    /**
     * Delete file upload (and physical file)
     */
    async delete(userId = null) {
        try {
            // First, try to delete the physical file
            if (this.path) {
                try {
                    await fs.unlink(this.path);
                    console.log(`Physical file deleted: ${this.path}`);
                } catch (fileError) {
                    console.warn(`Could not delete physical file: ${this.path}`, fileError.message);
                    // Continue with database deletion even if file deletion fails
                }
            }

            // Delete from database
            const queryText = 'DELETE FROM file_uploads WHERE id = $1 RETURNING *';
            const result = await query(queryText, [this.id]);
            
            if (result.rows.length === 0) {
                throw new Error('File upload not found');
            }

            // Audit log
            if (userId) {
                auditLogger('DELETE', 'file_upload', this.id, userId, {
                    filename: this.originalName,
                    size: this.size,
                    path: this.path
                });
            }

            return true;
        } catch (error) {
            console.error('Error deleting file upload:', error);
            throw error;
        }
    }

    /**
     * Check if file exists on disk
     */
    async fileExists() {
        try {
            if (!this.path) return false;
            await fs.access(this.path);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get file stats from disk
     */
    async getFileStats() {
        try {
            if (!this.path) return null;
            const stats = await fs.stat(this.path);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime
            };
        } catch (error) {
            console.error('Error getting file stats:', error);
            return null;
        }
    }

    /**
     * Generate download URL
     */
    getDownloadUrl(baseUrl = '') {
        return `${baseUrl}/api/file-uploads/${this.id}/download`;
    }

    /**
     * Get file extension
     */
    getFileExtension() {
        if (!this.originalName) return '';
        return path.extname(this.originalName).toLowerCase();
    }

    /**
     * Get file category based on MIME type
     */
    getFileCategory() {
        if (!this.mimeType) return 'unknown';
        
        const [category] = this.mimeType.split('/');
        
        const categoryMap = {
            'image': 'image',
            'video': 'video',
            'audio': 'audio',
            'text': 'document',
            'application': this.getApplicationCategory()
        };
        
        return categoryMap[category] || 'unknown';
    }

    /**
     * Get specific application category
     */
    getApplicationCategory() {
        if (!this.mimeType) return 'document';
        
        if (this.mimeType.includes('pdf')) return 'pdf';
        if (this.mimeType.includes('word') || this.mimeType.includes('document')) return 'document';
        if (this.mimeType.includes('spreadsheet') || this.mimeType.includes('excel')) return 'spreadsheet';
        if (this.mimeType.includes('presentation') || this.mimeType.includes('powerpoint')) return 'presentation';
        if (this.mimeType.includes('zip') || this.mimeType.includes('archive')) return 'archive';
        
        return 'document';
    }

    /**
     * Get human-readable file size
     */
    getHumanReadableSize() {
        if (!this.size) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = this.size;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Add tag to file upload
     */
    async addTag(tag, userId = null) {
        try {
            if (!this.tags.includes(tag)) {
                this.tags.push(tag);
                await this.save(userId);
                
                // Audit log
                if (userId) {
                    auditLogger('ADD_TAG', 'file_upload', this.id, userId, {
                        filename: this.originalName,
                        tag: tag
                    });
                }
            }
            
            return this;
        } catch (error) {
            console.error('Error adding tag:', error);
            throw error;
        }
    }

    /**
     * Remove tag from file upload
     */
    async removeTag(tag, userId = null) {
        try {
            const tagIndex = this.tags.indexOf(tag);
            if (tagIndex !== -1) {
                this.tags.splice(tagIndex, 1);
                await this.save(userId);
                
                // Audit log
                if (userId) {
                    auditLogger('REMOVE_TAG', 'file_upload', this.id, userId, {
                        filename: this.originalName,
                        tag: tag
                    });
                }
            }
            
            return this;
        } catch (error) {
            console.error('Error removing tag:', error);
            throw error;
        }
    }

    /**
     * Get file upload statistics
     */
    static async getStatistics(options = {}) {
        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramCount = 0;

            if (options.relatedEntityType) {
                whereClause += ` AND related_entity_type = $${++paramCount}`;
                params.push(options.relatedEntityType);
            }

            if (options.relatedEntityId) {
                whereClause += ` AND related_entity_id = $${++paramCount}`;
                params.push(options.relatedEntityId);
            }

            if (options.uploadedBy) {
                whereClause += ` AND uploaded_by = $${++paramCount}`;
                params.push(options.uploadedBy);
            }

            const queryText = `
                SELECT 
                    COUNT(*) as total_files,
                    COUNT(CASE WHEN is_public = true THEN 1 END) as public_files,
                    COUNT(CASE WHEN is_public = false THEN 1 END) as private_files,
                    COALESCE(SUM(size), 0) as total_size,
                    COALESCE(AVG(size), 0) as average_size,
                    COUNT(DISTINCT uploaded_by) as unique_uploaders,
                    COUNT(DISTINCT related_entity_type) as entity_types,
                    COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_files,
                    COUNT(CASE WHEN mime_type LIKE 'application/pdf' THEN 1 END) as pdf_files,
                    COUNT(CASE WHEN mime_type LIKE 'application/%word%' OR mime_type LIKE 'application/%document%' THEN 1 END) as document_files
                FROM file_uploads
                ${whereClause}
            `;

            const result = await query(queryText, params);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting file upload statistics:', error);
            throw error;
        }
    }

    /**
     * Get all tags used in file uploads
     */
    static async getAllTags() {
        try {
            const queryText = `
                SELECT DISTINCT unnest(tags) as tag, COUNT(*) as usage_count
                FROM file_uploads
                WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
                GROUP BY tag
                ORDER BY usage_count DESC, tag ASC
            `;

            const result = await query(queryText);
            return result.rows;
        } catch (error) {
            console.error('Error getting all tags:', error);
            throw error;
        }
    }

    /**
     * Validate file upload data
     */
    validate() {
        const errors = [];

        if (!this.filename) errors.push('Filename is required');
        if (!this.originalName) errors.push('Original name is required');
        if (!this.mimeType) errors.push('MIME type is required');
        if (!this.size || this.size <= 0) errors.push('Valid file size is required');
        if (!this.path) errors.push('File path is required');
        if (!this.uploadedBy) errors.push('Uploaded by user is required');
        
        if (this.tags && !Array.isArray(this.tags)) {
            errors.push('Tags must be an array');
        }

        if (this.originalName && this.originalName.length > 255) {
            errors.push('Original name cannot exceed 255 characters');
        }

        if (this.filename && this.filename.length > 255) {
            errors.push('Filename cannot exceed 255 characters');
        }

        if (this.description && this.description.length > 1000) {
            errors.push('Description cannot exceed 1000 characters');
        }

        // Validate file size limits (100MB default)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (this.size > maxSize) {
            errors.push(`File size cannot exceed ${maxSize / (1024 * 1024)}MB`);
        }

        return errors;
    }
}

module.exports = FileUpload;

