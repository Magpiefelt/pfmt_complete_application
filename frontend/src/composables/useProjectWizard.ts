import { ref, reactive } from 'vue'
import { ProjectWizardService } from '@/services/projectWizardService'
import { useProjectStore } from '@/stores/project'

export function useProjectWizard() {
  // State
  const sessionId = ref<string | null>(null)
  const currentStep = ref(1)
  const isProcessing = ref(false)
  const autoSaveStatus = ref<'saving' | 'saved' | null>(null)

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
      const result = await ProjectWizardService.initializeWizard()
      
      sessionId.value = result.sessionId
      currentStep.value = result.currentStep || 1
      
      console.log('Wizard initialized successfully:', { sessionId: sessionId.value, currentStep: currentStep.value })
    } catch (error: any) {
      console.error('Error initializing wizard:', error)
      
      // Handle authentication errors gracefully
      if (error.message.includes('Authentication required')) {
        console.warn('User not authenticated, wizard may have limited functionality')
        // Don't throw error, allow wizard to continue with limited functionality
        sessionId.value = `demo_${Date.now()}`
        currentStep.value = 1
        return
      }
      
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
        if (error.message.includes('session not found')) {
          throw new Error('Wizard session expired. Please start over.')
        } else if (error.message.includes('validation')) {
          throw new Error('Please check all required fields and try again.')
        } else if (error.message.includes('Authentication')) {
          throw new Error('Authentication required. Please refresh the page and try again.')
        }
      }
      
      throw error
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

