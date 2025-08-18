/**
 * Project Workflow API Service
 * Handles API calls for the project wizard workflow endpoints
 * Integrates with existing API service structure
 */

import { BaseService } from './BaseService'

// Type definitions for workflow API
export interface InitiationPayload {
  name: string
  description: string
  estimated_budget?: number | null
  start_date?: string | null
  end_date?: string | null
  project_type?: string | null
  delivery_method?: string | null
  project_category?: string | null
  geographic_region?: string | null
}

export interface AssignmentPayload {
  assigned_pm: string
  assigned_spm?: string | null
}

export interface FinalizationPayload {
  vendors: Array<{
    vendor_id: string
    role?: string
    notes?: string
  }>
  budget_breakdown: Record<string, any>
  detailed_description?: string
  risk_assessment?: string
  milestones: Array<{
    title: string
    type?: string | null
    planned_start: string
    planned_finish?: string | null
  }>
}

export interface ProjectSummary {
  id: string
  workflow_status: 'initiated' | 'assigned' | 'finalized' | 'active' | 'on_hold' | 'complete' | 'archived'
  created_by?: string
  assigned_pm?: string | null
  assigned_spm?: string | null
  project_name?: string
  project_description?: string
  estimated_budget?: number
  start_date?: string
  end_date?: string
  project_type?: string
  delivery_method?: string
  project_category?: string
  geographic_region?: string
  detailed_description?: string
  risk_assessment?: string
  budget_breakdown?: Record<string, any>
  created_at?: string
  updated_at?: string
  workflow_updated_at?: string
}

export interface WorkflowStatusResponse {
  id: string
  workflow_status: string
  created_by?: string
  assigned_pm?: string | null
  assigned_spm?: string | null
  assigned_by?: string | null
  finalized_by?: string | null
  finalized_at?: string | null
}

export interface ApiResponse<T> {
  success: boolean
  project?: T
  data?: T
  message?: string
  error?: {
    message: string
    code: string
    details?: string
  }
}

/**
 * Project Workflow API Client
 * Provides methods for all workflow endpoints
 */
export class ProjectWorkflowAPI extends BaseService {
  
  /**
   * Initiate a new project (PMI/Admin role)
   * POST /api/project-workflow
   */
  static async initiateProject(payload: InitiationPayload): Promise<ApiResponse<ProjectSummary>> {
    try {
      console.log('🚀 Initiating project:', payload)
      
      // Map frontend field names to backend expected names
      const backendPayload = {
        project_name: payload.name,
        project_description: payload.description,
        estimated_budget: payload.estimated_budget,
        start_date: payload.start_date,
        end_date: payload.end_date,
        project_type: payload.project_type,
        delivery_method: payload.delivery_method,
        project_category: payload.project_category,
        geographic_region: payload.geographic_region
      }
      
      const response = await this.post<any>('/project-workflow/initiate', backendPayload)
      
      console.log('✅ Project initiated successfully:', response)
      return {
        success: true,
        project: response.project || response.data,
        message: response.message || 'Project initiated successfully'
      }
      
    } catch (error: any) {
      return this.handleApiError(error, 'Failed to initiate project', 'INITIATION_FAILED')
    }
  }

  /**
   * Assign team to project (Director/Admin role)
   * POST /api/project-workflow/:id/assign
   */
  static async assignTeam(projectId: string, payload: AssignmentPayload): Promise<ApiResponse<ProjectSummary>> {
    try {
      console.log('👥 Assigning team to project:', { projectId, payload })
      
      const response = await this.post<any>(`/project-workflow/${projectId}/assign`, payload)
      
      console.log('✅ Team assigned successfully:', response)
      return {
        success: true,
        project: response.project || response.data,
        message: response.message || 'Team assigned successfully'
      }
      
    } catch (error: any) {
      return this.handleApiError(error, 'Failed to assign team', 'ASSIGNMENT_FAILED')
    }
  }

  /**
   * Finalize project setup (PM/SPM/Admin role)
   * POST /api/project-workflow/:id/finalize
   */
  static async finalizeProject(projectId: string, payload: FinalizationPayload): Promise<ApiResponse<ProjectSummary>> {
    try {
      console.log('🏁 Finalizing project:', { projectId, payload })
      
      const response = await this.post<any>(`/project-workflow/${projectId}/finalize`, payload)
      
      console.log('✅ Project finalized successfully:', response)
      return {
        success: true,
        project: response.project || response.data,
        message: response.message || 'Project finalized successfully'
      }
      
    } catch (error: any) {
      return this.handleApiError(error, 'Failed to finalize project', 'FINALIZATION_FAILED')
    }
  }

  /**
   * Get workflow status (All internal roles)
   * GET /api/project-workflow/:id/status
   */
  static async getWorkflowStatus(projectId: string): Promise<WorkflowStatusResponse> {
    try {
      console.log('📊 Getting workflow status for project:', projectId)

      const response = await this.get<any>(`/project-workflow/${projectId}/status`)

      console.log('✅ Workflow status retrieved:', response)
      return response.data || response

    } catch (error: any) {
      const handled = this.handleApiError(error, 'Failed to get workflow status', 'STATUS_FAILED')
      throw new Error(handled.error!.message)
    }
  }

  /**
   * Get full project details (All internal roles)
   * GET /api/projects/:id
   */
  static async getProject(projectId: string): Promise<{ project: ProjectSummary }> {
    try {
      console.log('📋 Getting full project details:', projectId)

      const response = await this.get<any>(`/projects/${projectId}`)

      console.log('✅ Project details retrieved:', response)
      return {
        project: response.data || response.project || response
      }

    } catch (error: any) {
      const handled = this.handleApiError(error, 'Failed to get project details', 'PROJECT_FETCH_FAILED')
      throw new Error(handled.error!.message)
    }
  }

