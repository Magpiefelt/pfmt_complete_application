import { ref, reactive } from 'vue'
import { ProjectWizardService } from '@/services/projectWizardService'
import { useProjectStore } from '@/stores/project'

export function useProjectWizard() {
  // State
  const sessionId = ref<string | null>(null)
  const currentStep = ref(1)
  const isProcessing = ref(false)
  const autoSaveStatus = ref<'saving' | 'saved' | null>(null)
  const isDemoMode = ref(false) // Track if we're in demo mode

  // Get project store for integration
  const projectStore = useProjectStore()

  // Wizard data structure
  const wizardData = reactive({
    basicInfo: {
      projectName: '',
      description: '',
      category: '',
      projectType: 'Standard',
      region: 'Alberta',
      ministry: 'Infrastructure',
      priority: 'Medium',
      startDate: null,
      expectedCompletion: null,
      location: '',
      municipality: '',
      buildingName: '',
      fundedToComplete: false
    },
    budgetInfo: {
      totalBudget: 0,
      initialBudget: 0,
      estimatedDuration: 365,
      budgetBreakdown: [],
      fundingSource: 'Provincial Budget',
      requiresApproval: false
    },
    teamInfo: {
      projectManager: null,
      teamMembers: [],
      requiredRoles: [],
      director: null
    }
  })

  // Initialize wizard session
  const initializeWizard = async () => {
    try {
      isProcessing.value = true
      isDemoMode.value = false // Reset demo mode flag
      
      const result = await ProjectWizardService.initializeWizard()
      
      sessionId.value = result.sessionId
      currentStep.value = result.currentStep || 1
      
      console.log('Wizard initialized successfully:', { sessionId: sessionId.value, currentStep: currentStep.value })
    } catch (error: any) {
      console.error('Error initializing wizard:', error)
      
      // Handle different types of errors with specific user-friendly messages
      if (error.response?.status === 401 || error.message?.includes('Authentication required')) {
        console.warn('User not authenticated, providing demo mode fallback')
        
        // Provide demo mode fallback
        sessionId.value = `demo_${Date.now()}`
        currentStep.value = 1
        isDemoMode.value = true
        
        // Show user-friendly message
        const message = 'Unable to connect to the server. You can continue in demo mode, but your progress will not be saved. Please refresh the page to try again.'
        
        // Use a more user-friendly notification instead of alert
        if (typeof window !== 'undefined' && window.alert) {
          alert(message)
        } else {
          console.warn('Demo mode active:', message)
        }
        
        return
      } else if (error.response?.status === 500 || error.message?.includes('database') || error.message?.includes('server')) {
        console.error('Server or database error during wizard initialization')
        
        // Provide demo mode fallback for server errors
        sessionId.value = `demo_${Date.now()}`
        currentStep.value = 1
        isDemoMode.value = true
        
        const message = 'There was a server error while starting the wizard. You can continue in demo mode, but your progress will not be saved. Please try again later or contact support if the problem persists.'
        
        if (typeof window !== 'undefined' && window.alert) {
          alert(message)
        } else {
          console.warn('Demo mode active due to server error:', message)
        }
        
        return
      } else if (error.response?.status >= 400 && error.response?.status < 500) {
        // Client errors (4xx)
        const message = `Unable to start the wizard: ${error.message || 'Client error'}. Please refresh the page and try again.`
        
        if (typeof window !== 'undefined' && window.alert) {
          alert(message)
        }
        
        throw new Error(message)
      } else if (!navigator.onLine) {
        // Network connectivity issues
        console.warn('Network connectivity issue detected')
        
        sessionId.value = `demo_${Date.now()}`
        currentStep.value = 1
        isDemoMode.value = true
        
        const message = 'No internet connection detected. You can continue in demo mode, but your progress will not be saved. Please check your connection and refresh the page.'
        
        if (typeof window !== 'undefined' && window.alert) {
          alert(message)
        } else {
          console.warn('Demo mode active due to network issue:', message)
        }
        
        return
      }
      
      // For any other unexpected errors, provide a generic fallback
      console.error('Unexpected error during wizard initialization:', error)
      
      sessionId.value = `demo_${Date.now()}`
      currentStep.value = 1
      isDemoMode.value = true
      
      const message = 'An unexpected error occurred while starting the wizard. You can continue in demo mode, but your progress will not be saved. Please refresh the page to try again.'
      
      if (typeof window !== 'undefined' && window.alert) {
        alert(message)
      } else {
        console.warn('Demo mode active due to unexpected error:', message)
      }
    } finally {
      isProcessing.value = false
    }
  }

  // Save step data
  const saveStepData = async (stepId: number, stepData: any) => {
    try {
      isProcessing.value = true
      autoSaveStatus.value = 'saving'
      
      // Skip API call in demo mode
      if (isDemoMode.value) {
        console.log(`Demo mode: Simulating save for step ${stepId}`)
        autoSaveStatus.value = 'saved'
        setTimeout(() => {
          autoSaveStatus.value = null
        }, 1000)
        return { success: true, demo: true }
      }
      
      const result = await ProjectWizardService.saveStepData(sessionId.value!, stepId, stepData)
      
      autoSaveStatus.value = 'saved'
      setTimeout(() => {
        autoSaveStatus.value = null
      }, 2000)
      
      console.log(`Step ${stepId} data saved successfully`)
      return result
    } catch (error) {
      console.error('Error saving step data:', error)
      autoSaveStatus.value = null
      
      // Provide user-friendly error message
      const message = `Failed to save step ${stepId} data. Your progress may not be saved. Please try again or refresh the page.`
      
      if (typeof window !== 'undefined' && window.alert) {
        alert(message)
      }
      
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  // Validate step
  const validateStep = async (stepId: number, stepData: any) => {
    try {
      const validation = await ProjectWizardService.validateStep(stepId, stepData)
      console.log(`Step ${stepId} validation result:`, validation)
      return validation
    } catch (error) {
      console.error('Error validating step:', error)
      return { isValid: false, errors: ['Validation error occurred'] }
    }
  }

  // Save draft
  const saveDraft = async () => {
    if (!sessionId.value) return

    try {
      isProcessing.value = true
      
      // Save all current step data
      await saveStepData(currentStep.value, getCurrentStepData())
      
      // Show success message
      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft')
    } finally {
      isProcessing.value = false
    }
  }

  // Complete wizard and create project
  const completeWizard = async () => {
    if (!sessionId.value) throw new Error('No active wizard session')

    try {
      isProcessing.value = true
      
      // Handle demo mode
      if (isDemoMode.value) {
        const message = 'Demo mode active: Project cannot be saved to the database. Please refresh the page and try again with a proper connection to create a real project.'
        
        if (typeof window !== 'undefined' && window.alert) {
          alert(message)
        }
        
        throw new Error('Cannot complete wizard in demo mode')
      }
      
      console.log('Completing wizard with session:', sessionId.value)
      
      // Complete the wizard via API
      const project = await ProjectWizardService.completeWizard(sessionId.value)
      
      console.log('Project created successfully:', project)
      
      // Update the project store to refresh the projects list
      try {
        // Use the project store's addProject method to ensure the list is updated
        await projectStore.addProject(project)
        console.log('Project store updated successfully')
      } catch (storeError) {
        console.warn('Failed to update project store:', storeError)
        // Don't fail the entire process if store update fails
        // The project was still created successfully
      }
      
      return project
    } catch (error) {
      console.error('Error completing wizard:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('demo mode')) {
          throw error // Re-throw demo mode errors as-is
        } else if (error.message.includes('session not found') || error.message.includes('session expired')) {
          const message = 'Your wizard session has expired. Please start over by refreshing the page and beginning a new project.'
          
          if (typeof window !== 'undefined' && window.alert) {
            alert(message)
          }
          
          throw new Error(message)
        } else if (error.message.includes('validation') || error.message.includes('required')) {
          const message = 'Please check that all required fields are filled out correctly and try again.'
          
          if (typeof window !== 'undefined' && window.alert) {
            alert(message)
          }
          
          throw new Error(message)
        } else if (error.message.includes('Authentication') || error.message.includes('401')) {
          const message = 'Your session has expired. Please refresh the page, log in again, and try creating the project again.'
          
          if (typeof window !== 'undefined' && window.alert) {
            alert(message)
          }
          
          throw new Error(message)
        } else if (error.message.includes('500') || error.message.includes('server') || error.message.includes('database')) {
          const message = 'There was a server error while creating your project. Please try again in a few moments, or contact support if the problem persists.'
          
          if (typeof window !== 'undefined' && window.alert) {
            alert(message)
          }
          
          throw new Error(message)
        }
      }
      
      // Generic error fallback
      const message = 'An unexpected error occurred while creating your project. Please try again or contact support if the problem persists.'
      
      if (typeof window !== 'undefined' && window.alert) {
        alert(message)
      }
      
      throw new Error(message)
    } finally {
      isProcessing.value = false
    }
  }

  // Get project templates
  const getProjectTemplates = async () => {
    try {
      const templates = await ProjectWizardService.getProjectTemplates()
      console.log('Templates loaded:', templates.length)
      return templates
    } catch (error) {
      console.error('Error fetching templates:', error)
      return []
    }
  }

  // Get available team members
  const getAvailableTeamMembers = async () => {
    try {
      const members = await ProjectWizardService.getAvailableTeamMembers()
      console.log('Team members loaded:', members.length)
      return members
    } catch (error) {
      console.error('Error fetching team members:', error)
      return []
    }
  }

  // Load wizard session (for resuming)
  const loadWizardSession = async (sessionId: string) => {
    try {
      const result = await ProjectWizardService.loadWizardSession(sessionId)
      const { session, stepData } = result
      
      // Restore session state
      currentStep.value = session.current_step
      
      // Restore step data
      if (stepData[1]) {
        // Template selection
        // Handle template restoration if needed
      }
      if (stepData[2]) {
        Object.assign(wizardData.basicInfo, stepData[2])
      }
      if (stepData[3]) {
        Object.assign(wizardData.budgetInfo, stepData[3])
      }
      if (stepData[4]) {
        Object.assign(wizardData.teamInfo, stepData[4])
      }
      
      console.log('Wizard session loaded successfully')
    } catch (error) {
      console.error('Error loading wizard session:', error)
    }
  }

  // Helper to get current step data
  const getCurrentStepData = () => {
    switch (currentStep.value) {
      case 1:
        return { step: 'template' }
      case 2:
        return wizardData.basicInfo
      case 3:
        return wizardData.budgetInfo
      case 4:
        return wizardData.teamInfo
      case 5:
        return { step: 'review' }
      default:
        return {}
    }
  }

  // Reset wizard
  const resetWizard = () => {
    sessionId.value = null
    currentStep.value = 1
    
    // Reset wizard data
    Object.assign(wizardData.basicInfo, {
      projectName: '',
      description: '',
      category: '',
      projectType: 'Standard',
      region: 'Alberta',
      ministry: 'Infrastructure',
      priority: 'Medium',
      startDate: null,
      expectedCompletion: null,
      location: '',
      municipality: '',
      buildingName: '',
      fundedToComplete: false
    })
    
    Object.assign(wizardData.budgetInfo, {
      totalBudget: 0,
      initialBudget: 0,
      estimatedDuration: 365,
      budgetBreakdown: [],
      fundingSource: 'Provincial Budget',
      requiresApproval: false
    })
    
    Object.assign(wizardData.teamInfo, {
      projectManager: null,
      teamMembers: [],
      requiredRoles: [],
      director: null
    })
    
    console.log('Wizard reset successfully')
  }

  return {
    // State
    sessionId,
    currentStep,
    wizardData,
    isProcessing,
    autoSaveStatus,
    isDemoMode,
    
    // Methods
    initializeWizard,
    saveStepData,
    validateStep,
    saveDraft,
    completeWizard,
    getProjectTemplates,
    getAvailableTeamMembers,
    loadWizardSession,
    resetWizard,
    getCurrentStepData
  }
}

