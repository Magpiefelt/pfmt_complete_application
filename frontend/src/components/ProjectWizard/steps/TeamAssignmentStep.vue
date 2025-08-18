<template>
  <div class="assignment-step">
    <div class="step-header">
      <h2>Team Assignment</h2>
      <p>Assign a Project Manager and Senior Project Manager to this project.</p>
    </div>

    <!-- Project Summary -->
    <div class="project-summary">
      <h3>Project Summary</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <label>Project Name:</label>
          <span>{{ projectData.name || 'Not specified' }}</span>
        </div>
        <div class="summary-item">
          <label>Estimated Budget:</label>
          <span>{{ formatCurrency(projectData.estimated_budget) }}</span>
        </div>
        <div class="summary-item">
          <label>Project Type:</label>
          <span>{{ projectData.project_type || 'Not specified' }}</span>
        </div>
        <div class="summary-item">
          <label>Geographic Region:</label>
          <span>{{ projectData.geographic_region || 'Not specified' }}</span>
        </div>
      </div>
      <div class="summary-description">
        <label>Description:</label>
        <p>{{ projectData.description || 'No description provided' }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="step-form">
      <!-- Team Assignment -->
      <div class="form-section">
        <h3>Team Assignment</h3>
        
        <div class="assignment-grid">
          <!-- Project Manager Assignment -->
          <div class="assignment-card">
            <div class="card-header">
              <h4>Project Manager</h4>
              <span class="role-badge pm">PM</span>
            </div>
            
            <div class="form-group">
              <label for="assigned_pm">Select Project Manager</label>
              <select
                id="assigned_pm"
                v-model="formData.assigned_pm"
                class="form-select"
                :class="{ 'error': validationErrors.assigned_pm }"
              >
                <option value="">Select a Project Manager</option>
                <option 
                  v-for="pm in projectManagers" 
                  :key="pm.id" 
                  :value="pm.id"
                  :disabled="pm.id === formData.assigned_spm"
                >
                  {{ pm.name }} ({{ pm.email }})
                  <span v-if="pm.current_projects">({{ pm.current_projects }} active projects)</span>
                </option>
              </select>
              <span v-if="validationErrors.assigned_pm" class="error-message">
                {{ validationErrors.assigned_pm }}
              </span>
            </div>

            <!-- Selected PM Details -->
            <div v-if="selectedPM" class="member-details">
              <div class="member-info">
                <div class="member-avatar">
                  {{ selectedPM.name.charAt(0) }}
                </div>
                <div class="member-data">
                  <div class="member-name">{{ selectedPM.name }}</div>
                  <div class="member-email">{{ selectedPM.email }}</div>
                  <div class="member-stats">
                    {{ selectedPM.current_projects || 0 }} active projects
                  </div>
                </div>
              </div>
              <div class="member-skills" v-if="selectedPM.skills">
                <div class="skills-label">Skills:</div>
                <div class="skills-list">
                  <span 
                    v-for="skill in selectedPM.skills" 
                    :key="skill" 
                    class="skill-tag"
                  >
                    {{ skill }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Senior Project Manager Assignment -->
          <div class="assignment-card">
            <div class="card-header">
              <h4>Senior Project Manager</h4>
              <span class="role-badge spm">SPM</span>
            </div>
            
            <div class="form-group">
              <label for="assigned_spm">Select Senior Project Manager</label>
              <select
                id="assigned_spm"
                v-model="formData.assigned_spm"
                class="form-select"
                :class="{ 'error': validationErrors.assigned_spm }"
              >
                <option value="">Select a Senior Project Manager</option>
                <option 
                  v-for="spm in seniorProjectManagers" 
                  :key="spm.id" 
                  :value="spm.id"
                  :disabled="spm.id === formData.assigned_pm"
                >
                  {{ spm.name }} ({{ spm.email }})
                  <span v-if="spm.current_projects">({{ spm.current_projects }} active projects)</span>
                </option>
              </select>
              <span v-if="validationErrors.assigned_spm" class="error-message">
                {{ validationErrors.assigned_spm }}
              </span>
            </div>

            <!-- Selected SPM Details -->
            <div v-if="selectedSPM" class="member-details">
              <div class="member-info">
                <div class="member-avatar">
                  {{ selectedSPM.name.charAt(0) }}
                </div>
                <div class="member-data">
                  <div class="member-name">{{ selectedSPM.name }}</div>
                  <div class="member-email">{{ selectedSPM.email }}</div>
                  <div class="member-stats">
                    {{ selectedSPM.current_projects || 0 }} active projects
                  </div>
                </div>
              </div>
              <div class="member-skills" v-if="selectedSPM.skills">
                <div class="skills-label">Skills:</div>
                <div class="skills-list">
                  <span 
                    v-for="skill in selectedSPM.skills" 
                    :key="skill" 
                    class="skill-tag"
                  >
                    {{ skill }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Assignment Notes -->
        <div class="form-group">
          <label for="assignment_notes">Assignment Notes (Optional)</label>
          <textarea
            id="assignment_notes"
            v-model="formData.assignment_notes"
            class="form-textarea"
            placeholder="Add any notes about the team assignment..."
            rows="3"
          ></textarea>
        </div>

        <!-- Validation Error -->
        <div v-if="validationErrors.assignment" class="error-message global-error">
          {{ validationErrors.assignment }}
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('previous')"
        >
          Previous
        </button>
        
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading || (!formData.assigned_pm && !formData.assigned_spm)"
        >
          {{ loading ? 'Assigning Team...' : 'Assign Team & Continue' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'

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
const projectManagers = ref([
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@gov.ab.ca',
    current_projects: 3,
    skills: ['Infrastructure', 'Technology', 'Budget Management']
  },
  {
    id: '2',
    name: 'David Chen',
    email: 'david.chen@gov.ab.ca',
    current_projects: 2,
    skills: ['Construction', 'Risk Management', 'Stakeholder Relations']
  },
  {
    id: '3',
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@gov.ab.ca',
    current_projects: 4,
    skills: ['Environmental', 'Consulting', 'Change Management']
  }
])

const seniorProjectManagers = ref([
  {
    id: '4',
    name: 'Mike Thompson',
    email: 'mike.thompson@gov.ab.ca',
    current_projects: 2,
    skills: ['Strategic Planning', 'Large Scale Projects', 'Leadership']
  },
  {
    id: '5',
    name: 'Jennifer Liu',
    email: 'jennifer.liu@gov.ab.ca',
    current_projects: 1,
    skills: ['Technology Integration', 'Process Improvement', 'Team Development']
  },
  {
    id: '6',
    name: 'Robert Anderson',
    email: 'robert.anderson@gov.ab.ca',
    current_projects: 3,
    skills: ['Infrastructure', 'Public-Private Partnerships', 'Financial Analysis']
  }
])

// Form data
const formData = reactive({
  assigned_pm: '',
  assigned_spm: '',
  assignment_notes: ''
})

// Computed
const selectedPM = computed(() => {
  return projectManagers.value.find(pm => pm.id === formData.assigned_pm)
})

const selectedSPM = computed(() => {
  return seniorProjectManagers.value.find(spm => spm.id === formData.assigned_spm)
})

// Methods
const formatCurrency = (amount: number | null): string => {
  if (!amount) return 'Not specified'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount)
}

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
  // Load team members from API if needed
  // This would be implemented with actual API calls
})
</script>

<style scoped>
.assignment-step {
  max-width: 1000px;
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

.project-summary {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.project-summary h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0c4a6e;
  margin-bottom: 1rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.summary-item label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.summary-item span {
  color: #1f2937;
  font-weight: 600;
}

.summary-description {
  border-top: 1px solid #bae6fd;
  padding-top: 1rem;
}

.summary-description label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  display: block;
  margin-bottom: 0.5rem;
}

.summary-description p {
  color: #1f2937;
  line-height: 1.5;
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

.assignment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.assignment-card {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.pm {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.spm {
  background: #dcfce7;
  color: #166534;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select.error,
.form-textarea.error {
  border-color: #ef4444;
}

.member-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.member-info {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 1rem;
}

.member-data {
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: #1f2937;
}

.member-email {
  color: #6b7280;
  font-size: 0.875rem;
}

.member-stats {
  color: #6b7280;
  font-size: 0.875rem;
}

.member-skills {
  margin-top: 0.5rem;
}

.skills-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.global-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-top: 1rem;
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
  .assignment-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>

