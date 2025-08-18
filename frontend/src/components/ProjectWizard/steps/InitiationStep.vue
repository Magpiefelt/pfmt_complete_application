<template>
  <div class="initiation-step">
    <div class="step-header">
      <h2>Project Initiation</h2>
      <p>Provide the basic information and requirements for the new project.</p>
    </div>

    <form @submit.prevent="handleSubmit" class="step-form">
      <!-- Basic Information -->
      <div class="form-section">
        <h3>Basic Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="name" class="required">Project Name</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              class="form-input"
              :class="{ 'error': validationErrors.name }"
              placeholder="Enter project name"
              required
            />
            <span v-if="validationErrors.name" class="error-message">
              {{ validationErrors.name }}
            </span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="description" class="required">Project Description</label>
            <textarea
              id="description"
              v-model="formData.description"
              class="form-textarea"
              :class="{ 'error': validationErrors.description }"
              placeholder="Provide a brief description of the project"
              rows="4"
              required
            ></textarea>
            <span v-if="validationErrors.description" class="error-message">
              {{ validationErrors.description }}
            </span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="program_id">Program</label>
            <select
              id="program_id"
              v-model="formData.program_id"
              class="form-select"
            >
              <option value="">Select a program</option>
              <option v-for="program in programs" :key="program.id" :value="program.id">
                {{ program.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="client_ministry_id">Client Ministry</label>
            <select
              id="client_ministry_id"
              v-model="formData.client_ministry_id"
              class="form-select"
            >
              <option value="">Select client ministry</option>
              <option v-for="ministry in ministries" :key="ministry.id" :value="ministry.id">
                {{ ministry.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Project Details -->
      <div class="form-section">
        <h3>Project Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="project_type">Project Type</label>
            <select
              id="project_type"
              v-model="formData.project_type"
              class="form-select"
            >
              <option value="">Select project type</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="technology">Technology</option>
              <option value="construction">Construction</option>
              <option value="consulting">Consulting</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div class="form-group">
            <label for="delivery_method">Delivery Method</label>
            <select
              id="delivery_method"
              v-model="formData.delivery_method"
              class="form-select"
            >
              <option value="">Select delivery method</option>
              <option value="design_bid_build">Design-Bid-Build</option>
              <option value="design_build">Design-Build</option>
              <option value="cm_at_risk">CM at Risk</option>
              <option value="p3">P3 (Public-Private Partnership)</option>
              <option value="direct_award">Direct Award</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="project_category">Project Category</label>
            <select
              id="project_category"
              v-model="formData.project_category"
              class="form-select"
            >
              <option value="">Select category</option>
              <option value="capital">Capital</option>
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div class="form-group">
            <label for="geographic_region">Geographic Region</label>
            <select
              id="geographic_region"
              v-model="formData.geographic_region"
              class="form-select"
            >
              <option value="">Select region</option>
              <option value="calgary">Calgary</option>
              <option value="edmonton">Edmonton</option>
              <option value="northern">Northern Alberta</option>
              <option value="southern">Southern Alberta</option>
              <option value="central">Central Alberta</option>
              <option value="provincial">Provincial</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Budget and Timeline -->
      <div class="form-section">
        <h3>Budget and Timeline</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="estimated_budget" class="required">Estimated Budget (CAD)</label>
            <input
              id="estimated_budget"
              v-model.number="formData.estimated_budget"
              type="number"
              class="form-input"
              :class="{ 'error': validationErrors.estimated_budget }"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
            <span v-if="validationErrors.estimated_budget" class="error-message">
              {{ validationErrors.estimated_budget }}
            </span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="start_date">Planned Start Date</label>
            <input
              id="start_date"
              v-model="formData.start_date"
              type="date"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="end_date">Planned End Date</label>
            <input
              id="end_date"
              v-model="formData.end_date"
              type="date"
              class="form-input"
              :min="formData.start_date"
            />
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('previous')"
          :disabled="true"
        >
          Previous
        </button>
        
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading"
        >
          {{ loading ? 'Saving...' : 'Save & Continue' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'

interface Props {
  projectData: any
  validationErrors: Record<string, string>
}

interface Emits {
  (e: 'update:project-data', data: any): void
  (e: 'next'): void
  (e: 'previous'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const programs = ref([
  { id: '1', name: 'Infrastructure Development' },
  { id: '2', name: 'Technology Modernization' },
  { id: '3', name: 'Public Services Enhancement' },
  { id: '4', name: 'Environmental Initiatives' }
])

const ministries = ref([
  { id: '1', name: 'Ministry of Transportation' },
  { id: '2', name: 'Ministry of Health' },
  { id: '3', name: 'Ministry of Education' },
  { id: '4', name: 'Ministry of Environment' },
  { id: '5', name: 'Ministry of Justice' }
])

// Form data
const formData = reactive({
  name: '',
  description: '',
  program_id: '',
  client_ministry_id: '',
  project_type: '',
  delivery_method: '',
  project_category: '',
  geographic_region: '',
  estimated_budget: null as number | null,
  start_date: '',
  end_date: ''
})

// Watch for changes and emit updates
watch(formData, (newData) => {
  emit('update:project-data', { ...newData })
}, { deep: true })

// Initialize form data from props
watch(() => props.projectData, (newData) => {
  if (newData) {
    Object.assign(formData, newData)
  }
}, { immediate: true })

const handleSubmit = () => {
  emit('next')
}

onMounted(() => {
  // Load programs and ministries from API if needed
  // This would be implemented with actual API calls
})
</script>

<style scoped>
.initiation-step {
  max-width: 800px;
  margin: 0 auto;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-header h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.step-header p {
  color: #6b7280;
}

.step-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.form-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  border-bottom: 2px solid #3b82f6;
  padding-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group:only-child {
  grid-column: 1 / -1;
}

label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error,
.form-textarea.error,
.form-select.error {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>

