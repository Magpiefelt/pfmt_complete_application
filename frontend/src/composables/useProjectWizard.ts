import { ref, reactive } from 'vue'
import { ProjectWizardService } from '@/services/projectWizardService'

export function useProjectWizard() {
  // State
  const sessionId = ref<string | null>(null)
  const currentStep = ref(1)
  const isProcessing = ref(false)
  const autoSaveStatus = ref<'saving' | 'saved' | null>(null)

  // Wizard data structure
  const wizardData = reactive({
    basicInfo: {
      projectName: '',
      description: '',
      category: '',
      projectType: 'Standard',
      region: 'Alberta',
      ministry: 'Infrastructure',
      startDate: null,
      expectedCompletion: null
    },
    budgetInfo: {
      totalBudget: 0,
      initialBudget: 0,
      estimatedDuration: 365,
      budgetBreakdown: []
    },
    teamInfo: {
      projectManager: null,
      teamMembers: [],
      requiredRoles: []
    }
  })

  // Initialize wizard session
  const initializeWizard = async () => {
    try {
      isProcessing.value = true
      const result = await ProjectWizardService.initializeWizard()
      
      sessionId.value = result.sessionId
      currentStep.value = result.currentStep || 1
    } catch (error) {
      console.error('Error initializing wizard:', error)
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
      return await ProjectWizardService.validateStep(stepId, stepData)
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
      
      const project = await ProjectWizardService.completeWizard(sessionId.value)
      return project
    } catch (error) {
      console.error('Error completing wizard:', error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  // Get project templates
  const getProjectTemplates = async () => {
    try {
      return await ProjectWizardService.getProjectTemplates()
    } catch (error) {
      console.error('Error fetching templates:', error)
      return []
    }
  }

  // Get available team members
  const getAvailableTeamMembers = async () => {
    try {
      return await ProjectWizardService.getAvailableTeamMembers()
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
      startDate: null,
      expectedCompletion: null
    })
    
    Object.assign(wizardData.budgetInfo, {
      totalBudget: 0,
      initialBudget: 0,
      estimatedDuration: 365,
      budgetBreakdown: []
    })
    
    Object.assign(wizardData.teamInfo, {
      projectManager: null,
      teamMembers: [],
      requiredRoles: []
    })
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

