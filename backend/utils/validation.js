/**
 * Comprehensive validation utilities for PFMT application
 * Provides server-side validation for all data inputs
 */

const { pool } = require('../config/database');

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * Validates required fields
 */
const validateRequired = (data, requiredFields) => {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD'
      });
    }
  });
  
  return errors;
};

/**
 * Validates string length
 */
const validateStringLength = (value, field, minLength = 0, maxLength = null) => {
  const errors = [];
  
  if (typeof value !== 'string') {
    return errors;
  }
  
  if (value.length < minLength) {
    errors.push({
      field,
      message: `${field} must be at least ${minLength} characters long`,
      code: 'MIN_LENGTH'
    });
  }
  
  if (maxLength && value.length > maxLength) {
    errors.push({
      field,
      message: `${field} must be no more than ${maxLength} characters long`,
      code: 'MAX_LENGTH'
    });
  }
  
  return errors;
};

/**
 * Validates email format
 */
const validateEmail = (email, field = 'email') => {
  const errors = [];
  
  if (!email) return errors;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push({
      field,
      message: `${field} must be a valid email address`,
      code: 'INVALID_EMAIL'
    });
  }
  
  return errors;
};

/**
 * Validates date format and range
 */
const validateDate = (dateString, field, allowPast = true, allowFuture = true) => {
  const errors = [];
  
  if (!dateString) return errors;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    errors.push({
      field,
      message: `${field} must be a valid date`,
      code: 'INVALID_DATE'
    });
    return errors;
  }
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  if (!allowPast && date < now) {
    errors.push({
      field,
      message: `${field} cannot be in the past`,
      code: 'DATE_IN_PAST'
    });
  }
  
  if (!allowFuture && date > now) {
    errors.push({
      field,
      message: `${field} cannot be in the future`,
      code: 'DATE_IN_FUTURE'
    });
  }
  
  return errors;
};

/**
 * Validates numeric values
 */
const validateNumber = (value, field, min = null, max = null, allowDecimals = true) => {
  const errors = [];
  
  if (value === null || value === undefined || value === '') {
    return errors;
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    errors.push({
      field,
      message: `${field} must be a valid number`,
      code: 'INVALID_NUMBER'
    });
    return errors;
  }
  
  if (!allowDecimals && num % 1 !== 0) {
    errors.push({
      field,
      message: `${field} must be a whole number`,
      code: 'DECIMAL_NOT_ALLOWED'
    });
  }
  
  if (min !== null && num < min) {
    errors.push({
      field,
      message: `${field} must be at least ${min}`,
      code: 'MIN_VALUE'
    });
  }
  
  if (max !== null && num > max) {
    errors.push({
      field,
      message: `${field} must be no more than ${max}`,
      code: 'MAX_VALUE'
    });
  }
  
  return errors;
};

/**
 * Validates UUID format
 */
const validateUUID = (uuid, field) => {
  const errors = [];
  
  if (!uuid) return errors;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    errors.push({
      field,
      message: `${field} must be a valid UUID`,
      code: 'INVALID_UUID'
    });
  }
  
  return errors;
};

/**
 * Validates project name uniqueness
 */
const validateProjectNameUnique = async (projectName, excludeProjectId = null) => {
  const errors = [];
  
  if (!projectName) return errors;
  
  try {
    let query = 'SELECT id FROM projects WHERE LOWER(project_name) = LOWER($1)';
    const params = [projectName];
    
    if (excludeProjectId) {
      query += ' AND id != $2';
      params.push(excludeProjectId);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
      errors.push({
        field: 'projectName',
        message: 'A project with this name already exists',
        code: 'DUPLICATE_PROJECT_NAME'
      });
    }
  } catch (error) {
    console.error('Error checking project name uniqueness:', error);
    errors.push({
      field: 'projectName',
      message: 'Unable to validate project name uniqueness',
      code: 'VALIDATION_ERROR'
    });
  }
  
  return errors;
};

/**
 * Validates basic project information
 */
