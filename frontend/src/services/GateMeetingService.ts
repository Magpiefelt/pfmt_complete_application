import { BaseService } from './BaseService'
import type { GateMeeting, GateMeetingFilters } from '@/composables/useGateMeetings'

export interface CreateGateMeetingRequest {
  project_id: string
  gate_type: string
  planned_date: string
  agenda?: string
  attendees?: Array<{
    name: string
    email: string
  }>
}

export interface UpdateGateMeetingRequest {
  gate_type?: string
  planned_date?: string
  actual_date?: string
  status?: 'scheduled' | 'completed' | 'cancelled'
  agenda?: string
  attendees?: Array<{
    name: string
    email: string
  }>
  decision?: string
  notes?: string
}

export interface GateMeetingResponse {
  success: boolean
  data: GateMeeting | GateMeeting[]
  message?: string
}

/**
 * Service for gate meeting API operations
 * Handles all gate meeting-related HTTP requests
 */
export class GateMeetingService extends BaseService {

  /**
   * Get all gate meetings with optional filtering
   */
  static async getAll(filters?: GateMeetingFilters): Promise<GateMeeting[]> {
    try {
      const params: Record<string, any> = {}
      
      if (filters?.projectId) params.project_id = filters.projectId
      if (filters?.status) params.status = filters.status
      if (filters?.userRole) params.user_role = filters.userRole
      if (filters?.userId) params.user_id = filters.userId

      const response = await this.get<GateMeetingResponse>('/gate-meetings', params)
      return Array.isArray(response.data) ? response.data : [response.data]
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Get upcoming gate meetings
   */
  static async getUpcoming(filters?: GateMeetingFilters): Promise<GateMeeting[]> {
    try {
      const params: Record<string, any> = {}
      
      if (filters?.userRole) params.user_role = filters.userRole
      if (filters?.userId) params.user_id = filters.userId
      if (filters?.projectId) params.project_id = filters.projectId

      const response = await this.get<GateMeetingResponse>('/gate-meetings/upcoming', params)
      return Array.isArray(response.data) ? response.data : [response.data]
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Get gate meeting by ID
   */
  static async getById(id: string): Promise<GateMeeting> {
    try {
      const response = await this.get<GateMeetingResponse>(`/gate-meetings/${id}`)
      return response.data as GateMeeting
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Get gate meetings for a specific project
   */
  static async getByProject(projectId: string): Promise<GateMeeting[]> {
    try {
      const response = await this.get<GateMeetingResponse>(`/projects/${projectId}/gate-meetings`)
      return Array.isArray(response.data) ? response.data : [response.data]
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Create a new gate meeting
   */
  static async create(meetingData: CreateGateMeetingRequest): Promise<GateMeeting> {
    try {
      const response = await this.post<GateMeetingResponse>('/gate-meetings', meetingData)
      return response.data as GateMeeting
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Update an existing gate meeting
   */
  static async update(id: string, meetingData: UpdateGateMeetingRequest): Promise<GateMeeting> {
    try {
      const response = await this.patch<GateMeetingResponse>(`/gate-meetings/${id}`, meetingData)
      return response.data as GateMeeting
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Delete a gate meeting
   */
  static async delete(id: string): Promise<void> {
    try {
      await this.delete<{ success: boolean }>(`/gate-meetings/${id}`)
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Complete a gate meeting
   */
  static async complete(id: string, completionData: {
    actual_date?: string
    decision?: string
    notes?: string
  }): Promise<GateMeeting> {
    try {
      const updateData: UpdateGateMeetingRequest = {
        status: 'completed',
        actual_date: completionData.actual_date || new Date().toISOString(),
        decision: completionData.decision,
        notes: completionData.notes
      }

      const response = await this.patch<GateMeetingResponse>(`/gate-meetings/${id}`, updateData)
      return response.data as GateMeeting
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Cancel a gate meeting
   */
  static async cancel(id: string, reason?: string): Promise<GateMeeting> {
    try {
      const updateData: UpdateGateMeetingRequest = {
        status: 'cancelled',
        notes: reason
      }

      const response = await this.patch<GateMeetingResponse>(`/gate-meetings/${id}`, updateData)
      return response.data as GateMeeting
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Reschedule a gate meeting
   */
  static async reschedule(id: string, newDate: string): Promise<GateMeeting> {
    try {
      const updateData: UpdateGateMeetingRequest = {
        planned_date: newDate,
        status: 'scheduled'
      }

      const response = await this.patch<GateMeetingResponse>(`/gate-meetings/${id}`, updateData)
      return response.data as GateMeeting
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Get meeting statistics
   */
  static async getStatistics(projectId?: string): Promise<{
    total: number
    completed: number
    upcoming: number
    overdue: number
  }> {
    try {
      const params = projectId ? { project_id: projectId } : {}
      const response = await this.get<{
        data: {
          total: number
          completed: number
          upcoming: number
          overdue: number
        }
      }>('/gate-meetings/statistics', params)
      
      return response.data
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Export gate meetings to CSV
   */
  static async exportToCsv(filters?: GateMeetingFilters): Promise<Blob> {
    try {
      const params: Record<string, any> = { format: 'csv' }
      
      if (filters?.projectId) params.project_id = filters.projectId
      if (filters?.status) params.status = filters.status
      if (filters?.userRole) params.user_role = filters.userRole
      if (filters?.userId) params.user_id = filters.userId

      const response = await fetch(`${this.API_BASE}/gate-meetings/export`, {
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

