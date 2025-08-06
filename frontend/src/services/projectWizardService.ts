import ApiService from './apiService'

export interface WizardSession {
  id: string
  current_step: number
  created_at: string
  updated_at: string
}

export interface ProjectTemplate {
  id: number
  name: string
  description: string
  category: string
  default_settings: any
}

export interface TeamMember {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  is_available: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export class ProjectWizardService {
  // Initialize a new wizard session
  static async initializeWizard(): Promise<{ sessionId: string; currentStep: number }> {
    const response = await ApiService.request<any>('/project-wizard/init', {
      method: 'POST'
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to initialize wizard')
    }
    
    return {
      sessionId: response.sessionId,
      currentStep: response.currentStep
    }
  }

  // Get project templates
  static async getProjectTemplates(): Promise<ProjectTemplate[]> {
    const response = await ApiService.request<any>('/project-wizard/templates', {
      method: 'GET'
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch templates')
    }
    
    return response.templates || []
  }

  // Get available team members
  static async getAvailableTeamMembers(): Promise<TeamMember[]> {
    const response = await ApiService.request<TeamMember[]>('/project-wizard/team-members', {
      method: 'GET'
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch team members')
    }
    
    return response.data
  }

  // Save step data
  static async saveStepData(sessionId: string, stepId: number, stepData: any): Promise<void> {
    const response = await ApiService.request(`/project-wizard/session/${sessionId}/step/${stepId}`, {
      method: 'POST',
      body: JSON.stringify(stepData)
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to save step data')
    }
  }

  // Validate step data
  static async validateStep(stepId: number, stepData: any): Promise<ValidationResult> {
    try {
      const response = await ApiService.request<any>(`/project-wizard/validate/step/${stepId}`, {
        method: 'POST',
        body: JSON.stringify(stepData)
      })
      
      if (!response.success) {
        return { isValid: false, errors: [response.error || 'Validation failed'] }
      }
      
      // Backend returns validation wrapped in a 'validation' property
      return response.validation || { isValid: false, errors: ['Invalid validation response'] }
    } catch (error: any) {
      console.error('Error validating step:', error)
      return { isValid: false, errors: ['Validation error occurred'] }
    }
  }

  // Load wizard session
  static async loadWizardSession(sessionId: string): Promise<{ session: WizardSession; stepData: any }> {
    const response = await ApiService.request<{ session: WizardSession; stepData: any }>(`/project-wizard/session/${sessionId}`, {
      method: 'GET'
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to load wizard session')
    }
    
    return response.data
  }

  // Complete wizard and create project
  static async completeWizard(sessionId: string): Promise<any> {
    const response = await ApiService.request<any>(`/project-wizard/session/${sessionId}/complete`, {
      method: 'POST'
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to create project')
    }
    
    return response.data
  }

  // Delete wizard session
  static async deleteWizardSession(sessionId: string): Promise<void> {
    const response = await ApiService.request(`/project-wizard/session/${sessionId}`, {
      method: 'DELETE'
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete wizard session')
    }
  }

  // Get wizard session status
  static async getWizardSessionStatus(sessionId: string): Promise<{ status: string; progress: number }> {
    const response = await ApiService.request<{ status: string; progress: number }>(`/project-wizard/session/${sessionId}/status`, {
      method: 'GET'
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get session status')
    }
    
    return response.data
  }
}

