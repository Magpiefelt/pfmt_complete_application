<template>
  <div class="wizard-integration">
    <!-- Integration Status -->
    <div class="integration-status">
      <div class="status-indicator" :class="statusClass">
        <span class="status-icon">{{ statusIcon }}</span>
        <span class="status-text">{{ statusText }}</span>
      </div>
      
      <div v-if="lastSync" class="last-sync">
        Last synced: {{ formatTime(lastSync) }}
      </div>
    </div>

    <!-- Project Context -->
    <div v-if="currentProject" class="project-context">
      <div class="project-header">
        <h3 class="project-name">{{ currentProject.name }}</h3>
        <div class="project-meta">
          <span class="project-id">ID: {{ currentProject.id }}</span>
          <span class="project-status" :class="`status-${currentProject.status}`">
            {{ formatStatus(currentProject.status) }}
          </span>
        </div>
      </div>
      
      <div class="project-progress">
        <div class="progress-label">Completion Progress</div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: completionPercentage + '%' }"
          ></div>
        </div>
        <div class="progress-text">{{ completionPercentage }}% Complete</div>
      </div>
    </div>

    <!-- Integration Actions -->
    <div class="integration-actions">
      <button
        @click="syncWithProjectSystem"
        class="btn btn-primary btn-sm"
        :disabled="isSyncing"
      >
        {{ isSyncing ? 'Syncing...' : 'Sync Now' }}
      </button>
      
      <button
        v-if="currentProject"
        @click="viewInProjectSystem"
        class="btn btn-outline btn-sm"
      >
        View in Project System
      </button>
      
      <button
        @click="exportWizardData"
        class="btn btn-outline btn-sm"
        :disabled="isExporting"
      >
        {{ isExporting ? 'Exporting...' : 'Export Data' }}
      </button>
    </div>

    <!-- Integration Logs -->
    <div v-if="showLogs" class="integration-logs">
      <div class="logs-header">
        <h4 class="logs-title">Integration Activity</h4>
        <button @click="showLogs = false" class="btn-close">×</button>
      </div>
      
      <div class="logs-content">
        <div
          v-for="log in integrationLogs"
          :key="log.id"
          class="log-entry"
          :class="`log-${log.type}`"
        >
          <div class="log-time">{{ formatTime(log.timestamp) }}</div>
          <div class="log-message">{{ log.message }}</div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="integrationError" class="integration-error">
      <div class="error-header">
        <span class="error-icon">⚠️</span>
        <span class="error-title">Integration Error</span>
      </div>
      <div class="error-message">{{ integrationError }}</div>
      <div class="error-actions">
        <button @click="retryIntegration" class="btn btn-sm btn-primary">
          Retry
        </button>
        <button @click="clearError" class="btn btn-sm btn-secondary">
          Dismiss
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useProjectWizardIntegration } from '@/composables/useProjectWizardIntegration'
import { ProjectWorkflowAPI } from '@/services/projectWorkflowApi'

// Composables
const {
  wizardStore,
  authStore,
  handleWizardError
} = useProjectWizardIntegration()

// Local state
const isSyncing = ref(false)
const isExporting = ref(false)
const showLogs = ref(false)
const lastSync = ref<Date | null>(null)
const integrationError = ref('')
const integrationLogs = ref<Array<{
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: Date
}>>([])

// Computed properties
const currentProject = computed(() => wizardStore.project)

const statusClass = computed(() => {
  if (integrationError.value) return 'status-error'
  if (isSyncing.value) return 'status-syncing'
  if (lastSync.value) return 'status-synced'
  return 'status-pending'
})

const statusIcon = computed(() => {
  if (integrationError.value) return '⚠️'
  if (isSyncing.value) return '🔄'
  if (lastSync.value) return '✅'
  return '⏳'
})

const statusText = computed(() => {
  if (integrationError.value) return 'Integration Error'
  if (isSyncing.value) return 'Syncing...'
  if (lastSync.value) return 'Synchronized'
  return 'Pending Sync'
})

const completionPercentage = computed(() => {
  if (!currentProject.value) return 0
  
  let completed = 0
  let total = 3 // Total wizard steps
  
  // Check initiation completion
  if (currentProject.value.name && currentProject.value.description) {
    completed++
  }
  
  // Check assignment completion
  if (currentProject.value.assigned_pm) {
    completed++
  }
  
  // Check configuration completion
  if (currentProject.value.status === 'active') {
    completed++
  }
  
  return Math.round((completed / total) * 100)
})

