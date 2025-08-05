<template>
  <div class="project-version-manager">
    <!-- Version Status Header -->
    <div class="version-status-header bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Version Management</h2>
          <p class="text-sm text-gray-600 mt-1">
            Current Version: {{ currentProject?.project.currentVersionId ? `v${currentVersion?.versionNumber}` : 'None' }}
          </p>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- Version Status Badge -->
          <div v-if="currentVersion" class="flex items-center space-x-2">
            <span class="text-sm text-gray-600">Status:</span>
            <span :class="getStatusBadgeClass(currentVersion.reportStatus)" class="px-2 py-1 rounded-full text-xs font-medium">
              {{ currentVersion.reportStatus }}
            </span>
          </div>
          
          <!-- Pending Changes Indicator -->
          <div v-if="currentProject?.project.hasPendingChanges" class="flex items-center space-x-1 text-amber-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-medium">Pending Changes</span>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center space-x-3 mt-4">
        <button
          v-if="canCreateDraft && !hasDraftVersion"
          @click="handleCreateDraft"
          :disabled="loading"
          class="btn btn-primary"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Draft
        </button>
        
        <button
          v-if="latestDraft"
          @click="editDraft"
          class="btn btn-secondary"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Draft
        </button>
        
        <button
          v-if="latestDraft"
          @click="handleSubmitForApproval"
          :disabled="loading"
          class="btn btn-success"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Submit for Approval
        </button>
        
        <button
          @click="refreshVersions"
          :disabled="loading"
          class="btn btn-outline"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
    
    <!-- Version History -->
    <div class="version-history bg-white rounded-lg shadow-sm border">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Version History</h3>
        <p class="text-sm text-gray-600 mt-1">Track all changes and approvals for this project</p>
      </div>
      
      <div class="p-6">
        <div v-if="loading && versions.length === 0" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Loading versions...</p>
        </div>
        
        <div v-else-if="versions.length === 0" class="text-center py-8">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-600">No versions found</p>
        </div>
        
        <div v-else class="space-y-4">
          <div
            v-for="version in versions"
            :key="version.projectVersionId"
            class="version-item border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            :class="getVersionItemClass(version)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <div :class="getVersionIconClass(version)" class="w-8 h-8 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-white">v{{ version.versionNumber }}</span>
                  </div>
                </div>
                
                <div>
                  <div class="flex items-center space-x-2">
                    <h4 class="text-sm font-medium text-gray-900">Version {{ version.versionNumber }}</h4>
                    <span :class="getStatusBadgeClass(version.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                      {{ version.status }}
                    </span>
                  </div>
                  
                  <div class="text-xs text-gray-600 mt-1">
                    <span>Created {{ formatDate(version.createdAt) }}</span>
                    <span v-if="version.updatedAt !== version.createdAt"> • Updated {{ formatDate(version.updatedAt) }}</span>
                  </div>
                  
                  <div v-if="version.rejectionReason" class="text-xs text-red-600 mt-1">
                    <strong>Rejection Reason:</strong> {{ version.rejectionReason }}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <!-- Version Actions -->
                <button
                  v-if="version.status === 'Draft'"
                  @click="editVersion(version)"
                  class="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                
                <button
                  v-if="version.status === 'PendingApproval' && canApprove"
                  @click="handleApproveVersion(version)"
                  :disabled="loading"
                  class="text-green-600 hover:text-green-800 text-sm"
                >
                  Approve
                </button>
                
                <button
                  v-if="version.status === 'PendingApproval' && canApprove"
                  @click="handleRejectVersion(version)"
                  :disabled="loading"
                  class="text-red-600 hover:text-red-800 text-sm"
                >
                  Reject
                </button>
                
                <button
                  @click="viewVersion(version)"
                  class="text-gray-600 hover:text-gray-800 text-sm"
                >
                  View
                </button>
                
                <button
                  v-if="versions.length > 1"
                  @click="compareVersion(version)"
                  class="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Compare
                </button>
                
                <button
                  v-if="version.status === 'Draft'"
                  @click="handleDeleteDraft(version)"
                  :disabled="loading"
                  class="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Rejection Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Reject Version</h3>
        <p class="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this version:</p>
        
        <textarea
          v-model="rejectionReason"
          rows="4"
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          placeholder="Enter rejection reason..."
        ></textarea>
        
        <div class="flex justify-end space-x-3 mt-4">
          <button
            @click="showRejectModal = false"
            class="btn btn-outline"
          >
            Cancel
          </button>
          <button
            @click="confirmRejectVersion"
            :disabled="!rejectionReason.trim() || loading"
            class="btn btn-danger"
          >
            Reject Version
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProjectVersions, type ProjectVersion } from '@/composables/useProjectVersions'

