<template>
  <div class="project-wizard">
    <!-- Wizard Header -->
    <div class="wizard-header bg-white shadow-sm">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="wizard-title">
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900">
              Create New Project
            </h1>
            <p class="text-gray-600 mt-1">
              Follow the steps below to create your project
            </p>
          </div>
          
          <!-- Save Status Indicator -->
          <div class="save-status" v-if="!isCompleted">
            <div class="flex items-center space-x-2">
              <div class="save-indicator">
                <CheckCircle v-if="lastSaveStatus === 'success'" class="h-4 w-4 text-green-600" />
                <span class="text-sm text-gray-600">
                  {{ saveStatusText }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="progress-section mt-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">
              Step {{ currentStep }} of {{ totalSteps }}
            </span>
            <span class="text-sm text-gray-500">
              {{ Math.round(progressPercentage) }}% Complete
            </span>
          </div>
          
          <div class="progress-bar-container">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
          </div>
          
          <!-- Step Indicators -->
          <div class="step-indicators mt-4">
            <div class="flex items-center justify-between">
              <div 
                v-for="step in steps" 
                :key="step.id"
                class="step-indicator flex items-center"
                :class="{
                  'text-blue-600': step.id === currentStep,
                  'text-green-600': step.id < currentStep,
                  'text-gray-400': step.id > currentStep
                }"
              >
                <div class="step-circle flex items-center justify-center w-8 h-8 rounded-full border-2 mr-2"
                     :class="{
                       'border-blue-600 bg-blue-600 text-white': step.id === currentStep,
                       'border-green-600 bg-green-600 text-white': step.id < currentStep,
                       'border-gray-300': step.id > currentStep
                     }">
                  <CheckCircle v-if="step.id < currentStep" class="h-4 w-4" />
                  <span v-else class="text-sm font-medium">{{ step.id }}</span>
                </div>
                <div class="step-info">
                  <div class="step-title font-medium">{{ step.title }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Wizard Content -->
    <div class="wizard-content">
      <div class="container mx-auto px-4 py-6">
        <!-- Error Banner -->
        <div v-if="globalError" class="error-banner mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div class="flex items-center">
            <AlertCircle class="h-4 w-4 text-red-600 mr-2" />
            <div>
              <div class="font-medium text-red-800">Error</div>
              <div class="text-red-700">{{ globalError }}</div>
            </div>
          </div>
        </div>

        <!-- Success Banner -->
        <div v-if="successMessage" class="success-banner mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div class="flex items-center">
            <CheckCircle class="h-4 w-4 text-green-600 mr-2" />
            <div>
              <div class="font-medium text-green-800">Success</div>
              <div class="text-green-700">{{ successMessage }}</div>
            </div>
          </div>
        </div>

        <!-- Step Content -->
        <div class="step-content bg-white rounded-lg shadow-sm border p-6">
          <ProjectDetailsStep 
            v-if="currentStep === 1"
            ref="step1"
            :data="stepData.details"
            :errors="stepErrors[1]"
            @update:data="updateStepData(1, 'details', $event)"
            @validate="validateStep(1)"
          />
          
          <LocationStep 
            v-if="currentStep === 2"
            ref="step2"
            :data="stepData.location"
            :errors="stepErrors[2]"
            @update:data="updateStepData(2, 'location', $event)"
            @validate="handleStepValidation(2, $event)"
          />
          
          <VendorsStep 
            v-if="currentStep === 3"
            ref="step3"
            :data="stepData.vendors"
            :errors="stepErrors[3]"
            @update:data="updateStepData(3, 'vendors', $event)"
            @validate="validateStep(3)"
          />
          
          <BudgetStep 
            v-if="currentStep === 4"
            ref="step4"
            :data="stepData.budget"
            :errors="stepErrors[4]"
            @update:data="updateStepData(4, 'budget', $event)"
            @validate="validateStep(4)"
          />
        </div>

        <!-- Navigation -->
        <div class="wizard-navigation mt-6 flex items-center justify-between">
          <Button
            v-if="currentStep > 1"
            variant="outline"
            @click="previousStep"
            :disabled="isLoading"
            class="flex items-center"
          >
            <ChevronLeft class="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div v-else></div>

          <div class="flex items-center space-x-3">
            <Button
              v-if="currentStep < totalSteps"
              @click="nextStep"
              :disabled="isLoading || !canProceed"
              class="flex items-center"
            >
              Next
              <ChevronRight class="h-4 w-4 ml-1" />
            </Button>
            
            <Button
              v-if="currentStep === totalSteps"
              @click="completeWizard"
              :disabled="isLoading || !canProceed"
              variant="default"
              class="flex items-center"
            >
              <Save class="h-4 w-4 mr-1" />
              Create Project
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="loading-content bg-white rounded-lg p-6 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600">{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui'
import { 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Save
} from 'lucide-vue-next'

// Import step components
import ProjectDetailsStep from './steps/ProjectDetailsStep.vue'
import LocationStep from './steps/LocationStep.vue'
import VendorsStep from './steps/VendorsStep.vue'
import BudgetStep from './steps/BudgetStep.vue'

// Import services
import { projectWizardService } from '@/services/projectWizardService'
import { useToast } from '@/composables/useToast'

// Composables
const router = useRouter()
const { showSuccess, showError } = useToast()

// Enhanced state for completion and error handling
const showCompletionModal = ref(false)
const showErrorModal = ref(false)
const createdProject = ref(null)
const errorTitle = ref('')
const errorMessage = ref('')
const errorDetails = ref('')
const retryAvailable = ref(false)
const lastFailedAction = ref(null)

// Reactive state
const currentStep = ref(1)
const totalSteps = ref(4)
const sessionId = ref(null)
const isLoading = ref(false)
const lastSaveStatus = ref(null)
const autoSaveTimeout = ref(null)
const isAutoSaveEnabled = ref(true)
const AUTO_SAVE_DELAY = 2000 // 2 seconds delay
const globalError = ref(null)
const successMessage = ref(null)
const isCompleted = ref(false)
const loadingMessage = ref('Loading...')

// Step data
const stepData = reactive({
  details: {},
  location: {},
  vendors: {},
  budget: {}
})

// Step errors
const stepErrors = reactive({
  1: [],
  2: [],
  3: [],
  4: []
})

// Steps configuration
const steps = ref([
  { id: 1, title: 'Project Details', description: 'Basic project information' },
  { id: 2, title: 'Location', description: 'Project location details' },
  { id: 3, title: 'Vendors', description: 'Select project vendors' },
  { id: 4, title: 'Budget', description: 'Set project budget' }
])

// Computed properties
const progressPercentage = computed(() => {
  return (currentStep.value / totalSteps.value) * 100
})

const saveStatusText = computed(() => {
  if (lastSaveStatus.value === 'saving') return 'Saving...'
  if (lastSaveStatus.value === 'success') return 'Saved'
  if (lastSaveStatus.value === 'error') return 'Save failed'
  if (!isAutoSaveEnabled.value) return 'Auto-save paused'
  return 'Auto-save enabled'
})

const canProceed = computed(() => {
  // Add null safety check
  const errors = stepErrors[currentStep.value]
  return errors ? errors.length === 0 : true
})

// Methods
const updateStepData = (stepId, dataKey, data) => {
  stepData[dataKey] = { ...stepData[dataKey], ...data }
  autoSave()
}

const validateStep = async (stepId) => {
  try {
    const stepKey = ['details', 'location', 'vendors', 'budget'][stepId - 1]
    const currentStepData = stepData[stepKey]
    
    // Clear previous errors - ensure stepErrors[stepId] exists
    if (!stepErrors[stepId]) {
      stepErrors[stepId] = []
    }
    stepErrors[stepId] = []
    
    // Client-side validation first
    switch (stepId) {
      case 1: // Project Details
        if (!currentStepData.projectName || currentStepData.projectName.trim().length < 3) {
          stepErrors[stepId].push({ field: 'projectName', message: 'Project name must be at least 3 characters' })
        }
        if (!currentStepData.description || currentStepData.description.trim().length < 10) {
          stepErrors[stepId].push({ field: 'description', message: 'Description must be at least 10 characters' })
        }
        if (!currentStepData.category) {
          stepErrors[stepId].push({ field: 'category', message: 'Project category is required' })
        }
        break
        
      case 2: // Location
        if (!currentStepData.primaryLocation || currentStepData.primaryLocation.trim().length < 2) {
          stepErrors[stepId].push({ field: 'primaryLocation', message: 'Primary location is required' })
        }
        break
        
      case 3: // Vendors
        // Vendors are optional, but if added, validate them
        if (currentStepData.vendors && currentStepData.vendors.length > 0) {
          currentStepData.vendors.forEach((vendor, index) => {
            if (!vendor.role || vendor.role.trim().length < 2) {
              stepErrors[stepId].push({ field: `vendor_${index}_role`, message: `Vendor ${index + 1} role is required` })
            }
          })
        }
        break
        
      case 4: // Budget
        if (!currentStepData.totalBudget || currentStepData.totalBudget <= 0) {
          stepErrors[stepId].push({ field: 'totalBudget', message: 'Total budget must be greater than 0' })
        }
        if (currentStepData.initialBudget && currentStepData.initialBudget > currentStepData.totalBudget) {
          stepErrors[stepId].push({ field: 'initialBudget', message: 'Initial budget cannot exceed total budget' })
        }
        break
    }
    
    // If client-side validation passes, do server-side validation
    const currentErrors = stepErrors[stepId] || []
    if (currentErrors.length === 0) {
      try {
        await projectWizardService.validateStep(stepId, currentStepData)
        // If no error is thrown, validation passed
      } catch (serverError) {
        console.warn('Server validation failed, using client-side validation only:', serverError)
        // Continue with client-side validation only
      }
    }
  } catch (error) {
    console.error('Validation error:', error)
    // Ensure stepErrors[stepId] exists before setting
    if (!stepErrors[stepId]) {
      stepErrors[stepId] = []
    }
    stepErrors[stepId] = [{ field: 'general', message: 'Validation failed. Please check your input.' }]
  }
}

const handleStepValidation = (stepId, errors) => {
  // Update step errors with validation results from step component
  // Ensure stepErrors[stepId] exists before setting
  if (!stepErrors[stepId]) {
    stepErrors[stepId] = []
  }
  stepErrors[stepId] = errors || []
  console.log(`Step ${stepId} validation:`, errors)
}

const nextStep = async () => {
  await validateStep(currentStep.value)
  
  if (canProceed.value && currentStep.value < totalSteps.value) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const autoSave = async () => {
  if (!sessionId.value || !isAutoSaveEnabled.value) return
  
  // Clear existing timeout
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
  
  // Set new timeout for debounced save
  autoSaveTimeout.value = setTimeout(async () => {
    try {
      lastSaveStatus.value = 'saving'
      const stepKey = ['details', 'location', 'vendors', 'budget'][currentStep.value - 1]
      await projectWizardService.saveStepData(sessionId.value, currentStep.value, stepData[stepKey])
      lastSaveStatus.value = 'success'
    } catch (error) {
      console.error('Auto-save failed:', error)
      lastSaveStatus.value = 'error'
      
      // If rate limited, disable auto-save temporarily
      if (error.message && error.message.includes('Too many requests')) {
        isAutoSaveEnabled.value = false
        setTimeout(() => {
          isAutoSaveEnabled.value = true
        }, 10000) // Re-enable after 10 seconds
      }
    }
  }, AUTO_SAVE_DELAY)
}

const completeWizard = async () => {
  // Disable auto-save during project creation
  isAutoSaveEnabled.value = false
  
  // Clear any pending auto-save
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
  
  isLoading.value = true
  loadingMessage.value = 'Creating project...'
  
  try {
    // Clear previous errors
    globalError.value = null
    successMessage.value = null
    
    // Validate all steps first
    let hasValidationErrors = false
    for (let i = 1; i <= totalSteps.value; i++) {
      await validateStep(i)
      const errors = stepErrors[i] || []
      if (errors.length > 0) {
        hasValidationErrors = true
        console.error(`Step ${i} validation errors:`, stepErrors[i])
      }
    }
    
    if (hasValidationErrors) {
      // Find first step with errors and navigate to it
      for (let i = 1; i <= totalSteps.value; i++) {
        const errors = stepErrors[i] || []
        if (errors.length > 0) {
          currentStep.value = i
          break
        }
      }
      throw new Error('Please fix validation errors before creating the project')
    }
    
    // Validate required data exists
    if (!stepData.details.projectName || stepData.details.projectName.trim().length < 3) {
      currentStep.value = 1
      throw new Error('Project name is required and must be at least 3 characters')
    }
    
    if (!stepData.details.description || stepData.details.description.trim().length < 10) {
      currentStep.value = 1
      throw new Error('Project description is required and must be at least 10 characters')
    }
    
    if (!stepData.budget.totalBudget || stepData.budget.totalBudget <= 0) {
      currentStep.value = 4
      throw new Error('Total budget must be greater than 0')
    }
    
    // Complete the wizard with enhanced error handling and workflow integration
    loadingMessage.value = 'Creating and finalizing project...'
    const result = await projectWizardService.completeWizard(sessionId.value)
    
    if (result.success && result.project) {
      isCompleted.value = true
      
      // Enhanced success message based on workflow status
      const statusMessage = result.project.workflow_status === 'finalized' 
        ? 'Project created and finalized successfully!' 
        : 'Project created successfully!'
      
      successMessage.value = statusMessage
      showSuccess(statusMessage)
      
      // Log workflow status for debugging
      console.log('Project workflow status:', result.project.workflow_status)
      console.log('Project lifecycle status:', result.project.lifecycle_status)
      
      // Clear wizard data
      sessionId.value = null
      
      // Redirect to project detail page with proper error handling
      setTimeout(() => {
        try {
          // Use the correct project ID field from the response
          const projectId = result.project.id || result.project.project_id
          if (projectId) {
            console.log('Navigating to project details:', projectId)
            router.push(`/projects/${projectId}`)
          } else {
            console.warn('No project ID found in response, redirecting to projects list')
            router.push('/projects')
          }
        } catch (routerError) {
          console.error('Navigation error:', routerError)
          // Fallback to projects list
          router.push('/projects')
        }
      }, 1500)
    } else {
      throw new Error(result.message || 'Failed to create project - no project data returned')
    }
  } catch (error) {
    console.error('Wizard completion failed:', error)
    
    // Provide specific error messages based on error type
    if (error.message.includes('validation errors') || error.message.includes('required')) {
      globalError.value = error.message
    } else if (error.message.includes('session not found') || error.message.includes('session expired')) {
      globalError.value = 'Your session has expired. Please start the wizard again.'
      // Reset wizard state
      sessionId.value = null
      currentStep.value = 1
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      globalError.value = 'Network error. Please check your connection and try again.'
    } else if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
      globalError.value = 'Authentication error. Please refresh the page and try again.'
    } else if (error.message.includes('workflow')) {
      globalError.value = 'Project was created but workflow finalization failed. You may need to finalize it manually.'
    } else {
      globalError.value = error.message || 'Failed to create project. Please try again.'
    }
    
    showError(globalError.value)
  } finally {
    isLoading.value = false
  }
}

const initializeWizard = async () => {
  isLoading.value = true
  loadingMessage.value = 'Initializing wizard...'
  globalError.value = null
  
  try {
    const result = await projectWizardService.initializeWizard(null)
    
    // If we reach here, the service call was successful (service validates response.data.success)
    sessionId.value = result.sessionId
    currentStep.value = result.currentStep || 1
    totalSteps.value = result.totalSteps || 4
    
    console.log('Wizard initialized successfully:', {
      sessionId: sessionId.value,
      currentStep: currentStep.value,
      totalSteps: totalSteps.value
    })
  } catch (error) {
    console.error('Wizard initialization failed:', error)
    
    // Provide specific error messages
    if (error.message.includes('network') || error.message.includes('fetch')) {
      globalError.value = 'Network error. Please check your connection and try again.'
    } else if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
      globalError.value = 'Authentication error. Please refresh the page and try again.'
    } else {
      globalError.value = 'Failed to initialize wizard. Please refresh the page and try again.'
    }
    
    showError(globalError.value)
  } finally {
    isLoading.value = false
  }
}

// Enhanced error handling methods
const showEnhancedError = (title, message, details = '', retry = false) => {
  errorTitle.value = title
  errorMessage.value = message
  errorDetails.value = details
  retryAvailable.value = retry
  showErrorModal.value = true
}

const getErrorMessage = (error) => {
  if (error.message.includes('validation errors') || error.message.includes('required')) {
    return error.message
  } else if (error.message.includes('session not found') || error.message.includes('session expired')) {
    return 'Your session has expired. Please start the wizard again.'
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  } else if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
    return 'Authentication error. Please refresh the page and try again.'
  } else if (error.message.includes('duplicate') || error.message.includes('already exists')) {
    return 'A project with this name already exists. Please choose a different name.'
  } else {
    return error.message || 'An unexpected error occurred. Please try again.'
  }
}

