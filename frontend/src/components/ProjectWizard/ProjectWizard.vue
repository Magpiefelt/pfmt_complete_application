<template>
  <div class="project-wizard">
    <!-- Wizard Header -->
    <div class="wizard-header">
      <h1 class="wizard-title">Project Creation Wizard</h1>
      <p class="wizard-subtitle">{{ getStepDescription() }}</p>
    </div>

    <!-- Progress Stepper -->
    <div class="wizard-stepper">
      <div 
        v-for="(step, index) in steps" 
        :key="step.id"
        class="step"
        :class="{
          'active': currentStep === index,
          'completed': index < currentStep,
          'disabled': !canAccessStep(index)
        }"
      >
        <div class="step-indicator">
          <span v-if="index < currentStep" class="step-check">✓</span>
          <span v-else class="step-number">{{ index + 1 }}</span>
        </div>
        <div class="step-info">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-role">{{ step.role }}</div>
        </div>
      </div>
    </div>

    <!-- Wizard Content -->
    <div class="wizard-content">
      <component 
        :is="currentStepComponent"
        :project-data="projectData"
        :validation-errors="validationErrors"
        @update:project-data="updateProjectData"
        @next="handleNext"
        @previous="handlePrevious"
        @submit="handleSubmit"
      />
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/constants/roles'
import InitiationStep from './steps/InitiationStep.vue'
import TeamAssignmentStep from './steps/TeamAssignmentStep.vue'
import ConfigurationStep from './steps/ConfigurationStep.vue'
import ReviewStep from './steps/ReviewStep.vue'

interface ProjectData {
  // Initiation data
  name?: string
  description?: string
  program_id?: string
  client_ministry_id?: string
  estimated_budget?: number
  start_date?: string
  end_date?: string
  project_type?: string
  delivery_method?: string
  project_category?: string
  geographic_region?: string
  
  // Assignment data
  assigned_pm?: string
  assigned_spm?: string
  
  // Configuration data
  milestones?: any[]
  vendors?: any[]
  budget_breakdown?: any
  detailed_description?: string
  risk_assessment?: string
  
  // Workflow metadata
  status?: string
  created_by?: string
  assigned_by?: string
  finalized_by?: string
}

interface WizardStep {
  id: string
  title: string
  role: string
  component: string
  requiredRole: string[]
  canEdit: (userRole: string, projectStatus: string) => boolean
}

const router = useRouter()
const authStore = useAuthStore()

// State
const currentStep = ref(0)
const projectData = ref<ProjectData>({})
const validationErrors = ref<Record<string, string>>({})
const loading = ref(false)
const loadingMessage = ref('')

// Wizard steps configuration
const steps: WizardStep[] = [
  {
    id: 'initiation',
    title: 'Project Initiation',
    role: 'PM&I',
    component: 'InitiationStep',
    requiredRole: [ROLES.PMI, ROLES.ADMIN],
    canEdit: (userRole, status) => 
      [ROLES.PMI, ROLES.ADMIN].includes(userRole as any) && 
      (!status || status === 'initiated')
  },
  {
    id: 'assignment',
    title: 'Team Assignment',
    role: 'Director',
    component: 'TeamAssignmentStep',
    requiredRole: [ROLES.DIRECTOR, ROLES.ADMIN],
    canEdit: (userRole, status) => 
      [ROLES.DIRECTOR, ROLES.ADMIN].includes(userRole as any) && 
      status === 'initiated'
  },
  {
    id: 'configuration',
    title: 'Project Configuration',
    role: 'PM/SPM',
    component: 'ConfigurationStep',
    requiredRole: [ROLES.PM, ROLES.SPM, ROLES.ADMIN],
    canEdit: (userRole, status) => 
      [ROLES.PM, ROLES.SPM, ROLES.ADMIN].includes(userRole as any) && 
      status === 'assigned'
  },
  {
    id: 'review',
    title: 'Review & Finalize',
    role: 'PM/SPM',
    component: 'ReviewStep',
    requiredRole: [ROLES.PM, ROLES.SPM, ROLES.ADMIN],
    canEdit: (userRole, status) => 
      [ROLES.PM, ROLES.SPM, ROLES.ADMIN].includes(userRole as any) && 
      status === 'assigned'
  }
]

// Computed
const currentStepComponent = computed(() => {
  const stepMap: Record<string, any> = {
    'InitiationStep': InitiationStep,
    'TeamAssignmentStep': TeamAssignmentStep,
    'ConfigurationStep': ConfigurationStep,
    'ReviewStep': ReviewStep
  }
  return stepMap[steps[currentStep.value].component]
})

