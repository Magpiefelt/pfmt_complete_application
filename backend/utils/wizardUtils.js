const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'wizard-utils' },
  transports: [
    new winston.transports.File({ filename: 'logs/utils.log' }),
    new winston.transports.Console()
  ]
});

// Data validation utilities
const validationUtils = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone number validation (North American format)
  isValidPhone: (phone) => {
    const phoneRegex = /^(\+1|1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  },

  // Canadian postal code validation
  isValidPostalCode: (postalCode) => {
    const postalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    return postalRegex.test(postalCode);
  },

  // Currency validation
  isValidCurrency: (amount) => {
    const currencyRegex = /^\d+(\.\d{1,2})?$/;
    return currencyRegex.test(amount.toString()) && parseFloat(amount) >= 0;
  },

  // Date validation
  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  // Future date validation
  isFutureDate: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    return date > now;
  },

  // Date range validation
  isValidDateRange: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  },

  // Project code validation
  isValidProjectCode: (code) => {
    const codeRegex = /^CPD\d{8}$/;
    return codeRegex.test(code);
  },

  // Coordinate validation
  isValidLatitude: (lat) => {
    const latitude = parseFloat(lat);
    return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
  },

  isValidLongitude: (lng) => {
    const longitude = parseFloat(lng);
    return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
  },

  // File validation
  isValidFileType: (filename, allowedTypes) => {
    const ext = path.extname(filename).toLowerCase();
    return allowedTypes.includes(ext);
  },

  isValidFileSize: (fileSize, maxSizeBytes) => {
    return fileSize <= maxSizeBytes;
  },

  // Complex validation for wizard steps
  validateProjectDetails: (data) => {
    const errors = [];

    if (!data.projectName || data.projectName.trim().length < 3) {
      errors.push('Project name must be at least 3 characters long');
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('Project description must be at least 10 characters long');
    }

    if (!data.category) {
      errors.push('Project category is required');
    }

    if (data.startDate && data.expectedCompletion) {
      if (!validationUtils.isValidDateRange(data.startDate, data.expectedCompletion)) {
        errors.push('Expected completion date must be after start date');
      }
    }

    return errors;
  },

  validateLocationData: (data) => {
    const errors = [];

    if (!data.location || data.location.trim().length < 2) {
      errors.push('Primary location is required');
    }

    if (data.latitude && !validationUtils.isValidLatitude(data.latitude)) {
      errors.push('Invalid latitude value');
    }

    if (data.longitude && !validationUtils.isValidLongitude(data.longitude)) {
      errors.push('Invalid longitude value');
    }

    if (data.postalCode && !validationUtils.isValidPostalCode(data.postalCode)) {
      errors.push('Invalid postal code format');
    }

    return errors;
  },

  validateVendorData: (data) => {
    const errors = [];

    if (!data.selectedVendors || data.selectedVendors.length === 0) {
      errors.push('At least one vendor must be selected');
    }

    if (data.selectedVendors) {
      data.selectedVendors.forEach((vendor, index) => {
        if (!vendor.vendorId) {
          errors.push(`Vendor ${index + 1}: Vendor ID is required`);
        }

        if (!vendor.role) {
          errors.push(`Vendor ${index + 1}: Role is required`);
        }

        if (vendor.contractValue && !validationUtils.isValidCurrency(vendor.contractValue)) {
          errors.push(`Vendor ${index + 1}: Invalid contract value`);
        }
      });
    }

    return errors;
  },

  validateBudgetData: (data) => {
    const errors = [];

    if (!data.totalBudget || !validationUtils.isValidCurrency(data.totalBudget)) {
      errors.push('Valid total budget is required');
    }

    if (!data.fiscalYear || !/^\d{4}$/.test(data.fiscalYear)) {
      errors.push('Valid fiscal year is required (YYYY format)');
    }

    if (data.categories && data.categories.length > 0) {
      const totalCategoryAmount = data.categories.reduce((sum, cat) => {
        return sum + (parseFloat(cat.amount) || 0);
      }, 0);

      if (totalCategoryAmount > parseFloat(data.totalBudget)) {
        errors.push('Total category allocation cannot exceed total budget');
      }

      data.categories.forEach((category, index) => {
        if (!category.name || category.name.trim().length < 2) {
          errors.push(`Category ${index + 1}: Name is required`);
        }

        if (!category.amount || !validationUtils.isValidCurrency(category.amount)) {
          errors.push(`Category ${index + 1}: Valid amount is required`);
        }
      });
    }

    return errors;
  }
};

