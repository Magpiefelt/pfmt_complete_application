<template>
  <div class="max-w-4xl mx-auto">
    <!-- Wizard Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <AlbertaText tag="h2" variant="heading-m" color="primary">
            Create New Project
          </AlbertaText>
          <button 
            @click="cancelWizard"
            class="text-gray-400 hover:text-gray-600"
          >
            <X class="h-6 w-6" />
          </button>
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="flex items-center justify-between mb-2">
            <AlbertaText variant="body-s" color="secondary">
              Step {{ currentStep }} of {{ totalSteps }}
            </AlbertaText>
            <AlbertaText variant="body-s" color="secondary">
              {{ Math.round((currentStep / totalSteps) * 100) }}% Complete
            </AlbertaText>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Step Indicators -->
        <div class="flex justify-between mt-4">
          <div 
            v-for="step in steps" 
            :key="step.id"
            class="flex flex-col items-center"
          >
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
              :class="getStepIndicatorClass(step.id)"
            >
              <CheckCircle 
                v-if="step.id < currentStep" 
                class="w-5 h-5 text-white" 
              />
              <span v-else>{{ step.id }}</span>
            </div>
            <AlbertaText 
              variant="body-xs" 
              :color="step.id <= currentStep ? 'primary' : 'secondary'"
              class="mt-1 text-center"
            >
              {{ step.title }}
            </AlbertaText>
          </div>
        </div>
      </div>
    </div>

    <!-- Wizard Content -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="p-6">
        <!-- Step 1: Template Selection -->
        <TemplateSelectionStep
          v-if="currentStep === 1"
          :selected-template="selectedTemplate"
          @template-selected="handleTemplateSelected"
          @step-completed="handleStepCompleted"
        />

        <!-- Step 2: Basic Information -->
        <BasicInformationStep
          v-else-if="currentStep === 2"
          :template="selectedTemplate"
          :data="wizardData.basicInfo || {}"
          @data-updated="updateBasicInfo"
          @step-completed="handleStepCompleted"
        />

        <!-- Step 3: Budget Setup -->
        <BudgetSetupStep
          v-else-if="currentStep === 3"
          :template="selectedTemplate"
          :data="wizardData.budgetInfo || {}"
          @data-updated="updateBudgetInfo"
          @step-completed="handleStepCompleted"
        />

        <!-- Step 4: Team Assignment -->
        <TeamAssignmentStep
          v-else-if="currentStep === 4"
          :data="wizardData.teamInfo || {}"
          @data-updated="updateTeamInfo"
          @step-completed="handleStepCompleted"
        />

        <!-- Step 5: Review and Create -->
        <ReviewStep
          v-else-if="currentStep === 5"
          :wizard-data="wizardData"
          :selected-template="selectedTemplate"
          @project-created="handleProjectCreated"
        />
      </div>

      <!-- Navigation -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
        <Button 
          variant="outline" 
          @click="previousStep"
          :disabled="currentStep === 1 || isProcessing"
        >
          <ArrowLeft class="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div class="flex space-x-3">
          <Button 
            variant="outline" 
            @click="saveDraft"
            :disabled="isProcessing"
            v-if="currentStep > 1"
          >
            Save Draft
          </Button>
          
          <Button 
            @click="nextStep"
            :disabled="!canProceed || isProcessing"
            v-if="currentStep < totalSteps"
          >
            Next
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>

          <Button 
            @click="createProject"
            :disabled="!canProceed || isProcessing"
            v-if="currentStep === totalSteps"
          >
            <LoadingSpinner v-if="isProcessing" class="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>
    </div>

    <!-- Auto-save Indicator -->
    <div 
      v-if="autoSaveStatus" 
      class="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center space-x-2"
    >
      <div 
        class="w-2 h-2 rounded-full"
        :class="autoSaveStatus === 'saving' ? 'bg-yellow-500' : 'bg-green-500'"
      ></div>
      <AlbertaText variant="body-xs" color="secondary">
        {{ autoSaveStatus === 'saving' ? 'Saving...' : 'Saved' }}
      </AlbertaText>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, X, CheckCircle } from 'lucide-vue-next'
import { Button, AlbertaText } from '@/components/ui'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import TemplateSelectionStep from './steps/TemplateSelectionStep.vue'
import BasicInformationStep from './steps/BasicInformationStep.vue'
import BudgetSetupStep from './steps/BudgetSetupStep.vue'
import TeamAssignmentStep from './steps/TeamAssignmentStep.vue'
import ReviewStep from './steps/ReviewStep.vue'
import { useProjectWizard } from '@/composables/useProjectWizard'
import { useProjectStore } from '@/stores/project'
import { useLoading } from '@/composables/useLoading'

// Props
const props = defineProps<{
  selectedTemplate?: any
}>()

// Emits
const emit = defineEmits<{
  wizardCompleted: [project: any]
  wizardCancelled: []
}>()

// Composables
const router = useRouter()

const {
  sessionId,
  currentStep,
  wizardData,
  isProcessing,
  autoSaveStatus,
  initializeWizard,
  saveStepData,
  saveDraft,
  completeWizard,
  validateStep
} = useProjectWizard()

const projectStore = useProjectStore()

// Use standardized loading state
const { isLoading: wizardLoading, withLoading } = useLoading('Processing...')

// Local state
const selectedTemplate = ref(props.selectedTemplate)
const totalSteps = 5

// Steps configuration
const steps = [
  { id: 1, title: 'Template' },
  { id: 2, title: 'Basic Info' },
  { id: 3, title: 'Budget' },
  { id: 4, title: 'Team' },
  { id: 5, title: 'Review' }
]

