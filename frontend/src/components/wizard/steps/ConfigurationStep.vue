<template>
  <div class="configuration-step">
    <!-- Step Header -->
    <div class="step-header">
      <h2 class="step-title">Project Configuration</h2>
      <p class="step-description">Configure project details, vendors, budget, and milestones.</p>
    </div>

    <!-- Project Information -->
    <div class="project-info-card">
      <h3 class="project-name">{{ project?.project_name || 'Project Configuration' }}</h3>
      <div class="project-meta">
        <div class="meta-item">
          <span class="meta-label">Status:</span>
          <span class="status-badge status-assigned">{{ project?.workflow_status || 'Assigned' }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">PM:</span>
          <span>{{ project?.assigned_pm || 'Not assigned' }}</span>
        </div>
      </div>
    </div>

    <!-- Substep Navigation -->
    <div class="substep-navigation">
      <div class="substep-tabs">
        <button
          v-for="substep in substeps"
          :key="substep.id"
          @click="navigateToSubstep(substep.id)"
          class="substep-tab"
          :class="{ 
            'active': currentSubstep === substep.id,
            'completed': isSubstepCompleted(substep.id)
          }"
        >
          <span class="tab-icon">{{ substep.icon }}</span>
          <span class="tab-title">{{ substep.title }}</span>
          <span v-if="isSubstepCompleted(substep.id)" class="completion-check">✓</span>
        </button>
      </div>
    </div>

    <!-- Substep Content -->
    <div class="substep-content">
      <!-- Overview Substep -->
      <div v-if="currentSubstep === 'overview'" class="substep-panel">
        <h3 class="substep-title">Project Overview</h3>
        <form @submit.prevent="saveOverview" class="substep-form">
          <div class="form-group">
            <label class="form-label">Detailed Description</label>
            <textarea
              v-model="wizardStore.overview.detailed_description"
              @input="markDirty('overview')"
              class="form-textarea"
              placeholder="Provide a detailed description of the project"
              rows="4"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Risk Assessment</label>
            <textarea
              v-model="wizardStore.overview.risk_assessment"
              @input="markDirty('overview')"
              class="form-textarea"
              placeholder="Identify potential risks and mitigation strategies"
              rows="4"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Save Overview' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Vendors Substep -->
      <div v-else-if="currentSubstep === 'vendors'" class="substep-panel">
        <div class="substep-header">
          <h3 class="substep-title">Vendors</h3>
          <button
            type="button"
            @click="addVendor"
            class="btn btn-outline btn-sm"
          >
            + Add Vendor
          </button>
        </div>
        
        <div v-if="wizardStore.vendors.vendors.length === 0" class="empty-state">
          <p>No vendors added yet. Click "Add Vendor" to get started.</p>
        </div>

        <div v-for="(vendor, index) in wizardStore.vendors.vendors" :key="vendor.vendor_id || index" class="vendor-card">
          <div class="vendor-header">
            <h4 class="vendor-title">Vendor {{ index + 1 }}</h4>
            <button
              type="button"
              @click="removeVendor(index)"
              class="btn btn-danger btn-sm"
              v-if="wizardStore.vendors.vendors.length > 1"
            >
              Remove
            </button>
          </div>

          <div class="vendor-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Vendor *</label>
                <select
                  v-model="vendor.vendor_id"
                  @change="markDirty('vendors')"
                  class="form-select"
                  required
                >
                  <option value="">Select a vendor</option>
                  <option 
                    v-for="availableVendor in wizardStore.availableVendors" 
                    :key="availableVendor.id"
                    :value="availableVendor.id"
                  >
                    {{ availableVendor.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Role</label>
                <input
                  type="text"
                  v-model="vendor.role"
                  @input="markDirty('vendors')"
                  class="form-input"
                  placeholder="e.g., Primary Contractor, Consultant"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea
                v-model="vendor.notes"
                @input="markDirty('vendors')"
                class="form-textarea"
                placeholder="Additional notes about this vendor's involvement"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="saveVendors" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : 'Save Vendors' }}
          </button>
        </div>
      </div>

      <!-- Budget Substep -->
      <div v-else-if="currentSubstep === 'budget'" class="substep-panel">
        <h3 class="substep-title">Budget Breakdown</h3>
        <form @submit.prevent="saveBudget" class="substep-form">
          <div class="budget-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Development</label>
                <input
                  type="number"
                  v-model.number="budgetBreakdown.development"
                  @input="markDirty('budget')"
                  class="form-input"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Testing</label>
                <input
                  type="number"
                  v-model.number="budgetBreakdown.testing"
                  @input="markDirty('budget')"
                  class="form-input"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Deployment</label>
                <input
                  type="number"
                  v-model.number="budgetBreakdown.deployment"
                  @input="markDirty('budget')"
                  class="form-input"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Maintenance</label>
                <input
                  type="number"
                  v-model.number="budgetBreakdown.maintenance"
                  @input="markDirty('budget')"
                  class="form-input"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div class="budget-total">
              <strong>Total Budget: ${{ formatCurrency(totalBudget) }}</strong>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Save Budget' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Milestone Substep -->
      <div v-else-if="currentSubstep === 'milestone'" class="substep-panel">
        <h3 class="substep-title">Key Milestone</h3>
        <form @submit.prevent="saveMilestone" class="substep-form">
          <div class="milestone-form">
            <div class="form-group">
              <label class="form-label">Milestone Title *</label>
              <input
                type="text"
                v-model="wizardStore.milestone1.title"
                @input="markDirty('milestone1')"
                class="form-input"
                placeholder="Enter milestone title"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Milestone Type</label>
              <select
                v-model="wizardStore.milestone1.type"
                @change="markDirty('milestone1')"
                class="form-select"
              >
                <option value="">Select type</option>
                <option value="design">Design</option>
                <option value="development">Development</option>
                <option value="testing">Testing</option>
                <option value="deployment">Deployment</option>
                <option value="review">Review</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Planned Start *</label>
                <input
                  type="date"
                  v-model="wizardStore.milestone1.planned_start"
                  @input="markDirty('milestone1')"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Planned Finish</label>
                <input
                  type="date"
                  v-model="wizardStore.milestone1.planned_finish"
                  @input="markDirty('milestone1')"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Save Milestone' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Overall Actions -->
    <div class="overall-actions">
      <div class="actions-left">
        <button type="button" @click="goBack" class="btn btn-secondary">
          Back to Assignment
        </button>
      </div>

      <div class="actions-right">
        <button
          v-if="allSubstepsCompleted"
          @click="finalizeProject"
          :disabled="isSubmitting"
          class="btn btn-success"
        >
          <span v-if="isSubmitting">Finalizing...</span>
          <span v-else>Finalize Project</span>
        </button>
        <button
          v-else
          @click="navigateToNextIncompleteSubstep"
          class="btn btn-primary"
        >
          Continue Configuration
        </button>
      </div>
    </div>

    <!-- Auto-save Indicator -->
    <div v-if="showAutoSaveIndicator" class="auto-save-indicator">
      <span class="save-icon">💾</span>
      <span class="save-text">Auto-saved</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectWizardStore } from '@/stores/projectWizard'

