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

  // Wizard data structure - matches backend expectations
  const wizardData = reactive({
    basicInfo: {
      projectName: '',
      description: '',
      category: 'construction',
      projectType: 'new_construction',
      deliveryType: 'design_bid_build',
      program: 'government_facilities',
      region: 'central',
      municipality: '',
      location: '',
      buildingName: '',
      fundedToComplete: false,
      startDate: null,
      expectedCompletion: null
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
      director: null,
      teamMembers: [],
      requiredRoles: []
    }
  })

  // Initialize wizard session
  const initializeWizard = async () => {
    try {
      isProcessing.value = true
      isDemoMode.value = false // Reset demo mode flag
      
      console.log('Initializing wizard session...')
      const result = await ProjectWizardService.initializeWizard()
      
      if (!result.sessionId) {
        throw new Error('No session ID returned from server')
      }
      
      sessionId.value = result.sessionId
      currentStep.value = result.currentStep || 1
      
      console.log('Wizard initialized successfully:', { 
        sessionId: sessionId.value, 
        currentStep: currentStep.value,
        isDemoMode: isDemoMode.value 
      })
    } catch (error: any) {
      console.error('Error initializing wizard:', error)
      
      // Only enter demo mode for specific errors, otherwise throw the error
      if (error.response?.status === 401 || error.message?.includes('Authentication required')) {
        throw new Error('Authentication required. Please log in and try again.')
      } else if (error.response?.status === 500 || error.message?.includes('database') || error.message?.includes('server')) {
        throw new Error('Server error occurred. Please try again later or contact support.')
      } else if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your connection and try again.')
      }
      
      // For any other errors, throw them to be handled by the component
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  // Save step data
  const saveStepData = async (stepId: number, stepData: any) => {
    try {
      isProcessing.value = true
      autoSaveStatus.value = 'saving'
      
      // Validate session exists
      if (!sessionId.value) {
        throw new Error('No active wizard session. Please restart the wizard.')
      }
      
      // Skip API call in demo mode
      if (isDemoMode.value) {
        console.log(`Demo mode: Simulating save for step ${stepId}`)
        autoSaveStatus.value = 'saved'
        setTimeout(() => {
          autoSaveStatus.value = null
        }, 1000)
        return { success: true, demo: true }
      }
      
      console.log(`Saving step ${stepId} data:`, stepData)
      const result = await ProjectWizardService.saveStepData(sessionId.value, stepId, stepData)
      
      autoSaveStatus.value = 'saved'
      setTimeout(() => {
        autoSaveStatus.value = null
      }, 2000)
      
      console.log(`Step ${stepId} data saved successfully`)
      return result
    } catch (error: any) {
      console.error('Error saving step data:', error)
      autoSaveStatus.value = null
      
      // Handle specific error cases
      if (error.message?.includes('session not found') || error.message?.includes('404')) {
        throw new Error('Wizard session expired. Please restart the wizard.')
      } else if (error.message?.includes('Authentication') || error.message?.includes('401')) {
        throw new Error('Authentication expired. Please refresh the page and try again.')
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
    if (!sessionId.value) {
      throw new Error('No active wizard session')
    }

    try {
      isProcessing.value = true
      
      // Handle demo mode
      if (isDemoMode.value) {
        throw new Error('Cannot complete wizard in demo mode. Please refresh the page and try again with a proper connection.')
      }
      
      // Validate required fields before submission
      if (!wizardData.basicInfo.projectName?.trim()) {
        throw new Error('Project name is required')
      }
      if (!wizardData.basicInfo.description?.trim()) {
        throw new Error('Project description is required')
      }
      
      console.log('Completing wizard with session:', sessionId.value)
      console.log('Wizard data:', wizardData)
      
      // Complete the wizard via API
      const project = await ProjectWizardService.completeWizard(sessionId.value)
      
      if (!project || !project.id) {
        throw new Error('Project creation failed - no project ID returned')
      }
      
      console.log('Project created successfully:', project)
      
      return project
    } catch (error: any) {
      console.error('Error completing wizard:', error)
      
      // Provide more specific error messages
      if (error.message?.includes('demo mode')) {
        throw error // Re-throw demo mode errors as-is
      } else if (error.message?.includes('session not found') || error.message?.includes('session expired')) {
        throw new Error('Your wizard session has expired. Please start over by refreshing the page.')
      } else if (error.message?.includes('required')) {
        throw error // Re-throw validation errors as-is
      } else if (error.message?.includes('Authentication') || error.message?.includes('401')) {
        throw new Error('Your session has expired. Please refresh the page and try again.')
      } else if (error.message?.includes('500') || error.message?.includes('server') || error.message?.includes('database')) {
        throw new Error('Server error occurred while creating your project. Please try again.')
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        throw new Error('Network error occurred. Please check your connection and try again.')
      }
      
      // Generic error fallback
      throw new Error('An unexpected error occurred while creating your project. Please try again.')
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
    
    // Reset wizard data to match backend expectations
    Object.assign(wizardData.basicInfo, {
      projectName: '',
      description: '',
      category: 'construction',
      projectType: 'new_construction',
      deliveryType: 'design_bid_build',
      program: 'government_facilities',
      region: 'central',
      municipality: '',
      location: '',
      buildingName: '',
      fundedToComplete: false,
      startDate: null,
      expectedCompletion: null
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
      director: null,
      teamMembers: [],
      requiredRoles: []
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