// Props
interface Props {
  projectId: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  editVersion: [version: ProjectVersion]
  viewVersion: [version: ProjectVersion]
  compareVersion: [version: ProjectVersion]
}>()

// Composables
const {
  loading,
  error,
  currentProject,
  versions,
  canCreateDraft,
  canApprove,
  hasDraftVersion,
  latestDraft,
  getProject,
  getVersionHistory,
  createDraftVersion,
  submitForApproval,
  approveVersion,
  rejectVersion,
  deleteDraftVersion
} = useProjectVersions()

// Local state
const showRejectModal = ref(false)
const rejectionReason = ref('')
const versionToReject = ref<ProjectVersion | null>(null)

// Computed
const currentVersion = computed(() => currentProject.value?.currentVersion)

// Methods
const handleCreateDraft = async () => {
  try {
    await createDraftVersion(props.projectId)
    // Optionally emit event to parent to switch to edit mode
  } catch (err) {
    console.error('Failed to create draft:', err)
  }
}

const editDraft = () => {
  if (latestDraft.value) {
    emit('editVersion', latestDraft.value)
  }
}

const editVersion = (version: ProjectVersion) => {
  emit('editVersion', version)
}

const viewVersion = (version: ProjectVersion) => {
  emit('viewVersion', version)
}

const compareVersion = (version: ProjectVersion) => {
  emit('compareVersion', version)
}

const handleSubmitForApproval = async () => {
  if (!latestDraft.value) return
  
  try {
    await submitForApproval(props.projectId, latestDraft.value.projectVersionId)
  } catch (err) {
    console.error('Failed to submit for approval:', err)
  }
}

const handleApproveVersion = async (version: ProjectVersion) => {
  try {
    await approveVersion(props.projectId, version.projectVersionId)
  } catch (err) {
    console.error('Failed to approve version:', err)
  }
}

const handleRejectVersion = (version: ProjectVersion) => {
  versionToReject.value = version
  rejectionReason.value = ''
  showRejectModal.value = true
}

const confirmRejectVersion = async () => {
  if (!versionToReject.value || !rejectionReason.value.trim()) return
  
  try {
    await rejectVersion(props.projectId, versionToReject.value.projectVersionId, rejectionReason.value)
    showRejectModal.value = false
    versionToReject.value = null
    rejectionReason.value = ''
  } catch (err) {
    console.error('Failed to reject version:', err)
  }
}

const handleDeleteDraft = async (version: ProjectVersion) => {
  if (!confirm('Are you sure you want to delete this draft version?')) return
  
  try {
    await deleteDraftVersion(props.projectId, version.projectVersionId)
  } catch (err) {
    console.error('Failed to delete draft:', err)
  }
}

const refreshVersions = async () => {
  try {
    await Promise.all([
      getProject(props.projectId),
      getVersionHistory(props.projectId)
    ])
  } catch (err) {
    console.error('Failed to refresh versions:', err)
  }
}

// Utility functions
const getStatusBadgeClass = (status: string) => {
  const classes = {
    'Draft': 'bg-gray-100 text-gray-800',
    'PendingApproval': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Update Required': 'bg-red-100 text-red-800',
    'Updated by Project Team': 'bg-yellow-100 text-yellow-800',
    'Reviewed by Director': 'bg-green-100 text-green-800'
  }
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getVersionIconClass = (version: ProjectVersion) => {
  const classes = {
    'Draft': 'bg-gray-500',
    'PendingApproval': 'bg-yellow-500',
    'Approved': 'bg-green-500',
    'Rejected': 'bg-red-500'
  }
  return classes[version.status as keyof typeof classes] || 'bg-gray-500'
}

const getVersionItemClass = (version: ProjectVersion) => {
  if (version.projectVersionId === currentProject.value?.project.currentVersionId) {
    return 'border-blue-200 bg-blue-50'
  }
  return 'border-gray-200'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  refreshVersions()
})

// Watch for project ID changes
watch(() => props.projectId, () => {
  if (props.projectId) {
    refreshVersions()
  }
})
</script>

<style scoped>
.btn {
  @apply inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors;
}

.btn-primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.btn-secondary {
  @apply text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500;
}

.btn-success {
  @apply text-white bg-green-600 hover:bg-green-700 focus:ring-green-500;
}

.btn-danger {
  @apply text-white bg-red-600 hover:bg-red-700 focus:ring-red-500;
}

.btn-outline {
  @apply text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.version-item {
  transition: all 0.2s ease-in-out;
}

.version-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>