// Router and route
const router = useRouter()
const route = useRoute()

// Store
const wizardStore = useProjectWizardStore()

// Local state
const isSubmitting = ref(false)
const showAutoSaveIndicator = ref(false)
const autoSaveTimer = ref<NodeJS.Timeout | null>(null)

// Substep configuration
const substeps = [
  { id: 'overview', title: 'Overview', icon: '📋' },
  { id: 'vendors', title: 'Vendors', icon: '🏢' },
  { id: 'budget', title: 'Budget', icon: '💰' },
  { id: 'milestone', title: 'Milestone', icon: '🎯' }
]

// Computed properties
const currentSubstep = computed(() => {
  return route.params.substep as string || 'overview'
})

const project = computed(() => wizardStore.project)

const budgetBreakdown = computed({
  get: () => wizardStore.budget.budget_breakdown,
  set: (value) => {
    wizardStore.budget.budget_breakdown = value
    markDirty('budget')
  }
})

const totalBudget = computed(() => {
  const breakdown = budgetBreakdown.value
  return Object.values(breakdown).reduce((sum: number, amount: any) => sum + (Number(amount) || 0), 0)
})

const allSubstepsCompleted = computed(() => {
  return substeps.every(substep => isSubstepCompleted(substep.id))
})

// Methods
const markDirty = (section: string) => {
  wizardStore.markDirty(section)
}

const isSubstepCompleted = (substepId: string): boolean => {
  switch (substepId) {
    case 'overview':
      return !!(wizardStore.overview.detailed_description && wizardStore.overview.risk_assessment)
    case 'vendors':
      return wizardStore.vendors.vendors.length > 0 && 
             wizardStore.vendors.vendors.every(v => v.vendor_id)
    case 'budget':
      return Object.values(wizardStore.budget.budget_breakdown).some(amount => Number(amount) > 0)
    case 'milestone':
      return !!(wizardStore.milestone1.title && wizardStore.milestone1.planned_start)
    default:
      return false
  }
}

const navigateToSubstep = (substepId: string) => {
  const projectId = route.params.projectId as string
  router.push({
    name: 'wizard-project-configure',
    params: { projectId, substep: substepId }
  })
}

const navigateToNextIncompleteSubstep = () => {
  const nextIncomplete = substeps.find(substep => !isSubstepCompleted(substep.id))
  if (nextIncomplete) {
    navigateToSubstep(nextIncomplete.id)
  }
}

// Vendor management
const addVendor = () => {
  wizardStore.vendors.vendors.push({
    vendor_id: '',
    role: '',
    notes: ''
  })
  markDirty('vendors')
}

const removeVendor = (index: number) => {
  wizardStore.vendors.vendors.splice(index, 1)
  markDirty('vendors')
}

