<template>
  <div class="assignment-step">
    <!-- Step Header -->
    <div class="step-header">
      <h2 class="step-title">Team Assignment</h2>
      <p class="step-description">
        Assign project manager and senior project manager to this project
      </p>
    </div>

    <!-- Project Information -->
    <div v-if="currentProject" class="project-info-card">
      <h3 class="project-name">{{ currentProject.name }}</h3>
      <p class="project-description">{{ currentProject.description }}</p>
      <div class="project-meta">
        <div class="meta-item">
          <span class="meta-label">Status:</span>
          <span class="status-badge status-initiated">Initiated</span>
        </div>
        <div v-if="currentProject.estimated_budget" class="meta-item">
          <span class="meta-label">Budget:</span>
          <span class="meta-value">${{ formatCurrency(currentProject.estimated_budget) }}</span>
        </div>
        <div v-if="currentProject.start_date" class="meta-item">
          <span class="meta-label">Start Date:</span>
          <span class="meta-value">{{ formatDate(currentProject.start_date) }}</span>
        </div>
      </div>
    </div>

    <!-- Assignment Form -->
    <form @submit.prevent="handleSubmit" class="assignment-form">
      <!-- Team Assignment Section -->
      <div class="form-section">
        <h3 class="section-title">Team Assignment</h3>
        
        <!-- Project Manager Assignment -->
        <div class="assignment-group">
          <div class="assignment-header">
            <h4 class="assignment-title">Project Manager (PM)</h4>
            <span class="assignment-required">Required</span>
          </div>
          
          <div class="form-group">
            <label for="project-manager" class="form-label">
              Select Project Manager
            </label>
            <select
              id="project-manager"
              v-model="formData.assigned_pm"
              class="form-select"
              :class="{ 'error': errors.assigned_pm }"
              required
              @change="validateField('assigned_pm')"
            >
              <option value="">Choose a project manager...</option>
              <option
                v-for="pm in availablePMs"
                :key="pm.id"
                :value="pm.id"
                :disabled="pm.id === formData.assigned_spm"
              >
                {{ pm.name }} ({{ pm.email }})
                <span v-if="pm.current_projects_count > 0">
                  - {{ pm.current_projects_count }} active project{{ pm.current_projects_count !== 1 ? 's' : '' }}
                </span>
              </option>
            </select>
            <div v-if="errors.assigned_pm" class="field-error">{{ errors.assigned_pm }}</div>
          </div>

          <!-- Selected PM Info -->
          <div v-if="selectedPM" class="selected-user-info">
            <div class="user-avatar">
              <span class="avatar-initials">{{ getInitials(selectedPM.name) }}</span>
            </div>
            <div class="user-details">
              <div class="user-name">{{ selectedPM.name }}</div>
              <div class="user-email">{{ selectedPM.email }}</div>
              <div class="user-workload">
                Current workload: {{ selectedPM.current_projects_count || 0 }} active projects
              </div>
            </div>
          </div>
        </div>

        <!-- Senior Project Manager Assignment -->
        <div class="assignment-group">
          <div class="assignment-header">
            <h4 class="assignment-title">Senior Project Manager (SPM)</h4>
            <span class="assignment-optional">Optional</span>
          </div>
          
          <div class="form-group">
            <label for="senior-project-manager" class="form-label">
              Select Senior Project Manager
            </label>
            <select
              id="senior-project-manager"
              v-model="formData.assigned_spm"
              class="form-select"
              @change="validateField('assigned_spm')"
            >
              <option value="">Choose a senior project manager (optional)...</option>
              <option
                v-for="spm in availableSPMs"
                :key="spm.id"
                :value="spm.id"
                :disabled="spm.id === formData.assigned_pm"
              >
                {{ spm.name }} ({{ spm.email }})
                <span v-if="spm.current_projects_count > 0">
                  - {{ spm.current_projects_count }} active project{{ spm.current_projects_count !== 1 ? 's' : '' }}
                </span>
              </option>
            </select>
          </div>

          <!-- Selected SPM Info -->
          <div v-if="selectedSPM" class="selected-user-info">
            <div class="user-avatar">
              <span class="avatar-initials">{{ getInitials(selectedSPM.name) }}</span>
            </div>
            <div class="user-details">
              <div class="user-name">{{ selectedSPM.name }}</div>
              <div class="user-email">{{ selectedSPM.email }}</div>
              <div class="user-workload">
                Current workload: {{ selectedSPM.current_projects_count || 0 }} active projects
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assignment Notes Section -->
      <div class="form-section">
        <h3 class="section-title">Assignment Notes</h3>
        
        <div class="form-group">
          <label for="assignment-notes" class="form-label">
            Notes (Optional)
          </label>
          <textarea
            id="assignment-notes"
            v-model="formData.assignment_notes"
            class="form-textarea"
            placeholder="Add any notes about the team assignment, special requirements, or considerations..."
            rows="4"
            maxlength="1000"
          ></textarea>
          <div class="field-hint">{{ (formData.assignment_notes || '').length }}/1000 characters</div>
        </div>
      </div>

      <!-- Validation Summary -->
      <div v-if="hasErrors" class="validation-summary">
        <div class="validation-header">
          <span class="validation-icon">⚠️</span>
          <span class="validation-title">Please fix the following issues:</span>
        </div>
        <ul class="validation-list">
          <li v-for="error in Object.values(errors)" :key="error" class="validation-item">
            {{ error }}
          </li>
        </ul>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingUsers" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading available team members...</p>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <div class="actions-left">
          <button
            type="button"
            @click="goBack"
            class="btn btn-secondary"
          >
            Back to Project
          </button>
        </div>

        <div class="actions-right">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || hasErrors || !isFormValid || isLoadingUsers"
          >
            {{ isSubmitting ? 'Assigning Team...' : 'Assign Team' }}
          </button>
        </div>
      </div>
    </form>

    <!-- Auto-save Indicator -->
    <div v-if="showAutoSaveIndicator" class="auto-save-indicator">
      <span class="save-icon">💾</span>
      <span class="save-text">Auto-saved</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'
