<template>
  <div class="project-details-adapter">
    <!-- Adapter Header -->
    <div class="adapter-header">
      <h3 class="adapter-title">{{ title }}</h3>
      <p v-if="description" class="adapter-description">{{ description }}</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button
        v-for="tab in availableTabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="tab-button"
        :class="{ 'active': activeTab === tab.id }"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Details Tab -->
      <div v-if="activeTab === 'details'" class="tab-panel">
        <DetailsTab
          v-if="project"
          :project="project"
          :is-wizard-mode="true"
          @update:project="handleProjectUpdate"
          @validation-change="handleValidationChange"
        />
        <div v-else class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading project details...</p>
        </div>
      </div>

      <!-- Vendors Tab -->
      <div v-if="activeTab === 'vendors'" class="tab-panel">
        <VendorsTab
          v-if="project"
          :project="project"
          :is-wizard-mode="true"
          @update:vendors="handleVendorsUpdate"
          @validation-change="handleValidationChange"
        />
        <div v-else class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading vendors...</p>
        </div>
      </div>

      <!-- Budget Tab -->
      <div v-if="activeTab === 'budget'" class="tab-panel">
        <BudgetTab
          v-if="project"
          :project="project"
          :is-wizard-mode="true"
          @update:budget="handleBudgetUpdate"
          @validation-change="handleValidationChange"
        />
        <div v-else class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading budget information...</p>
        </div>
      </div>

      <!-- Milestones Tab -->
      <div v-if="activeTab === 'milestones'" class="tab-panel">
        <MilestonesTab
          v-if="project"
          :project="project"
          :is-wizard-mode="true"
          @update:milestones="handleMilestonesUpdate"
          @validation-change="handleValidationChange"
        />
        <div v-else class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading milestones...</p>
        </div>
      </div>

      <!-- Team Tab -->
      <div v-if="activeTab === 'team'" class="tab-panel">
        <div class="team-assignment-wrapper">
          <div class="team-info">
            <h4>Current Team Assignment</h4>
            <div v-if="project?.assigned_pm || project?.assigned_spm" class="team-members">
              <div v-if="project.assigned_pm" class="team-member">
                <span class="member-role">Project Manager:</span>
                <span class="member-name">{{ getUserName(project.assigned_pm) }}</span>
              </div>
              <div v-if="project.assigned_spm" class="team-member">
                <span class="member-role">Senior Project Manager:</span>
                <span class="member-name">{{ getUserName(project.assigned_spm) }}</span>
              </div>
            </div>
            <div v-else class="no-team">
              <p>No team members assigned yet.</p>
            </div>
          </div>
          
          <div v-if="canEditTeam" class="team-actions">
            <button
              @click="editTeamAssignment"
              class="btn btn-outline"
            >
              Edit Team Assignment
            </button>
          </div>
        </div>
      </div>

      <!-- Custom Tab Content -->
      <div v-if="activeTab === 'custom'" class="tab-panel">
        <slot name="custom-content" :project="project" />
      </div>
    </div>

    <!-- Validation Summary -->
    <div v-if="hasValidationErrors" class="validation-summary">
      <div class="validation-header">
        <span class="validation-icon">⚠️</span>
        <span class="validation-title">Please fix the following issues:</span>
      </div>
      <ul class="validation-list">
        <li v-for="error in validationErrors" :key="error" class="validation-item">
          {{ error }}
        </li>
      </ul>
    </div>

    <!-- Adapter Actions -->
    <div class="adapter-actions">
      <div class="actions-left">
        <slot name="left-actions" />
      </div>
      
      <div class="actions-right">
        <slot name="right-actions" :is-valid="!hasValidationErrors" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DetailsTab from '@/components/project-detail/DetailsTab.vue'
import VendorsTab from '@/components/project-detail/VendorsTab.vue'
import BudgetTab from '@/components/project-detail/BudgetTab.vue'
import MilestonesTab from '@/components/project-detail/MilestonesTab.vue'

// Props
interface Props {
  project?: any
  title?: string
  description?: string
  defaultTab?: string
  availableTabs?: Array<{
    id: string
    label: string
    component?: string
  }>
  canEditTeam?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Project Details',
  description: '',
  defaultTab: 'details',
  availableTabs: () => [
    { id: 'details', label: 'Details' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'budget', label: 'Budget' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'team', label: 'Team' }
  ],
  canEditTeam: false
})

