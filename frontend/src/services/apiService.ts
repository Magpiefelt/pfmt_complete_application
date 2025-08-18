// Enhanced API service with comprehensive error handling and PostgreSQL backend support
// Always use relative URLs in the browser to work with Vite proxy
const API_BASE_URL = '/api'

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  userContext?: {
    id: number
    role: string
    name: string
  }
}

class ApiService {
  private static retryAttempts = 3
  private static retryDelay = 1000

  // Helper method for making HTTP requests with user context and retry logic
  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    
    // Get current user from Pinia store
    const getCurrentUser = () => {
      try {
        // Try to get from Pinia store if available
        if (typeof window !== 'undefined') {
          // Try localStorage/sessionStorage fallback
          const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
          if (userStr) {
            try {
              return JSON.parse(userStr)
            } catch (e) {
              console.warn('Failed to parse stored user data')
            }
          }
        }
        
        // Return default user context for development
        return {
          id: 1,
          name: "Sarah Johnson",
          role: "Project Manager"
        }
      } catch (error) {
        console.warn('Could not get current user from store, using default:', error)
        return {
          id: 1,
          name: "Sarah Johnson",
          role: "Project Manager"
        }
      }
    }
    
    // Convert integer user ID to UUID format for backend compatibility
    const convertUserIdToUuid = (userId: number): string => {
      const uuidMap: Record<number, string> = {
        1: '550e8400-e29b-41d4-a716-446655440001',
        2: '550e8400-e29b-41d4-a716-446655440002',
        3: '550e8400-e29b-41d4-a716-446655440003',
        4: '550e8400-e29b-41d4-a716-446655440004',
        5: '550e8400-e29b-41d4-a716-446655440005'
      }
      
      return uuidMap[userId] || '550e8400-e29b-41d4-a716-446655440002'
    }
    
    const currentUser = getCurrentUser()
    const headers: HeadersInit = {
      // Add user context to headers with UUID format
      ...(currentUser && {
        'X-User-Id': convertUserIdToUuid(currentUser.id),
        'X-User-Role': currentUser.role,
        'X-User-Name': currentUser.name
      })
    }

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    const config: RequestInit = {
      headers: {
        ...headers,
        ...options.headers
      },
      credentials: 'include',
      ...options
    }