  /**
   * Get available users for team assignment (updated for dual-wizard)
   * GET /api/project-workflow/users/available
   */
  static async getAvailableUsers(roles: string[] = ['pm', 'spm']): Promise<Array<{
    id: string
    name: string
    email: string
    role: string
  }>> {
    try {
      console.log('👤 Getting available users for dual-wizard')

      const response = await this.get<any>('/project-workflow/users/available')

      console.log('✅ Available users retrieved:', response)
      return response.users || response.data || []

    } catch (error: any) {
      console.error('❌ Failed to get available users:', error)

      // Fallback to legacy endpoint
      try {
        const roleQuery = roles.join(',')
        const fallbackResponse = await this.get<any>(`/users?role=${roleQuery}&is_active=true`)
        return fallbackResponse.data || []
      } catch (fallbackError) {
        const handled = this.handleApiError(fallbackError, 'Failed to get available users', 'USERS_FETCH_FAILED')
        throw new Error(handled.error!.message)
      }
    }
  }

  /**
   * Get available vendors for project assignment (updated for dual-wizard)
   * GET /api/project-workflow/vendors/available
   */
  static async getAvailableVendors(): Promise<Array<{
    id: string
    name: string
    capabilities?: string
    certification_level?: string
    performance_rating?: number
  }>> {
    try {
      console.log('🏢 Getting available vendors for dual-wizard')

      const response = await this.get<any>('/project-workflow/vendors/available')

      console.log('✅ Available vendors retrieved:', response)
      return response.vendors || response.data || []

    } catch (error: any) {
      console.error('❌ Failed to get available vendors:', error)

      // Fallback to legacy endpoint
      try {
        const fallbackResponse = await this.get<any>('/vendors?status=active')
        return fallbackResponse.data || []
      } catch (fallbackError) {
        const handled = this.handleApiError(fallbackError, 'Failed to get available vendors', 'VENDORS_FETCH_FAILED')
        throw new Error(handled.error!.message)
      }
    }
  }

  /**
   * Get project with enhanced status information (for dual-wizard system)
   * GET /api/project-workflow/:id/details
   */
  static async getProjectWithStatus(projectId: string): Promise<{ project: ProjectSummary & { lifecycle_status?: string } }> {
    try {
      console.log('📋 Getting enhanced project details for dual-wizard:', projectId)

      const response = await this.get<any>(`/project-workflow/${projectId}/details`)

      console.log('✅ Enhanced project details retrieved:', response)
      return {
        project: response.project || response.data || response
      }

    } catch (error: any) {
      console.error('❌ Failed to get enhanced project details, falling back to standard:', error)

      // Fallback to standard project endpoint
      return await this.getProject(projectId)
    }
  }

  /**
   * Validate user permissions for workflow action
   * Helper method to check if user can perform specific workflow actions
   */
  static canUserPerformAction(
    userRole: string, 
    action: 'initiate' | 'assign' | 'finalize', 
    projectStatus?: string
  ): boolean {
    const rolePermissions = {
      initiate: ['admin', 'pmi'],
      assign: ['admin', 'director'],
      finalize: ['admin', 'pm', 'spm']
    }
    
    const allowedRoles = rolePermissions[action]
    if (!allowedRoles.includes(userRole)) {
      return false
    }
    
    // Additional status-based validation
    if (action === 'assign' && projectStatus && projectStatus !== 'initiated') {
      return false
    }
    
    if (action === 'finalize' && projectStatus && projectStatus !== 'assigned') {
      return false
    }
    
    return true
  }

  /**
   * Get next workflow step for user (updated for dual-wizard system)
   * Helper method to determine what step user should see
   */
  static getNextStepForUser(
    userRole: string,
    projectStatus: string,
    projectId?: string,
    assignedPm?: string,
    assignedSpm?: string,
    userId?: string
  ): string | null {
    // Projects that are finalized/active/complete should go to details
    if (['finalized', 'active', 'complete'].includes(projectStatus)) {
      return null
    }

    // If project is assigned and user is PM/SPM, go to configuration
    if (projectStatus === 'assigned' && ['pm', 'spm'].includes(userRole)) {
      if (userId && (assignedPm === userId || assignedSpm === userId || userRole === 'admin')) {
        return 'configure'
      }
    }

    // If project is initiated and user is director, go to assignment
    if (projectStatus === 'initiated' && userRole === 'director') {
      return 'assign'
    }

    // PMI/Admin can initiate new projects when no project selected
    if ((userRole === 'pmi' || userRole === 'admin') && !projectId) {
      return 'initiate'
    }

    // Default: no wizard step
    return null
  }

  /**
   * Centralized error handling for workflow API
   */
  private static handleApiError(error: any, defaultMessage: string, defaultCode: string): ApiResponse<any> {
    console.error('API error handling:', error)
    return {
      success: false,
      error: {
        message: error?.response?.data?.error?.message || error.message || defaultMessage,
        code: error?.response?.data?.error?.code || defaultCode,
        details: error.stack
      }
    }
  }
}

// Export individual functions for backward compatibility
export const initiateProject = ProjectWorkflowAPI.initiateProject
export const assignTeam = ProjectWorkflowAPI.assignTeam
export const finalizeProject = ProjectWorkflowAPI.finalizeProject
export const getWorkflowStatus = ProjectWorkflowAPI.getWorkflowStatus
export const getProject = ProjectWorkflowAPI.getProject
export const getAvailableUsers = ProjectWorkflowAPI.getAvailableUsers
export const getAvailableVendors = ProjectWorkflowAPI.getAvailableVendors

// Default export
export default ProjectWorkflowAPI

