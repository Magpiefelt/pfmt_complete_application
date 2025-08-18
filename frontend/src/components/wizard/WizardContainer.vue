<template>
  <div class="wizard-container">
    <!-- Wizard Header -->
    <div class="wizard-header">
      <div class="header-content">
        <div class="wizard-branding">
          <h1 class="wizard-title">Project Wizard</h1>
          <p class="wizard-subtitle">Streamlined project creation and management</p>
        </div>
        
        <div class="wizard-actions">
          <button
            v-if="canExitWizard"
            @click="exitWizard"
            class="btn btn-outline btn-sm"
          >
            Exit Wizard
          </button>
          
          <div class="user-info">
            <span class="user-name">{{ currentUser?.name || 'User' }}</span>
            <span class="user-role">{{ getRoleDisplayName(currentUser?.role) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div v-if="showProgress" class="progress-section">
      <div class="progress-container">
        <div class="progress-steps">
          <div
            v-for="(step, index) in availableSteps"
            :key="step.id"
            class="progress-step"
            :class="{
              'completed': isStepCompleted(step.id),
              'active': isStepActive(step.id),
              'accessible': isStepAccessible(step.id),
              'locked': !isStepAccessible(step.id)
            }"
            @click="navigateToStep(step.id)"
          >
            <div class="step-indicator">
              <span v-if="isStepCompleted(step.id)" class="step-icon">✓</span>
              <span v-else-if="!isStepAccessible(step.id)" class="step-icon">🔒</span>
              <span v-else class="step-number">{{ index + 1 }}</span>
            </div>
            <div class="step-info">
              <div class="step-title">{{ step.title }}</div>
              <div class="step-description">{{ step.description }}</div>
            </div>
          </div>
        </div>
        
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="wizard-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">{{ loadingMessage }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">Something went wrong</h3>
        <p class="error-message">{{ error }}</p>
        <div class="error-actions">
          <button @click="retryOperation" class="btn btn-primary">
            Try Again
          </button>
          <button @click="goToDashboard" class="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>

      <!-- Wizard Content -->
      <div v-else class="wizard-main">
        <!-- Step Content -->
        <div class="step-content">
          <router-view
            :key="routeKey"
            @step-completed="handleStepCompleted"
            @step-error="handleStepError"
            @navigation-request="handleNavigationRequest"
            @project-updated="handleProjectUpdated"
          />
        </div>

        <!-- Wizard Navigation -->
        <div class="wizard-navigation">
          <div class="nav-left">
            <button
              v-if="canGoPrevious"
              @click="goToPreviousStep"
              class="btn btn-secondary"
              :disabled="isNavigating"
            >
              ← Previous Step
            </button>
          </div>

          <div class="nav-center">
            <div v-if="hasUnsavedChanges" class="unsaved-indicator">
              <span class="unsaved-icon">●</span>
              <span class="unsaved-text">Unsaved changes</span>
            </div>
            
            <div v-if="lastSaved" class="last-saved">
              Last saved: {{ formatTime(lastSaved) }}
            </div>
          </div>

          <div class="nav-right">
            <button
              v-if="canGoNext"
              @click="goToNextStep"
              class="btn btn-primary"
              :disabled="isNavigating || !canProceed"
            >
              Next Step →
            </button>
            
            <button
              v-else-if="canComplete"
              @click="completeWizard"
              class="btn btn-success"
              :disabled="isNavigating || !canProceed"
            >
              Complete Project
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Auto-save Indicator -->
    <div v-if="showAutoSaveIndicator" class="auto-save-indicator">
      <span class="save-icon">💾</span>
      <span class="save-text">Auto-saved</span>
    </div>

    <!-- Confirmation Modals -->
    <div v-if="showExitConfirmation" class="modal-overlay" @click="cancelExit">
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">Exit Wizard?</h3>
        <p class="modal-message">
          You have unsaved changes. Are you sure you want to exit the wizard?
        </p>
        <div class="modal-actions">
          <button @click="cancelExit" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="confirmExit" class="btn btn-danger">
            Exit Without Saving
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'
import { useWizardPersistence } from '@/composables/useWizardPersistence'
import { WIZARD_STEPS, type WizardStepId } from '@/router/wizardRoutes'
import { ROLE_DISPLAY_NAMES } from '@/constants/roles'

// Composables
const route = useRoute()
const router = useRouter()
const {
  wizardStore,
  authStore,
  submitCurrentStep,
  navigateToProjectDetails,
  handleWizardError
} = useProjectWizardIntegration()

const {
  saveState,
  loadState,
  clearState
} = useWizardPersistence()

// Local state
const isLoading = ref(false)
const isNavigating = ref(false)
const error = ref('')
const loadingMessage = ref('Loading...')
const showExitConfirmation = ref(false)
const showAutoSaveIndicator = ref(false)
const autoSaveTimer = ref<NodeJS.Timeout | null>(null)
const lastSaved = ref<Date | null>(null)

// Computed properties
const currentUser = computed(() => authStore.currentUser)

const routeKey = computed(() => {
  // Force re-render when route changes
  return `${route.name}-${route.params.projectId || 'new'}-${Date.now()}`
})

const currentStepId = computed(() => {
  const routeName = route.name as string
  if (routeName?.includes('initiate')) return 'initiate'
  if (routeName?.includes('assign')) return 'assign'
  if (routeName?.includes('configure')) return 'configure'
  return 'initiate'
})

const availableSteps = computed(() => {
  const userRole = currentUser.value?.role
  if (!userRole) return []

  return Object.values(WIZARD_STEPS).filter(step => {
    return step.requiredRoles.includes(userRole) || userRole === 'admin'
  }).sort((a, b) => a.order - b.order)
})

const showProgress = computed(() => {
  return availableSteps.value.length > 1
})

const progressPercentage = computed(() => {
  const steps = availableSteps.value
  if (steps.length === 0) return 0
  
  const currentIndex = steps.findIndex(step => step.id === currentStepId.value)
  if (currentIndex === -1) return 0
  
  return ((currentIndex + 1) / steps.length) * 100
})

const canExitWizard = computed(() => {
  return route.name !== 'wizard-dashboard'
})

const hasUnsavedChanges = computed(() => {
  return wizardStore.hasUnsavedChanges
})

const canGoPrevious = computed(() => {
  const steps = availableSteps.value
  const currentIndex = steps.findIndex(step => step.id === currentStepId.value)
  return currentIndex > 0
})

const canGoNext = computed(() => {
  const steps = availableSteps.value
  const currentIndex = steps.findIndex(step => step.id === currentStepId.value)
  return currentIndex >= 0 && currentIndex < steps.length - 1
})

const canComplete = computed(() => {
  const steps = availableSteps.value
  const currentIndex = steps.findIndex(step => step.id === currentStepId.value)
  return currentIndex === steps.length - 1
})

const canProceed = computed(() => {
  // Check if current step is valid and can proceed
  return !wizardStore.hasValidationErrors && !isLoading.value
})

// Methods
const getRoleDisplayName = (role?: string) => {
  if (!role) return 'Unknown'
  return ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role
}

const isStepCompleted = (stepId: WizardStepId) => {
  const project = wizardStore.project
  if (!project) return false
  
  switch (stepId) {
    case 'initiate':
      return !!project.name && !!project.description
    case 'assign':
      return !!project.assigned_pm
    case 'configure':
      return project.workflow_status === 'active'
    default:
      return false
  }
}

const isStepActive = (stepId: WizardStepId) => {
  return currentStepId.value === stepId
}

const isStepAccessible = (stepId: WizardStepId) => {
  const userRole = currentUser.value?.role
  if (!userRole) return false
  
  const step = WIZARD_STEPS[stepId.toUpperCase() as keyof typeof WIZARD_STEPS]
  if (!step) return false
  
  // Check role permissions
  if (!step.requiredRoles.includes(userRole) && userRole !== 'admin') {
    return false
  }
  
  // Check workflow status requirements
  const project = wizardStore.project
  if (step.requiredStatus && step.requiredStatus.length > 0 && project) {
    return step.requiredStatus.includes(project.workflow_status)
  }
  
  return true
}

const navigateToStep = (stepId: WizardStepId) => {
  if (!isStepAccessible(stepId) || isNavigating.value) return
  
  const projectId = route.params.projectId as string
  const routeName = projectId ? `wizard-project-${stepId}` : `wizard-${stepId}`
  
  isNavigating.value = true
  
  router.push({
    name: routeName,
    params: projectId ? { projectId } : {}
  }).finally(() => {
    isNavigating.value = false
  })
}

const goToPreviousStep = () => {
  const steps = availableSteps.value
  const currentIndex = steps.findIndex(step => step.id === currentStepId.value)
  
  if (currentIndex > 0) {
    const previousStep = steps[currentIndex - 1]
    navigateToStep(previousStep.id as WizardStepId)
  }
}

const goToNextStep = () => {
  const steps = availableSteps.value
  const currentIndex = steps.findIndex(step => step.id === currentStepId.value)
  
  if (currentIndex >= 0 && currentIndex < steps.length - 1) {
    const nextStep = steps[currentIndex + 1]
    navigateToStep(nextStep.id as WizardStepId)
  }
}

const completeWizard = async () => {
  try {
    isNavigating.value = true
    const success = await submitCurrentStep()
    
    if (success) {
      await navigateToProjectDetails()
    }
  } catch (error: any) {
    handleWizardError(error)
  } finally {
    isNavigating.value = false
  }
}

const exitWizard = () => {
  if (hasUnsavedChanges.value) {
    showExitConfirmation.value = true
  } else {
    goToDashboard()
  }
}

const confirmExit = () => {
  showExitConfirmation.value = false
  clearState()
  goToDashboard()
}

const cancelExit = () => {
  showExitConfirmation.value = false
}

const goToDashboard = () => {
  router.push({ name: 'wizard-dashboard' })
}

const retryOperation = () => {
  error.value = ''
  // Reload current route
  router.go(0)
}

const handleStepCompleted = (stepData: any) => {
  console.log('Step completed:', currentStepId.value, stepData)
  
  // Auto-advance to next step if available
  if (canGoNext.value) {
    setTimeout(() => {
      goToNextStep()
    }, 1000)
  } else if (canComplete.value) {
    // Show completion message or navigate to project details
    setTimeout(() => {
      navigateToProjectDetails()
    }, 1000)
  }
}

const handleStepError = (errorMessage: string) => {
  error.value = errorMessage
}

const handleNavigationRequest = (direction: 'next' | 'previous' | 'complete') => {
  switch (direction) {
    case 'next':
      if (canGoNext.value) goToNextStep()
      break
    case 'previous':
      if (canGoPrevious.value) goToPreviousStep()
      break
    case 'complete':
      if (canComplete.value) completeWizard()
      break
  }
}

const handleProjectUpdated = (project: any) => {
  wizardStore.setProject(project)
}

const setupAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
  }
  
  autoSaveTimer.value = setInterval(async () => {
    if (hasUnsavedChanges.value) {
      try {
        await saveState()
        lastSaved.value = new Date()
        showAutoSaveIndicator.value = true
        
        setTimeout(() => {
          showAutoSaveIndicator.value = false
        }, 2000)
      } catch (error) {
        console.warn('Auto-save failed:', error)
      }
    }
  }, 30000) // Auto-save every 30 seconds
}

const cleanupAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Lifecycle
onMounted(async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Loading wizard...'
    
    // Load saved state if available
    await loadState()
    
    setupAutoSave()
  } catch (error: any) {
    console.error('Failed to initialize wizard:', error)
    handleWizardError(error)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  cleanupAutoSave()
})

// Watch for route changes
watch(() => route.fullPath, () => {
  error.value = '' // Clear errors on route change
})
</script>

<style scoped>
.wizard-container {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* Wizard Header */
.wizard-header {
  background: white;
  border-bottom: 1px solid #dee2e6;
  padding: 1rem 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wizard-branding h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
}

.wizard-subtitle {
  color: #6c757d;
  font-size: 0.875rem;
  margin: 0;
}

.wizard-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.875rem;
}

.user-name {
  font-weight: 500;
  color: #212529;
}

.user-role {
  color: #6c757d;
  font-size: 0.75rem;
}

/* Progress Section */
.progress-section {
  background: white;
  border-bottom: 1px solid #dee2e6;
  padding: 1.5rem 2rem;
}

.progress-container {
  max-width: 1200px;
  margin: 0 auto;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 0.375rem;
  flex: 1;
  max-width: 300px;
}

.progress-step:hover:not(.locked) {
  background: #f8f9fa;
}

.progress-step.active {
  background: #e3f2fd;
}