    // Retry logic for failed requests
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config)
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch (parseError) {
            // If we can't parse the error response, use the status text
          }
          
          // Don't retry on client errors (4xx), only on server errors (5xx) or network issues
          if (response.status >= 400 && response.status < 500) {
            throw new Error(errorMessage)
          }
          
          // Retry on server errors if we have attempts left
          if (attempt < this.retryAttempts) {
            console.warn(`Request failed (attempt ${attempt}/${this.retryAttempts}), retrying in ${this.retryDelay}ms...`)
            await new Promise(resolve => setTimeout(resolve, this.retryDelay))
            continue
          }
          
          throw new Error(errorMessage)
        }

        const data = await response.json()
        return data
      } catch (error: any) {
        // Network errors or other exceptions
        if (attempt < this.retryAttempts && (error.name === 'TypeError' || error.message.includes('fetch'))) {
          console.warn(`Network error (attempt ${attempt}/${this.retryAttempts}), retrying in ${this.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
          continue
        }
        
        throw error
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error('Maximum retry attempts exceeded')
  }
  // MINIMAL FIX: Specific fallback only for project creation
  static getProjectCreationFallback<T>(): ApiResponse<T> {
    const timestamp = new Date().toISOString()
    const projectId = 'demo-' + Date.now()
    
    return {
      success: true,
      data: {
        id: projectId,
        project_name: 'New Demo Project',
        project_description: 'Created in demo mode',
        project_status: 'planning',
        report_status: 'new',
        project_phase: 'planning',
        project_type: 'New Construction',
        delivery_type: 'Traditional',
        program: 'Infrastructure',
        geographic_region: 'Central',
        approval_year: new Date().getFullYear(),
        cpd_number: `CPD-${new Date().getFullYear()}-DEMO`,
        created_at: timestamp,
        updated_at: timestamp,
        // Add computed fields for frontend compatibility
        name: 'New Demo Project',
        status: 'planning',
        reportStatus: 'new',
        phase: 'planning',
        region: 'Central',
        projectManager: 'Sarah Johnson',
        startDate: timestamp,
        totalBudget: 5000000,
        amountSpent: 0,
        scheduleStatus: 'On Track',
        budgetStatus: 'On Track'
      } as T,
      message: 'Project created successfully (demo mode)',
      userContext: {
        id: 1,
        role: 'Project Manager',
        name: 'Sarah Johnson'
      }
    }
  }

  // Provide fallback data when backend is not available
  static getFallbackData<T>(endpoint: string, method: string): ApiResponse<T> {
    
    // Fallback for projects
    if (endpoint.includes('/projects') && method === 'GET') {
      return {
        success: true,
        data: [
          {
            id: 'demo-1',
            project_name: 'Red Deer Justice Centre',
            project_description: 'Construction of new justice facility',
            project_status: 'underway',
            report_status: 'current',
            project_phase: 'construction',
            project_type: 'New Construction',
            delivery_type: 'Design-Build',
            program: 'Justice',
            geographic_region: 'Central',
            approval_year: 2024,
            cpd_number: 'CPD-2024-001',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            // Add computed fields for frontend compatibility
            name: 'Red Deer Justice Centre',
            status: 'underway',
            reportStatus: 'current',
            phase: 'construction',
            region: 'Central',
            projectManager: 'Sarah Johnson',
            contractor: 'Red Deer Construction Ltd.',
            startDate: '2024-01-15T00:00:00Z',
            totalBudget: 15000000,
            amountSpent: 8500000,
            scheduleStatus: 'On Track',
            budgetStatus: 'On Track'
          },
          {
            id: 'demo-2', 
            project_name: 'Calgary Courthouse Renovation',
            project_description: 'Major renovation and modernization',
            project_status: 'underway',
            report_status: 'update_required',
            project_phase: 'design',
            project_type: 'Renovation',
            delivery_type: 'Traditional',
            program: 'Justice',
            geographic_region: 'South',
            approval_year: 2024,
            cpd_number: 'CPD-2024-002',
            created_at: '2024-02-01T00:00:00Z',
            updated_at: '2024-02-01T00:00:00Z',
            // Add computed fields for frontend compatibility
            name: 'Calgary Courthouse Renovation',
            status: 'underway',
            reportStatus: 'update_required',
            phase: 'design',
            region: 'South',
            projectManager: 'Michael Chen',
            contractor: 'XYZ Renovations Inc.',
            startDate: '2024-02-01T00:00:00Z',
            totalBudget: 8500000,
            amountSpent: 2100000,
            scheduleStatus: 'At Risk',
            budgetStatus: 'On Track'
          }
        ] as T,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        userContext: {
          id: 1,
          role: 'Project Manager',
          name: 'Sarah Johnson'
        }
      }
    }
    
    // Fallback for project creation
    if (endpoint.includes('/projects') && method === 'POST') {
      return this.getProjectCreationFallback()
    }
    
    // Fallback for users
    if (endpoint.includes('/users') && method === 'GET') {
      return {
        success: true,
        data: [
          { id: 1, first_name: 'Sarah', last_name: 'Johnson', role: 'project_manager', email: 'sarah.johnson@gov.ab.ca' },
          { id: 2, first_name: 'Michael', last_name: 'Chen', role: 'sr_project_manager', email: 'michael.chen@gov.ab.ca' },
          { id: 3, first_name: 'Lisa', last_name: 'Rodriguez', role: 'director', email: 'lisa.rodriguez@gov.ab.ca' },
          { id: 4, first_name: 'David', last_name: 'Kim', role: 'director', email: 'david.kim@gov.ab.ca' },
          { id: 5, first_name: 'Vendor', last_name: 'User', role: 'vendor', email: 'vendor@example.com' }
        ] as T
      }
    }

    // Fallback for companies
    if (endpoint.includes('/companies') && method === 'GET') {
      return {
        success: true,
        data: [
          { id: 1, name: 'Red Deer Construction Ltd.', industry: 'Construction', status: 'active' },
          { id: 2, name: 'XYZ Engineering Inc.', industry: 'Engineering', status: 'active' },
          { id: 3, name: 'DEF Consulting Group', industry: 'Consulting', status: 'active' }
        ] as T
      }
    }

    // Fallback for vendors
    if (endpoint.includes('/vendors') && method === 'GET') {
      return {
        success: true,
        data: [
          { id: 1, name: 'BuildCorp Solutions', capabilities: 'Construction, Project Management', status: 'active' },
          { id: 2, name: 'TechServ Inc.', capabilities: 'IT Services, Software Development', status: 'active' },
          { id: 3, name: 'ConsultPro Ltd.', capabilities: 'Business Consulting, Process Improvement', status: 'active' }
        ] as T
      }
    }
    
    // Default fallback
    return {
      success: false,
      error: 'Backend service not available',
      message: 'Please ensure the backend server is running and reachable',
      data: null as T
    }
  }

  // Helper method for file uploads with user context
  static async uploadFile<T>(endpoint: string, file: File, additionalData: Record<string, any> = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    const formData = new FormData()
    formData.append('file', file)
    
    // Get current user from store
    const getCurrentUser = () => {
      try {
        if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
          if (userStr) {
            try {
              return JSON.parse(userStr)
            } catch (e) {
              console.warn('Failed to parse stored user data for upload')
            }
          }
        }
        
        return {
          id: 1,
          name: "Sarah Johnson", 
          role: "Project Manager"
        }
      } catch (error) {
        console.warn('Could not get current user from store for upload:', error)
        return {
          id: 1,
          name: "Sarah Johnson", 
          role: "Project Manager"
        }
      }
    }
    
    const currentUser = getCurrentUser()
    
    // Add any additional form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key])
    })

    const headers: Record<string, string> = {}
    // Add user context to headers
    if (currentUser) {
      headers['X-User-Id'] = currentUser.id.toString()
      headers['X-User-Role'] = currentUser.role
      headers['X-User-Name'] = currentUser.name
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      })
      
      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // If response is not JSON, use the status text
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      console.error('File upload failed:', error)
      
      // Provide fallback for file uploads in demo mode
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        console.warn('🔄 Backend not available, simulating successful upload')
        return {
          success: true,
          message: 'File upload simulated (demo mode)',
          data: {
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString()
          } as T
        }
      }
      
      throw error
    }
  }

  // Convenience HTTP methods for backward compatibility
  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  static async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  static async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Project API methods
export class ProjectAPI {
  // Get all projects with pagination and filtering
  static async getProjects(options: any = {}): Promise<ApiResponse<any[]>> {
    const {
      page = 1,
      limit = 10,
      status,
      phase,
      search,
      program,
      region,
      ownerId,
      userId,
      userRole,
      reportStatus,
      approvedOnly,
      includePendingDrafts,
      includeVersions
    } = options

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })

    // Add all filter parameters to the query string
    if (status) params.append('status', status)
    if (phase) params.append('phase', phase)
    if (search) params.append('search', search)
    if (program) params.append('program', program)
    if (region) params.append('region', region)
    if (ownerId) params.append('ownerId', ownerId)
    if (userId) params.append('userId', userId)
    if (userRole) params.append('userRole', userRole)
    if (reportStatus) params.append('reportStatus', reportStatus)
    if (approvedOnly !== undefined) params.append('approvedOnly', approvedOnly.toString())
    if (includePendingDrafts !== undefined) params.append('includePendingDrafts', includePendingDrafts.toString())
    if (includeVersions !== undefined) params.append('includeVersions', includeVersions.toString())

    // Handle array parameters (e.g., multiple status values)
    Object.entries(options).forEach(([key, value]) => {
      if (Array.isArray(value) && !params.has(key)) {
        value.forEach(item => params.append(key, item.toString()))
      }
    })

    
    try {
      const result = await ApiService.request<any[]>(`/projects?${params}`)
      console.log('✅ ProjectAPI.getProjects successful:', { 
        projectCount: result.data?.length, 
        userContext: result.userContext,
        filters: { status, phase, search, program, region, ownerId, userId, userRole, reportStatus, approvedOnly, includePendingDrafts, includeVersions }
      })
      return result
    } catch (error: any) {
      console.error('❌ ProjectAPI.getProjects failed:', error.message)
      throw error
    }
  }

  // Get single project by ID
  static async getProject(id: number | string): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/projects/${id}`)
    } catch (error: any) {
      console.error(`❌ ProjectAPI.getProject(${id}) failed:`, error.message)
      throw error
    }
  }

  // Create new project with user context
  static async createProject(projectData: any): Promise<ApiResponse<any>> {
    
    try {
      const result = await ApiService.request<any>('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData)
      })
      return result
    } catch (error: any) {
      console.error('❌ ProjectAPI.createProject failed:', error.message)
      throw error
    }
  }

  // Update project
  static async updateProject(id: number | string, updates: any): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    } catch (error: any) {
      console.error(`❌ ProjectAPI.updateProject(${id}) failed:`, error.message)
      throw error
    }
  }

  // Delete project
  static async deleteProject(id: number | string): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/projects/${id}`, {
        method: 'DELETE'
      })
    } catch (error: any) {
      console.error(`❌ ProjectAPI.deleteProject(${id}) failed:`, error.message)
      throw error
    }
  }

  // Upload Excel file to project
  static async uploadExcel(projectId: number | string, file: File): Promise<ApiResponse<any>> {
    try {
      return await ApiService.uploadFile<any>(`/projects/${projectId}/excel`, file)
    } catch (error: any) {
      console.error(`❌ ProjectAPI.uploadExcel(${projectId}) failed:`, error.message)
      throw error
    }
  }

  // Upload PFMT Excel file to project
  static async uploadPFMTExcel(projectId: number | string, file: File): Promise<ApiResponse<any>> {
    try {
      return await ApiService.uploadFile<any>(`/projects/${projectId}/pfmt-excel`, file)
    } catch (error: any) {
      console.error(`❌ ProjectAPI.uploadPFMTExcel(${projectId}) failed:`, error.message)
      throw error
    }
  }
}

// User API methods
export class UserAPI {
  // Get all users
  static async getUsers(): Promise<ApiResponse<any[]>> {
    try {
      return await ApiService.request<any[]>('/users')
    } catch (error: any) {
      console.error('❌ UserAPI.getUsers failed:', error.message)
      throw error
    }
  }

  // Get single user by ID
  static async getUser(id: number | string): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/users/${id}`)
    } catch (error: any) {
      console.error(`❌ UserAPI.getUser(${id}) failed:`, error.message)
      throw error
    }
  }

  // Create new user
  static async createUser(userData: any): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      })
    } catch (error: any) {
      console.error('❌ UserAPI.createUser failed:', error.message)
      throw error
    }
  }

  // Update user
  static async updateUser(id: number | string, updates: any): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    } catch (error: any) {
      console.error(`❌ UserAPI.updateUser(${id}) failed:`, error.message)
      throw error
    }
  }

  // Delete user
  static async deleteUser(id: number | string): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/users/${id}`, {
        method: 'DELETE'
      })
    } catch (error: any) {
      console.error(`❌ UserAPI.deleteUser(${id}) failed:`, error.message)
      throw error
    }
  }
}

// Company API methods
export class CompanyAPI {
  // Get all companies
  static async getCompanies(searchTerm = ''): Promise<ApiResponse<any[]>> {
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''
      return await ApiService.request<any[]>(`/companies${params}`)
    } catch (error: any) {
      console.error('❌ CompanyAPI.getCompanies failed:', error.message)
      throw error
    }
  }

  // Get single company by ID
  static async getCompany(id: number | string): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/companies/${id}`)
    } catch (error: any) {
      console.error(`❌ CompanyAPI.getCompany(${id}) failed:`, error.message)
      throw error
    }
  }

  // Create new company
  static async createCompany(companyData: any): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>('/companies', {
        method: 'POST',
        body: JSON.stringify(companyData)
      })
    } catch (error: any) {
      console.error('❌ CompanyAPI.createCompany failed:', error.message)
      throw error
    }
  }

  // Update company
  static async updateCompany(id: number | string, updates: any): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    } catch (error: any) {
      console.error(`❌ CompanyAPI.updateCompany(${id}) failed:`, error.message)
      throw error
    }
  }

  // Delete company
  static async deleteCompany(id: number | string): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/companies/${id}`, {
        method: 'DELETE'
      })
    } catch (error: any) {
      console.error(`❌ CompanyAPI.deleteCompany(${id}) failed:`, error.message)
      throw error
    }
  }
}

// Vendor API methods
export class VendorAPI {
  // Get all vendors
  static async getVendors(options: any = {}): Promise<ApiResponse<any[]>> {
    try {
      const { search, status, capability } = options
      const params = new URLSearchParams()
      
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (capability) params.append('capability', capability)

      const queryString = params.toString()
      return await ApiService.request<any[]>(`/vendors${queryString ? '?' + queryString : ''}`)
    } catch (error: any) {
      console.error('❌ VendorAPI.getVendors failed:', error.message)
      throw error
    }
  }

  // Get single vendor by ID
  static async getVendor(id: number | string): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/vendors/${id}`)
    } catch (error: any) {
      console.error(`❌ VendorAPI.getVendor(${id}) failed:`, error.message)
      throw error
    }
  }

  // Create new vendor
  static async createVendor(vendorData: any): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>('/vendors', {
        method: 'POST',
        body: JSON.stringify(vendorData)
      })
    } catch (error: any) {
      console.error('❌ VendorAPI.createVendor failed:', error.message)
      throw error
    }
  }

  // Update vendor
  static async updateVendor(id: number | string, updates: any): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    } catch (error: any) {
      console.error(`❌ VendorAPI.updateVendor(${id}) failed:`, error.message)
      throw error
    }
  }

  // Delete vendor
  static async deleteVendor(id: number | string): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/vendors/${id}`, {
        method: 'DELETE'
      })
    } catch (error: any) {
      console.error(`❌ VendorAPI.deleteVendor(${id}) failed:`, error.message)
      throw error
    }
  }

  // Get vendors for a specific project
  static async getProjectVendors(projectId: number | string): Promise<ApiResponse<any[]>> {
    try {
      return await ApiService.request<any[]>(`/projects/${projectId}/vendors`)
    } catch (error: any) {
      console.error(`❌ VendorAPI.getProjectVendors(${projectId}) failed:`, error.message)
      throw error
    }
  }

  // Add vendor to project
  static async addVendorToProject(projectId: number | string, vendorData: any): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>(`/projects/${projectId}/vendors`, {
        method: 'POST',
        body: JSON.stringify(vendorData)
      })
    } catch (error: any) {
      console.error(`❌ VendorAPI.addVendorToProject(${projectId}) failed:`, error.message)
      throw error
    }
  }
}

// Migration API methods
export class MigrationAPI {
  // Get migration status
  static async getStatus(): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>('/migration/status')
    } catch (error: any) {
      console.error('❌ MigrationAPI.getStatus failed:', error.message)
      throw error
    }
  }

  // Start migration
  static async startMigration(dataPath: string, userId: string): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>('/migration/start', {
        method: 'POST',
        body: JSON.stringify({ dataPath, userId })
      })
    } catch (error: any) {
      console.error('❌ MigrationAPI.startMigration failed:', error.message)
      throw error
    }
  }

  // Reset migration status
  static async resetStatus(): Promise<ApiResponse<any>> {
    try {
      return await ApiService.request<any>('/migration/reset', {
        method: 'POST'
      })
    } catch (error: any) {
      console.error('❌ MigrationAPI.resetStatus failed:', error.message)
      throw error
    }
  }
}

export default ApiService


// Export the main ApiService class as both default and named export
export { ApiService as apiService };