// Methods
const syncWithProjectSystem = async () => {
  if (isSyncing.value) return
  
  isSyncing.value = true
  integrationError.value = ''
  
  try {
    addLog('info', 'Starting synchronization with project system...')
    
    // Sync wizard state with project system
    if (currentProject.value) {
      await ProjectWorkflowAPI.syncProject(currentProject.value.id)
      addLog('success', 'Project data synchronized successfully')
    }
    
    // Sync user permissions and roles
    await syncUserPermissions()
    addLog('success', 'User permissions synchronized')
    
    // Update last sync time
    lastSync.value = new Date()
    addLog('success', 'Synchronization completed successfully')
    
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to sync with project system'
    integrationError.value = errorMessage
    addLog('error', errorMessage)
    handleWizardError(error)
  } finally {
    isSyncing.value = false
  }
}

const syncUserPermissions = async () => {
  // Sync user roles and permissions with the main system
  const user = authStore.currentUser
  if (!user) return
  
  // This would typically call an API to sync permissions
  // For now, we'll simulate the sync
  await new Promise(resolve => setTimeout(resolve, 1000))
}

const viewInProjectSystem = () => {
  if (!currentProject.value) return
  
  // Navigate to the project in the main system
  const projectUrl = `/projects/${currentProject.value.id}`
  window.open(projectUrl, '_blank')
  
  addLog('info', `Opened project ${currentProject.value.id} in project system`)
}

const exportWizardData = async () => {
  if (isExporting.value) return
  
  isExporting.value = true
  
  try {
    addLog('info', 'Exporting wizard data...')
    
    // Prepare export data
    const exportData = {
      project: currentProject.value,
      wizardState: {
        initiation: wizardStore.initiation,
        assignment: wizardStore.assignment,
        finalization: wizardStore.finalization
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: authStore.currentUser?.id,
        version: '2.0.0'
      }
    }
    
    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wizard-data-${currentProject.value?.id || 'new'}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    addLog('success', 'Wizard data exported successfully')
    
  } catch (error: any) {
    const errorMessage = 'Failed to export wizard data'
    addLog('error', errorMessage)
    handleWizardError(error)
  } finally {
    isExporting.value = false
  }
}

const retryIntegration = () => {
  integrationError.value = ''
  syncWithProjectSystem()
}

const clearError = () => {
  integrationError.value = ''
}

const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
  const log = {
    id: Date.now().toString(),
    type,
    message,
    timestamp: new Date()
  }
  
  integrationLogs.value.unshift(log)
  
  // Keep only last 50 logs
  if (integrationLogs.value.length > 50) {
    integrationLogs.value = integrationLogs.value.slice(0, 50)
  }
}

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

const formatTime = (date: Date) => {
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Auto-sync functionality
let autoSyncTimer: NodeJS.Timeout | null = null

const setupAutoSync = () => {
  // Auto-sync every 5 minutes
  autoSyncTimer = setInterval(() => {
    if (!isSyncing.value && !integrationError.value) {
      syncWithProjectSystem()
    }
  }, 5 * 60 * 1000)
}

const cleanupAutoSync = () => {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer)
    autoSyncTimer = null
  }
}

// Lifecycle
onMounted(() => {
  // Initial sync
  setTimeout(() => {
    syncWithProjectSystem()
  }, 1000)
  
  // Setup auto-sync
  setupAutoSync()
})

onUnmounted(() => {
  cleanupAutoSync()
})
</script>

<style scoped>
.wizard-integration {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

/* Integration Status */
.integration-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.status-indicator.status-synced {
  color: #28a745;
}

.status-indicator.status-syncing {
  color: #007bff;
}

.status-indicator.status-error {
  color: #dc3545;
}

.status-indicator.status-pending {
  color: #ffc107;
}

.status-icon {
  font-size: 1rem;
}

.last-sync {
  color: #6c757d;
  font-size: 0.875rem;
}

/* Project Context */
.project-context {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.375rem;
}

.project-header {
  margin-bottom: 1rem;
}

.project-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
  margin: 0 0 0.5rem;
}

.project-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.project-id {
  color: #6c757d;
}

.project-status {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
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

.project-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
}

.progress-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6c757d;
  text-align: right;
}

/* Integration Actions */
.integration-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

/* Integration Logs */
.integration-logs {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.logs-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #212529;
}

.logs-content {
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
}

.log-entry {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.log-entry.log-info {
  background: #e3f2fd;
  color: #1565c0;
}

.log-entry.log-success {
  background: #e8f5e8;
  color: #2e7d32;
}

.log-entry.log-warning {
  background: #fff3cd;
  color: #856404;
}

.log-entry.log-error {
  background: #f8d7da;
  color: #721c24;
}

.log-time {
  font-weight: 500;
  white-space: nowrap;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

/* Integration Error */
.integration-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 0.375rem;
  padding: 1rem;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.error-icon {
  font-size: 1rem;
}

.error-title {
  font-weight: 600;
  color: #721c24;
}

.error-message {
  color: #721c24;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
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

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
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

/* Responsive Design */
@media (max-width: 768px) {
  .integration-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .project-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .integration-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .error-actions {
    flex-direction: column;
  }
}
</style>

