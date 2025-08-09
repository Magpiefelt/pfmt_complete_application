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
 * Normalizes a project object to ensure consistent field access
 */
export const normalizeProject = (project: any): NormalizedProject => {
  if (!project) {
    return {} as NormalizedProject
  }

  return {
    // Preserve all original fields
    ...project,
    
    // Core fields with fallbacks
    id: project.id || project.project_id || '',
    name: project.name || project.projectName || project.project_name || '',
    description: project.description || project.projectDescription || project.project_description || '',
    status: project.status || project.projectStatus || project.project_status || '',
    phase: project.phase || project.projectPhase || project.project_phase || '',
    
    // Location and organization
    region: project.region || project.geographicRegion || project.geographic_region || '',
    ministry: project.ministry || project.clientMinistry || project.client_ministry || '',
    category: project.category || project.projectCategory || project.project_category || '',
    
    // People
    projectManager: project.projectManager || 
                   project.project_manager || 
                   project.project_manager_name ||
                   project.modifiedByName || 
                   project.modified_by_name || 
                   project.currentVersion?.team?.projectManager || '',
    contractor: project.contractor || project.contractorName || project.contractor_name || '',
    
    // Financial
    totalBudget: project.totalBudget || 
                project.totalApprovedFunding || 
                project.total_approved_funding || 
                project.currentVersion?.totalApprovedFunding || 0,
    amountSpent: project.amountSpent || 
                project.amount_spent || 
                project.currentVersion?.amountSpent || 0,
    reportStatus: project.reportStatus || 
                 project.report_status || 
                 project.currentVersion?.reportStatus || 'Current',
    
    // Dates
    startDate: project.startDate || 
              project.start_date || 
              project.createdAt || 
              project.created_at || '',
    createdAt: project.createdAt || project.created_at || '',
    updatedAt: project.updatedAt || project.updated_at || '',
    
    // Status indicators
    scheduleStatus: project.scheduleStatus || project.schedule_status || 'On Track',
    budgetStatus: project.budgetStatus || project.budget_status || 'On Track'
  }
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
 * Gets a field value with multiple fallback options
 */
export const getFieldValue = (obj: any, fieldNames: string[], defaultValue: any = '') => {
  if (!obj) return defaultValue
  
  for (const fieldName of fieldNames) {
    if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
      return obj[fieldName]
    }
  }
  
  return defaultValue
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