// Data formatting utilities
const formatUtils = {
  // Currency formatting
  formatCurrency: (amount, currency = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  // Date formatting
  formatDate: (date, format = 'short') => {
    const dateObj = new Date(date);
    const options = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }
    };

    return new Intl.DateTimeFormat('en-CA', options[format]).format(dateObj);
  },

  // Phone number formatting
  formatPhone: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  },

  // Postal code formatting
  formatPostalCode: (postalCode) => {
    const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
    if (cleaned.length === 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    return postalCode;
  },

  // Project code formatting
  formatProjectCode: (code) => {
    return code.toUpperCase();
  },

  // Name formatting
  formatName: (name) => {
    return name.trim().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  // Address formatting
  formatAddress: (addressComponents) => {
    const parts = [
      addressComponents.streetNumber,
      addressComponents.streetName,
      addressComponents.streetType,
      addressComponents.streetDirection
    ].filter(Boolean);

    return parts.join(' ');
  },

  // Percentage formatting
  formatPercentage: (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  }
};

// File handling utilities
const fileUtils = {
  // Allowed file types for different purposes
  allowedTypes: {
    documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'],
    spreadsheets: ['.xls', '.xlsx', '.csv'],
    archives: ['.zip', '.rar', '.7z', '.tar', '.gz']
  },

  // Maximum file sizes (in bytes)
  maxSizes: {
    document: 10 * 1024 * 1024, // 10MB
    image: 5 * 1024 * 1024,     // 5MB
    spreadsheet: 20 * 1024 * 1024, // 20MB
    archive: 50 * 1024 * 1024   // 50MB
  },

  // Generate unique filename
  generateUniqueFilename: (originalName) => {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${name}_${timestamp}_${random}${ext}`;
  },

  // Validate file upload
  validateFileUpload: (file, category = 'document') => {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    // Check file type
    const allowedTypes = fileUtils.allowedTypes[category] || fileUtils.allowedTypes.documents;
    if (!validationUtils.isValidFileType(file.originalname, allowedTypes)) {
      errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    const maxSize = fileUtils.maxSizes[category] || fileUtils.maxSizes.document;
    if (!validationUtils.isValidFileSize(file.size, maxSize)) {
      errors.push(`File size too large. Maximum size: ${formatUtils.formatFileSize(maxSize)}`);
    }

    return errors;
  },

  // Format file size
  formatFileSize: (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Create upload directory if it doesn't exist
  ensureUploadDirectory: async (uploadPath) => {
    try {
      await fs.access(uploadPath);
    } catch (error) {
      await fs.mkdir(uploadPath, { recursive: true });
      logger.info('Created upload directory', { path: uploadPath });
    }
  },

  // Save uploaded file
  saveUploadedFile: async (file, uploadPath, category = 'document') => {
    try {
      // Validate file
      const validationErrors = fileUtils.validateFileUpload(file, category);
      if (validationErrors.length > 0) {
        throw new Error(`File validation failed: ${validationErrors.join(', ')}`);
      }

      // Ensure upload directory exists
      await fileUtils.ensureUploadDirectory(uploadPath);

      // Generate unique filename
      const filename = fileUtils.generateUniqueFilename(file.originalname);
      const filePath = path.join(uploadPath, filename);

      // Save file
      await fs.writeFile(filePath, file.buffer);

      logger.info('File saved successfully', {
        originalName: file.originalname,
        savedAs: filename,
        size: file.size,
        path: filePath
      });

      return {
        filename,
        originalName: file.originalname,
        size: file.size,
        path: filePath,
        url: `/uploads/${filename}`
      };
    } catch (error) {
      logger.error('Failed to save uploaded file', {
        error: error.message,
        filename: file?.originalname
      });
      throw error;
    }
  },

  // Delete file
  deleteFile: async (filePath) => {
    try {
      await fs.unlink(filePath);
      logger.info('File deleted successfully', { path: filePath });
    } catch (error) {
      logger.error('Failed to delete file', {
        error: error.message,
        path: filePath
      });
      throw error;
    }
  }
};

// Notification utilities
const notificationUtils = {
  // Email transporter configuration
  createEmailTransporter: () => {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  },

  // Send email notification
  sendEmail: async (to, subject, htmlContent, textContent = null) => {
    try {
      const transporter = notificationUtils.createEmailTransporter();

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@alberta.ca',
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '')
      };

      const result = await transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId
      });

      return result;
    } catch (error) {
      logger.error('Failed to send email', {
        error: error.message,
        to,
        subject
      });
      throw error;
    }
  },

  // Send wizard completion notification
  sendWizardCompletionNotification: async (userEmail, projectData) => {
    const subject = `Project Created: ${projectData.name}`;
    const htmlContent = `
      <h2>Project Created Successfully</h2>
      <p>Your project has been created successfully in the PFMT system.</p>
      
      <h3>Project Details:</h3>
      <ul>
        <li><strong>Project Name:</strong> ${projectData.name}</li>
        <li><strong>Project Code:</strong> ${projectData.code}</li>
        <li><strong>Category:</strong> ${projectData.category}</li>
        <li><strong>Status:</strong> ${projectData.status}</li>
      </ul>
      
      <p>You can view and manage your project by logging into the PFMT system.</p>
      
      <p>Best regards,<br>PFMT System</p>
    `;

    await notificationUtils.sendEmail(userEmail, subject, htmlContent);
  },

  // Send error notification to administrators
  sendErrorNotification: async (error, context) => {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    if (adminEmails.length === 0) {
      logger.warn('No admin emails configured for error notifications');
      return;
    }

    const subject = `PFMT Wizard Error: ${error.message}`;
    const htmlContent = `
      <h2>Wizard Error Notification</h2>
      <p>An error occurred in the PFMT project wizard system.</p>
      
      <h3>Error Details:</h3>
      <ul>
        <li><strong>Error:</strong> ${error.message}</li>
        <li><strong>Stack:</strong> <pre>${error.stack}</pre></li>
        <li><strong>Context:</strong> ${JSON.stringify(context, null, 2)}</li>
        <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
      </ul>
      
      <p>Please investigate this issue promptly.</p>
    `;

    for (const email of adminEmails) {
      try {
        await notificationUtils.sendEmail(email.trim(), subject, htmlContent);
      } catch (emailError) {
        logger.error('Failed to send error notification', {
          adminEmail: email,
          error: emailError.message
        });
      }
    }
  }
};

// Data export/import utilities
const dataUtils = {
  // Export wizard data to JSON
  exportWizardData: (wizardData) => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: wizardData
    };

    return JSON.stringify(exportData, null, 2);
  },

  // Import wizard data from JSON
  importWizardData: (jsonString) => {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.data) {
        throw new Error('Invalid import data format');
      }

      return importData.data;
    } catch (error) {
      throw new Error(`Failed to import data: ${error.message}`);
    }
  },

  // Export to CSV format
  exportToCSV: (data, headers) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        return value.toString().includes(',') ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  },

  // Generate project summary report
  generateProjectSummary: (projectData) => {
    return {
      projectInfo: {
        name: projectData.details?.projectName,
        code: projectData.code,
        category: projectData.details?.category,
        type: projectData.details?.projectType,
        description: projectData.details?.description
      },
      location: {
        primaryLocation: projectData.location?.location,
        municipality: projectData.location?.municipality,
        address: projectData.location?.address,
        coordinates: projectData.location?.latitude && projectData.location?.longitude 
          ? `${projectData.location.latitude}, ${projectData.location.longitude}` 
          : null
      },
      vendors: projectData.vendors?.selectedVendors?.map(vendor => ({
        name: vendor.vendorName,
        role: vendor.role,
        contractValue: vendor.contractValue ? formatUtils.formatCurrency(vendor.contractValue) : null
      })) || [],
      budget: {
        totalBudget: projectData.budget?.totalBudget ? formatUtils.formatCurrency(projectData.budget.totalBudget) : null,
        fiscalYear: projectData.budget?.fiscalYear,
        categories: projectData.budget?.categories?.map(cat => ({
          name: cat.name,
          amount: formatUtils.formatCurrency(cat.amount)
        })) || []
      },
      generatedAt: new Date().toISOString()
    };
  }
};

// Geocoding utilities
const geocodingUtils = {
  // Mock geocoding service (replace with actual service integration)
  geocodeAddress: async (address) => {
    try {
      // This would typically call a real geocoding service like Google Maps API
      logger.info('Geocoding address', { address });
      
      // Mock response for Alberta addresses
      const mockResponses = {
        'calgary': { latitude: 51.0447, longitude: -114.0719, municipality: 'Calgary' },
        'edmonton': { latitude: 53.5461, longitude: -113.4938, municipality: 'Edmonton' },
        'red deer': { latitude: 52.2681, longitude: -113.8112, municipality: 'Red Deer' }
      };

      const lowerAddress = address.toLowerCase();
      for (const [city, coords] of Object.entries(mockResponses)) {
        if (lowerAddress.includes(city)) {
          return coords;
        }
      }

      // Default to Calgary if no match
      return mockResponses.calgary;
    } catch (error) {
      logger.error('Geocoding failed', { error: error.message, address });
      return null;
    }
  },

  // Reverse geocoding
  reverseGeocode: async (latitude, longitude) => {
    try {
      logger.info('Reverse geocoding coordinates', { latitude, longitude });
      
      // Mock reverse geocoding
      return {
        address: '123 Main Street SW',
        municipality: 'Calgary',
        province: 'Alberta',
        postalCode: 'T2P 1A1',
        country: 'Canada'
      };
    } catch (error) {
      logger.error('Reverse geocoding failed', { error: error.message, latitude, longitude });
      return null;
    }
  }
};

// Performance monitoring utilities
const performanceUtils = {
  // Measure function execution time
  measureExecutionTime: async (fn, name) => {
    const start = process.hrtime.bigint();
    try {
      const result = await fn();
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      
      logger.info('Performance measurement', {
        function: name,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return { result, duration };
    } catch (error) {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000;
      
      logger.error('Performance measurement (with error)', {
        function: name,
        duration: `${duration.toFixed(2)}ms`,
        error: error.message
      });
      
      throw error;
    }
  },

  // Memory usage monitoring
  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      heapUsed: formatUtils.formatFileSize(usage.heapUsed),
      heapTotal: formatUtils.formatFileSize(usage.heapTotal),
      external: formatUtils.formatFileSize(usage.external),
      rss: formatUtils.formatFileSize(usage.rss)
    };
  },

  // System health check
  getSystemHealth: () => {
    const uptime = process.uptime();
    const memoryUsage = performanceUtils.getMemoryUsage();
    
    return {
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: memoryUsage,
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  validationUtils,
  formatUtils,
  fileUtils,
  notificationUtils,
  dataUtils,
  geocodingUtils,
  performanceUtils,
  logger
};

