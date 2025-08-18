import { ApiError } from './ApiError'

/**
 * Base service class with common API functionality
 * Provides authentication, error handling, and request utilities
 */
export abstract class BaseService {
  protected static readonly API_BASE = '/api'

  /**
   * Get authentication headers
   */
  protected static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Get token from auth store or localStorage
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Get authentication token
   */
  private static getAuthToken(): string | null {
    // Try to get from auth store first
    try {
      const authStore = JSON.parse(localStorage.getItem('auth') || '{}')
      if (authStore.token) {
        return authStore.token
      }
    } catch (error) {
      console.warn('Failed to parse auth store:', error)
    }

    // Fallback to direct localStorage access
    return localStorage.getItem('authToken')
  }

  /**
   * Make HTTP request
   */
  protected static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.API_BASE}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw await ApiError.fromResponse(response)
      }

      const data = await response.json()
      
      // Handle API response format
      if (data.success === false) {
        throw new ApiError(
          data.error?.message || data.message || 'API request failed',
          response.status,
          response.statusText,
          data
        )
      }

      // Return the data directly if it exists, otherwise return the whole response
      return data.data !== undefined ? data.data : data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      // Handle network errors and JSON parsing errors
      if (error instanceof Error) {
        throw new ApiError(
          error.message,
          0,
          'Network Error',
          { originalError: error }
        )
      }

      throw new ApiError(
        'Network error occurred',
        0,
        'Network Error',
        { originalError: error }
      )
    }
  }

  /**
   * GET request
   */
  protected static async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }
    }

    return this.request<T>(url, { method: 'GET' })
  }

  /**
   * POST request
   */
  protected static async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * PUT request
   */
  protected static async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * PATCH request
   */
  protected static async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  /**
   * DELETE request
   */
  protected static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  /**
   * Upload file
   */
  protected static async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const headers = this.getAuthHeaders()
    delete headers['Content-Type'] // Let browser set content type for FormData

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData
    })
  }

  /**
   * Handle common error scenarios
   */
  protected static handleError(error: unknown): never {
    if (error instanceof ApiError) {
      // Handle specific API errors
      if (error.isUnauthorized()) {
        // Redirect to login or refresh token
        console.warn('Unauthorized access - redirecting to login')
        // You might want to emit an event or call a logout function here
      }
      
      throw error
    }

    // Handle unexpected errors
    console.error('Unexpected error:', error)
    
    // Check if it's a network error
    if (error instanceof Error) {
      throw new ApiError(error.message || 'Unknown error')
    }
    
    throw new ApiError('An unexpected error occurred')
  }
}

