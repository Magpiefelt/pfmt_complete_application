<template>
  <div class="initiation-step">
    <!-- Step Header -->
    <div class="step-header">
      <h2 class="step-title">Project Initiation</h2>
      <p class="step-description">
        {{ isEditing ? 'Edit project information and requirements' : 'Create a new project with basic information and requirements' }}
      </p>
    </div>

    <!-- Form Content -->
    <form @submit.prevent="handleSubmit" class="initiation-form">
      <!-- Basic Information Section -->
      <div class="form-section">
        <h3 class="section-title">Basic Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="project-name" class="form-label required">
              Project Name
            </label>
            <input
              id="project-name"
              v-model="formData.name"
              type="text"
              class="form-input"
              :class="{ 'error': errors.name }"
              placeholder="Enter project name"
              required
              maxlength="255"
              @blur="validateField('name')"
            />
            <div v-if="errors.name" class="field-error">{{ errors.name }}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="project-description" class="form-label required">
              Project Description
            </label>
            <textarea
              id="project-description"
              v-model="formData.description"
              class="form-textarea"
              :class="{ 'error': errors.description }"
              placeholder="Describe the project objectives, scope, and key deliverables"
              rows="4"
              required
              maxlength="2000"
              @blur="validateField('description')"
            ></textarea>
            <div v-if="errors.description" class="field-error">{{ errors.description }}</div>
            <div class="field-hint">{{ formData.description.length }}/2000 characters</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group half-width">
            <label for="project-type" class="form-label">
              Project Type
            </label>
            <select
              id="project-type"
              v-model="formData.project_type"
              class="form-select"
            >
              <option value="">Select project type</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="software">Software Development</option>
              <option value="consulting">Consulting</option>
              <option value="research">Research & Development</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="form-group half-width">
            <label for="project-category" class="form-label">
              Project Category
            </label>
            <select
              id="project-category"
              v-model="formData.project_category"
              class="form-select"
            >
              <option value="">Select category</option>
              <option value="strategic">Strategic Initiative</option>
              <option value="operational">Operational Improvement</option>
              <option value="compliance">Compliance & Regulatory</option>
              <option value="innovation">Innovation</option>
              <option value="maintenance">Maintenance & Support</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group half-width">
            <label for="delivery-method" class="form-label">
              Delivery Method
            </label>
            <select
              id="delivery-method"
              v-model="formData.delivery_method"
              class="form-select"
            >
              <option value="">Select delivery method</option>
              <option value="waterfall">Waterfall</option>
              <option value="agile">Agile</option>
              <option value="hybrid">Hybrid</option>
              <option value="lean">Lean</option>
            </select>
          </div>

          <div class="form-group half-width">
            <label for="geographic-region" class="form-label">
              Geographic Region
            </label>
            <select
              id="geographic-region"
              v-model="formData.geographic_region"
              class="form-select"
            >
              <option value="">Select region</option>
              <option value="alberta">Alberta</option>
              <option value="british-columbia">British Columbia</option>
              <option value="saskatchewan">Saskatchewan</option>
              <option value="manitoba">Manitoba</option>
              <option value="ontario">Ontario</option>
              <option value="quebec">Quebec</option>
              <option value="national">National</option>
              <option value="international">International</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Timeline & Budget Section -->
      <div class="form-section">
        <h3 class="section-title">Timeline & Budget</h3>
        
        <div class="form-row">
          <div class="form-group half-width">
            <label for="start-date" class="form-label">
              Planned Start Date
            </label>
            <input
              id="start-date"
              v-model="formData.start_date"
              type="date"
              class="form-input"
              :min="minStartDate"
            />
          </div>

          <div class="form-group half-width">
            <label for="end-date" class="form-label">
              Planned End Date
            </label>
            <input
              id="end-date"
              v-model="formData.end_date"
              type="date"
              class="form-input"
              :min="formData.start_date || minStartDate"
              :class="{ 'error': errors.end_date }"
            />
            <div v-if="errors.end_date" class="field-error">{{ errors.end_date }}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group half-width">
            <label for="estimated-budget" class="form-label">
              Estimated Budget (CAD)
            </label>
            <div class="input-group">
              <span class="input-prefix">$</span>
              <input
                id="estimated-budget"
                v-model.number="formData.estimated_budget"
                type="number"
                class="form-input"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>
            <div class="field-hint">Enter total estimated project budget</div>
          </div>

          <div class="form-group half-width">
            <label class="form-label">Duration</label>
            <div class="duration-display">
              <span v-if="projectDuration" class="duration-value">
                {{ projectDuration }}
              </span>
              <span v-else class="duration-placeholder">
                Select start and end dates
              </span>
            </div>
          </div>
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

      <!-- Form Actions -->
      <div class="form-actions">
        <div class="actions-left">
          <button
            type="button"
            @click="saveDraft"
            class="btn btn-outline"
            :disabled="isSaving || !canSaveDraft"
          >
            {{ isSaving ? 'Saving...' : 'Save Draft' }}
          </button>
        </div>

        <div class="actions-right">
          <button
            type="button"
            @click="goBack"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || hasErrors || !isFormValid"
          >
            {{ isSubmitting ? 'Submitting...' : (isEditing ? 'Update Project' : 'Create Project') }}
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
  saveDraft,
  saveState
} = useWizardPersistence()

// Local state
const isSubmitting = ref(false)
const isSaving = ref(false)
const showAutoSaveIndicator = ref(false)
const autoSaveTimer = ref<NodeJS.Timeout | null>(null)

// Form data - reactive copy of wizard store data
const formData = reactive({
  name: '',
  description: '',
  project_type: '',
  project_category: '',
  delivery_method: '',
  geographic_region: '',
  start_date: '',
  end_date: '',
  estimated_budget: null as number | null
})