import { useWizardPersistence } from '@/composables/useWizardPersistence'
import { ProjectWorkflowAPI } from '@/services/projectWorkflowApi'

// Composables
const router = useRouter()
const {
  wizardStore,
  authStore,
  submitCurrentStep,
  navigateToProjectDetails,
  handleWizardError
} = useProjectWizardIntegration()

const {
  saveState
} = useWizardPersistence()

// Local state
const isSubmitting = ref(false)
const isLoadingUsers = ref(true)
const showAutoSaveIndicator = ref(false)
const autoSaveTimer = ref<NodeJS.Timeout | null>(null)
const availablePMs = ref<any[]>([])
const availableSPMs = ref<any[]>([])

// Form data
const formData = reactive({
  assigned_pm: '',
  assigned_spm: '',
  assignment_notes: ''
})

// Validation errors
const errors = reactive({
  assigned_pm: '',
  assigned_spm: ''
})

// Computed properties
const currentProject = computed(() => wizardStore.project)

const selectedPM = computed(() => {
  return availablePMs.value.find(pm => pm.id === formData.assigned_pm)
})

const selectedSPM = computed(() => {
  return availableSPMs.value.find(spm => spm.id === formData.assigned_spm)
})

const hasErrors = computed(() => Object.values(errors).some(error => error !== ''))

const isFormValid = computed(() => {
  return formData.assigned_pm !== '' && !hasErrors.value
})

// Methods
const loadAvailableUsers = async () => {
  try {
    isLoadingUsers.value = true
    
    // In a real implementation, this would call an API
    // For now, we'll simulate with sample data
    availablePMs.value = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@pfmt.ca',
        role: 'pm',
        current_projects_count: 2
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@pfmt.ca',
        role: 'pm',
        current_projects_count: 1
      },
      {
        id: '3',
        name: 'Mike Wilson',
        email: 'mike.wilson@pfmt.ca',
        role: 'pm',
        current_projects_count: 0
      }
    ]
    
    availableSPMs.value = [
      {
        id: '4',
        name: 'Lisa Chen',
        email: 'lisa.chen@pfmt.ca',
        role: 'spm',
        current_projects_count: 3
      },
      {
        id: '5',
        name: 'David Brown',
        email: 'david.brown@pfmt.ca',
        role: 'spm',
        current_projects_count: 2
      },
      {
        id: '6',
        name: 'Emma Davis',
        email: 'emma.davis@pfmt.ca',
        role: 'spm',
        current_projects_count: 1
      }
    ]
    
    // In real implementation:
    // const [pms, spms] = await Promise.all([
    //   ProjectWorkflowAPI.getAvailableUsers('pm'),
    //   ProjectWorkflowAPI.getAvailableUsers('spm')
    // ])
    // availablePMs.value = pms
    // availableSPMs.value = spms
    
  } catch (error: any) {
    console.error('Failed to load available users:', error)
    handleWizardError(error)
  } finally {
    isLoadingUsers.value = false
  }
}

const validateField = (fieldName: string) => {
  switch (fieldName) {
    case 'assigned_pm':
      if (!formData.assigned_pm) {
        errors.assigned_pm = 'Project manager is required'
      } else if (formData.assigned_pm === formData.assigned_spm) {
        errors.assigned_pm = 'Project manager and senior project manager cannot be the same person'
      } else {
        errors.assigned_pm = ''
      }
      break
      
    case 'assigned_spm':
      if (formData.assigned_spm && formData.assigned_spm === formData.assigned_pm) {
        errors.assigned_spm = 'Senior project manager cannot be the same as project manager'
      } else {
        errors.assigned_spm = ''
      }
      break
  }
}

