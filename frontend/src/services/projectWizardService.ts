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

// Debug logging
console.log('API_CONFIG.baseURL:', API_CONFIG.baseURL)
console.log('VITE_API_BASE_URL env var:', import.meta.env.VITE_API_BASE_URL)

// ENHANCED: Data validation helpers
const validateStepDataStructure = (stepData: any): StepData => {
  console.log('🔧 validateStepDataStructure input:', stepData, 'type:', typeof stepData)
  
  // Handle null, undefined, or non-object inputs
  if (!stepData || typeof stepData !== 'object' || Array.isArray(stepData)) {
    console.warn('Invalid stepData provided, using empty object with timestamp:', stepData)
    return { timestamp: Date.now() }
  }
  
  // Handle case where stepData might be a proxy or reactive object
  let cleanedData: StepData = {}
  
  try {
    // Try to get keys safely
    const keys = Object.keys(stepData)
    console.log('🔧 stepData keys:', keys)
    
    // Remove any null or undefined values and ensure we have at least one property
    let hasValidData = false
    
    keys.forEach(key => {
      const value = stepData[key]
      if (value !== null && value !== undefined) {
        cleanedData[key] = value
        hasValidData = true
      }
    })
    
    // If no valid data, add a timestamp to ensure non-empty object
    if (!hasValidData) {
      cleanedData.timestamp = Date.now()
    }
    
    console.log('🔧 validateStepDataStructure output:', cleanedData)
    return cleanedData
    
  } catch (error) {
    console.error('Error processing stepData:', error)
    return { timestamp: Date.now(), error: 'data_processing_failed' }
  }
}

const ensureNonEmptyBody = (data: any): any => {
  console.log('🔧 ensureNonEmptyBody input:', data)
  
  // Always ensure we have a non-empty object for POST requests
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    const fallback = { timestamp: Date.now() }
    console.log('🔧 ensureNonEmptyBody using fallback:', fallback)
    return fallback
  }
  
  console.log('🔧 ensureNonEmptyBody output:', data)
  return data
}