// Emits
const emit = defineEmits<{
  'update:project': [project: any]
  'validation-change': [isValid: boolean, errors: string[]]
  'tab-change': [tabId: string]
  'edit-team': []
}>()

// Composables
const router = useRouter()

// Local state
const activeTab = ref(props.defaultTab)
const validationErrors = ref<string[]>([])

// Computed properties
const hasValidationErrors = computed(() => validationErrors.value.length > 0)

// Methods
const handleProjectUpdate = (updatedProject: any) => {
  emit('update:project', updatedProject)
}

const handleVendorsUpdate = (vendors: any[]) => {
  const updatedProject = { ...props.project, vendors }
  emit('update:project', updatedProject)
}

const handleBudgetUpdate = (budgetData: any) => {
  const updatedProject = { ...props.project, ...budgetData }
  emit('update:project', updatedProject)
}

const handleMilestonesUpdate = (milestones: any[]) => {
  const updatedProject = { ...props.project, milestones }
  emit('update:project', updatedProject)
}

const handleValidationChange = (isValid: boolean, errors: string[] = []) => {
  validationErrors.value = errors
  emit('validation-change', isValid, errors)
}

const editTeamAssignment = () => {
  emit('edit-team')
}

const getUserName = (userId: string) => {
  // This would typically fetch from a user store or API
  return `User ${userId}`
}

// Watchers
watch(() => activeTab.value, (newTab) => {
  emit('tab-change', newTab)
})

watch(() => props.defaultTab, (newDefaultTab) => {
  if (newDefaultTab && newDefaultTab !== activeTab.value) {
    activeTab.value = newDefaultTab
  }
})

// Lifecycle
onMounted(() => {
  // Ensure default tab is available
  const tabExists = props.availableTabs.some(tab => tab.id === props.defaultTab)
  if (!tabExists && props.availableTabs.length > 0) {
    activeTab.value = props.availableTabs[0].id
  }
})

// Expose methods for parent component
defineExpose({
  activeTab,
  setActiveTab: (tabId: string) => {
    if (props.availableTabs.some(tab => tab.id === tabId)) {
      activeTab.value = tabId
    }
  },
  validateCurrentTab: () => {
    // This would trigger validation on the current tab component
    return !hasValidationErrors.value
  }
})
</script>

<style scoped>
.project-details-adapter {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Adapter Header */
.adapter-header {
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
}

.adapter-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 0.5rem;
}

.adapter-description {
  color: #6c757d;
  margin: 0;
  line-height: 1.5;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  border-bottom: 1px solid #dee2e6;
  background: white;
  overflow-x: auto;
}

.tab-button {
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: #6c757d;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.tab-button:hover {
  color: #007bff;
  background: #f8f9fa;
}

.tab-button.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background: white;
}

/* Tab Content */
.tab-content {
  min-height: 400px;
}

.tab-panel {
  padding: 2rem;
}

/* Team Assignment Wrapper */
.team-assignment-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.team-info h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1rem;
}

.team-members {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 0.375rem;
}

.member-role {
  font-weight: 500;
  color: #495057;
  min-width: 150px;
}

.member-name {
  color: #212529;
}

.no-team {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.team-actions {
  display: flex;
  justify-content: flex-start;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e9ecef;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Validation Summary */
.validation-summary {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1.5rem;
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

/* Adapter Actions */
.adapter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
}

.actions-left,
.actions-right {
  display: flex;
  gap: 1rem;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Responsive Design */
@media (max-width: 768px) {
  .adapter-header {
    padding: 1rem;
  }
  
  .tab-panel {
    padding: 1rem;
  }
  
  .tab-button {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
  
  .team-assignment-wrapper {
    gap: 1.5rem;
  }
  
  .team-member {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .member-role {
    min-width: auto;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #6c757d;
  }
  
  .adapter-actions {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .actions-left,
  .actions-right {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .tab-navigation {
    flex-wrap: wrap;
  }
  
  .tab-button {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.75rem;
  }
  
  .actions-left,
  .actions-right {
    flex-direction: column;
  }
}
</style>

