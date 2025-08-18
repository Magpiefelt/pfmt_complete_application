/**
 * Utility functions for normalizing project field names across different data sources
 * Handles camelCase, snake_case, and various naming conventions
 */

export interface NormalizedProject {
  // Core fields
  id: string | number
  name: string
  description: string
  status: string
  phase: string
  
  // Location and organization
  region: string
  ministry: string
  category: string
  
  // People
  projectManager: string
  contractor: string
  
  // Financial
  totalBudget: number
  amountSpent: number
  reportStatus: string
  
  // Dates
  startDate: string
  createdAt: string
  updatedAt: string
  
  // Status indicators
  scheduleStatus: string
  budgetStatus: string
  
  // Original fields preserved for backward compatibility
  [key: string]: any
}

/**
 * Enhanced field mapping for comprehensive wizard-to-details alignment
 */
const FIELD_MAPPINGS = {
  // Core project fields
  name: ['name', 'projectName', 'project_name'],
  description: ['description', 'projectDescription', 'project_description'],
  status: ['status', 'projectStatus', 'project_status'],
  phase: ['phase', 'projectPhase', 'project_phase'],
  
  // Classification fields
  category: ['category', 'projectCategory', 'project_category'],
  projectType: ['projectType', 'project_type'],
  deliveryType: ['deliveryType', 'delivery_type'],
  priority: ['priority'],
  program: ['program'],
  
  // Location fields
  region: ['region', 'geographicRegion', 'geographic_region'],
  ministry: ['ministry', 'clientMinistry', 'client_ministry', 'clientMinistryId', 'client_ministry_id'],
  address: ['address', 'projectAddress', 'project_address'],
  municipality: ['municipality'],
  constituency: ['constituency'],
  location: ['location'],
  buildingName: ['buildingName', 'building_name'],
  buildingType: ['buildingType', 'building_type'],
  buildingId: ['buildingId', 'building_id'],
  buildingOwner: ['buildingOwner', 'building_owner'],
  urbanRural: ['urbanRural', 'urban_rural'],
  postalCode: ['postalCode', 'postal_code'],
  latitude: ['latitude'],
  longitude: ['longitude'],
  
  // Date fields
  startDate: ['startDate', 'start_date'],
  expectedCompletion: ['expectedCompletion', 'expected_completion'],
  archivedDate: ['archivedDate', 'archived_date'],
  createdAt: ['createdAt', 'created_at'],
  updatedAt: ['updatedAt', 'updated_at'],
  
  // Financial fields
  totalBudget: ['totalBudget', 'totalApprovedFunding', 'total_approved_funding'],
  currentBudget: ['currentBudget', 'current_budget'],
  amountSpent: ['amountSpent', 'amount_spent'],
  designBudget: ['designBudget', 'design_budget'],
  constructionBudget: ['constructionBudget', 'construction_budget'],
  contingencyBudget: ['contingencyBudget', 'contingency_budget'],
  equipmentBudget: ['equipmentBudget', 'equipment_budget'],
  managementBudget: ['managementBudget', 'management_budget'],
  otherBudget: ['otherBudget', 'other_budget'],
  fundingSource: ['fundingSource', 'funding_source'],
  fundedToComplete: ['fundedToComplete', 'funded_to_complete'],
  
  // Team fields
  projectManager: ['projectManager', 'project_manager', 'project_manager_id', 'project_manager_name'],
  director: ['director', 'director_id', 'director_name'],
  srProjectManager: ['srProjectManager', 'sr_project_manager_id', 'sr_project_manager_name'],
  projectCoordinator: ['projectCoordinator', 'project_coordinator_id', 'project_coordinator_name'],
  executiveDirector: ['executiveDirector', 'executive_director_id', 'executive_director_name'],
  contractServicesAnalyst: ['contractServicesAnalyst', 'contract_services_analyst_id', 'contract_services_analyst_name'],
  programIntegrationAnalyst: ['programIntegrationAnalyst', 'program_integration_analyst_id', 'program_integration_analyst_name'],
  
  // Status fields
  reportStatus: ['reportStatus', 'report_status'],
  scheduleStatus: ['scheduleStatus', 'schedule_status'],
  budgetStatus: ['budgetStatus', 'budget_status'],
  
  // Additional fields
  contractor: ['contractor', 'contractorName', 'contractor_name'],
  schoolJurisdictionId: ['schoolJurisdictionId', 'school_jurisdiction_id'],
  clientMinistryId: ['clientMinistryId', 'client_ministry_id'],
  cpdNumber: ['cpdNumber', 'cpd_number'],
  approvalYear: ['approvalYear', 'approval_year'],
  fiscalYear: ['fiscalYear', 'fiscal_year'],
  requiresApproval: ['requiresApproval', 'requires_approval']
}

