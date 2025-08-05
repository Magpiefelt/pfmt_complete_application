const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/vendor-documents');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed.'));
    }
  }
});

class VendorPortalController {
  // Vendor registration
  async registerVendor(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        companyName,
        businessNumber,
        contactName,
        contactEmail,
        contactPhone,
        address,
        city,
        province,
        postalCode,
        website,
        businessType,
        capabilities,
        certifications,
        password
      } = req.body;

      // Check if vendor already exists
      const existingVendor = await client.query(
        'SELECT id FROM vendor_registrations WHERE contact_email = $1 OR business_number = $2',
        [contactEmail, businessNumber]
      );

      if (existingVendor.rows.length > 0) {
        throw new Error('Vendor with this email or business number already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create vendor registration
      const registrationQuery = `
        INSERT INTO vendor_registrations (
          company_name, business_number, contact_name, contact_email, 
          contact_phone, address, city, province, postal_code, website,
          business_type, capabilities, certifications, password_hash,
          registration_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        RETURNING *
      `;

      const registrationResult = await client.query(registrationQuery, [
        companyName, businessNumber, contactName, contactEmail,
        contactPhone, address, city, province, postalCode, website,
        businessType, JSON.stringify(capabilities), JSON.stringify(certifications),
        hashedPassword, 'Pending Review'
      ]);

      await client.query('COMMIT');

      // Remove password hash from response
      const vendor = registrationResult.rows[0];
      delete vendor.password_hash;

      res.status(201).json({
        success: true,
        message: 'Vendor registration submitted successfully',
        vendor: vendor
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error registering vendor:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to register vendor'
      });
    } finally {
      client.release();
    }
  }