const validateBasicProjectInfo = async (data, excludeProjectId = null) => {
  const errors = [];
  
  // Required fields
  const requiredErrors = validateRequired(data, ['projectName', 'description', 'category']);
  errors.push(...requiredErrors);
  
  // String length validations
  errors.push(...validateStringLength(data.projectName, 'projectName', 3, 200));
  errors.push(...validateStringLength(data.description, 'description', 10, 1000));
  
  // Category validation
  const validCategories = ['Infrastructure', 'Technology', 'Construction', 'Research', 'Maintenance', 'Renovation', 'Other'];
  if (data.category && !validCategories.includes(data.category)) {
    errors.push({
      field: 'category',
      message: 'Invalid project category',
      code: 'INVALID_CATEGORY'
    });
  }
  
  // Project type validation
  const validProjectTypes = ['Standard', 'Fast-Track', 'Emergency', 'Pilot', 'Research'];
  if (data.projectType && !validProjectTypes.includes(data.projectType)) {
    errors.push({
      field: 'projectType',
      message: 'Invalid project type',
      code: 'INVALID_PROJECT_TYPE'
    });
  }
  
  // Region validation
  const validRegions = ['Alberta', 'Calgary', 'Edmonton', 'Northern Alberta', 'Southern Alberta', 'Central Alberta'];
  if (data.region && !validRegions.includes(data.region)) {
    errors.push({
      field: 'region',
      message: 'Invalid region',
      code: 'INVALID_REGION'
    });
  }
  
  // Ministry validation
  const validMinistries = [
    'Infrastructure', 'Transportation', 'Education', 'Health', 'Environment',
    'Technology and Innovation', 'Municipal Affairs', 'Energy', 'Agriculture', 'Other'
  ];
  if (data.ministry && !validMinistries.includes(data.ministry)) {
    errors.push({
      field: 'ministry',
      message: 'Invalid ministry',
      code: 'INVALID_MINISTRY'
    });
  }
  
  // Date validations
  if (data.startDate) {
    errors.push(...validateDate(data.startDate, 'startDate', false, true));
  }
  
  if (data.expectedCompletion) {
    errors.push(...validateDate(data.expectedCompletion, 'expectedCompletion', false, true));
    
    // Ensure completion date is after start date
    if (data.startDate && data.expectedCompletion) {
      const startDate = new Date(data.startDate);
      const completionDate = new Date(data.expectedCompletion);
      
      if (completionDate <= startDate) {
        errors.push({
          field: 'expectedCompletion',
          message: 'Expected completion date must be after start date',
          code: 'INVALID_DATE_RANGE'
        });
      }
    }
  }
  
  // Project name uniqueness (async validation)
  if (data.projectName && errors.filter(e => e.field === 'projectName').length === 0) {
    const uniqueErrors = await validateProjectNameUnique(data.projectName, excludeProjectId);
    errors.push(...uniqueErrors);
  }
  
  return errors;
};

/**
 * Validates budget information
 */
const validateBudgetInfo = (data) => {
  const errors = [];
  
  // Budget amount validations
  const budgetFields = [
    'totalBudget', 'designBudget', 'constructionBudget', 'contingencyBudget',
    'equipmentBudget', 'managementBudget', 'otherBudget'
  ];
  
  budgetFields.forEach(field => {
    if (data[field] !== undefined) {
      errors.push(...validateNumber(data[field], field, 0, 999999999, true));
    }
  });
  
  // Validate budget breakdown doesn't exceed total
  if (data.totalBudget) {
    const breakdown = [
      data.designBudget || 0,
      data.constructionBudget || 0,
      data.contingencyBudget || 0,
      data.equipmentBudget || 0,
      data.managementBudget || 0,
      data.otherBudget || 0
    ];
    
    const breakdownTotal = breakdown.reduce((sum, amount) => sum + Number(amount || 0), 0);
    
    if (breakdownTotal > Number(data.totalBudget)) {
      errors.push({
        field: 'totalBudget',
        message: 'Budget breakdown cannot exceed total budget',
        code: 'BUDGET_BREAKDOWN_EXCEEDS_TOTAL'
      });
    }
  }
  
  // Funding source validation
  const validFundingSources = ['Government', 'Private', 'Mixed', 'Grant', 'Other'];
  if (data.fundingSource && !validFundingSources.includes(data.fundingSource)) {
    errors.push({
      field: 'fundingSource',
      message: 'Invalid funding source',
      code: 'INVALID_FUNDING_SOURCE'
    });
  }
  
  return errors;
};

