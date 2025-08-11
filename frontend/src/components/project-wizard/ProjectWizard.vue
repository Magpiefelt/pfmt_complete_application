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
            @validate="validateStep(2)"
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
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

// Reactive state
const currentStep = ref(1)
const totalSteps = ref(4)
const sessionId = ref(null)
const isLoading = ref(false)
const lastSaveStatus = ref(null)
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
  if (lastSaveStatus.value === 'success') return 'Saved'
  if (lastSaveStatus.value === 'error') return 'Save failed'
  return 'Auto-save enabled'
})

const canProceed = computed(() => {
  return stepErrors[currentStep.value].length === 0
})

// Methods
const updateStepData = (stepId, dataKey, data) => {
  stepData[dataKey] = { ...stepData[dataKey], ...data }
  autoSave()
}

const validateStep = async (stepId) => {
  try {
    const stepKey = ['details', 'location', 'vendors', 'budget'][stepId - 1]
    const result = await projectWizardService.validateStepData(stepId, stepData[stepKey])
    
    if (result.success) {
      stepErrors[stepId] = []
    } else {
      stepErrors[stepId] = result.errors || []
    }
  } catch (error) {
    console.error('Validation error:', error)
    stepErrors[stepId] = [{ field: 'general', message: 'Validation failed' }]
  }
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
  if (!sessionId.value) return
  
  try {
    const stepKey = ['details', 'location', 'vendors', 'budget'][currentStep.value - 1]
    await projectWizardService.saveStepData(sessionId.value, currentStep.value, stepData[stepKey])
    lastSaveStatus.value = 'success'
  } catch (error) {
    console.error('Auto-save failed:', error)
    lastSaveStatus.value = 'error'
  }
}

const completeWizard = async () => {
  isLoading.value = true
  loadingMessage.value = 'Creating project...'
  
  try {
    // Validate all steps
    for (let i = 1; i <= totalSteps.value; i++) {
      await validateStep(i)
      if (stepErrors[i].length > 0) {
        throw new Error(`Step ${i} has validation errors`)
      }
    }
    
    // Complete the wizard
    const result = await projectWizardService.completeWizard(sessionId.value)
    
    if (result.success) {
      isCompleted.value = true
      successMessage.value = 'Project created successfully!'
      showSuccess('Project created successfully!')
      
      // Redirect to project detail page
      setTimeout(() => {
        router.push(`/projects/${result.project.id}`)
      }, 2000)
    } else {
      throw new Error(result.message || 'Failed to create project')
    }
  } catch (error) {
    console.error('Wizard completion failed:', error)
    globalError.value = error.message
    showError('Failed to create project. Please try again.')
  } finally {
    isLoading.value = false
  }
}

const initializeWizard = async () => {
  isLoading.value = true
  loadingMessage.value = 'Initializing wizard...'
  
  try {
    const result = await projectWizardService.initializeWizard()
    
    if (result.success) {
      sessionId.value = result.sessionId
      currentStep.value = result.currentStep || 1
      totalSteps.value = result.totalSteps || 4
    } else {
      throw new Error(result.message || 'Failed to initialize wizard')
    }
  } catch (error) {
    console.error('Wizard initialization failed:', error)
    globalError.value = 'Failed to initialize wizard. Please refresh the page.'
    showError('Failed to initialize wizard')
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  initializeWizard()
})

// Auto-save watcher
watch(stepData, () => {
  autoSave()
}, { deep: true })
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

