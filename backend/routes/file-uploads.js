/**
 * File Uploads Routes
 * API routes for file upload and management operations
 */

const express = require('express');
const router = express.Router();
const fileUploadsController = require('../controllers/fileUploadsController');
const { authenticateToken, requireRole } = require('../middleware/auth-consolidated');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

// Validation middleware
const validateFileUploadId = [
  param('id').isUUID().withMessage('Invalid file upload ID format')
];

const validateFileUploadData = [
  body('entity_type').isIn(['project', 'contract', 'report', 'gate_meeting', 'task', 'change_order']).withMessage('Invalid entity type'),
  body('entity_id').isUUID().withMessage('Valid entity ID is required'),
  body('category').optional().isIn(['Document', 'Image', 'Spreadsheet', 'Presentation', 'Archive', 'Other']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
  body('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
  body('access_level').optional().isIn(['Public', 'Internal', 'Restricted', 'Confidential']).withMessage('Invalid access level')
];

const validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('entity_type').optional().isIn(['project', 'contract', 'report', 'gate_meeting', 'task', 'change_order']).withMessage('Invalid entity type filter'),
  query('entity_id').optional().isUUID().withMessage('Invalid entity ID filter'),
  query('category').optional().isIn(['Document', 'Image', 'Spreadsheet', 'Presentation', 'Archive', 'Other']).withMessage('Invalid category filter'),
  query('access_level').optional().isIn(['Public', 'Internal', 'Restricted', 'Confidential']).withMessage('Invalid access level filter'),
  query('uploaded_by').optional().isUUID().withMessage('Invalid uploaded by user ID filter'),
  query('date_from').optional().isISO8601().withMessage('Invalid date_from format'),
  query('date_to').optional().isISO8601().withMessage('Invalid date_to format'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
];

// Routes - Only include methods that exist in the controller

/**
 * @route   GET /api/file-uploads
 * @desc    Get all file uploads with filtering and pagination
 * @access  Private
 */
router.get('/', 
  authenticateToken, 
  validateQueryParams,
  fileUploadsController.getAllFileUploads
);

/**
 * @route   GET /api/file-uploads/statistics
 * @desc    Get file upload statistics
 * @access  Private
 */
router.get('/statistics', 
  authenticateToken,
  fileUploadsController.getFileUploadStatistics
);

/**
 * @route   GET /api/file-uploads/by-user
 * @desc    Get files uploaded by current user
 * @access  Private
 */
router.get('/by-user', 
  authenticateToken,
  validateQueryParams,
  fileUploadsController.getFileUploadsByUser
);

/**
 * @route   GET /api/file-uploads/by-entity/:entityType/:entityId
 * @desc    Get files by entity
 * @access  Private
 */
router.get('/by-entity/:entityType/:entityId', 
  authenticateToken,
  fileUploadsController.getFileUploadsByEntity
);

/**
 * @route   GET /api/file-uploads/tags
 * @desc    Get all available tags
 * @access  Private
 */
router.get('/tags', 
  authenticateToken,
  fileUploadsController.getAllTags
);

/**
 * @route   GET /api/file-uploads/:id
 * @desc    Get file upload by ID
 * @access  Private
 */
router.get('/:id', 
  authenticateToken, 
  validateFileUploadId,
  fileUploadsController.getFileUploadById
);

/**
 * @route   POST /api/file-uploads
 * @desc    Upload new files
 * @access  Private
 */
router.post('/', 
  authenticateToken,
  upload.array('files', 10), // Allow up to 10 files
  validateFileUploadData,
  fileUploadsController.uploadFiles
);

/**
 * @route   PUT /api/file-uploads/:id
 * @desc    Update file upload metadata
 * @access  Private
 */
router.put('/:id', 
  authenticateToken, 
  validateFileUploadId,
  [
    body('filename').optional().isLength({ min: 1, max: 255 }).withMessage('Filename must be between 1 and 255 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    body('category').optional().isIn(['Document', 'Image', 'Spreadsheet', 'Presentation', 'Archive', 'Other']).withMessage('Invalid category'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
    body('access_level').optional().isIn(['Public', 'Internal', 'Restricted', 'Confidential']).withMessage('Invalid access level')
  ],
  fileUploadsController.updateFileUpload
);

/**
 * @route   DELETE /api/file-uploads/:id
 * @desc    Delete file upload
 * @access  Private
 */
router.delete('/:id', 
  authenticateToken, 
  validateFileUploadId,
  fileUploadsController.deleteFileUpload
);

/**
 * @route   GET /api/file-uploads/:id/download
 * @desc    Download file
 * @access  Private
 */
router.get('/:id/download', 
  authenticateToken, 
  validateFileUploadId,
  fileUploadsController.downloadFile
);

/**
 * @route   POST /api/file-uploads/:id/tag
 * @desc    Add tag to file
 * @access  Private
 */
router.post('/:id/tag', 
  authenticateToken, 
  validateFileUploadId,
  [
    body('tag').notEmpty().withMessage('Tag is required')
  ],
  fileUploadsController.addTag
);

/**
 * @route   DELETE /api/file-uploads/:id/tag
 * @desc    Remove tag from file
 * @access  Private
 */
router.delete('/:id/tag', 
  authenticateToken, 
  validateFileUploadId,
  [
    body('tag').notEmpty().withMessage('Tag is required')
  ],
  fileUploadsController.removeTag
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per request.'
      });
    }
  }
  
  if (error.message === 'Invalid file type. Only images, documents, and archives are allowed.') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;

