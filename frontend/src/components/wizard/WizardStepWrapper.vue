<template>
  <div class="wizard-step-wrapper">
    <!-- Step Component -->
    <component
      :is="currentStepComponent"
      v-if="currentStepComponent"
      :key="stepKey"
      v-bind="stepProps"
      @step-completed="handleStepCompleted"
      @step-error="handleStepError"
      @navigation-request="handleNavigationRequest"
    />
    
    <!-- Fallback for unknown steps -->
    <div v-else class="unknown-step">
      <div class="error-icon">⚠️</div>
      <h2>Unknown Step</h2>
      <p>The requested wizard step "{{ currentStep }}" is not recognized.</p>
      <div class="error-actions">
        <router-link to="/wizard" class="btn btn-primary">
          Back to Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'

// Lazy load step components
const InitiationStep = defineAsyncComponent(() => import('./steps/InitiationStep.vue'))
const AssignmentStep = defineAsyncComponent(() => import('./steps/AssignmentStep.vue'))
const ConfigurationStep = defineAsyncComponent(() => import('./steps/ConfigurationStep.vue'))

// Composables
const route = useRoute()
const {
  wizardStore,
  authStore,
  handleWizardError
} = useProjectWizardIntegration()

// Emits
const emit = defineEmits<{
  'step-completed': [stepData: any]
  'step-error': [error: string]
  'navigation-request': [direction: 'next' | 'previous' | 'complete']
}>()

// Computed properties
const currentStep = computed(() => {
  // Get step from route params or determine from project state
  const routeStep = route.params.step as string
  if (routeStep) return routeStep
  
  // Determine step based on route name
  const routeName = route.name as string
  if (routeName?.includes('initiate')) return 'initiate'
  if (routeName?.includes('assign')) return 'assign'
  if (routeName?.includes('configure')) return 'configure'
  
  return 'initiate' // Default fallback
})

const currentStepComponent = computed(() => {
  switch (currentStep.value) {
    case 'initiate':
      return InitiationStep
    case 'assign':
      return AssignmentStep
    case 'configure':
      return ConfigurationStep
    default:
      return null
  }
})

const stepKey = computed(() => {
  // Create unique key for component re-rendering
  const projectId = route.params.projectId as string
  return `${currentStep.value}-${projectId || 'new'}-${Date.now()}`
})

const stepProps = computed(() => {
  // Pass relevant props to step components
  const baseProps = {
    projectId: route.params.projectId as string,
    isEditing: !!route.params.projectId,
    currentProject: wizardStore.project,
    userRole: authStore.currentUser?.role
  }
  
  // Add step-specific props
  switch (currentStep.value) {
    case 'initiate':
      return {
        ...baseProps,
        initiationData: wizardStore.initiation
      }
    case 'assign':
      return {
        ...baseProps,
        assignmentData: wizardStore.assignment
      }
    case 'configure':
      return {
        ...baseProps,
        finalizationData: wizardStore.finalization
      }
    default:
      return baseProps
  }
})

// Methods
const handleStepCompleted = (stepData: any) => {
  console.log('Step completed in wrapper:', currentStep.value, stepData)
  emit('step-completed', stepData)
}

const handleStepError = (error: string) => {
  console.error('Step error in wrapper:', currentStep.value, error)
  handleWizardError(new Error(error))
  emit('step-error', error)
}

const handleNavigationRequest = (direction: 'next' | 'previous' | 'complete') => {
  console.log('Navigation request in wrapper:', direction)
  emit('navigation-request', direction)
}
</script>

<style scoped>
.wizard-step-wrapper {
  width: 100%;
  min-height: 400px;
}

/* Unknown Step Styles */
.unknown-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #ffc107;
}

.unknown-step h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1rem;
}

.unknown-step p {
  color: #6c757d;
  margin: 0 0 2rem;
  max-width: 400px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

/* Responsive Design */
@media (max-width: 768px) {
  .unknown-step {
    padding: 2rem 1rem;
  }
  
  .error-icon {
    font-size: 3rem;
  }
  
  .unknown-step h2 {
    font-size: 1.25rem;
  }
  
  .error-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .btn {
    width: 100%;
  }
}
</style>

