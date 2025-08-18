import { BaseService } from './BaseService'
import { ApiError } from './ApiError'

export interface Vendor {
  id: string
  name: string
  description?: string
  capabilities?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  address?: string
  certification_level?: string
  performance_rating?: number
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
}

export interface VendorProject {
  assignment_id: string
  role: string
  contract_value?: number
  start_date?: string
  end_date?: string
  assignment_status: string
  project_id: string
  project_name: string
  project_status: string
  project_phase: string
  program?: string
  geographic_region?: string
  project_type?: string
}

export interface CreateVendorData {
  name: string
  description?: string
  capabilities?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  address?: string
  certification_level?: string
  performance_rating?: number
  status?: 'active' | 'inactive' | 'pending'
}

export interface UpdateVendorData extends Partial<CreateVendorData> {}

export interface VendorFilters {
  search?: string
  capability?: string
  status?: string
  limit?: number
  offset?: number
}

export interface AssignToProjectData {
  project_id: string
  role: string
  contract_value?: number
  start_date?: string
  end_date?: string
}

export interface VendorListResponse {
  data: Vendor[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Service class for vendor management operations
 */
export class VendorService extends BaseService {
  /**
   * Get all vendors with optional filtering and pagination
   */
  static async getAll(filters: VendorFilters = {}): Promise<VendorListResponse> {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.capability) params.append('capability', filters.capability)
      if (filters.status) params.append('status', filters.status)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await this.request<VendorListResponse>(`/vendors?${params.toString()}`)
      return response
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch vendors',
        500,
        'FETCH_VENDORS_ERROR'
      )
    }
  }

  /**
   * Get vendor by ID
   */
  static async getById(id: string): Promise<Vendor> {
    try {
      const response = await this.request<Vendor>(`/vendors/${id}`)
      return response
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch vendor',
        500,
        'FETCH_VENDOR_ERROR'
      )
    }
  }

  /**
   * Create a new vendor
   */
  static async create(data: CreateVendorData): Promise<Vendor> {
    try {
      const response = await this.request<Vendor>('/vendors', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return response
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to create vendor',
        500,
        'CREATE_VENDOR_ERROR'
      )
    }
  }

  /**
   * Update vendor by ID
   */
  static async update(id: string, data: UpdateVendorData): Promise<Vendor> {
    try {
      const response = await this.request<Vendor>(`/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      return response
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to update vendor',
        500,
        'UPDATE_VENDOR_ERROR'
      )
    }
  }

  /**
   * Delete vendor by ID
   */
  static async delete(id: string): Promise<void> {
    try {
      await this.request<void>(`/vendors/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to delete vendor',
        500,
        'DELETE_VENDOR_ERROR'
      )
    }
  }

  /**
   * Get projects assigned to a vendor
   */
  static async getProjects(vendorId: string): Promise<VendorProject[]> {
    try {
      const response = await this.request<VendorProject[]>(`/vendors/${vendorId}/projects`)
      return response
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch vendor projects',
        500,
        'FETCH_VENDOR_PROJECTS_ERROR'
      )
    }
  }

  /**
   * Assign vendor to a project
   */
  static async assignToProject(vendorId: string, data: AssignToProjectData): Promise<{ assignment_id: string; message: string }> {
    try {
      const response = await this.request<{ assignment_id: string; message: string }>(`/vendors/${vendorId}/assign-to-project`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return response
    } catch (error) {
      if (error instanceof Error && error.message.includes('already assigned')) {
        throw new ApiError(
          'Vendor is already assigned to this project with the same role',
          409,
          'DUPLICATE_ASSIGNMENT'
        )
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to assign vendor to project',
        500,
        'ASSIGN_VENDOR_ERROR'
      )
    }
  }

  /**
   * Remove vendor from a project
   */
  static async removeFromProject(vendorId: string, projectId: string): Promise<void> {
    try {
      await this.request<void>(`/projects/${projectId}/vendors/${vendorId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to remove vendor from project',
        500,
        'REMOVE_VENDOR_ERROR'
      )
    }
  }

  /**
   * Update vendor assignment in a project
   */
  static async updateAssignment(
    vendorId: string, 
    projectId: string, 
    data: Partial<AssignToProjectData>
  ): Promise<VendorProject> {
    try {
      const response = await this.request<VendorProject>(`/projects/${projectId}/vendors/${vendorId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      return response
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to update vendor assignment',
        500,
        'UPDATE_ASSIGNMENT_ERROR'
      )
    }
  }

  /**
   * Search vendors by name or capabilities
   */
  static async search(query: string, limit: number = 20): Promise<Vendor[]> {
    try {
      const response = await this.getAll({ search: query, limit })
      return response.data
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to search vendors',
        500,
        'SEARCH_VENDORS_ERROR'
      )
    }
  }

  /**
   * Get vendors by capability
   */
  static async getByCapability(capability: string): Promise<Vendor[]> {
    try {
      const response = await this.getAll({ capability })
      return response.data
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch vendors by capability',
        500,
        'FETCH_BY_CAPABILITY_ERROR'
      )
    }
  }

  /**
   * Get active vendors only
   */
  static async getActive(): Promise<Vendor[]> {
    try {
      const response = await this.getAll({ status: 'active' })
      return response.data
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Failed to fetch active vendors',
        500,
        'FETCH_ACTIVE_VENDORS_ERROR'
      )
    }
  }

  /**
   * Validate vendor data before submission
   */
  static validateVendorData(data: CreateVendorData | UpdateVendorData): string[] {
    const errors: string[] = []

    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      errors.push('Vendor name is required')
    }

    if ('contact_email' in data && data.contact_email && !this.isValidEmail(data.contact_email)) {
      errors.push('Invalid email format')
    }

    if ('website' in data && data.website && !this.isValidUrl(data.website)) {
      errors.push('Invalid website URL format')
    }

    if ('performance_rating' in data && data.performance_rating !== undefined) {
      if (data.performance_rating < 0 || data.performance_rating > 5) {
        errors.push('Performance rating must be between 0 and 5')
      }
    }

    return errors
  }

  /**
   * Helper method to validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Helper method to validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}

export default VendorService

