/**
 * Project Wizard Integration Composable
 * Provides integration between wizard store, auth store, and router
 * Handles navigation, permissions, and state synchronization
 */

import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectWizardStore } from '@/stores/projectWizard'
import { useAuthStore } from '@/stores/auth'

export interface WizardStep {
  id: string
  title: string
  description: string
  component: string
  requiredRoles: string[]
  requiredStatus?: string[]
  isComplete: boolean
  isAccessible: boolean
  isActive: boolean
}

export interface WizardNavigation {
  currentStepIndex: number
  steps: WizardStep[]
  canGoNext: boolean
  canGoPrevious: boolean
  nextStep: WizardStep | null
  previousStep: WizardStep | null
}

export function useProjectWizardIntegration() {
  const router = useRouter()
  const route = useRoute()
  const wizardStore = useProjectWizardStore()
  const authStore = useAuthStore()

  // Define wizard steps configuration
  const stepDefinitions: Omit<WizardStep, 'isComplete' | 'isAccessible' | 'isActive'>[] = [
    {
      id: 'initiate',
      title: 'Project Initiation',
      description: 'Create new project with basic information',
      component: 'InitiationStep',
      requiredRoles: ['pmi', 'admin'],
      requiredStatus: []
    },
    {
      id: 'assign',
      title: 'Team Assignment',
      description: 'Assign project manager and senior project manager',
      component: 'AssignmentStep',
      requiredRoles: ['director', 'admin'],
      requiredStatus: ['initiated']
    },
    {
      id: 'configure',
      title: 'Project Configuration',
      description: 'Configure project details, vendors, budget, and milestones',
      component: 'ConfigurationStep',
      requiredRoles: ['pm', 'spm', 'admin'],
      requiredStatus: ['assigned']
    }
  ]

  // Computed wizard navigation state
  const wizardNavigation = computed((): WizardNavigation => {
    const currentUser = authStore.currentUser
    const project = wizardStore.project
    const currentStepId = route.params.step as string || 'initiate'

    // Build steps with dynamic state
    const steps: WizardStep[] = stepDefinitions.map(stepDef => {
      const isAccessible = currentUser ? 
        stepDef.requiredRoles.includes(currentUser.role) &&
        (stepDef.requiredStatus?.length === 0 || 
         stepDef.requiredStatus?.includes(project?.workflow_status || '')) : false

      const isComplete = getStepCompletionStatus(stepDef.id)
      const isActive = stepDef.id === currentStepId

      return {
        ...stepDef,
        isComplete,
        isAccessible,
        isActive
      }
    })

    const currentStepIndex = steps.findIndex(step => step.id === currentStepId)
    const currentStep = steps[currentStepIndex]
    
    const canGoNext = currentStep?.isComplete && 
                     currentStepIndex < steps.length - 1 &&
                     steps[currentStepIndex + 1]?.isAccessible

    const canGoPrevious = currentStepIndex > 0 &&
                         steps[currentStepIndex - 1]?.isAccessible

    const nextStep = canGoNext ? steps[currentStepIndex + 1] : null
    const previousStep = canGoPrevious ? steps[currentStepIndex - 1] : null

    return {
      currentStepIndex,
      steps,
      canGoNext,
      canGoPrevious,
      nextStep,
      previousStep
    }
  })

  // Helper function to determine step completion (updated for dual-wizard system)
  const getStepCompletionStatus = (stepId: string): boolean => {
    const projectStatus = wizardStore.project?.workflow_status
    
    switch (stepId) {
      case 'initiate':
        return wizardStore.isInitiationValid.isValid && 
               projectStatus !== undefined &&
               ['assigned', 'finalized', 'active', 'completed'].includes(projectStatus)
      
      case 'assign':
        return wizardStore.isAssignmentValid.isValid && 
               projectStatus !== undefined &&
               ['finalized', 'active', 'completed'].includes(projectStatus)
      
      case 'configure':
        return wizardStore.isFinalizationValid.isValid && 
               projectStatus !== undefined &&
               ['finalized', 'active', 'completed'].includes(projectStatus)
      
      default:
        return false
    }
  }

  // Navigation actions
  const navigateToStep = async (stepId: string, projectId?: string) => {
    const targetStep = stepDefinitions.find(step => step.id === stepId)
    if (!targetStep) {
      console.error('Invalid step ID:', stepId)
      return false
    }

    // Check permissions
    if (!authStore.currentUser || !targetStep.requiredRoles.includes(authStore.currentUser.role)) {
      console.error('User does not have permission for step:', stepId)
      return false
    }

    // Build route path
    const routePath = projectId ? 
      `/wizard/${projectId}/${stepId}` : 
      `/wizard/${stepId}`

    try {
      await router.push(routePath)
      return true
    } catch (error) {
      console.error('Navigation failed:', error)
      return false
    }
  }

  const navigateNext = async () => {
    const nav = wizardNavigation.value
    if (nav.canGoNext && nav.nextStep) {
      const projectId = wizardStore.project?.id
      return await navigateToStep(nav.nextStep.id, projectId)
    }
    return false
  }

  const navigatePrevious = async () => {
    const nav = wizardNavigation.value
    if (nav.canGoPrevious && nav.previousStep) {
      const projectId = wizardStore.project?.id
      return await navigateToStep(nav.previousStep.id, projectId)
    }
    return false
  }

  const navigateToProjectDetails = async () => {
    if (wizardStore.project?.id) {
      await router.push(`/projects/${wizardStore.project.id}`)
      return true
    }
    return false
  }

  // Step submission handlers
  const submitCurrentStep = async (): Promise<boolean> => {
    const currentStepId = route.params.step as string
    
    try {
      switch (currentStepId) {
        case 'initiate':
          const projectId = await wizardStore.submitInitiation()
          if (projectId) {
            // Navigate to assignment step with new project ID
            await navigateToStep('assign', projectId)
            return true
          }
          return false

        case 'assign':
          const assignSuccess = await wizardStore.submitAssignment()
          if (assignSuccess) {
            // Navigate to configuration step
            await navigateToStep('configure', wizardStore.project?.id)
            return true
          }
          return false

        case 'configure':
          const configSuccess = await wizardStore.submitFinalization()
          if (configSuccess) {
            // Navigate to project details
            await navigateToProjectDetails()
            return true
          }
          return false

        default:
          console.error('Unknown step for submission:', currentStepId)
          return false
      }
    } catch (error) {
      console.error('Step submission failed:', error)
      return false
    }
  }

  // Auto-save functionality
  const setupAutoSave = () => {
    let autoSaveTimeout: NodeJS.Timeout | null = null

    const triggerAutoSave = () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }

      autoSaveTimeout = setTimeout(async () => {
        if (wizardStore.hasUnsavedChanges && wizardStore.project?.id) {
          console.log('🔄 Auto-saving wizard changes...')
          
          // Auto-save logic based on current step
          const currentStepId = route.params.step as string
          
          try {
            switch (currentStepId) {
              case 'initiate':
                // For initiation, we can't auto-save until submitted
                break
              case 'assign':
                // For assignment, we can't auto-save until submitted
                break
              case 'configure':
                // For configuration, we could implement partial saves
                // This would require additional API endpoints
                break
            }
          } catch (error) {
            console.warn('Auto-save failed:', error)
          }
        }
      }, 30000) // 30 seconds
    }

    // Watch for changes to trigger auto-save
    const stopWatching = watch(
      () => wizardStore.hasUnsavedChanges,
      (hasChanges) => {
        if (hasChanges) {
          triggerAutoSave()
        }
      }
    )

    return () => {
      stopWatching()
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }

  // Lifecycle management
  const initializeWizard = async (projectId?: string) => {
    console.log('🧙‍♂️ Initializing wizard integration...')

    // Load available users and vendors
    await Promise.all([
      wizardStore.loadAvailableUsers(['pm', 'spm']),
      wizardStore.loadAvailableVendors()
    ])

    // Load project if ID provided
    if (projectId) {
      await wizardStore.loadProject(projectId)
    }

    // Ensure user has access to current step
    const currentStepId = route.params.step as string || 'initiate'
    const hasAccess = wizardNavigation.value.steps
      .find(step => step.id === currentStepId)?.isAccessible

    if (!hasAccess) {
      console.warn('User does not have access to current step, redirecting...')
      
      // Find first accessible step
      const firstAccessibleStep = wizardNavigation.value.steps
        .find(step => step.isAccessible)
      
      if (firstAccessibleStep) {
        await navigateToStep(firstAccessibleStep.id, projectId)
      } else {
        // No accessible steps, redirect to projects list
        await router.push('/projects')
      }
    }
  }

  const cleanupWizard = () => {
    console.log('🧹 Cleaning up wizard integration...')
    // Any cleanup logic would go here
  }

  // Unsaved changes warning
  const setupUnsavedChangesWarning = () => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (wizardStore.hasUnsavedChanges) {
        event.preventDefault()
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return event.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }

  // Permission helpers
  const canUserInitiateProjects = computed(() => 
    authStore.canInitiateProjects
  )

  const canUserAssignTeams = computed(() => 
    authStore.canAssignTeams
  )

  const canUserFinalizeProjects = computed(() => 
    authStore.canFinalizeProjects
  )

  const getUserRoleDisplay = computed(() => 
    authStore.userRoleDisplay
  )

  // Error handling
  const handleWizardError = (error: any) => {
    console.error('Wizard error:', error)
    
    // Could integrate with a toast notification system
    // or error reporting service here
  }

  return {
    // State
    wizardNavigation,
    
    // Navigation
    navigateToStep,
    navigateNext,
    navigatePrevious,
    navigateToProjectDetails,
    
    // Step management
    submitCurrentStep,
    
    // Lifecycle
    initializeWizard,
    cleanupWizard,
    setupAutoSave,
    setupUnsavedChangesWarning,
    
    // Permissions
    canUserInitiateProjects,
    canUserAssignTeams,
    canUserFinalizeProjects,
    getUserRoleDisplay,
    
    // Error handling
    handleWizardError,
    
    // Store access
    wizardStore,
    authStore
  }
}