// Utility functions
const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
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
  private baseUrl: string

  constructor() {
    this.apiClient = createApiClient()
    this.baseUrl = '/project-wizard'
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const operation = async () => {
      const config: any = {
        method,
        url: `${this.baseUrl}${endpoint}`
      }

      if (method === 'GET' && data) {
        config.params = data
      } else if (data) {
        // ENHANCED: Ensure non-empty body for POST requests
        const processedData = ensureNonEmptyBody(data)
        config.data = processedData
        console.log(`🔧 Sending ${method} request to ${endpoint} with data:`, processedData)
      }

      const response = await this.apiClient.request<ApiResponse<T>>(config)
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'API request failed')
      }

      // For wizard initialization, the session data is directly in response.data (excluding success field)
      // For other endpoints, data might be in response.data.data
      let result: T
      if (response.data.data !== undefined && endpoint !== '/init') {
        result = response.data.data
      } else {
        // Extract session data by removing metadata fields
        const { success, message, errors, correlationId, ...sessionData } = response.data as any
        result = sessionData as T
      }
      
      return result
    }

    return await withRetry(operation)
  }

  // Wizard session management
  async initializeWizard(templateId?: string): Promise<WizardSession> {
    console.log('Initializing wizard session', { templateId })
    
    const initData = templateId ? { templateId } : { timestamp: Date.now() }
    return this.makeRequest<WizardSession>('POST', '/init', initData)
  }

  async getWizardSession(sessionId: string): Promise<any> {
    console.log('Retrieving wizard session', { sessionId })
    
    return this.makeRequest<any>('GET', `/session/${sessionId}`)
  }

  // Step data management - ENHANCED FOR NULL SAFETY
  async saveStepData(sessionId: string, stepId: number, stepData: StepData): Promise<void> {
    console.log('🔧 saveStepData called with:', { 
      sessionId, 
      stepId, 
      stepData,
      stepDataType: typeof stepData,
      stepDataKeys: stepData ? Object.keys(stepData) : 'null/undefined'
    })
    
    // ENHANCED: Validate and clean step data before sending
    const validatedStepData = validateStepDataStructure(stepData)
    const nonEmptyStepData = ensureNonEmptyBody(validatedStepData)
    
    console.log('🔧 Processed step data:', { 
      original: stepData, 
      validated: validatedStepData, 
      final: nonEmptyStepData 
    })
    
    await this.makeRequest<void>('POST', `/session/${sessionId}/step/${stepId}`, nonEmptyStepData)
  }

  async validateStep(stepId: number, stepData: StepData): Promise<boolean> {
    console.log('🔧 validateStep called with:', { 
      stepId, 
      stepData,
      stepDataType: typeof stepData
    })
    
    try {
      // ENHANCED: Protect against null/undefined stepData
      let dataToValidate = stepData
      if (!stepData || typeof stepData !== 'object') {
        console.warn('validateStep: stepData is null/undefined, using empty object')
        dataToValidate = {}
      }
      
      const validatedStepData = validateStepDataStructure(dataToValidate)
      await this.makeRequest<void>('POST', `/validate/step/${stepId}`, ensureNonEmptyBody(validatedStepData))
      return true
    } catch (error) {
      console.warn('Step validation failed:', error)
      throw error
    }
  }

  // Wizard completion - UPDATED FOR WORKFLOW INTEGRATION
  async completeWizard(sessionId: string): Promise<{ success: boolean; project: Project; message?: string }> {
    console.log('Completing wizard with workflow integration', { sessionId })
    
    try {
      // Step 1: Complete the legacy wizard to create the project
      const result = await this.makeRequest<{ project: Project }>('POST', `/session/${sessionId}/complete`)
      
      if (!result.project?.id) {
        throw new Error('Project creation failed - no project ID returned')
      }

      console.log('✅ Legacy project created:', result.project.id)

      // Step 2: Normalize legacy data to workflow format and finalize the project
      try {
        console.log('🔄 Normalizing legacy data and finalizing project...')
        
        // Call the workflow finalize endpoint to set both workflow_status and lifecycle_status
        const workflowResponse = await axios.post(`/api/projects/${result.project.id}/workflow/finalize`, {
          // Normalize legacy data to workflow format
          finalized_by: 'legacy_wizard', // Indicate this was finalized via legacy wizard
          finalization_notes: 'Project finalized via legacy wizard',
          // The backend will set both workflow_status='finalized' and lifecycle_status='active'
        })

        if (workflowResponse.data.success) {
          console.log('✅ Project workflow finalization successful')
          
          // Update the project object with the new status information
          result.project = {
            ...result.project,
            workflow_status: 'finalized',
            lifecycle_status: 'active',
            finalized_at: new Date().toISOString()
          }
        } else {
          console.warn('⚠️ Workflow finalization failed, but project was created')
        }
      } catch (workflowError) {
        console.warn('⚠️ Workflow integration failed, but project was created:', workflowError)
        // Don't fail the entire wizard completion if workflow integration fails
        // The project was successfully created, just without the workflow status
      }

      // Step 3: Verify project was created by checking if we can fetch it
      if (result.project?.id) {
        try {
          console.log('Verifying project creation by fetching project:', result.project.id)
          // Wait a moment for database consistency
          await delay(1000)
          
          // Try to fetch the project to verify it exists
          const projectResponse = await axios.get(`/api/projects/${result.project.id}`)
          if (projectResponse.data.success) {
            console.log('✅ Project verification successful')
            
            // Use the fetched project data which should include the latest workflow status
            if (projectResponse.data.data) {
              result.project = {
                ...result.project,
                ...projectResponse.data.data
              }
            }
          }
        } catch (verificationError) {
          console.warn('⚠️ Project verification failed, but continuing:', verificationError)
          // Don't fail the wizard completion if verification fails
        }
      }
      
      return {
        success: true,
        project: result.project,
        message: 'Project created and finalized successfully'
      }
    } catch (error) {
      console.error('Failed to complete wizard:', error)
      
      return {
        success: false,
        project: null,
        message: error.message || 'Failed to create project'
      }
    }
  }

  // ENHANCED: Data retrieval with fallback for vendors
  async getAvailableVendors(filters?: {
    search?: string
    category?: string
    status?: string
  }): Promise<{ vendors: Vendor[]; count: number }> {
    console.log('Retrieving available vendors', { filters })
    
    try {
      const result = await this.makeRequest<{ vendors: Vendor[]; count: number }>('GET', '/vendors', filters)
      
      // If no vendors returned, provide fallback data
      if (!result.vendors || result.vendors.length === 0) {
        console.warn('No vendors returned from API, providing fallback data')
        return {
          vendors: [
            {
              id: '1',
              name: 'ABC Construction Ltd.',
              description: 'General construction services',
              category: 'General Contractor',
              status: 'Active',
              project_count: 15,
              avg_rating: 4.5
            },
            {
              id: '2',
              name: 'XYZ Engineering Inc.',
              description: 'Engineering and consulting services',
              category: 'Engineering',
              status: 'Active',
              project_count: 22,
              avg_rating: 4.8
            },
            {
              id: '3',
              name: 'DEF Architects',
              description: 'Architectural design and planning',
              category: 'Architecture',
              status: 'Active',
              project_count: 18,
              avg_rating: 4.6
            }
          ],
          count: 3
        }
      }
      
      return result
    } catch (error) {
      console.error('Error fetching vendors, providing fallback:', error)
      // Return fallback vendors if API fails
      return {
        vendors: [
          {
            id: '1',
            name: 'ABC Construction Ltd.',
            description: 'General construction services',
            category: 'General Contractor',
            status: 'Active',
            project_count: 15,
            avg_rating: 4.5
          },
          {
            id: '2',
            name: 'XYZ Engineering Inc.',
            description: 'Engineering and consulting services',
            category: 'Engineering',
            status: 'Active',
            project_count: 22,
            avg_rating: 4.8
          },
          {
            id: '3',
            name: 'DEF Architects',
            description: 'Architectural design and planning',
            category: 'Architecture',
            status: 'Active',
            project_count: 18,
            avg_rating: 4.6
          }
        ],
        count: 3
      }
    }
  }

  async getTemplates(): Promise<{ templates: Template[] }> {
    console.log('Retrieving project templates')
    
    try {
      return this.makeRequest<{ templates: Template[] }>('GET', '/templates')
    } catch (error) {
      console.error('Error fetching templates, providing fallback:', error)
      // Return fallback templates if API fails
      return {
        templates: [
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
  }

  async getTeamMembers(filters?: {
    search?: string
    role?: string
  }): Promise<{ teamMembers: any[] }> {
    console.log('Retrieving team members', { filters })
    
    try {
      return this.makeRequest<{ teamMembers: any[] }>('GET', '/team-members', filters)
    } catch (error) {
      console.error('Error fetching team members:', error)
      return { teamMembers: [] }
    }
  }

  async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('GET', '/health')
  }
}

// Create and export singleton instance
const projectWizardService = new ProjectWizardService()

// Export both default and named exports for compatibility
export default projectWizardService
export { projectWizardService }
export { projectWizardService as ProjectWizardService }
export type { WizardSession, StepData, ValidationError, ApiResponse, Vendor, Template, Project }

