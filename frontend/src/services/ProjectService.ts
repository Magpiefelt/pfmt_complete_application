import { BaseService } from './BaseService'

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

export interface ProjectResponse {
  success: boolean
  data: Project | Project[]
  message?: string
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * Service for project API operations
 * Handles all project-related HTTP requests
 */
export class ProjectService extends BaseService {

  /**
   * Get all projects with optional filtering and pagination
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
    try {
      const params: Record<string, any> = {}
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params[key] = value
          }
        })
      }

      const response = await this.get<ProjectResponse>('/projects', params)
      
      return {
        projects: Array.isArray(response.data) ? response.data : [response.data],
        pagination: response.pagination
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Get project by ID
   */
  static async getById(id: string): Promise<Project> {
    try {
      const response = await this.get<ProjectResponse>(`/projects/${id}`)
      return response.data as Project
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Get projects assigned to current user
   */
  static async getMyProjects(): Promise<Project[]> {
    try {
      const response = await this.get<ProjectResponse>('/projects/my')
      return Array.isArray(response.data) ? response.data : [response.data]
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Create a new project
   */
  static async create(projectData: CreateProjectRequest): Promise<Project> {
    try {
      const response = await this.post<ProjectResponse>('/projects', projectData)
      return response.data as Project
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Update an existing project
   */
  static async update(id: string, projectData: UpdateProjectRequest): Promise<Project> {
    try {
      const response = await this.patch<ProjectResponse>(`/projects/${id}`, projectData)
      return response.data as Project
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Delete a project
   */
  static async delete(id: string): Promise<void> {
    try {
      await this.delete<{ success: boolean }>(`/projects/${id}`)
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Search projects
   */
  static async search(query: string, filters?: Omit<ProjectFilters, 'search'>): Promise<Project[]> {
    try {
      const params: Record<string, any> = { search: query }
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params[key] = value
          }
        })
      }

      const response = await this.get<ProjectResponse>('/projects/search', params)
      return Array.isArray(response.data) ? response.data : [response.data]
    } catch (error) {
      this.handleError(error)
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
    try {
      const response = await this.get<{
        data: {
          total: number
          active: number
          completed: number
          on_hold: number
          by_phase: Record<string, number>
          by_ministry: Record<string, number>
          total_budget: number
          total_spent: number
        }
      }>('/projects/statistics')
      
      return response.data
    } catch (error) {
      this.handleError(error)
    }
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
    try {
      const response = await this.get<{
        data: Array<{
          user_id: string
          username: string
          email: string
          role: string
          first_name: string
          last_name: string
        }>
      }>(`/projects/${projectId}/team`)
      
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Add team member to project
   */
  static async addTeamMember(projectId: string, userId: string, role?: string): Promise<void> {
    try {
      await this.post<{ success: boolean }>(`/projects/${projectId}/team`, {
        user_id: userId,
        role
      })
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Remove team member from project
   */
  static async removeTeamMember(projectId: string, userId: string): Promise<void> {
    try {
      await this.delete<{ success: boolean }>(`/projects/${projectId}/team/${userId}`)
    } catch (error) {
      this.handleError(error)
    }
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
    try {
      const additionalData: Record<string, any> = {}
      if (documentType) {
        additionalData.document_type = documentType
      }

      const response = await this.upload<{
        data: {
          id: string
          filename: string
          url: string
          type: string
          size: number
        }
      }>(`/projects/${projectId}/documents`, file, additionalData)
      
      return response.data
    } catch (error) {
      this.handleError(error)
    }
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
    try {
      const response = await this.get<{
        data: Array<{
          id: string
          filename: string
          url: string
          type: string
          size: number
          uploaded_at: string
          uploaded_by: string
        }>
      }>(`/projects/${projectId}/documents`)
      
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Delete project document
   */
  static async deleteDocument(projectId: string, documentId: string): Promise<void> {
    try {
      await this.delete<{ success: boolean }>(`/projects/${projectId}/documents/${documentId}`)
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Export projects to CSV
   */
  static async exportToCsv(filters?: ProjectFilters): Promise<Blob> {
    try {
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
    } catch (error) {
      this.handleError(error)
    }
  }
}

