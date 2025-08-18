/**
 * File Uploads Controller
 * Handles file upload and management operations for Team A integration
 */

const FileUpload = require('../models/FileUpload');
const { validationResult } = require('express-validator');
const { logger } = require('../middleware/logging');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10 // Maximum 10 files per request
    },
    fileFilter: (req, file, cb) => {
        // Allow all file types for now, but could be restricted based on requirements
        cb(null, true);
    }
});

class FileUploadsController {
    /**
     * Get multer middleware for file uploads
     */
    static getUploadMiddleware() {
        return upload.array('files', 10);
    }

    /**
     * Get all file uploads with filtering and pagination
     */
    static async getAllFileUploads(req, res) {
        try {
            const {
                relatedEntityType,
                relatedEntityId,
                uploadedBy,
                mimeType,
                mimeTypeCategory,
                isPublic,
                search,
                tags,
                sizeMin,
                sizeMax,
                page = 1,
                limit = 20,
                orderBy = 'created_at DESC'
            } = req.query;

            const options = {
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                orderBy
            };

            // Add filters
            if (relatedEntityType) options.relatedEntityType = relatedEntityType;
            if (relatedEntityId) options.relatedEntityId = relatedEntityId;
            if (uploadedBy) options.uploadedBy = uploadedBy;
            if (mimeType) options.mimeType = mimeType;
            if (mimeTypeCategory) options.mimeTypeCategory = mimeTypeCategory;
            if (isPublic !== undefined) options.isPublic = isPublic === 'true';
            if (search) options.search = search;
            if (tags) options.tags = Array.isArray(tags) ? tags : [tags];
            if (sizeMin) options.sizeMin = parseInt(sizeMin);
            if (sizeMax) options.sizeMax = parseInt(sizeMax);

            const fileUploads = await FileUpload.findAll(options);
            const statistics = await FileUpload.getStatistics(options);

            res.json({
                success: true,
                data: fileUploads,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(statistics.total_files)
                },
                statistics
            });
        } catch (error) {
            logger.error('Error fetching file uploads:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch file uploads',
                error: error.message
            });
        }
    }

    /**
     * Get file upload by ID
     */
    static async getFileUploadById(req, res) {
        try {
            const { id } = req.params;
            const fileUpload = await FileUpload.findById(id);

            if (!fileUpload) {
                return res.status(404).json({
                    success: false,
                    message: 'File upload not found'
                });
            }

            res.json({
                success: true,
                data: fileUpload
            });
        } catch (error) {
            logger.error('Error fetching file upload:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch file upload',
                error: error.message
            });
        }
    }

    /**
     * Get file uploads by related entity
     */
    static async getFileUploadsByEntity(req, res) {
        try {
            const { entityType, entityId } = req.params;
            const fileUploads = await FileUpload.findByRelatedEntity(entityType, entityId);

            res.json({
                success: true,
                data: fileUploads,
                count: fileUploads.length
            });
        } catch (error) {
            logger.error('Error fetching entity file uploads:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch entity file uploads',
                error: error.message
            });
        }
    }

    /**
     * Get file uploads by user
     */
    static async getFileUploadsByUser(req, res) {
        try {
            const { userId } = req.params;
            const fileUploads = await FileUpload.findByUser(userId);

            res.json({
                success: true,
                data: fileUploads,
                count: fileUploads.length
            });
        } catch (error) {
            logger.error('Error fetching user file uploads:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user file uploads',
                error: error.message
            });
        }
    }

    /**
     * Upload files
     */
    static async uploadFiles(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            const {
                relatedEntityType,
                relatedEntityId,
                description,
                tags,
                isPublic = false
            } = req.body;

            const uploadedFiles = [];
            const errors = [];

            for (const file of req.files) {
                try {
                    const fileUpload = new FileUpload({
                        filename: file.filename,
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        size: file.size,
                        path: file.path,
                        relatedEntityType,
                        relatedEntityId,
                        uploadedBy: req.user.id,
                        description,
                        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
                        isPublic: isPublic === 'true'
                    });

                    // Validate file upload data
                    const validationErrors = fileUpload.validate();
                    if (validationErrors.length > 0) {
                        errors.push({
                            filename: file.originalname,
                            errors: validationErrors
                        });
                        // Delete the uploaded file if validation fails
                        await fs.unlink(file.path).catch(() => {});
                        continue;
                    }

                    const savedFileUpload = await fileUpload.save(req.user.id);
                    uploadedFiles.push(savedFileUpload);
                } catch (error) {
                    logger.error(`Error processing file ${file.originalname}:`, error);
                    errors.push({
                        filename: file.originalname,
                        error: error.message
                    });
                    // Delete the uploaded file if processing fails
                    await fs.unlink(file.path).catch(() => {});
                }
            }

            if (uploadedFiles.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files were successfully uploaded',
                    errors
                });
            }

            res.status(201).json({
                success: true,
                message: `${uploadedFiles.length} file(s) uploaded successfully`,
                data: uploadedFiles,
                errors: errors.length > 0 ? errors : undefined
            });
        } catch (error) {
            logger.error('Error uploading files:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload files',
                error: error.message
            });
        }
    }

    /**
     * Update file upload metadata
     */
    static async updateFileUpload(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const fileUpload = await FileUpload.findById(id);

            if (!fileUpload) {
                return res.status(404).json({
                    success: false,
                    message: 'File upload not found'
                });
            }

            // Check if user can update this file
            if (fileUpload.uploadedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this file'
                });
            }

            const updatedFileUpload = await fileUpload.update(req.body, req.user.id);

            res.json({
                success: true,
                message: 'File upload updated successfully',
                data: updatedFileUpload
            });
        } catch (error) {
            logger.error('Error updating file upload:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update file upload',
                error: error.message
            });
        }
    }

    /**
     * Delete file upload
     */
    static async deleteFileUpload(req, res) {
        try {
            const { id } = req.params;
            const fileUpload = await FileUpload.findById(id);

            if (!fileUpload) {
                return res.status(404).json({
                    success: false,
                    message: 'File upload not found'
                });
            }

            // Check if user can delete this file
            if (fileUpload.uploadedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this file'
                });
            }

            await fileUpload.delete(req.user.id);

            res.json({
                success: true,
                message: 'File upload deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting file upload:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete file upload',
                error: error.message
            });
        }
    }

    /**
     * Download file
     */
    static async downloadFile(req, res) {
        try {
            const { id } = req.params;
            const fileUpload = await FileUpload.findById(id);

            if (!fileUpload) {
                return res.status(404).json({
                    success: false,
                    message: 'File upload not found'
                });
            }

            // Check if user can access this file
            if (!fileUpload.isPublic && fileUpload.uploadedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this file'
                });
            }

            // Check if file exists on disk
            const fileExists = await fileUpload.fileExists();
            if (!fileExists) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found on disk'
                });
            }

            // Set appropriate headers
            res.setHeader('Content-Disposition', `attachment; filename="${fileUpload.originalName}"`);
            res.setHeader('Content-Type', fileUpload.mimeType || 'application/octet-stream');

            // Stream the file
            res.sendFile(path.resolve(fileUpload.path));
        } catch (error) {
            logger.error('Error downloading file:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to download file',
                error: error.message
            });
        }
    }

    /**
     * Add tag to file upload
     */
    static async addTag(req, res) {
        try {
            const { id } = req.params;
            const { tag } = req.body;
            const fileUpload = await FileUpload.findById(id);

            if (!fileUpload) {
                return res.status(404).json({
                    success: false,
                    message: 'File upload not found'
                });
            }

            // Check if user can modify this file
            if (fileUpload.uploadedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this file'
                });
            }

            if (!tag) {
                return res.status(400).json({
                    success: false,
                    message: 'Tag is required'
                });
            }

            const updatedFileUpload = await fileUpload.addTag(tag, req.user.id);

            res.json({
                success: true,
                message: 'Tag added successfully',
                data: updatedFileUpload
            });
        } catch (error) {
            logger.error('Error adding tag:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add tag',
                error: error.message
            });
        }
    }

    /**
     * Remove tag from file upload
     */
    static async removeTag(req, res) {
        try {
            const { id } = req.params;
            const { tag } = req.body;
            const fileUpload = await FileUpload.findById(id);

            if (!fileUpload) {
                return res.status(404).json({
                    success: false,
                    message: 'File upload not found'
                });
            }

            // Check if user can modify this file
            if (fileUpload.uploadedBy !== req.user.id && req.user.role !== 'Admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this file'
                });
            }

            if (!tag) {
                return res.status(400).json({
                    success: false,
                    message: 'Tag is required'
                });
            }

            const updatedFileUpload = await fileUpload.removeTag(tag, req.user.id);

            res.json({
                success: true,
                message: 'Tag removed successfully',
                data: updatedFileUpload
            });
        } catch (error) {
            logger.error('Error removing tag:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove tag',
                error: error.message
            });
        }
    }

    /**
     * Get file upload statistics
     */
    static async getFileUploadStatistics(req, res) {
        try {
            const { relatedEntityType, relatedEntityId, uploadedBy } = req.query;
            const options = {};
            
            if (relatedEntityType) options.relatedEntityType = relatedEntityType;
            if (relatedEntityId) options.relatedEntityId = relatedEntityId;
            if (uploadedBy) options.uploadedBy = uploadedBy;

            const statistics = await FileUpload.getStatistics(options);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            logger.error('Error fetching file upload statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch file upload statistics',
                error: error.message
            });
        }
    }

    /**
     * Get all tags used in file uploads
     */
    static async getAllTags(req, res) {
        try {
            const tags = await FileUpload.getAllTags();

            res.json({
                success: true,
                data: tags
            });
        } catch (error) {
            logger.error('Error fetching all tags:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch all tags',
                error: error.message
            });
        }
    }
}

module.exports = FileUploadsController;

