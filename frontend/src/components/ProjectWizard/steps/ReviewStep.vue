<template>
  <div class="review-step">
    <div class="step-header">
      <h2>Review & Finalize</h2>
      <p>Review all project information and finalize the project setup.</p>
    </div>

    <div class="review-content">
      <!-- Project Overview -->
      <div class="review-section">
        <div class="section-header">
          <h3>Project Overview</h3>
          <button
            type="button"
            class="btn-edit"
            @click="editStep(0)"
          >
            Edit
          </button>
        </div>
        
        <div class="review-grid">
          <div class="review-item">
            <label>Project Name:</label>
            <span>{{ projectData.name || 'Not specified' }}</span>
          </div>
          
          <div class="review-item">
            <label>Project Type:</label>
            <span>{{ projectData.project_type || 'Not specified' }}</span>
          </div>
          
          <div class="review-item">
            <label>Delivery Method:</label>
            <span>{{ projectData.delivery_method || 'Not specified' }}</span>
          </div>
          
          <div class="review-item">
            <label>Geographic Region:</label>
            <span>{{ projectData.geographic_region || 'Not specified' }}</span>
          </div>
          
          <div class="review-item">
            <label>Estimated Budget:</label>
            <span class="budget-amount">{{ formatCurrency(projectData.estimated_budget) }}</span>
          </div>
          
          <div class="review-item">
            <label>Timeline:</label>
            <span>{{ formatDateRange(projectData.start_date, projectData.end_date) }}</span>
          </div>
        </div>
        
        <div class="review-description">
          <label>Description:</label>
          <p>{{ projectData.description || 'No description provided' }}</p>
        </div>
      </div>

      <!-- Team Assignment -->
      <div class="review-section">
        <div class="section-header">
          <h3>Team Assignment</h3>
          <button
            type="button"
            class="btn-edit"
            @click="editStep(1)"
          >
            Edit
          </button>
        </div>
        
        <div class="team-assignment">
          <div class="team-member" v-if="assignedPM">
            <div class="member-role">Project Manager</div>
            <div class="member-info">
              <div class="member-avatar">{{ assignedPM.name.charAt(0) }}</div>
              <div class="member-details">
                <div class="member-name">{{ assignedPM.name }}</div>
                <div class="member-email">{{ assignedPM.email }}</div>
              </div>
            </div>
          </div>
          
          <div class="team-member" v-if="assignedSPM">
            <div class="member-role">Senior Project Manager</div>
            <div class="member-info">
              <div class="member-avatar">{{ assignedSPM.name.charAt(0) }}</div>
              <div class="member-details">
                <div class="member-name">{{ assignedSPM.name }}</div>
                <div class="member-email">{{ assignedSPM.email }}</div>
              </div>
            </div>
          </div>
          
          <div v-if="!assignedPM && !assignedSPM" class="no-assignment">
            No team members assigned yet.
          </div>
        </div>
      </div>

      <!-- Project Configuration -->
      <div class="review-section">
        <div class="section-header">
          <h3>Project Configuration</h3>
          <button
            type="button"
            class="btn-edit"
            @click="editStep(2)"
          >
            Edit
          </button>
        </div>
        
        <!-- Detailed Description -->
        <div class="config-subsection">
          <h4>Detailed Description</h4>
          <p>{{ projectData.detailed_description || 'No detailed description provided' }}</p>
        </div>
        
        <!-- Risk Assessment -->
        <div class="config-subsection" v-if="projectData.risk_assessment">
          <h4>Risk Assessment</h4>
          <p>{{ projectData.risk_assessment }}</p>
        </div>
        
        <!-- Milestones -->
        <div class="config-subsection" v-if="projectData.milestones && projectData.milestones.length > 0">
          <h4>Project Milestones</h4>
          <div class="milestones-list">
            <div 
              v-for="(milestone, index) in projectData.milestones" 
              :key="index"
              class="milestone-item"
            >
              <div class="milestone-header">
                <span class="milestone-name">{{ milestone.name || `Milestone ${index + 1}` }}</span>
                <span class="milestone-date">{{ formatDate(milestone.target_date) }}</span>
              </div>
              <p class="milestone-description">{{ milestone.description || 'No description' }}</p>
            </div>
          </div>
        </div>
        
        <!-- Budget Breakdown -->
        <div class="config-subsection" v-if="projectData.budget_breakdown && projectData.budget_breakdown.length > 0">
          <h4>Budget Breakdown</h4>
          <div class="budget-table">
            <div class="budget-header">
              <span>Category</span>
              <span>Amount</span>
              <span>Percentage</span>
            </div>
            <div 
              v-for="(category, index) in projectData.budget_breakdown" 
              :key="index"
              class="budget-row"
            >
              <span>{{ category.name || 'Unnamed Category' }}</span>
              <span>{{ formatCurrency(category.amount) }}</span>
              <span>{{ calculatePercentage(category.amount) }}</span>
            </div>
            <div class="budget-total">
              <span>Total Allocated</span>
              <span>{{ formatCurrency(totalBudgetAllocated) }}</span>
              <span>{{ calculatePercentage(totalBudgetAllocated) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Vendor Requirements -->
        <div class="config-subsection" v-if="projectData.vendors && projectData.vendors.length > 0">
          <h4>Vendor Requirements</h4>
          <div class="vendors-list">
            <div 
              v-for="(vendor, index) in projectData.vendors" 
              :key="index"
              class="vendor-item"
            >
              <div class="vendor-header">
                <span class="vendor-type">{{ vendor.service_type || 'Unspecified Service' }}</span>
                <span class="vendor-value">{{ formatCurrency(vendor.estimated_value) }}</span>
              </div>
              <p class="vendor-requirements">{{ vendor.requirements || 'No requirements specified' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Final Confirmation -->
      <div class="review-section confirmation-section">
        <h3>Final Confirmation</h3>
        
        <div class="confirmation-checklist">
          <label class="checkbox-item">
            <input
              type="checkbox"
              v-model="confirmations.projectInfo"
            />
            <span class="checkmark"></span>
            I confirm that all project information is accurate and complete.
          </label>
          
          <label class="checkbox-item">
            <input
              type="checkbox"
              v-model="confirmations.teamAssignment"
            />
            <span class="checkmark"></span>
            I confirm that the team assignment is appropriate for this project.
          </label>
          
          <label class="checkbox-item">
            <input
              type="checkbox"
              v-model="confirmations.budgetApproval"
            />
            <span class="checkmark"></span>
            I confirm that the budget breakdown has been reviewed and approved.
          </label>
          
          <label class="checkbox-item">
            <input
              type="checkbox"
              v-model="confirmations.readyToStart"
            />
            <span class="checkmark"></span>
            I confirm that this project is ready to begin execution.
          </label>
        </div>
        
        <div class="final-notes">
          <label for="final_notes">Final Notes (Optional)</label>
          <textarea
            id="final_notes"
            v-model="finalNotes"
            class="form-textarea"
            placeholder="Add any final notes or comments about the project setup..."
            rows="3"
          ></textarea>
        </div>
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
        type="button"
        class="btn btn-primary"
        @click="handleFinalize"
        :disabled="loading || !allConfirmed"
      >
        {{ loading ? 'Finalizing Project...' : 'Finalize Project' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

interface Props {
  projectData: any
  validationErrors: Record<string, string>
}

interface Emits {
  (e: 'update:project-data', data: any): void
  (e: 'submit'): void
  (e: 'previous'): void
  (e: 'edit-step', step: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const finalNotes = ref('')

const confirmations = reactive({
  projectInfo: false,
  teamAssignment: false,
  budgetApproval: false,
  readyToStart: false
})

// Mock data for team members (would come from API)
const teamMembers = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@gov.ab.ca' },
  { id: '2', name: 'David Chen', email: 'david.chen@gov.ab.ca' },
  { id: '3', name: 'Maria Rodriguez', email: 'maria.rodriguez@gov.ab.ca' },
  { id: '4', name: 'Mike Thompson', email: 'mike.thompson@gov.ab.ca' },
  { id: '5', name: 'Jennifer Liu', email: 'jennifer.liu@gov.ab.ca' },
  { id: '6', name: 'Robert Anderson', email: 'robert.anderson@gov.ab.ca' }
]

// Computed
const assignedPM = computed(() => {
  return teamMembers.find(member => member.id === props.projectData.assigned_pm)
})

const assignedSPM = computed(() => {
  return teamMembers.find(member => member.id === props.projectData.assigned_spm)
})

const totalBudgetAllocated = computed(() => {
  if (!props.projectData.budget_breakdown) return 0
  return props.projectData.budget_breakdown.reduce((total: number, category: any) => {
    return total + (category.amount || 0)
  }, 0)
})

const allConfirmed = computed(() => {
  return Object.values(confirmations).every(confirmed => confirmed)
})

// Methods
const formatCurrency = (amount: number | null): string => {
  if (!amount) return 'Not specified'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Not specified'
  return new Date(dateString).toLocaleDateString('en-CA')
}

const formatDateRange = (startDate: string, endDate: string): string => {
  if (!startDate && !endDate) return 'Not specified'
  if (!startDate) return `End: ${formatDate(endDate)}`
  if (!endDate) return `Start: ${formatDate(startDate)}`
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

const calculatePercentage = (amount: number | null): string => {
  if (!amount || !props.projectData.estimated_budget) return '0%'
  const percentage = (amount / props.projectData.estimated_budget) * 100
  return `${percentage.toFixed(1)}%`
}

const editStep = (stepIndex: number) => {
  emit('edit-step', stepIndex)
}

const handleFinalize = () => {
  // Add final notes to project data
  emit('update:project-data', { 
    final_notes: finalNotes.value,
    confirmations: { ...confirmations }
  })
  
  // Submit the project
  emit('submit')
}
</script>

<style scoped>
.review-step {
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

.review-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.review-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #3b82f6;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-edit {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.review-item {
  display: flex;
  flex-direction: column;
}

.review-item label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.review-item span {
  color: #1f2937;
  font-weight: 600;
}

.budget-amount {
  color: #059669;
  font-size: 1.125rem;
}

.review-description {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.review-description label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
  display: block;
  margin-bottom: 0.5rem;
}

.review-description p {
  color: #1f2937;
  line-height: 1.6;
}

/* Team Assignment Styles */
.team-assignment {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-member {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
}

.member-role {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.member-info {
  display: flex;
  align-items: center;
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

.member-name {
  font-weight: 600;
  color: #1f2937;
}

.member-email {
  color: #6b7280;
  font-size: 0.875rem;
}

.no-assignment {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

/* Configuration Styles */
.config-subsection {
  margin-bottom: 1.5rem;
}

.config-subsection:last-child {
  margin-bottom: 0;
}

.config-subsection h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.config-subsection p {
  color: #374151;
  line-height: 1.6;
}

.milestones-list,
.vendors-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.milestone-item,
.vendor-item {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 1rem;
}

.milestone-header,
.vendor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.milestone-name,
.vendor-type {
  font-weight: 600;
  color: #1f2937;
}

.milestone-date,
.vendor-value {
  color: #6b7280;
  font-size: 0.875rem;
}

.milestone-description,
.vendor-requirements {
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Budget Table */
.budget-table {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  overflow: hidden;
}

.budget-header,
.budget-row,
.budget-total {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.budget-header {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.budget-total {
  background: #f0f9ff;
  font-weight: 600;
  color: #1f2937;
  border-bottom: none;
}

/* Confirmation Section */
.confirmation-section {
  background: #f0f9ff;
  border-color: #0ea5e9;
}

.confirmation-checklist {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: #1f2937;
}

.checkbox-item input[type="checkbox"] {
  margin-right: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #3b82f6;
}

.final-notes {
  display: flex;
  flex-direction: column;
}

.final-notes label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
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
  .review-grid {
    grid-template-columns: 1fr;
  }
  
  .budget-header,
  .budget-row,
  .budget-total {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>