const canAccessStep = (stepIndex: number): boolean => {
  const step = steps[stepIndex]
  const userRole = authStore.currentUser.role
  const projectStatus = projectData.value.status || ''
  
  // Check role permission
  if (!step.requiredRole.includes(userRole)) {
    return false
  }
  
  // Check if step can be edited based on current state
  return step.canEdit(userRole, projectStatus)
}

// Methods
const getStepDescription = (): string => {
  const descriptions = [
    'Initiate a new project with basic information and requirements',
    'Assign project manager and senior project manager to the project',
    'Configure project details, milestones, and resources',
    'Review all information and finalize the project setup'
  ]
  return descriptions[currentStep.value] || ''
}

const updateProjectData = (data: Partial<ProjectData>) => {
  projectData.value = { ...projectData.value, ...data }
  // Clear validation errors for updated fields
  Object.keys(data).forEach(key => {
    delete validationErrors.value[key]
  })
}

const validateCurrentStep = (): boolean => {
  validationErrors.value = {}
  
  switch (currentStep.value) {
    case 0: // Initiation
      if (!projectData.value.name) {
        validationErrors.value.name = 'Project name is required'
      }
      if (!projectData.value.description) {
        validationErrors.value.description = 'Project description is required'
      }
      if (!projectData.value.estimated_budget) {
        validationErrors.value.estimated_budget = 'Estimated budget is required'
      }
      break
      
    case 1: // Assignment
      if (!projectData.value.assigned_pm && !projectData.value.assigned_spm) {
        validationErrors.value.assignment = 'At least one team member must be assigned'
      }
      break
      
    case 2: // Configuration
      if (!projectData.value.detailed_description) {
        validationErrors.value.detailed_description = 'Detailed description is required'
      }
      break
  }
  
  return Object.keys(validationErrors.value).length === 0
}

const handleNext = async () => {
  if (!validateCurrentStep()) {
    return
  }
  
  loading.value = true
  loadingMessage.value = 'Saving progress...'
  
  try {
    // Save current step data
    await saveStepData()
    
    if (currentStep.value < steps.length - 1) {
      currentStep.value++
    }
  } catch (error) {
    console.error('Error saving step data:', error)
    // Handle error
  } finally {
    loading.value = false
  }
}

const handlePrevious = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleSubmit = async () => {
  if (!validateCurrentStep()) {
    return
  }
  
  loading.value = true
  loadingMessage.value = 'Finalizing project...'
  
  try {
    // Submit final project
    await submitProject()
    
    // Redirect to project detail or success page
    router.push('/projects')
  } catch (error) {
    console.error('Error submitting project:', error)
    // Handle error
  } finally {
    loading.value = false
  }
}

const saveStepData = async () => {
  // Implementation depends on current step
  const stepId = steps[currentStep.value].id
  
  switch (stepId) {
    case 'initiation':
      // Call project initiation API
      break
    case 'assignment':
      // Call team assignment API
      break
    case 'configuration':
      // Save configuration data
      break
  }
}

const submitProject = async () => {
  // Call project finalization API
}

// Initialize wizard based on user role and existing project
onMounted(() => {
  const userRole = authStore.currentUser.role
  
  // Determine starting step based on user role
  if (userRole === ROLES.PMI) {
    currentStep.value = 0
  } else if (userRole === ROLES.DIRECTOR) {
    currentStep.value = 1
  } else if ([ROLES.PM, ROLES.SPM].includes(userRole)) {
    currentStep.value = 2
  }
  
  // Load existing project data if editing
  // This would be implemented based on route params
})
</script>

<style scoped>
.project-wizard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.wizard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.wizard-title {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.wizard-subtitle {
  color: #6b7280;
  font-size: 1.1rem;
}

.wizard-stepper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3rem;
  position: relative;
}

.wizard-stepper::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e5e7eb;
  z-index: 1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  flex: 1;
}

.step-indicator {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
  background: #e5e7eb;
  color: #6b7280;
}

.step.active .step-indicator {
  background: #3b82f6;
  color: white;
}

.step.completed .step-indicator {
  background: #10b981;
  color: white;
}

.step.disabled .step-indicator {
  background: #f3f4f6;
  color: #d1d5db;
}

.step-info {
  text-align: center;
}

.step-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.step.disabled .step-title {
  color: #d1d5db;
}

.step-role {
  font-size: 0.875rem;
  color: #6b7280;
}

.step.disabled .step-role {
  color: #d1d5db;
}

.wizard-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  min-height: 500px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .wizard-stepper {
    flex-direction: column;
    gap: 1rem;
  }
  
  .wizard-stepper::before {
    display: none;
  }
  
  .step {
    flex-direction: row;
    justify-content: flex-start;
    text-align: left;
  }
  
  .step-indicator {
    margin-right: 1rem;
    margin-bottom: 0;
  }
}
</style>