// Validation errors
const errors = reactive({
  name: '',
  description: '',
  end_date: ''
})

// Computed properties
const isEditing = computed(() => !!wizardStore.project?.id)

const minStartDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const projectDuration = computed(() => {
  if (!formData.start_date || !formData.end_date) return null
  
  const start = new Date(formData.start_date)
  const end = new Date(formData.end_date)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Invalid date range'
  if (diffDays === 0) return '1 day'
  if (diffDays < 30) return `${diffDays + 1} days`
  if (diffDays < 365) return `${Math.round((diffDays + 1) / 30)} months`
  return `${Math.round((diffDays + 1) / 365)} years`
})

const hasErrors = computed(() => Object.values(errors).some(error => error !== ''))

const isFormValid = computed(() => {
  return formData.name.trim() !== '' && 
         formData.description.trim() !== '' && 
         !hasErrors.value
})

const canSaveDraft = computed(() => {
  return formData.name.trim() !== '' && !isEditing.value
})

// Methods
const validateField = (fieldName: string) => {
  switch (fieldName) {
    case 'name':
      if (!formData.name.trim()) {
        errors.name = 'Project name is required'
      } else if (formData.name.length < 3) {
        errors.name = 'Project name must be at least 3 characters'
      } else if (formData.name.length > 255) {
        errors.name = 'Project name must be less than 255 characters'
      } else {
        errors.name = ''
      }
      break
      
    case 'description':
      if (!formData.description.trim()) {
        errors.description = 'Project description is required'
      } else if (formData.description.length < 10) {
        errors.description = 'Project description must be at least 10 characters'
      } else if (formData.description.length > 2000) {
        errors.description = 'Project description must be less than 2000 characters'
      } else {
        errors.description = ''
      }
      break
      
    case 'end_date':
      if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date)
        const end = new Date(formData.end_date)
        if (end <= start) {
          errors.end_date = 'End date must be after start date'
        } else {
          errors.end_date = ''
        }
      } else {
        errors.end_date = ''
      }
      break
  }
}

const validateForm = () => {
  validateField('name')
  validateField('description')
  validateField('end_date')
}

const syncToStore = () => {
  // Update wizard store with form data
  Object.assign(wizardStore.initiation, {
    name: formData.name,
    description: formData.description,
    project_type: formData.project_type || null,
    project_category: formData.project_category || null,
    delivery_method: formData.delivery_method || null,
    geographic_region: formData.geographic_region || null,
    start_date: formData.start_date || null,
    end_date: formData.end_date || null,
    estimated_budget: formData.estimated_budget
  })
  
  // Mark as dirty for auto-save
  wizardStore.markDirty('initiation')
}

const loadFromStore = () => {
  // Load data from wizard store
  const initiation = wizardStore.initiation
  
  formData.name = initiation.name || ''
  formData.description = initiation.description || ''
  formData.project_type = initiation.project_type || ''
  formData.project_category = initiation.project_category || ''
  formData.delivery_method = initiation.delivery_method || ''
  formData.geographic_region = initiation.geographic_region || ''
  formData.start_date = initiation.start_date || ''
  formData.end_date = initiation.end_date || ''
  formData.estimated_budget = initiation.estimated_budget
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
      // Navigate to next step or project details
      if (isEditing.value) {
        await navigateToProjectDetails()
      }
      // For new projects, navigation is handled by submitCurrentStep
    }
  } catch (error: any) {
    console.error('Failed to submit initiation:', error)
    handleWizardError(error)
  } finally {
    isSubmitting.value = false
  }
}

const handleSaveDraft = async () => {
  if (!canSaveDraft.value) return
  
  isSaving.value = true
  
  try {
    syncToStore()
    
    const draftName = `${formData.name} - Draft`
    const draftDescription = `Project draft created on ${new Date().toLocaleDateString()}`
    
    await saveDraft(draftName, draftDescription)
    
    showAutoSaveIndicator.value = true
    setTimeout(() => {
      showAutoSaveIndicator.value = false
    }, 2000)
  } catch (error: any) {
    console.error('Failed to save draft:', error)
  } finally {
    isSaving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'wizard-dashboard' })
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

// Watchers
watch(formData, () => {
  syncToStore()
}, { deep: true })

watch(() => formData.start_date, () => {
  if (formData.end_date) {
    validateField('end_date')
  }
})

watch(() => formData.end_date, () => {
  validateField('end_date')
})

// Lifecycle
onMounted(() => {
  loadFromStore()
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
.initiation-step {
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

/* Form Layout */
.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group.half-width {
  flex: 0 0 calc(50% - 0.5rem);
}

/* Form Elements */
.form-label {
  font-weight: 500;
  color: #212529;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-label.required::after {
  content: ' *';
  color: #dc3545;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-input.error,
.form-textarea.error,
.form-select.error {
  border-color: #dc3545;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 0.75rem;
  color: #6c757d;
  font-weight: 500;
  z-index: 1;
}

.input-group .form-input {
  padding-left: 2rem;
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

/* Duration Display */
.duration-display {
  padding: 0.75rem;
  background: #e9ecef;
  border-radius: 0.375rem;
  border: 1px solid #ced4da;
}

.duration-value {
  font-weight: 500;
  color: #212529;
}

.duration-placeholder {
  color: #6c757d;
  font-style: italic;
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

.btn-outline {
  background-color: transparent;
  border-color: #6c757d;
  color: #6c757d;
}

.btn-outline:hover:not(:disabled) {
  background-color: #6c757d;
  color: white;
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
  .initiation-step {
    padding: 0 1rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-group.half-width {
    flex: 1;
  }
  
  .form-section {
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

