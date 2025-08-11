import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { ref, reactive } from 'vue'

// Types
interface WizardSession {
  sessionId: string
  currentStep: number
  totalSteps: number
  templateId?: string
  stepMapping: Record<number, string>
  data?: any
}

interface StepData {
  [key: string]: any
}

interface ValidationError {
  field: string
  message: string
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: ValidationError[]
  correlationId?: string
}

interface Vendor {
  id: string
  name: string
  description: string
  category: string
  status: string
  project_count: number
  avg_rating: number
}

interface Template {
  id: string
  name: string
  description: string
  category: string
  template_data: any
  created_at: string
}

interface Project {
  id: string
  code: string
  name: string
  [key: string]: any
}

// Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
}

// Create axios instance with enhanced configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create(API_CONFIG)

  // Request interceptor for correlation IDs and auth
  client.interceptors.request.use(
    (config) => {
      // Add correlation ID for request tracking
      config.headers['X-Correlation-ID'] = generateCorrelationId()
      
      // Add timestamp for request timing
      config.metadata = { startTime: Date.now() }
      
      // Add auth token if available
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      return config
    },
    (error) => {
      console.error('Request interceptor error:', error)
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling and logging
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful requests
      const duration = Date.now() - response.config.metadata?.startTime
      console.log(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`)
      
      return response
    },
    (error: AxiosError) => {
      // Enhanced error handling
      const duration = error.config?.metadata?.startTime ? Date.now() - error.config.metadata.startTime : 0
      
      console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        correlationId: error.response?.headers['x-correlation-id']
      })
      
      // Transform error for consistent handling
      const transformedError = transformApiError(error)
      return Promise.reject(transformedError)
    }
  )

  return client
}

// Error transformation
const transformApiError = (error: AxiosError): Error => {
  const response = error.response
  const data = response?.data as any
  
  if (data?.message) {
    const enhancedError = new Error(data.message)
    enhancedError.name = 'ApiError'
    ;(enhancedError as any).status = response?.status
    ;(enhancedError as any).correlationId = data.correlationId
    ;(enhancedError as any).details = data.details
    return enhancedError
  }
  
  // Fallback error messages
  switch (response?.status) {
    case 400:
      return new Error('Invalid request. Please check your input and try again.')
    case 401:
      return new Error('Authentication required. Please log in and try again.')
    case 403:
      return new Error('Access denied. You do not have permission to perform this action.')
    case 404:
      return new Error('Resource not found. The requested item may have been deleted.')
    case 409:
      return new Error('Conflict. The resource already exists or is in use.')
    case 413:
      return new Error('Request too large. Please reduce the size of your data.')
    case 429:
      return new Error('Too many requests. Please wait a moment and try again.')
    case 500:
      return new Error('Server error. Please try again later.')
    default:
      return new Error(error.message || 'An unexpected error occurred.')
  }
}

// Utility functions
const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Cache implementation
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  delete(key: string): void {
    this.cache.delete(key)
  }
}

// Retry mechanism
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if ((error as any).status >= 400 && (error as any).status < 500) {
        throw error
      }
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff
      const delayMs = baseDelay * Math.pow(2, attempt - 1)
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms delay`)
      await delay(delayMs)
    }
  }
  
  throw lastError!
}

// Enhanced Project Wizard Service
class ProjectWizardService {
  private apiClient: AxiosInstance
  private cache: ApiCache
  private baseUrl: string

  // Reactive state for service status
  public isOnline = ref(true)
  public lastError = ref<string | null>(null)
  public requestCount = ref(0)
  public cacheHitRate = ref(0)

  constructor() {
    this.apiClient = createApiClient()
    this.cache = new ApiCache()
    this.baseUrl = '/project-wizard'
    
    // Monitor network status
    this.setupNetworkMonitoring()
  }

