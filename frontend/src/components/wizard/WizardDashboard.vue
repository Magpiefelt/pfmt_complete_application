<template>
  <div class="wizard-dashboard">
    <!-- Welcome Section -->
    <div class="dashboard-header">
      <h1 class="dashboard-title">Project Wizard</h1>
      <p class="dashboard-subtitle">
        Welcome, {{ userRoleDisplay }}. Choose your next action to manage projects efficiently.
      </p>
    </div>

    <!-- Action Cards -->
    <div class="action-cards">
      <!-- Initiate New Project -->
      <div 
        v-if="canUserInitiateProjects"
        class="action-card card-primary"
        @click="initiateNewProject"
      >
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
        </div>
        <div class="card-content">
          <h3 class="card-title">Start New Project</h3>
          <p class="card-description">
            Create a new project and begin the initiation process. Define project scope, objectives, and basic requirements.
          </p>
          <div class="card-meta">
            <span class="meta-badge">PMI • Admin</span>
          </div>
        </div>
        <div class="card-arrow">→</div>
      </div>

      <!-- Resume Projects -->
      <div 
        v-if="resumableProjects.length > 0"
        class="action-card card-secondary"
        @click="showResumeProjects = !showResumeProjects"
      >
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <div class="card-content">
          <h3 class="card-title">Resume Projects</h3>
          <p class="card-description">
            Continue working on projects that are waiting for your input. 
            {{ resumableProjects.length }} project{{ resumableProjects.length !== 1 ? 's' : '' }} available.
          </p>
          <div class="card-meta">
            <span class="meta-badge">{{ resumableProjects.length }} Available</span>
          </div>
        </div>
        <div class="card-arrow">{{ showResumeProjects ? '↓' : '→' }}</div>
      </div>

      <!-- Assign Teams -->
      <div 
        v-if="canUserAssignTeams && assignableProjects.length > 0"
        class="action-card card-warning"
        @click="showAssignableProjects = !showAssignableProjects"
      >
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10l-1.99-1.01A2.5 2.5 0 0 0 10 8H8.46c-.8 0-1.49.59-1.42 1.37L8.5 16H11v6h2v-6h2v6h2z"/>
          </svg>
        </div>
        <div class="card-content">
          <h3 class="card-title">Assign Teams</h3>
          <p class="card-description">
            Assign project managers and senior project managers to initiated projects.
            {{ assignableProjects.length }} project{{ assignableProjects.length !== 1 ? 's' : '' }} need assignment.
          </p>
          <div class="card-meta">
            <span class="meta-badge">Director • Admin</span>
          </div>
        </div>
        <div class="card-arrow">{{ showAssignableProjects ? '↓' : '→' }}</div>
      </div>

      <!-- Configure Projects -->
      <div 
        v-if="canUserFinalizeProjects && configurableProjects.length > 0"
        class="action-card card-success"
        @click="showConfigurableProjects = !showConfigurableProjects"
      >
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div class="card-content">
          <h3 class="card-title">Configure Projects</h3>
          <p class="card-description">
            Complete project configuration including vendors, budget, and milestones.
            {{ configurableProjects.length }} project{{ configurableProjects.length !== 1 ? 's' : '' }} ready for configuration.
          </p>
          <div class="card-meta">
            <span class="meta-badge">PM • SPM • Admin</span>
          </div>
        </div>
        <div class="card-arrow">{{ showConfigurableProjects ? '↓' : '→' }}</div>
      </div>

      <!-- No Actions Available -->
      <div v-if="!hasAnyActions" class="action-card card-disabled">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="card-content">
          <h3 class="card-title">All Caught Up!</h3>
          <p class="card-description">
            No projects currently require your attention. Check back later or contact your administrator if you need access to additional features.
          </p>
          <div class="card-meta">
            <span class="meta-badge">{{ userRoleDisplay }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Expandable Project Lists -->
    <div v-if="showResumeProjects && resumableProjects.length > 0" class="project-list">
      <h3 class="list-title">Projects to Resume</h3>
      <div class="project-cards">
        <div 
          v-for="project in resumableProjects" 
          :key="project.id"
          class="project-card"
          @click="resumeProject(project)"
        >
          <div class="project-header">
            <h4 class="project-name">{{ project.name }}</h4>
            <span class="project-status" :class="`status-${project.workflow_status}`">
              {{ formatStatus(project.workflow_status) }}
            </span>
          </div>
          <p class="project-description">{{ project.description || 'No description available' }}</p>
          <div class="project-meta">
            <div class="meta-item">
              <span class="meta-label">Next Step:</span>
              <span class="meta-value">{{ getNextStepForProject(project) }}</span>
            </div>
            <div v-if="project.updated_at" class="meta-item">
              <span class="meta-label">Updated:</span>
              <span class="meta-value">{{ formatDate(project.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAssignableProjects && assignableProjects.length > 0" class="project-list">
      <h3 class="list-title">Projects Awaiting Team Assignment</h3>
      <div class="project-cards">
        <div 
          v-for="project in assignableProjects" 
          :key="project.id"
          class="project-card"
          @click="assignTeamToProject(project)"
        >
          <div class="project-header">
            <h4 class="project-name">{{ project.name }}</h4>
            <span class="project-status status-initiated">Initiated</span>
          </div>
          <p class="project-description">{{ project.description || 'No description available' }}</p>
          <div class="project-meta">
            <div class="meta-item">
              <span class="meta-label">Created:</span>
              <span class="meta-value">{{ formatDate(project.created_at) }}</span>
            </div>
            <div v-if="project.estimated_budget" class="meta-item">
              <span class="meta-label">Budget:</span>
              <span class="meta-value">${{ formatCurrency(project.estimated_budget) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showConfigurableProjects && configurableProjects.length > 0" class="project-list">
      <h3 class="list-title">Projects Ready for Configuration</h3>
      <div class="project-cards">
        <div 
          v-for="project in configurableProjects" 
          :key="project.id"
          class="project-card"
          @click="configureProject(project)"
        >
          <div class="project-header">
            <h4 class="project-name">{{ project.name }}</h4>
            <span class="project-status status-assigned">Assigned</span>
          </div>
          <p class="project-description">{{ project.description || 'No description available' }}</p>
          <div class="project-meta">
            <div v-if="project.assigned_pm" class="meta-item">
              <span class="meta-label">PM:</span>
              <span class="meta-value">{{ getUserName(project.assigned_pm) }}</span>
            </div>
            <div v-if="project.assigned_spm" class="meta-item">
              <span class="meta-label">SPM:</span>
              <span class="meta-value">{{ getUserName(project.assigned_spm) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="dashboard-stats">
      <div class="stat-card">
        <div class="stat-number">{{ totalProjects }}</div>
        <div class="stat-label">Total Projects</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ activeProjects }}</div>
        <div class="stat-label">Active Projects</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ pendingActions }}</div>
        <div class="stat-label">Pending Actions</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'
import { ProjectWorkflowAPI } from '@/services/projectWorkflowApi'

// Composables
const router = useRouter()
const {
  canUserInitiateProjects,
  canUserAssignTeams,
  canUserFinalizeProjects,
  getUserRoleDisplay,
  authStore,
  wizardStore
} = useProjectWizardIntegration()

// Local state
const isLoading = ref(true)
const showResumeProjects = ref(false)
const showAssignableProjects = ref(false)
const showConfigurableProjects = ref(false)
const availableProjects = ref<any[]>([])

// Computed properties
const userRoleDisplay = computed(() => getUserRoleDisplay.value)

const resumableProjects = computed(() => {
  return availableProjects.value.filter(project => {
    const userRole = authStore.currentUser?.role
    const userId = authStore.currentUser?.id?.toString()
    
    // Projects user can resume based on role and status
    const nextStep = ProjectWorkflowAPI.getNextStepForUser(
      userRole,
      project.workflow_status,
      project.assigned_pm,
      project.assigned_spm,
      userId,
      project.id
    )

    return nextStep !== null
  })
})

const assignableProjects = computed(() => {
  return availableProjects.value.filter(project => 
    project.workflow_status === 'initiated' && canUserAssignTeams.value
  )
})

const configurableProjects = computed(() => {
  const userRole = authStore.currentUser?.role
  const userId = authStore.currentUser?.id?.toString()
  
  return availableProjects.value.filter(project => {
    if (project.workflow_status !== 'assigned') return false
    
    // Check if user can configure this project
    if (userRole === 'admin') return true
    if (userRole === 'pm' && project.assigned_pm === userId) return true
    if (userRole === 'spm' && project.assigned_spm === userId) return true
    
    return false
  })
})

const hasAnyActions = computed(() => {
  return canUserInitiateProjects.value || 
         resumableProjects.value.length > 0 ||
         assignableProjects.value.length > 0 ||
         configurableProjects.value.length > 0
})

const totalProjects = computed(() => availableProjects.value.length)

const activeProjects = computed(() => 
  availableProjects.value.filter(p => p.workflow_status === 'active').length
)

const pendingActions = computed(() => 
  resumableProjects.value.length + 
  assignableProjects.value.length + 
  configurableProjects.value.length
)

// Methods
const loadDashboardData = async () => {
  try {
    isLoading.value = true
    
    // Load projects based on user role
    const userRole = authStore.currentUser?.role
    const userId = authStore.currentUser?.id?.toString()
    
    if (userRole && userId) {
      // This would typically call an API to get projects for the user
      // For now, we'll simulate with empty array
      availableProjects.value = []
      
      // In a real implementation, you'd call something like:
      // availableProjects.value = await ProjectWorkflowAPI.getUserProjects(userId, userRole)
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

const initiateNewProject = () => {
  router.push({ name: 'wizard-initiate' })
}

const resumeProject = (project: any) => {
  const userRole = authStore.currentUser?.role
  const userId = authStore.currentUser?.id?.toString()
  
  const nextStep = ProjectWorkflowAPI.getNextStepForUser(
    userRole,
    project.workflow_status,
    project.assigned_pm,
    project.assigned_spm,
    userId,
    project.id
  )

  if (nextStep) {
    router.push({ name: nextStep.route, params: nextStep.params })
  }
}

const assignTeamToProject = (project: any) => {
  router.push({
    name: 'wizard-project-assign',
    params: { projectId: project.id }
  })
}

const configureProject = (project: any) => {
  router.push({
    name: 'wizard-project-configure',
    params: { projectId: project.id }
  })
}

const getNextStepForProject = (project: any): string => {
  const userRole = authStore.currentUser?.role
  const userId = authStore.currentUser?.id?.toString()
  
  const nextStep = ProjectWorkflowAPI.getNextStepForUser(
    userRole,
    project.workflow_status,
    project.assigned_pm,
    project.assigned_spm,
    userId,
    project.id
  )

  switch (nextStep?.route) {
    case 'wizard-initiate':
      return 'Project Initiation'
    case 'wizard-project-assign':
      return 'Team Assignment'
    case 'wizard-project-configure':
      return 'Project Configuration'
    case 'project-detail':
      return 'Project Details'
    default:
      return 'Unknown'
  }
}

// Utility methods
const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const getUserName = (userId: string) => {
  // This would typically fetch from a user store or API
  return `User ${userId}`
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.wizard-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header Styles */
.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #212529;
  margin: 0 0 1rem;
}

.dashboard-subtitle {
  font-size: 1.125rem;
  color: #6c757d;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
}

/* Action Cards */
.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.action-card {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.action-card.card-primary {
  border-color: #007bff;
}

.action-card.card-primary:hover {
  border-color: #0056b3;
  background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
}

.action-card.card-secondary {
  border-color: #6c757d;
}

.action-card.card-secondary:hover {
  border-color: #495057;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.action-card.card-warning {
  border-color: #ffc107;
}

.action-card.card-warning:hover {
  border-color: #e0a800;
  background: linear-gradient(135deg, #fffbf0 0%, #fff3cd 100%);
}

.action-card.card-success {
  border-color: #28a745;
}

.action-card.card-success:hover {
  border-color: #1e7e34;
  background: linear-gradient(135deg, #f8fff9 0%, #d4edda 100%);
}

.action-card.card-disabled {
  border-color: #dee2e6;
  cursor: default;
  opacity: 0.7;
}

.action-card.card-disabled:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
}

.card-icon svg {
  width: 100%;
  height: 100%;
  color: currentColor;
}

.card-primary .card-icon {
  color: #007bff;
}

.card-secondary .card-icon {
  color: #6c757d;
}

.card-warning .card-icon {
  color: #ffc107;
}

.card-success .card-icon {
  color: #28a745;
}

.card-disabled .card-icon {
  color: #adb5bd;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 0.5rem;
}

.card-description {
  color: #6c757d;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.card-meta {
  display: flex;
  gap: 0.5rem;
}

.meta-badge {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.card-arrow {
  font-size: 1.5rem;
  color: #adb5bd;
  align-self: center;
  transition: transform 0.2s ease;
}

.action-card:hover .card-arrow {
  transform: translateX(0.25rem);
}

/* Project Lists */
.project-list {
  margin-bottom: 3rem;
}

.list-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 1.5rem;
}

.project-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.project-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.project-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
  flex: 1;
  margin-right: 1rem;
}

.project-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  white-space: nowrap;
}

.project-status.status-initiated {
  background: #fff3cd;
  color: #856404;
}

.project-status.status-assigned {
  background: #d1ecf1;
  color: #0c5460;
}

.project-status.status-active {
  background: #d4edda;
  color: #155724;
}

.project-description {
  color: #6c757d;
  margin: 0 0 1rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
}

.meta-value {
  font-size: 0.875rem;
  color: #212529;
}

/* Dashboard Stats */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
}

.stat-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.875rem;
}

/* Loading State */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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

/* Responsive Design */
@media (max-width: 768px) {
  .wizard-dashboard {
    padding: 1rem;
  }
  
  .dashboard-title {
    font-size: 2rem;
  }
  
  .action-cards {
    grid-template-columns: 1fr;
  }
  
  .action-card {
    padding: 1.5rem;
  }
  
  .project-cards {
    grid-template-columns: 1fr;
  }
  
  .dashboard-stats {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .stat-card {
    padding: 1.5rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
}
</style>