/**
 * Gets a field value using the mapping system
 */
export const getFieldValue = (obj: any, fieldKey: string, defaultValue: any = ''): any => {
  if (!obj) return defaultValue
  
  const fieldNames = FIELD_MAPPINGS[fieldKey] || [fieldKey]
  
  for (const fieldName of fieldNames) {
    if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
      return obj[fieldName]
    }
  }
  
  return defaultValue
}

/**
 * Normalizes a project object to ensure consistent field access
 */
export const normalizeProject = (project: any): NormalizedProject => {
  if (!project) {
    return {} as NormalizedProject
  }

  const normalized: any = {
    // Preserve all original fields
    ...project
  }

  // Apply field mappings
  Object.keys(FIELD_MAPPINGS).forEach(key => {
    normalized[key] = getFieldValue(project, key, getDefaultValue(key))
  })

  return normalized as NormalizedProject
}

/**
 * Gets default value for a field based on its type
 */
const getDefaultValue = (fieldKey: string): any => {
  const numericFields = [
    'totalBudget', 'currentBudget', 'amountSpent', 'designBudget', 
    'constructionBudget', 'contingencyBudget', 'equipmentBudget', 
    'managementBudget', 'otherBudget', 'latitude', 'longitude'
  ]
  
  const booleanFields = [
    'fundedToComplete', 'requiresApproval'
  ]
  
  if (numericFields.includes(fieldKey)) {
    return 0
  } else if (booleanFields.includes(fieldKey)) {
    return false
  } else {
    return ''
  }
}

/**
 * Converts wizard data to database format
 */
export const wizardToDatabase = (wizardData: any): any => {
  const dbData: any = {}
  
  // Map wizard fields to database fields
  const wizardToDbMapping = {
    projectName: 'project_name',
    description: 'project_description',
    category: 'project_category',
    projectType: 'project_type',
    deliveryType: 'delivery_type',
    startDate: 'start_date',
    expectedCompletion: 'expected_completion',
    buildingName: 'building_name',
    buildingType: 'building_type',
    buildingId: 'building_id',
    buildingOwner: 'building_owner',
    urbanRural: 'urban_rural',
    postalCode: 'postal_code',
    fundingSource: 'funding_source',
    fundedToComplete: 'funded_to_complete',
    totalBudget: 'total_approved_funding',
    currentBudget: 'current_budget',
    amountSpent: 'amount_spent',
    designBudget: 'design_budget',
    constructionBudget: 'construction_budget',
    contingencyBudget: 'contingency_budget',
    equipmentBudget: 'equipment_budget',
    managementBudget: 'management_budget',
    otherBudget: 'other_budget',
    projectManager: 'project_manager_id',
    director: 'director_id',
    srProjectManager: 'sr_project_manager_id',
    projectCoordinator: 'project_coordinator_id',
    executiveDirector: 'executive_director_id',
    contractServicesAnalyst: 'contract_services_analyst_id',
    programIntegrationAnalyst: 'program_integration_analyst_id',
    reportStatus: 'report_status',
    scheduleStatus: 'schedule_status',
    budgetStatus: 'budget_status',
    clientMinistryId: 'client_ministry_id',
    schoolJurisdictionId: 'school_jurisdiction_id',
    cpdNumber: 'cpd_number',
    approvalYear: 'approval_year',
    fiscalYear: 'fiscal_year',
    requiresApproval: 'requires_approval'
  }
  
  // Apply mappings
  Object.keys(wizardData).forEach(key => {
    const dbKey = wizardToDbMapping[key] || key
    dbData[dbKey] = wizardData[key]
  })
  
  return dbData
}

