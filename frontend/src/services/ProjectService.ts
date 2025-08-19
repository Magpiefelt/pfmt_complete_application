import { BaseService } from './BaseService'
import { withErrorHandling, AppError } from '@/utils/errorHandling'

export interface Project {
  id: string
  name: string
  description?: string
  status: string
  project_phase: string
  category?: string
  ministry?: string
  region?: string
  total_approved_funding: number
  current_budget: number
  amount_spent: number
  project_manager_id?: string
  created_at: string
  updated_at: string
  [key: string]: any
}

export interface CreateProjectRequest {
  name: string
  description?: string
  project_phase: string
  category?: string
  ministry?: string
  region?: string
  total_approved_funding: number
  project_manager_id?: string
  [key: string]: any
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  status?: string
  project_phase?: string
  category?: string
  ministry?: string
  region?: string
  total_approved_funding?: number
  current_budget?: number
  project_manager_id?: string
  [key: string]: any
}

export interface ProjectFilters {
  status?: string
  project_phase?: string
  category?: string
  ministry?: string
  region?: string
  project_manager_id?: string
  search?: string
  limit?: number
  offset?: number
}


/**
 * Service for project API operations
 * Handles all project-related HTTP requests
 */
export class ProjectService extends BaseService {

  /**
   * Get all projects with optional filters
   */
  static async getAll(filters?: ProjectFilters): Promise<{
    projects: Project[]
    pagination?: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }> {
    const params: Record<string, any> = {}
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value
        }
      })
    }

    const response = await this.get<{ projects: Project[]; pagination?: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    } }>('/projects', params)

    return {
      projects: response.projects || [],
      pagination: response.pagination
    }
  }

  /**
   * Get a project by ID
   */
  static async getById(id: string): Promise<Project> {
    const { data, error } = await withErrorHandling(
      () => this.get<Project>(`/projects/${id}`),
      { context: 'Getting project by ID', fallbackMessage: 'Failed to load project' }
    )

    if (error || !data) {
      throw new AppError(error?.message || 'Failed to load project', {
        context: 'ProjectService.getById',
        details: { projectId: id }
      })
    }

    return data
  }

  /**
   * Get projects assigned to current user
   */
  static async getMyProjects(): Promise<Project[]> {
    const response = await this.get<Project[]>('/projects/my')
    return Array.isArray(response) ? response : []
  }

  /**
   * Create a new project
   */
  static async create(projectData: CreateProjectRequest): Promise<Project> {
    return await this.post<Project>('/projects', projectData)
  }

  /**
   * Update an existing project
   */
  static async update(id: string, projectData: UpdateProjectRequest): Promise<Project> {
    return await this.put<Project>(`/projects/${id}`, projectData)
  }

  /**
   * Delete a project
   */
  static async delete(id: string): Promise<void> {
    await super.delete<void>(`/projects/${id}`)
  }

  /**
   * Search projects
   */
  static async search(query: string, filters?: ProjectFilters): Promise<{
    projects: Project[]
    pagination?: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }
  }> {
    const params: Record<string, any> = { q: query }
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value
        }
      })
    }

    const response = await this.get<{ projects: Project[]; pagination?: {
      total: number
      limit: number
      offset: number
      hasMore: boolean
    } }>('/projects/search', params)

    return {
      projects: response.projects || [],
      pagination: response.pagination
    }
  }

  /**
   * Get project statistics
   */
  static async getStatistics(): Promise<{
    total: number
    active: number
    completed: number
    on_hold: number
    by_phase: Record<string, number>
    by_ministry: Record<string, number>
    total_budget: number
    total_spent: number
  }> {
    return await this.get<{
      total: number
      active: number
      completed: number
      on_hold: number
      by_phase: Record<string, number>
      by_ministry: Record<string, number>
      total_budget: number
      total_spent: number
    }>('/projects/statistics')
  }

  /**
   * Get project team members
   */
  static async getTeam(projectId: string): Promise<Array<{
    user_id: string
    username: string
    email: string
    role: string
    first_name: string
    last_name: string
  }>> {
    return await this.get<Array<{
      user_id: string
      username: string
      email: string
      role: string
      first_name: string
      last_name: string
    }>>(`/projects/${projectId}/team`)
  }

  /**
   * Add team member to project
   */
  static async addTeamMember(projectId: string, userId: string, role?: string): Promise<void> {
    await this.post(`/projects/${projectId}/team`, {
      user_id: userId,
      role
    })
  }

  /**
   * Remove team member from project
   */
  static async removeTeamMember(projectId: string, userId: string): Promise<void> {
    await super.delete(`/projects/${projectId}/team/${userId}`)
  }

  /**
   * Upload project document
   */
  static async uploadDocument(projectId: string, file: File, documentType?: string): Promise<{
    id: string
    filename: string
    url: string
    type: string
    size: number
  }> {
    const additionalData: Record<string, any> = {}
    if (documentType) {
      additionalData.document_type = documentType
    }

    return await this.upload<{
      id: string
      filename: string
      url: string
      type: string
      size: number
    }>(`/projects/${projectId}/documents`, file, additionalData)
  }

  /**
   * Get project documents
   */
  static async getDocuments(projectId: string): Promise<Array<{
    id: string
    filename: string
    url: string
    type: string
    size: number
    uploaded_at: string
    uploaded_by: string
  }>> {
    return await this.get<Array<{
      id: string
      filename: string
      url: string
      type: string
      size: number
      uploaded_at: string
      uploaded_by: string
    }>>(`/projects/${projectId}/documents`)
  }

  /**
   * Delete project document
   */
  static async deleteDocument(projectId: string, documentId: string): Promise<void> {
    await super.delete(`/projects/${projectId}/documents/${documentId}`)
  }

  /**
   * Export projects to CSV
   */
  static async exportToCsv(filters?: ProjectFilters): Promise<Blob> {
    const params: Record<string, any> = { format: 'csv' }
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value
        }
      })
    }

    const response = await fetch(`${this.API_BASE}/projects/export`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      ...params && { 
        body: new URLSearchParams(params).toString() 
      }
    })

    if (!response.ok) {
      throw await ApiError.fromResponse(response)
    }

    return await response.blob()
  }
}