// Save methods
const saveOverview = async () => {
  isSubmitting.value = true
  try {
    // Auto-save logic would go here
    // For now, just mark as clean
    wizardStore.markClean('overview')
    showAutoSaveIndicator.value = true
    setTimeout(() => {
      showAutoSaveIndicator.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to save overview:', error)
  } finally {
    isSubmitting.value = false
  }
}

const saveVendors = async () => {
  isSubmitting.value = true
  try {
    // Auto-save logic would go here
    wizardStore.markClean('vendors')
    showAutoSaveIndicator.value = true
    setTimeout(() => {
      showAutoSaveIndicator.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to save vendors:', error)
  } finally {
    isSubmitting.value = false
  }
}

const saveBudget = async () => {
  isSubmitting.value = true
  try {
    // Auto-save logic would go here
    wizardStore.markClean('budget')
    showAutoSaveIndicator.value = true
    setTimeout(() => {
      showAutoSaveIndicator.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to save budget:', error)
  } finally {
    isSubmitting.value = false
  }
}

const saveMilestone = async () => {
  isSubmitting.value = true
  try {
    // Auto-save logic would go here
    wizardStore.markClean('milestone1')
    showAutoSaveIndicator.value = true
    setTimeout(() => {
      showAutoSaveIndicator.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to save milestone:', error)
  } finally {
    isSubmitting.value = false
  }
}

const finalizeProject = async () => {
  isSubmitting.value = true
  try {
    const success = await wizardStore.submitFinalization()
    if (success) {
      // Navigate to project details
      router.push(`/projects/${wizardStore.project?.id}`)
    }
  } catch (error) {
    console.error('Failed to finalize project:', error)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  const projectId = route.params.projectId as string
  router.push({
    name: 'wizard-project-assign',
    params: { projectId }
  })
}

const setupAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
  }
  
  autoSaveTimer.value = setInterval(() => {
    if (wizardStore.hasUnsavedChanges) {
      showAutoSaveIndicator.value = true
      setTimeout(() => {
        showAutoSaveIndicator.value = false
      }, 1500)
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

// Lifecycle
onMounted(async () => {
  // Load project if not already loaded
  const projectId = route.params.projectId as string
  if (projectId && !wizardStore.project) {
    await wizardStore.loadProject(projectId)
  }
  
  // Load available vendors if not already loaded
  if (wizardStore.availableVendors.length === 0) {
    await wizardStore.loadAvailableVendors()
  }
  
  // Ensure at least one vendor exists
  if (wizardStore.vendors.vendors.length === 0) {
    addVendor()
  }
  
  setupAutoSave()
})

onUnmounted(() => {
  cleanupAutoSave()
})

// Expose methods for parent component
defineExpose({
  isSubstepCompleted,
  allSubstepsCompleted,
  finalizeProject
})
</script>

<style scoped>
.configuration-step {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

/* Step Header */
.step-header {
  margin-bottom: 2rem;
  text-align: center;
}

.step-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.step-description {
  font-size: 1.1rem;
  color: #6b7280;
}

/* Project Info Card */
.project-info-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.project-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.project-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-label {
  font-weight: 500;
  color: #6b7280;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-assigned {
  background: #dbeafe;
  color: #1e40af;
}

/* Form Sections */
.form-section {
  margin-bottom: 3rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

/* Form Elements */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-outline {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f9fafb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Vendor Cards */
.vendor-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.vendor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.vendor-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

/* Budget */
.budget-total {
  margin-top: 1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  text-align: center;
  font-size: 1.125rem;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

/* Error Summary */
.error-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  color: #dc2626;
}

.error-summary h4 {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.error-summary ul {
  margin: 0;
  padding-left: 1.5rem;
}

/* Auto-save Indicator */
.auto-save-indicator {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: #10b981;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  animation: slideIn 0.3s ease-out;
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

/* Substep Navigation */
.substep-navigation {
  margin-bottom: 2rem;
}

.substep-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 2rem;
}

.substep-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  font-weight: 500;
  color: #6b7280;
  position: relative;
}

.substep-tab:hover {
  color: #374151;
  background: #f9fafb;
}

.substep-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: #eff6ff;
}

.substep-tab.completed {
  color: #059669;
}

.substep-tab.completed .tab-icon {
  color: #059669;
}

.tab-icon {
  font-size: 1.25rem;
}

.tab-title {
  font-size: 0.875rem;
}

.completion-check {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  font-size: 0.75rem;
  color: #059669;
  background: #d1fae5;
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Substep Content */
.substep-content {
  min-height: 400px;
}

.substep-panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 2rem;
}

.substep-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.substep-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.substep-form {
  space-y: 1.5rem;
}

/* Form Elements Updates */
.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Button Updates */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-success {
  background: #059669;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #047857;
}

.btn-success:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Vendor Cards Updates */
.vendor-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #fafafa;
}

/* Budget Updates */
.budget-total {
  margin-top: 1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  text-align: center;
  font-size: 1.125rem;
  border: 2px solid #e5e7eb;
}

/* Form Actions Updates */
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.overall-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e5e7eb;
}

.actions-left,
.actions-right {
  display: flex;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .configuration-step {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .actions-left,
  .actions-right {
    flex-direction: column;
  }
}
</style>

