<template>
  <div class="configuration-step">
    <div class="step-header">
      <h2>Project Configuration</h2>
      <p>Configure detailed project settings, milestones, and resources.</p>
    </div>

    <form @submit.prevent="handleSubmit" class="step-form">
      <!-- Detailed Description -->
      <div class="form-section">
        <h3>Detailed Project Information</h3>
        
        <div class="form-group">
          <label for="detailed_description" class="required">Detailed Description</label>
          <textarea
            id="detailed_description"
            v-model="formData.detailed_description"
            class="form-textarea"
            :class="{ 'error': validationErrors.detailed_description }"
            placeholder="Provide a comprehensive description of the project scope, objectives, and deliverables..."
            rows="6"
            required
          ></textarea>
          <span v-if="validationErrors.detailed_description" class="error-message">
            {{ validationErrors.detailed_description }}
          </span>
        </div>

        <div class="form-group">
          <label for="risk_assessment">Risk Assessment</label>
          <textarea
            id="risk_assessment"
            v-model="formData.risk_assessment"
            class="form-textarea"
            placeholder="Identify potential risks and mitigation strategies..."
            rows="4"
          ></textarea>
        </div>
      </div>

      <!-- Project Milestones -->
      <div class="form-section">
        <h3>Project Milestones</h3>
        
        <div class="milestones-container">
          <div 
            v-for="(milestone, index) in formData.milestones" 
            :key="index"
            class="milestone-item"
          >
            <div class="milestone-header">
              <h4>Milestone {{ index + 1 }}</h4>
              <button
                type="button"
                class="btn-remove"
                @click="removeMilestone(index)"
                v-if="formData.milestones.length > 1"
              >
                ×
              </button>
            </div>
            
            <div class="milestone-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Milestone Name</label>
                  <input
                    v-model="milestone.name"
                    type="text"
                    class="form-input"
                    placeholder="Enter milestone name"
                  />
                </div>
                
                <div class="form-group">
                  <label>Target Date</label>
                  <input
                    v-model="milestone.target_date"
                    type="date"
                    class="form-input"
                  />
                </div>
              </div>
              
              <div class="form-group">
                <label>Description</label>
                <textarea
                  v-model="milestone.description"
                  class="form-textarea"
                  placeholder="Describe the milestone deliverables and criteria..."
                  rows="2"
                ></textarea>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            class="btn btn-outline"
            @click="addMilestone"
          >
            + Add Milestone
          </button>
        </div>
      </div>

      <!-- Budget Breakdown -->
      <div class="form-section">
        <h3>Budget Breakdown</h3>
        
        <div class="budget-container">
          <div class="budget-summary">
            <div class="budget-total">
              <label>Total Estimated Budget:</label>
              <span class="total-amount">{{ formatCurrency(projectData.estimated_budget) }}</span>
            </div>
          </div>
          
          <div class="budget-categories">
            <div 
              v-for="(category, index) in formData.budget_breakdown" 
              :key="index"
              class="budget-category"
            >
              <div class="category-header">
                <h4>{{ category.name }}</h4>
                <button
                  type="button"
                  class="btn-remove"
                  @click="removeBudgetCategory(index)"
                  v-if="formData.budget_breakdown.length > 1"
                >
                  ×
                </button>
              </div>
              
              <div class="category-form">
                <div class="form-row">
                  <div class="form-group">
                    <label>Category Name</label>
                    <select
                      v-model="category.name"
                      class="form-select"
                    >
                      <option value="">Select category</option>
                      <option value="Labor">Labor</option>
                      <option value="Materials">Materials</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Travel">Travel</option>
                      <option value="Contingency">Contingency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label>Amount (CAD)</label>
                    <input
                      v-model.number="category.amount"
                      type="number"
                      class="form-input"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>Percentage</label>
                    <input
                      :value="calculatePercentage(category.amount)"
                      type="text"
                      class="form-input"
                      readonly
                    />
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Description</label>
                  <input
                    v-model="category.description"
                    type="text"
                    class="form-input"
                    placeholder="Brief description of this budget category"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="button"
              class="btn btn-outline"
              @click="addBudgetCategory"
            >
              + Add Budget Category
            </button>
          </div>
          
          <div class="budget-validation">
            <div class="validation-item" :class="{ 'warning': budgetVariance > 10 }">
              <label>Total Allocated:</label>
              <span>{{ formatCurrency(totalAllocated) }}</span>
            </div>
            <div class="validation-item" :class="{ 'warning': budgetVariance > 10 }">
              <label>Variance:</label>
              <span>{{ formatCurrency(budgetVariance) }} ({{ budgetVariancePercent }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vendor Requirements -->
      <div class="form-section">
        <h3>Vendor Requirements</h3>
        
        <div class="vendors-container">
          <div 
            v-for="(vendor, index) in formData.vendors" 
            :key="index"
            class="vendor-item"
          >
            <div class="vendor-header">
              <h4>Vendor Requirement {{ index + 1 }}</h4>
              <button
                type="button"
                class="btn-remove"
                @click="removeVendor(index)"
                v-if="formData.vendors.length > 1"
              >
                ×
              </button>
            </div>
            
            <div class="vendor-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Service Type</label>
                  <select
                    v-model="vendor.service_type"
                    class="form-select"
                  >
                    <option value="">Select service type</option>
                    <option value="Construction">Construction</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Technology">Technology</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>Estimated Value (CAD)</label>
                  <input
                    v-model.number="vendor.estimated_value"
                    type="number"
                    class="form-input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div class="form-group">
                <label>Requirements</label>
                <textarea
                  v-model="vendor.requirements"
                  class="form-textarea"
                  placeholder="Describe the vendor requirements and qualifications..."
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            class="btn btn-outline"
            @click="addVendor"
          >
            + Add Vendor Requirement
          </button>
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
          :disabled="loading"
        >
          {{ loading ? 'Saving...' : 'Save & Continue' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'

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

// Form data
const formData = reactive({
  detailed_description: '',
  risk_assessment: '',
  milestones: [
    {
      name: '',
      target_date: '',
      description: ''
    }
  ],
  budget_breakdown: [
    {
      name: '',
      amount: null as number | null,
      description: ''
    }
  ],
  vendors: [
    {
      service_type: '',
      estimated_value: null as number | null,
      requirements: ''
    }
  ]
})

// Computed
const totalAllocated = computed(() => {
  return formData.budget_breakdown.reduce((total, category) => {
    return total + (category.amount || 0)
  }, 0)
})

const budgetVariance = computed(() => {
  const estimated = props.projectData.estimated_budget || 0
  return Math.abs(estimated - totalAllocated.value)
})

const budgetVariancePercent = computed(() => {
  const estimated = props.projectData.estimated_budget || 0
  if (estimated === 0) return '0'
  return ((budgetVariance.value / estimated) * 100).toFixed(1)
})

// Methods
const formatCurrency = (amount: number | null): string => {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount)
}

const calculatePercentage = (amount: number | null): string => {
  if (!amount || !props.projectData.estimated_budget) return '0%'
  const percentage = (amount / props.projectData.estimated_budget) * 100
  return `${percentage.toFixed(1)}%`
}

const addMilestone = () => {
  formData.milestones.push({
    name: '',
    target_date: '',
    description: ''
  })
}

const removeMilestone = (index: number) => {
  formData.milestones.splice(index, 1)
}

const addBudgetCategory = () => {
  formData.budget_breakdown.push({
    name: '',
    amount: null,
    description: ''
  })
}

const removeBudgetCategory = (index: number) => {
  formData.budget_breakdown.splice(index, 1)
}

const addVendor = () => {
  formData.vendors.push({
    service_type: '',
    estimated_value: null,
    requirements: ''
  })
}

const removeVendor = (index: number) => {
  formData.vendors.splice(index, 1)
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
</script>

<style scoped>
.configuration-step {
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

.form-group label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
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
.form-textarea.error {
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

/* Milestone styles */
.milestones-container,
.vendors-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.milestone-item,
.vendor-item {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
}

.milestone-header,
.vendor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.milestone-header h4,
.vendor-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-remove {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.btn-remove:hover {
  background: #dc2626;
}

/* Budget styles */
.budget-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.budget-summary {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
}

.budget-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-total label {
  font-weight: 600;
  color: #1f2937;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: bold;
  color: #059669;
}

.budget-categories {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.budget-category {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.category-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.budget-validation {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
}

.validation-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.validation-item.warning {
  color: #f59e0b;
}

.validation-item label {
  font-size: 0.875rem;
  font-weight: 500;
}

.validation-item span {
  font-weight: bold;
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

.btn-outline {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-outline:hover {
  background: #3b82f6;
  color: white;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .budget-validation {
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>