// Computed
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return selectedTemplate.value !== null
    case 2:
      return wizardData.basicInfo.projectName && 
             wizardData.basicInfo.description && 
             wizardData.basicInfo.category
    case 3:
      return wizardData.budgetInfo.totalBudget > 0
    case 4:
      return wizardData.teamInfo.projectManager
    case 5:
      return true
    default:
      return false
  }
})

// Methods
const getStepIndicatorClass = (stepId: number) => {
  if (stepId < currentStep.value) {
    return 'bg-green-500 text-white'
  } else if (stepId === currentStep.value) {
    return 'bg-blue-600 text-white'
  } else {
    return 'bg-gray-200 text-gray-600'
  }
}

const handleTemplateSelected = (template: any) => {
  selectedTemplate.value = template
}

const handleStepCompleted = (stepData: any) => {
  // Step-specific completion logic handled by individual step components
}

const updateBasicInfo = (data: any) => {
  Object.assign(wizardData.basicInfo, data)
}

const updateBudgetInfo = (data: any) => {
  Object.assign(wizardData.budgetInfo, data)
}

const updateTeamInfo = (data: any) => {
  Object.assign(wizardData.teamInfo, data)
}

const nextStep = async () => {
  if (!canProceed.value) return

  // Validate current step
  const validation = await validateStep(currentStep.value, getCurrentStepData())
  if (!validation.isValid) {
    alert('Please fix the following errors:\n' + validation.errors.join('\n'))
    return
  }

  // Save current step data
  await saveStepData(currentStep.value, getCurrentStepData())
  
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const getCurrentStepData = () => {
  switch (currentStep.value) {
    case 1:
      return { selectedTemplate: selectedTemplate.value }
    case 2:
      return wizardData.basicInfo
    case 3:
      return wizardData.budgetInfo
    case 4:
      return wizardData.teamInfo
    case 5:
      return { reviewCompleted: true }
    default:
      return {}
  }
}

const getStepData = (step: number) => {
  switch (step) {
    case 1:
      return { selectedTemplate: selectedTemplate.value }
    case 2:
      return wizardData.basicInfo
    case 3:
      return wizardData.budgetInfo
    case 4:
      return wizardData.teamInfo
    default:
      return {}
  }
}

const createProject = async () => {
  try {
    // Save all step data before completing the wizard
    for (let step = 1; step <= 4; step++) {
      const stepData = getStepData(step)
      if (stepData && Object.keys(stepData).length > 0) {
        await saveStepData(step, stepData)
      }
    }
    
    // Complete the wizard and get the project
    const project = await completeWizard()
    
    console.log('Project created successfully:', project)
    
    // Validate project has ID before navigation
    if (!project || !project.id) {
      throw new Error('Project creation failed - no project ID returned')
    }
    
    // Navigate to the project detail page
    await router.push({ 
      name: 'project-detail', 
      params: { id: project.id } 
    })
    
    // Show success notification
    // You can replace this with your notification system
    if (typeof window !== 'undefined' && window.alert) {
      setTimeout(() => {
        alert('Project created successfully!')
      }, 100)
    }
    
    // Emit the completion event with the project data
    emit('wizardCompleted', project)
  } catch (error: any) {
    console.error('Error creating project:', error)
    
    // Show user-friendly error message
    const errorMessage = error.message || 'An unexpected error occurred while creating your project.'
    
    if (typeof window !== 'undefined' && window.alert) {
      alert(`Error: ${errorMessage}`)
    }
    
    // Don't navigate on error - stay on wizard
    throw error
  }
}

const cancelWizard = () => {
  if (confirm('Are you sure you want to cancel? Any unsaved progress will be lost.')) {
    emit('wizardCancelled')
  }
}

const handleProjectCreated = async (project: any) => {
  try {
    // Update the project store to refresh the projects list
    await projectStore.addProject(project)
    
    // Emit the completion event
    emit('wizardCompleted', project)
  } catch (error) {
    console.error('Error handling project creation:', error)
    
    // Even if store update fails, still emit the completion event
    // The navigation will still work
    emit('wizardCompleted', project)
  }
}

// Auto-save functionality
let autoSaveInterval: NodeJS.Timeout | null = null

const startAutoSave = () => {
  autoSaveInterval = setInterval(async () => {
    // Skip auto-save for step 1 (template selection) and step 5 (review step)
    if (currentStep.value > 1 && currentStep.value < 5) {
      try {
        await saveStepData(currentStep.value, getCurrentStepData())
      } catch (error) {
        console.warn('Auto-save failed:', error)
        // Don't show error to user for auto-save failures
      }
    }
  }, 30000) // Auto-save every 30 seconds
}

const stopAutoSave = () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
  }
}

// Watch for template changes
watch(() => props.selectedTemplate, (newTemplate) => {
  if (newTemplate) {
    selectedTemplate.value = newTemplate
    // Pre-fill data from template
    if (newTemplate.template_data) {
      const templateData = typeof newTemplate.template_data === 'string' 
        ? JSON.parse(newTemplate.template_data) 
        : newTemplate.template_data
      
      // Pre-fill basic info
      wizardData.basicInfo.category = newTemplate.category
      wizardData.basicInfo.projectType = templateData.type || 'Standard'
      
      // Pre-fill budget info
      wizardData.budgetInfo.totalBudget = newTemplate.default_budget || 0
      wizardData.budgetInfo.estimatedDuration = newTemplate.estimated_duration || 365
    }
  }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  await initializeWizard()
  startAutoSave()
})

onUnmounted(() => {
  stopAutoSave()
})
</script>

<style scoped>
/* Wizard-specific styles */
.step-indicator {
  transition: all 0.2s ease-in-out;
}

.progress-bar {
  transition: width 0.3s ease-in-out;
}
</style>