/**
 * Validates team information
 */
const validateTeamInfo = (data) => {
  const errors = [];
  
  // Project manager validation
  if (data.projectManager) {
    errors.push(...validateUUID(data.projectManager, 'projectManager'));
  }
  
  // Director validation
  if (data.director) {
    errors.push(...validateUUID(data.director, 'director'));
  }
  
  // Team members validation
  if (data.teamMembers && Array.isArray(data.teamMembers)) {
    data.teamMembers.forEach((member, index) => {
      if (member.userId) {
        errors.push(...validateUUID(member.userId, `teamMembers[${index}].userId`));
      }
      
      if (member.role) {
        errors.push(...validateStringLength(member.role, `teamMembers[${index}].role`, 2, 100));
      }
    });
  }
  
  return errors;
};

/**
 * Validates location information
 */
const validateLocationInfo = (data) => {
  const errors = [];
  
  // Address validation
  if (data.address) {
    errors.push(...validateStringLength(data.address, 'address', 5, 200));
  }
  
  // Municipality validation
  if (data.municipality) {
    errors.push(...validateStringLength(data.municipality, 'municipality', 2, 100));
  }
  
  // Postal code validation (Canadian format)
  if (data.postalCode) {
    const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    if (!postalCodeRegex.test(data.postalCode)) {
      errors.push({
        field: 'postalCode',
        message: 'Invalid Canadian postal code format',
        code: 'INVALID_POSTAL_CODE'
      });
    }
  }
  
  // Coordinates validation
  if (data.latitude !== undefined) {
    errors.push(...validateNumber(data.latitude, 'latitude', -90, 90, true));
  }
  
  if (data.longitude !== undefined) {
    errors.push(...validateNumber(data.longitude, 'longitude', -180, 180, true));
  }
  
  return errors;
};

/**
 * Validates complete wizard data
 */
const validateWizardData = async (stepData) => {
  const allErrors = [];
  
  try {
    // Validate basic information (step 2)
    if (stepData[2]) {
      const basicErrors = await validateBasicProjectInfo(stepData[2]);
      allErrors.push(...basicErrors);
    }
    
    // Validate budget information (step 3)
    if (stepData[3]) {
      const budgetErrors = validateBudgetInfo(stepData[3]);
      allErrors.push(...budgetErrors);
    }
    
    // Validate team information (step 4)
    if (stepData[4]) {
      const teamErrors = validateTeamInfo(stepData[4]);
      allErrors.push(...teamErrors);
    }
    
    // Validate location information if present
    const locationData = { ...stepData[2], ...stepData[5] }; // Location might be in step 2 or separate step 5
    const locationErrors = validateLocationInfo(locationData);
    allErrors.push(...locationErrors);
    
  } catch (error) {
    console.error('Error during wizard validation:', error);
    allErrors.push({
      field: 'general',
      message: 'Validation error occurred',
      code: 'VALIDATION_ERROR'
    });
  }
  
  return allErrors;
};

/**
 * Formats validation errors for API response
 */
const formatValidationErrors = (errors) => {
  return {
    success: false,
    message: 'Validation failed',
    fieldErrors: errors.reduce((acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field].push({
        message: error.message,
        code: error.code
      });
      return acc;
    }, {}),
    errorCount: errors.length
  };
};

module.exports = {
  ValidationError,
  validateRequired,
  validateStringLength,
  validateEmail,
  validateDate,
  validateNumber,
  validateUUID,
  validateProjectNameUnique,
  validateBasicProjectInfo,
  validateBudgetInfo,
  validateTeamInfo,
  validateLocationInfo,
  validateWizardData,
  formatValidationErrors
};