  // Vendor login
  async loginVendor(req, res) {
    try {
      const { email, password } = req.body;

      // Find vendor registration
      const vendorQuery = `
        SELECT id, company_name, contact_email, password_hash, registration_status
        FROM vendor_registrations 
        WHERE contact_email = $1
      `;
      
      const vendorResult = await pool.query(vendorQuery, [email]);

      if (vendorResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const vendor = vendorResult.rows[0];

      // Check if registration is approved
      if (vendor.registration_status !== 'Approved') {
        return res.status(403).json({
          success: false,
          message: 'Your vendor registration is still pending approval'
        });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, vendor.password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          vendorId: vendor.id, 
          email: vendor.contact_email,
          companyName: vendor.company_name,
          type: 'vendor'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token: token,
        vendor: {
          id: vendor.id,
          companyName: vendor.company_name,
          email: vendor.contact_email,
          status: vendor.registration_status
        }
      });

    } catch (error) {
      console.error('Error logging in vendor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login'
      });
    }
  }

  // Get vendor dashboard data
  async getVendorDashboard(req, res) {
    try {
      const vendorId = req.vendor.vendorId;

      // Get vendor details
      const vendorQuery = `
        SELECT 
          id, company_name, contact_name, contact_email, contact_phone,
          address, city, province, postal_code, website, business_type,
          capabilities, certifications, registration_status, created_at
        FROM vendor_registrations 
        WHERE id = $1
      `;
      
      const vendorResult = await pool.query(vendorQuery, [vendorId]);
      
      if (vendorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const vendor = vendorResult.rows[0];

      // Get document count
      const documentsQuery = `
        SELECT COUNT(*) as document_count
        FROM vendor_documents 
        WHERE vendor_id = $1
      `;
      const documentsResult = await pool.query(documentsQuery, [vendorId]);

      // Get recent activities (placeholder - would be implemented based on requirements)
      const activities = [
        {
          id: 1,
          type: 'document_uploaded',
          description: 'Business license uploaded',
          timestamp: new Date()
        }
      ];

      // Get qualification status
      const qualificationQuery = `
        SELECT 
          overall_score, qualification_status, last_assessment_date
        FROM vendor_assessments 
        WHERE vendor_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const qualificationResult = await pool.query(qualificationQuery, [vendorId]);

      res.json({
        success: true,
        data: {
          vendor: vendor,
          stats: {
            documentsCount: parseInt(documentsResult.rows[0].document_count),
            qualificationScore: qualificationResult.rows[0]?.overall_score || null,
            qualificationStatus: qualificationResult.rows[0]?.qualification_status || 'Not Assessed'
          },
          recentActivities: activities
        }
      });

    } catch (error) {
      console.error('Error fetching vendor dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data'
      });
    }
  }

  // Upload vendor document
  async uploadDocument(req, res) {
    try {
      const vendorId = req.vendor.vendorId;
      const { documentType, description } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Save document record to database
      const documentQuery = `
        INSERT INTO vendor_documents (
          vendor_id, document_type, file_name, file_path, file_size,
          description, uploaded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;

      const documentResult = await pool.query(documentQuery, [
        vendorId,
        documentType,
        req.file.originalname,
        req.file.path,
        req.file.size,
        description
      ]);

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        document: documentResult.rows[0]
      });

    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document'
      });
    }
  }

  // Get vendor documents
  async getVendorDocuments(req, res) {
    try {
      const vendorId = req.vendor.vendorId;

      const documentsQuery = `
        SELECT 
          id, document_type, file_name, file_size, description,
          uploaded_at, status
        FROM vendor_documents 
        WHERE vendor_id = $1
        ORDER BY uploaded_at DESC
      `;

      const documentsResult = await pool.query(documentsQuery, [vendorId]);

      res.json({
        success: true,
        documents: documentsResult.rows
      });

    } catch (error) {
      console.error('Error fetching vendor documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents'
      });
    }
  }

  // Update vendor profile
  async updateVendorProfile(req, res) {
    try {
      const vendorId = req.vendor.vendorId;
      const {
        contactName,
        contactPhone,
        address,
        city,
        province,
        postalCode,
        website,
        capabilities,
        certifications
      } = req.body;

      const updateQuery = `
        UPDATE vendor_registrations 
        SET 
          contact_name = $1,
          contact_phone = $2,
          address = $3,
          city = $4,
          province = $5,
          postal_code = $6,
          website = $7,
          capabilities = $8,
          certifications = $9,
          updated_at = NOW()
        WHERE id = $10
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, [
        contactName, contactPhone, address, city, province, postalCode,
        website, JSON.stringify(capabilities), JSON.stringify(certifications),
        vendorId
      ]);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }

      const vendor = updateResult.rows[0];
      delete vendor.password_hash;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        vendor: vendor
      });

    } catch (error) {
      console.error('Error updating vendor profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // Get vendor qualification status
  async getQualificationStatus(req, res) {
    try {
      const vendorId = req.vendor.vendorId;

      const qualificationQuery = `
        SELECT 
          va.*,
          vqs.criteria_name,
          vqs.score,
          vqs.max_score,
          vqs.comments
        FROM vendor_assessments va
        LEFT JOIN vendor_qualification_scores vqs ON va.id = vqs.assessment_id
        WHERE va.vendor_id = $1
        ORDER BY va.created_at DESC, vqs.criteria_name
      `;

      const qualificationResult = await pool.query(qualificationQuery, [vendorId]);

      if (qualificationResult.rows.length === 0) {
        return res.json({
          success: true,
          assessment: null,
          message: 'No qualification assessment found'
        });
      }

      // Group results by assessment
      const assessments = {};
      qualificationResult.rows.forEach(row => {
        if (!assessments[row.id]) {
          assessments[row.id] = {
            id: row.id,
            overallScore: row.overall_score,
            maxScore: row.max_score,
            qualificationStatus: row.qualification_status,
            assessedAt: row.created_at,
            assessedBy: row.assessed_by,
            criteria: []
          };
        }

        if (row.criteria_name) {
          assessments[row.id].criteria.push({
            name: row.criteria_name,
            score: row.score,
            maxScore: row.max_score,
            comments: row.comments
          });
        }
      });

      const latestAssessment = Object.values(assessments)[0];

      res.json({
        success: true,
        assessment: latestAssessment
      });

    } catch (error) {
      console.error('Error fetching qualification status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch qualification status'
      });
    }
  }

  // Middleware for vendor authentication
  static authenticateVendor(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      if (decoded.type !== 'vendor') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Invalid token type.'
        });
      }

      req.vendor = decoded;
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  }
}

// Export the controller and upload middleware
module.exports = {
  controller: new VendorPortalController(),
  upload: upload,
  authenticateVendor: VendorPortalController.authenticateVendor
};