.progress-step.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-indicator {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.progress-step.completed .step-indicator {
  background: #28a745;
  color: white;
}

.progress-step.active .step-indicator {
  background: #007bff;
  color: white;
}

.progress-step:not(.completed):not(.active) .step-indicator {
  background: #e9ecef;
  color: #6c757d;
}

.progress-step.locked .step-indicator {
  background: #f8f9fa;
  color: #adb5bd;
}

.step-info {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-weight: 500;
  color: #212529;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.step-description {
  color: #6c757d;
  font-size: 0.75rem;
  line-height: 1.3;
}

.progress-bar {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

/* Main Content */
.wizard-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.loading-container,
.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #e9ecef;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #6c757d;
  font-size: 1rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 0.5rem;
}

.error-message {
  color: #6c757d;
  margin: 0 0 2rem;
  max-width: 400px;
}

.error-actions {
  display: flex;
  gap: 1rem;
}

.wizard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
}

.step-content {
  flex: 1;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

/* Wizard Navigation */
.wizard-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-left,
.nav-right {
  flex: 1;
}

.nav-right {
  display: flex;
  justify-content: flex-end;
}

.nav-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.unsaved-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffc107;
  font-size: 0.875rem;
  font-weight: 500;
}

.unsaved-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.last-saved {
  color: #6c757d;
  font-size: 0.75rem;
}

/* Buttons */
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
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
  border-color: #545b62;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #1e7e34;
  border-color: #1e7e34;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
  border-color: #bd2130;
}

.btn-outline {
  background-color: transparent;
  border-color: #6c757d;
  color: #6c757d;
}

.btn-outline:hover:not(:disabled) {
  background-color: #6c757d;
  color: white;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  min-width: auto;
}

/* Auto-save Indicator */
.auto-save-indicator {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #28a745;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1rem;
}

.modal-message {
  color: #6c757d;
  margin: 0 0 2rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Responsive Design */
@media (max-width: 768px) {
  .wizard-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .wizard-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .progress-section {
    padding: 1rem;
  }
  
  .progress-steps {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .progress-step {
    max-width: none;
  }
  
  .wizard-main {
    padding: 1rem;
  }
  
  .wizard-navigation {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-left,
  .nav-right,
  .nav-center {
    width: 100%;
    flex: none;
  }
  
  .nav-right {
    justify-content: center;
  }
  
  .btn {
    width: 100%;
  }
  
  .modal-content {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .auto-save-indicator {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .step-title {
    font-size: 0.75rem;
  }
  
  .step-description {
    font-size: 0.625rem;
  }
  
  .step-indicator {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }
}
</style>