const retryLastAction = async () => {
  closeErrorModal()
  
  if (lastFailedAction.value === 'completeWizard') {
    await completeWizard()
  } else if (lastFailedAction.value === 'initializeWizard') {
    await initializeWizard()
  }
}

const closeErrorModal = () => {
  showErrorModal.value = false
  errorTitle.value = ''
  errorMessage.value = ''
  errorDetails.value = ''
  retryAvailable.value = false
  lastFailedAction.value = null
}

const navigateToProject = () => {
  showCompletionModal.value = false
  if (createdProject.value?.id) {
    router.push(`/projects/${createdProject.value.id}`)
  } else {
    router.push('/projects')
  }
}

const createAnotherProject = () => {
  showCompletionModal.value = false
  // Reset wizard state
  currentStep.value = 1
  sessionId.value = null
  createdProject.value = null
  isCompleted.value = false
  
  // Clear step data
  Object.keys(stepData).forEach(key => {
    stepData[key] = {}
  })
  
  // Clear errors
  Object.keys(stepErrors).forEach(key => {
    stepErrors[key] = []
  })
  
  // Initialize new wizard
  initializeWizard()
}

// Lifecycle
onMounted(() => {
  initializeWizard()
})

// Auto-save watcher with throttling
watch(stepData, () => {
  if (isAutoSaveEnabled.value) {
    autoSave()
  }
}, { deep: true })

// Cleanup on unmount
onUnmounted(() => {
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
})
</script>

<style scoped>
.project-wizard {
  min-height: 100vh;
  background-color: #f8fafc;
}

.wizard-header {
  border-bottom: 1px solid #e2e8f0;
}

.step-indicator {
  transition: all 0.3s ease;
}

.step-indicator:hover {
  transform: translateY(-1px);
}

.loading-overlay {
  backdrop-filter: blur(4px);
}

.error-banner, .success-banner {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-content {
  min-height: 400px;
}

.wizard-navigation {
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}
</style>