  private setupNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.value = true
        console.log('Network connection restored')
      })
      
      window.addEventListener('offline', () => {
        this.isOnline.value = false
        console.log('Network connection lost')
      })
    }
  }

  private getCacheKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${endpoint}:${paramString}`
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    useCache: boolean = false,
    cacheTtl: number = 300000
  ): Promise<T> {
    this.requestCount.value++
    
    // Check cache for GET requests
    if (method === 'GET' && useCache) {
      const cacheKey = this.getCacheKey(endpoint, data)
      const cachedData = this.cache.get(cacheKey)
      if (cachedData) {
        console.log(`Cache hit for ${endpoint}`)
        this.updateCacheHitRate(true)
        return cachedData
      }
      this.updateCacheHitRate(false)
    }

    const operation = async () => {
      const config: any = {
        method,
        url: `${this.baseUrl}${endpoint}`
      }

      if (method === 'GET' && data) {
        config.params = data
      } else if (data) {
        config.data = data
      }

      const response = await this.apiClient.request<ApiResponse<T>>(config)
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'API request failed')
      }

      const result = response.data.data || response.data
      
      // Cache successful GET requests
      if (method === 'GET' && useCache) {
        const cacheKey = this.getCacheKey(endpoint, data)
        this.cache.set(cacheKey, result, cacheTtl)
      }

      this.lastError.value = null
      return result
    }

    try {
      return await withRetry(operation)
    } catch (error) {
      this.lastError.value = (error as Error).message
      throw error
    }
  }

  private updateCacheHitRate(hit: boolean): void {
    // Simple cache hit rate calculation (last 100 requests)
    const currentRate = this.cacheHitRate.value
    const newRate = hit ? currentRate + 0.01 : Math.max(0, currentRate - 0.01)
    this.cacheHitRate.value = Math.min(1, Math.max(0, newRate))
  }

  // Wizard session management
  async initializeWizard(templateId?: string): Promise<WizardSession> {
    console.log('Initializing wizard session', { templateId })
    
    return this.makeRequest<WizardSession>('POST', '/init', { templateId })
  }

  async getWizardSession(sessionId: string): Promise<any> {
    console.log('Retrieving wizard session', { sessionId })
    
    return this.makeRequest<any>('GET', `/session/${sessionId}`)
  }

  async deleteWizardSession(sessionId: string): Promise<void> {
    console.log('Deleting wizard session', { sessionId })
    
    await this.makeRequest<void>('DELETE', `/session/${sessionId}`)
    
    // Clear related cache entries
    this.cache.delete(`/session/${sessionId}`)
  }

  // Step data management
  async saveStepData(sessionId: string, stepId: number, stepData: StepData): Promise<void> {
    console.log('Saving step data', { sessionId, stepId, dataKeys: Object.keys(stepData) })
    
    await this.makeRequest<void>('POST', `/session/${sessionId}/step/${stepId}`, stepData)
    
    // Clear session cache to ensure fresh data
    this.cache.delete(`/session/${sessionId}`)
  }

  async validateStep(stepId: number, stepData: StepData): Promise<boolean> {
    console.log('Validating step data', { stepId, dataKeys: Object.keys(stepData) })
    
    try {
      await this.makeRequest<void>('POST', `/validate/step/${stepId}`, stepData)
      return true
    } catch (error) {
      console.warn('Step validation failed:', error)
      throw error
    }
  }

  // Wizard completion
  async completeWizard(sessionId: string): Promise<{ project: Project }> {
    console.log('Completing wizard', { sessionId })
    
    const result = await this.makeRequest<{ project: Project }>('POST', `/session/${sessionId}/complete`)
    
    // Clear all wizard-related cache
    this.cache.clear()
    
    return result
  }

  // Data retrieval with caching
  async getAvailableVendors(filters?: {
    search?: string
    category?: string
    status?: string
  }): Promise<{ vendors: Vendor[]; count: number }> {
    console.log('Retrieving available vendors', { filters })
    
    return this.makeRequest<{ vendors: Vendor[]; count: number }>(
      'GET', 
      '/vendors', 
      filters,
      true, // Use cache
      300000 // 5 minutes cache
    )
  }

  async getTemplates(): Promise<{ templates: Template[] }> {
    console.log('Retrieving project templates')
    
    return this.makeRequest<{ templates: Template[] }>(
      'GET', 
      '/templates',
      undefined,
      true, // Use cache
      1800000 // 30 minutes cache
    )
  }

  async getTeamMembers(filters?: {
    search?: string
    role?: string
  }): Promise<{ teamMembers: any[] }> {
    console.log('Retrieving team members', { filters })
    
    return this.makeRequest<{ teamMembers: any[] }>(
      'GET', 
      '/team-members', 
      filters,
      true, // Use cache
      600000 // 10 minutes cache
    )
  }

  // Analytics and monitoring
  async getWizardAnalytics(timeframe: string = '30d'): Promise<any> {
    console.log('Retrieving wizard analytics', { timeframe })
    
    return this.makeRequest<any>(
      'GET', 
      '/analytics', 
      { timeframe },
      true, // Use cache
      60000 // 1 minute cache
    )
  }

  async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('GET', '/health')
  }

  // Utility methods
  clearCache(): void {
    console.log('Clearing service cache')
    this.cache.clear()
    this.cacheHitRate.value = 0
  }

  getServiceStats(): {
    requestCount: number
    cacheHitRate: number
    isOnline: boolean
    lastError: string | null
  } {
    return {
      requestCount: this.requestCount.value,
      cacheHitRate: this.cacheHitRate.value,
      isOnline: this.isOnline.value,
      lastError: this.lastError.value
    }
  }
}

// Create and export singleton instance
const projectWizardService = new ProjectWizardService()

// Add missing methods to the singleton instance for compatibility
projectWizardService.getProjectTemplates = async function(): Promise<Template[]> {
  try {
    const response = await this.makeRequest<{ templates: Template[] }>('GET', '/templates')
    return response.templates || []
  } catch (error) {
    console.error('Error fetching project templates:', error)
    // Return fallback templates if API fails
    return [
      {
        id: 'fallback-standard',
        name: 'Standard Project',
        description: 'Basic project template',
        category: 'General',
        template_data: {
          projectType: 'Standard',
          deliveryType: 'design_bid_build'
        },
        created_at: new Date().toISOString()
      }
    ]
  }
}

projectWizardService.getAvailableVendors = async function(): Promise<Vendor[]> {
  return this.getVendors()
}

projectWizardService.validateStepData = async function(stepId: number, stepData: any): Promise<{ success: boolean; errors?: any[] }> {
  try {
    await this.makeRequest('POST', `/validate/step/${stepId}`, stepData)
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      errors: [{ message: 'Validation failed', field: 'general' }] 
    }
  }
}

// Export both default and named exports for compatibility
export default projectWizardService

// Export both the instance and as the named service (with added methods)
export { projectWizardService }
export { projectWizardService as ProjectWizardService }
export type { WizardSession, StepData, ValidationError, ApiResponse, Vendor, Template, Project }