const validateForm = () => {
  validateField('assigned_pm')
  validateField('assigned_spm')
}

const syncToStore = () => {
  // Update wizard store with form data
  Object.assign(wizardStore.assignment, {
    assigned_pm: formData.assigned_pm || null,
    assigned_spm: formData.assigned_spm || null,
    assignment_notes: formData.assignment_notes || null
  })
  
  // Mark as dirty for auto-save
  wizardStore.markDirty('assignment')
}

const loadFromStore = () => {
  // Load data from wizard store
  const assignment = wizardStore.assignment
  
  formData.assigned_pm = assignment.assigned_pm || ''
  formData.assigned_spm = assignment.assigned_spm || ''
  formData.assignment_notes = assignment.assignment_notes || ''
}

const handleSubmit = async () => {
  validateForm()
  
  if (hasErrors.value || !isFormValid.value) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    // Sync form data to store
    syncToStore()
    
    // Submit the step
    const success = await submitCurrentStep()
    
    if (success) {
      // Navigation is handled by submitCurrentStep
    }
  } catch (error: any) {
    console.error('Failed to submit assignment:', error)
    handleWizardError(error)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  if (currentProject.value) {
    router.push({
      name: 'project-detail',
      params: { id: currentProject.value.id }
    })
  } else {
    router.push({ name: 'wizard-dashboard' })
  }
}

const setupAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
  }
  
  autoSaveTimer.value = setInterval(async () => {
    if (wizardStore.hasUnsavedChanges && isFormValid.value) {
      try {
        await saveState()
        showAutoSaveIndicator.value = true
        setTimeout(() => {
          showAutoSaveIndicator.value = false
        }, 1500)
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

// Utility methods
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA')
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

// Watchers
watch(formData, () => {
  syncToStore()
}, { deep: true })

watch(() => formData.assigned_pm, () => {
  validateField('assigned_pm')
  if (formData.assigned_spm) {
    validateField('assigned_spm')
  }
})

watch(() => formData.assigned_spm, () => {
  validateField('assigned_spm')
})

// Lifecycle
onMounted(async () => {
  loadFromStore()
  await loadAvailableUsers()
  setupAutoSave()
})

onUnmounted(() => {
  cleanupAutoSave()
})

// Expose methods for parent component
defineExpose({
  validateForm,
  isFormValid,
  handleSubmit
})
</script>

<style scoped>
.assignment-step {
  max-width: 800px;
  margin: 0 auto;
}

/* Step Header */
.step-header {
  margin-bottom: 2rem;
  text-align: center;
}

.step-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 0.5rem;
}

.step-description {
  font-size: 1rem;
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
}

/* Project Info Card */
.project-info-card {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.project-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1976d2;
  margin: 0 0 0.5rem;
}

.project-description {
  color: #424242;
  margin: 0 0 1rem;
  line-height: 1.5;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-label {
  font-weight: 500;
  color: #616161;
}

.meta-value {
  color: #212529;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.status-initiated {
  background: #fff3cd;
  color: #856404;
}

/* Form Sections */
.form-section {
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #dee2e6;
}

/* Assignment Groups */
.assignment-group {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
}

.assignment-group:last-child {
  margin-bottom: 0;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.assignment-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
}

.assignment-required {
  background: #dc3545;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.assignment-optional {
  background: #6c757d;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

/* Form Elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  font-weight: 500;
  color: #212529;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  display: block;
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-select.error,
.form-textarea.error {
  border-color: #dc3545;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* Selected User Info */
.selected-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.375rem;
  border: 1px solid #dee2e6;
  margin-top: 1rem;
}

.user-avatar {
  width: 3rem;
  height: 3rem;
  background: #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-initials {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.25rem;
}

.user-email {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.user-workload {
  color: #6c757d;
  font-size: 0.75rem;
}

/* Field Feedback */
.field-error {
  color: #dc3545;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.field-hint {
  color: #6c757d;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Validation Summary */
.validation-summary {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 2rem;
}

.validation-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.validation-icon {
  margin-right: 0.5rem;
}

.validation-title {
  font-weight: 500;
  color: #721c24;
}

.validation-list {
  margin: 0;
  padding-left: 1.5rem;
}

.validation-item {
  color: #721c24;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e9ecef;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid #dee2e6;
}

.actions-left,
.actions-right {
  display: flex;
  gap: 1rem;
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

.save-icon {
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .assignment-step {
    padding: 0 1rem;
  }
  
  .project-meta {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .selected-user-info {
    flex-direction: column;
    text-align: center;
  }
  
  .form-section {
    padding: 1rem;
  }
  
  .assignment-group {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .actions-left,
  .actions-right {
    width: 100%;
    justify-content: center;
  }
  
  .btn {
    flex: 1;
    min-width: auto;
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
    font-size: 1.5rem;
  }
  
  .actions-left,
  .actions-right {
    flex-direction: column;
  }
}
</style>