/**
 * Converts database data to frontend format
 */
export const databaseToFrontend = (dbData: any): any => {
  const frontendData: any = {}
  
  // Map database fields to frontend fields (reverse of wizardToDatabase)
  const dbToFrontendMapping = {
    project_name: 'name',
    project_description: 'description',
    project_category: 'category',
    project_type: 'projectType',
    delivery_type: 'deliveryType',
    start_date: 'startDate',
    expected_completion: 'expectedCompletion',
    building_name: 'buildingName',
    building_type: 'buildingType',
    building_id: 'buildingId',
    building_owner: 'buildingOwner',
    urban_rural: 'urbanRural',
    postal_code: 'postalCode',
    funding_source: 'fundingSource',
    funded_to_complete: 'fundedToComplete',
    total_approved_funding: 'totalBudget',
    current_budget: 'currentBudget',
    amount_spent: 'amountSpent',
    design_budget: 'designBudget',
    construction_budget: 'constructionBudget',
    contingency_budget: 'contingencyBudget',
    equipment_budget: 'equipmentBudget',
    management_budget: 'managementBudget',
    other_budget: 'otherBudget',
    project_manager_id: 'projectManager',
    director_id: 'director',
    sr_project_manager_id: 'srProjectManager',
    project_coordinator_id: 'projectCoordinator',
    executive_director_id: 'executiveDirector',
    contract_services_analyst_id: 'contractServicesAnalyst',
    program_integration_analyst_id: 'programIntegrationAnalyst',
    report_status: 'reportStatus',
    schedule_status: 'scheduleStatus',
    budget_status: 'budgetStatus',
    client_ministry_id: 'clientMinistryId',
    school_jurisdiction_id: 'schoolJurisdictionId',
    cpd_number: 'cpdNumber',
    approval_year: 'approvalYear',
    fiscal_year: 'fiscalYear',
    requires_approval: 'requiresApproval'
  }
  
  // Apply mappings
  Object.keys(dbData).forEach(key => {
    const frontendKey = dbToFrontendMapping[key] || key
    frontendData[frontendKey] = dbData[key]
  })
  
  return frontendData
}

/**
 * Normalizes an array of projects
 */
export const normalizeProjects = (projects: any[]): NormalizedProject[] => {
  if (!Array.isArray(projects)) {
    return []
  }
  
  return projects.map(normalizeProject)
}

/**
 * Formats currency values consistently
 */
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0'
  }
  
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Formats dates consistently
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  } catch {
    return ''
  }
}

/**
 * Calculates budget utilization percentage
 */
export const calculateBudgetUtilization = (amountSpent: number, totalBudget: number): number => {
  if (!totalBudget || totalBudget === 0) return 0
  return Math.min((amountSpent / totalBudget) * 100, 100)
}

/**
 * Gets status color class for badges
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status?.toLowerCase() || ''
  
  if (statusLower.includes('on track') || statusLower.includes('current')) {
    return 'bg-green-100 text-green-800'
  } else if (statusLower.includes('at risk') || statusLower.includes('update')) {
    return 'bg-yellow-100 text-yellow-800'
  } else if (statusLower.includes('delayed') || statusLower.includes('overdue')) {
    return 'bg-red-100 text-red-800'
  } else {
    return 'bg-gray-100 text-gray-800'
  }
}

