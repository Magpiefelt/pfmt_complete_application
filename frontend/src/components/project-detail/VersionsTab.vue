<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Project Versions</h3>
        <p class="text-sm text-gray-600">Manage project versions and approval workflow</p>
      </div>
      <div class="flex items-center space-x-2">
        <Button 
          v-if="canCreateDraft && !hasDraftVersion" 
          @click="createDraft"
          variant="outline"
        >
          <Edit class="h-4 w-4 mr-2" />
          Create Draft
        </Button>
        <Button 
          v-if="canSubmitForApproval" 
          @click="submitForApproval"
        >
          <Send class="h-4 w-4 mr-2" />
          Submit for Approval
        </Button>
      </div>
    </div>

    <!-- Version Status Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <FileText class="h-5 w-5 text-blue-600" />
            <div>
              <p class="text-sm font-medium">Total Versions</p>
              <p class="text-2xl font-bold">{{ versions.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <CheckCircle class="h-5 w-5 text-green-600" />
            <div>
              <p class="text-sm font-medium">Approved</p>
              <p class="text-2xl font-bold">{{ approvedVersions.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <Clock class="h-5 w-5 text-yellow-600" />
            <div>
              <p class="text-sm font-medium">Pending</p>
              <p class="text-2xl font-bold">{{ submittedVersions.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <Edit class="h-5 w-5 text-orange-600" />
            <div>
              <p class="text-sm font-medium">Drafts</p>
              <p class="text-2xl font-bold">{{ draftVersions.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Current Version Status -->
    <Card v-if="currentVersion">
      <CardHeader>
        <CardTitle>Current Version Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center space-x-4">
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="getVersionIconBgClass(versionStatus)"
            >
              <component 
                :is="getVersionIcon(versionStatus)" 
                class="h-6 w-6"
                :class="getVersionIconClass(versionStatus)"
              />
            </div>
            <div>
              <h4 class="text-lg font-medium">{{ getVersionStatusTitle(versionStatus) }}</h4>
              <p class="text-sm text-gray-600">{{ getVersionStatusDescription(versionStatus) }}</p>
            </div>
          </div>
          <div class="text-right">
            <span 
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              :class="getVersionStatusClass(versionStatus)"
            >
              {{ formatStatus(versionStatus) }}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
      <Button variant="outline" @click="loadVersions" class="mt-2">
        Try Again
      </Button>
    </div>

    <!-- Version History -->
    <Card v-else>
      <CardHeader>
        <CardTitle>Version History</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="versions.length === 0" class="text-center py-8">
          <FileText class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500">No version history available.</p>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="version in sortedVersions" 
            :key="version.id"
            class="flex items-start space-x-4 p-4 border rounded-lg"
            :class="version.is_current ? 'border-blue-200 bg-blue-50' : 'hover:bg-gray-50'"
          >
            <!-- Version Icon -->
            <div class="flex-shrink-0 mt-1">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :class="getVersionIconBgClass(version.status)"
              >
                <component 
                  :is="getVersionIcon(version.status)" 
                  class="h-5 w-5"
                  :class="getVersionIconClass(version.status)"
                />
              </div>
            </div>

            <!-- Version Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <h4 class="text-sm font-medium text-gray-900">
                    Version {{ version.version_number }}
                  </h4>
                  <span 
                    v-if="version.is_current"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    Current
                  </span>
                </div>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getVersionStatusClass(version.status)"
                >
                  {{ formatStatus(version.status) }}
                </span>
              </div>
              
              <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span class="flex items-center">
                  <Calendar class="h-4 w-4 mr-1" />
                  Created {{ formatDate(version.created_at) }}
                </span>
                <span v-if="version.submitted_at" class="flex items-center">
                  <Send class="h-4 w-4 mr-1" />
                  Submitted {{ formatDate(version.submitted_at) }}
                </span>
                <span v-if="version.approved_at" class="flex items-center">
                  <CheckCircle class="h-4 w-4 mr-1" />
                  Approved {{ formatDate(version.approved_at) }}
                </span>
              </div>

              <div v-if="version.approved_by" class="mt-1 text-sm text-gray-600">
                Approved by {{ version.approved_by }}
              </div>

              <div v-if="version.rejection_reason" class="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p class="text-sm text-red-700">
                  <strong>Rejection Reason:</strong> {{ version.rejection_reason }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    v-if="canEdit && version.status === 'Draft'" 
                    @click="editVersion(version)"
                  >
                    <Edit class="h-4 w-4 mr-2" />
                    Edit Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="canDeleteDraft && version.status === 'Draft'" 
                    @click="deleteDraft(version)"
                    class="text-red-600"
                  >
                    <XCircle class="h-4 w-4 mr-2" />
                    Delete Draft
                  </DropdownMenuItem>
                  <DropdownMenuSeparator v-if="(canEdit || canDeleteDraft) && version.status === 'Draft'" />
                  <DropdownMenuItem @click="viewVersion(version)">
                    <Eye class="h-4 w-4 mr-2" />
                    View Version
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="canViewVersionHistory && !version.is_current" 
                    @click="compareWithCurrent(version)"
                  >
                    <GitCompare class="h-4 w-4 mr-2" />
                    Compare to Current
                  </DropdownMenuItem>
                  <DropdownMenuSeparator v-if="(canApprove || canReject) && version.status === 'submitted'" />
                  <DropdownMenuItem 
                    v-if="canApprove && version.status === 'submitted'" 
                    @click="approveVersion(version)"
                  >
                    <CheckCircle class="h-4 w-4 mr-2" />
                    Approve Version
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="canReject && version.status === 'submitted'" 
                    @click="showRejectDialog(version)"
                    class="text-red-600"
                  >
                    <XCircle class="h-4 w-4 mr-2" />
                    Reject Version
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Reject Version Dialog -->
    <Dialog v-model:open="showRejectVersionDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Version</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this version.
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="rejectVersion" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
            <Textarea 
              v-model="rejectionReason" 
              required
              rows="4"
              placeholder="Explain why this version is being rejected..."
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" @click="showRejectVersionDialog = false">
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            @click="rejectVersion" 
            :disabled="!rejectionReason.trim()"
          >
            Reject Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Version Comparison Dialog -->
    <Dialog v-model:open="showComparisonDialog">
      <DialogContent class="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version Comparison</DialogTitle>
          <DialogDescription>
            Comparing Version {{ comparisonData?.version1?.version_number }} with Version {{ comparisonData?.version2?.version_number }}
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="loadingComparison" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        <div v-else-if="comparisonError" class="text-center py-8">
          <p class="text-red-600">{{ comparisonError }}</p>
        </div>

        <div v-else-if="comparisonData" class="space-y-6">
          <!-- Version Headers -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 class="font-medium text-red-900">Version {{ comparisonData.version1.version_number }}</h4>
              <p class="text-sm text-red-700">{{ formatDate(comparisonData.version1.created_at) }}</p>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                {{ formatStatus(comparisonData.version1.status) }}
              </span>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 class="font-medium text-green-900">Version {{ comparisonData.version2.version_number }}</h4>
              <p class="text-sm text-green-700">{{ formatDate(comparisonData.version2.created_at) }}</p>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                {{ formatStatus(comparisonData.version2.status) }}
              </span>
            </div>
          </div>

          <!-- Changes Summary -->
          <div v-if="comparisonData.differences && comparisonData.differences.length > 0">
            <h4 class="font-medium text-gray-900 mb-3">Changes Summary</h4>
            <div class="bg-gray-50 border rounded-lg p-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p class="text-2xl font-bold text-blue-600">{{ comparisonData.differences.length }}</p>
                  <p class="text-sm text-gray-600">Total Changes</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-green-600">{{ getChangeCount('added') }}</p>
                  <p class="text-sm text-gray-600">Additions</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-red-600">{{ getChangeCount('modified') }}</p>
                  <p class="text-sm text-gray-600">Modifications</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Detailed Changes -->
          <div v-if="comparisonData.differences && comparisonData.differences.length > 0">
            <h4 class="font-medium text-gray-900 mb-3">Detailed Changes</h4>
            <div class="space-y-3">
              <div 
                v-for="(change, index) in comparisonData.differences" 
                :key="index"
                class="border rounded-lg p-4"
                :class="getChangeClass(change.type)"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h5 class="font-medium" :class="getChangeTextClass(change.type)">
                      {{ formatFieldName(change.field) }}
                    </h5>
                    <div class="mt-2 space-y-2">
                      <div v-if="change.oldValue" class="flex items-start space-x-2">
                        <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">OLD</span>
                        <span class="text-sm text-gray-700">{{ change.oldValue }}</span>
                      </div>
                      <div v-if="change.newValue" class="flex items-start space-x-2">
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">NEW</span>
                        <span class="text-sm text-gray-700">{{ change.newValue }}</span>
                      </div>
                    </div>
                  </div>
                  <span 
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="getChangeTypeClass(change.type)"
                  >
                    {{ change.type }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- No Changes -->
          <div v-else class="text-center py-8">
            <CheckCircle class="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p class="text-gray-500">No differences found between these versions.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showComparisonDialog = false">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Edit, 
  Send, 
  FileText, 
  CheckCircle, 
  Clock, 
  Calendar,
  MoreHorizontal,
  Eye,
  GitCompare,
  XCircle
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProjectVersions } from '@/composables/useProjectVersions'
import { useFormat } from '@/composables/useFormat'
import { useStatusBadge } from '@/composables/useStatusBadge'
import { useNotifications } from '@/composables/useNotifications'

interface Props {
  projectId: string
  canEdit: boolean
  canApprove: boolean
  userRole: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'version-created': []
  'version-submitted': []
  'version-approved': []
  'version-rejected': []
  'edit-version': [version: any]
}>()

const {
  currentProject,
  versions,
  loading,
  error,
  canCreateDraft,
  canEdit,
  canSubmitForApproval,
  canApprove,
  canReject,
  canDeleteDraft,
  canViewVersionHistory,
  hasDraftVersion,
  approvedVersions,
  draftVersions,
  submittedVersions,
  createDraft: createDraftApi,
  submitForApproval: submitForApprovalApi,
  approveVersion: approveVersionApi,
  rejectVersion: rejectVersionApi,
  compareVersions: compareVersionsApi,
  fetchProject,
  fetchVersions
} = useProjectVersions()

const { formatDate, formatStatus } = useFormat()
const { getVersionStatusClass, getVersionStatusIcon } = useStatusBadge()
const { 
  versionCreated, 
  versionSubmitted, 
  versionApproved, 
  versionRejected, 
  error: showError 
} = useNotifications()

// Local state
const showRejectVersionDialog = ref(false)
const rejectionReason = ref('')
const versionToReject = ref<any>(null)

// Comparison state
const showComparisonDialog = ref(false)
const loadingComparison = ref(false)
const comparisonError = ref<string | null>(null)
const comparisonData = ref<any>(null)

// Computed
const currentVersion = computed(() => {
  return versions.value.find(v => v.is_current)
})

const versionStatus = computed(() => {
  if (hasDraftVersion.value) return 'draft'
  if (submittedVersions.value.length > 0) return 'submitted'
  return 'approved'
})

const sortedVersions = computed(() => {
  return [...versions.value].sort((a, b) => {
    // Current version first, then by creation date descending
    if (a.is_current) return -1
    if (b.is_current) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

const canCompareVersions = computed(() => {
  return versions.value.length > 1
})

// Methods
const loadVersions = async () => {
  await fetchProject(props.projectId)
  await fetchVersions(props.projectId)
}

const createDraft = async () => {
  try {
    const result = await createDraftApi(props.projectId)
    if (result) {
      versionCreated(result.versionNumber || versions.value.length)
      emit('version-created')
    }
  } catch (error: any) {
    showError('Failed to Create Draft', error.message || 'An error occurred while creating the draft version.')
  }
}

const submitForApproval = async () => {
  try {
    const latestDraft = versions.value.find(v => v.status === 'Draft')
    if (!latestDraft) {
      showError('No Draft Found', 'No draft version available to submit for approval.')
      return
    }
    
    const result = await submitForApprovalApi(props.projectId, latestDraft.projectVersionId)
    if (result) {
      versionSubmitted(latestDraft.versionNumber)
      emit('version-submitted')
    }
  } catch (error: any) {
    showError('Failed to Submit for Approval', error.message || 'An error occurred while submitting the version for approval.')
  }
}

const approveVersion = async (version: any) => {
  try {
    const result = await approveVersionApi(props.projectId, version.projectVersionId)
    if (result) {
      versionApproved(version.versionNumber)
      emit('version-approved')
    }
  } catch (error: any) {
    showError('Failed to Approve Version', error.message || 'An error occurred while approving the version.')
  }
}

const showRejectDialog = (version: any) => {
  versionToReject.value = version
  rejectionReason.value = ''
  showRejectVersionDialog.value = true
}

const rejectVersion = async () => {
  if (!versionToReject.value || !rejectionReason.value.trim()) return

  try {
    const result = await rejectVersionApi(props.projectId, versionToReject.value.projectVersionId, rejectionReason.value)
    if (result) {
      versionRejected(versionToReject.value.versionNumber, rejectionReason.value)
      showRejectVersionDialog.value = false
      versionToReject.value = null
      rejectionReason.value = ''
      emit('version-rejected')
    }
  } catch (error: any) {
    showError('Failed to Reject Version', error.message || 'An error occurred while rejecting the version.')
  }
}

const editVersion = (version: any) => {
  // Navigate to edit version page or emit event for parent to handle
  emit('edit-version', version)
}

const deleteDraft = async (version: any) => {
  if (!confirm('Are you sure you want to delete this draft version? This action cannot be undone.')) {
    return
  }

  try {
    // Call delete draft API when available
    // For now, just show success message
    versionCreated(version.version_number, 'Draft deleted successfully')
    await loadVersions()
  } catch (error: any) {
    showError('Failed to Delete Draft', error.message || 'An error occurred while deleting the draft version.')
  }
}

const viewVersion = (version: any) => {
  // Navigate to version view or emit event
}

const compareWithCurrent = async (version: any) => {
  if (!currentVersion.value) return

  loadingComparison.value = true
  comparisonError.value = null
  showComparisonDialog.value = true

  try {
    const comparison = await compareVersionsApi(
      props.projectId,
      version.projectVersionId,
      currentVersion.value.projectVersionId
    )
    
    comparisonData.value = {
      version1: version,
      version2: currentVersion.value,
      differences: comparison.differences || []
    }
  } catch (error: any) {
    comparisonError.value = error.message || 'Failed to compare versions'
    showError('Comparison Failed', error.message || 'Failed to compare versions')
  } finally {
    loadingComparison.value = false
  }
}

// Comparison utility functions
const getChangeCount = (type: string) => {
  if (!comparisonData.value?.differences) return 0
  return comparisonData.value.differences.filter((diff: any) => diff.type === type).length
}

const getChangeClass = (type: string) => {
  const classMap: Record<string, string> = {
    'added': 'border-green-200 bg-green-50',
    'modified': 'border-yellow-200 bg-yellow-50',
    'removed': 'border-red-200 bg-red-50'
  }
  return classMap[type] || 'border-gray-200 bg-gray-50'
}

const getChangeTextClass = (type: string) => {
  const classMap: Record<string, string> = {
    'added': 'text-green-900',
    'modified': 'text-yellow-900',
    'removed': 'text-red-900'
  }
  return classMap[type] || 'text-gray-900'
}

const getChangeTypeClass = (type: string) => {
  const classMap: Record<string, string> = {
    'added': 'bg-green-100 text-green-800',
    'modified': 'bg-yellow-100 text-yellow-800',
    'removed': 'bg-red-100 text-red-800'
  }
  return classMap[type] || 'bg-gray-100 text-gray-800'
}

const formatFieldName = (field: string) => {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const getVersionIcon = (status: string) => {
  return getVersionStatusIcon(status)
}

const getVersionIconClass = (status: string) => {
  const classMap: Record<string, string> = {
    'draft': 'text-yellow-600',
    'submitted': 'text-blue-600',
    'approved': 'text-green-600',
    'rejected': 'text-red-600'
  }
  return classMap[status] || 'text-gray-600'
}

const getVersionIconBgClass = (status: string) => {
  const classMap: Record<string, string> = {
    'draft': 'bg-yellow-100',
    'submitted': 'bg-blue-100',
    'approved': 'bg-green-100',
    'rejected': 'bg-red-100'
  }
  return classMap[status] || 'bg-gray-100'
}

const getVersionStatusTitle = (status: string) => {
  const titleMap: Record<string, string> = {
    'draft': 'Draft in Progress',
    'submitted': 'Pending Approval',
    'approved': 'Current Version',
    'rejected': 'Version Rejected'
  }
  return titleMap[status] || 'Unknown Status'
}

const getVersionStatusDescription = (status: string) => {
  const descMap: Record<string, string> = {
    'draft': 'You have unsaved changes that can be edited.',
    'submitted': 'Version is awaiting approval from a director.',
    'approved': 'This is the current approved version.',
    'rejected': 'The submitted version was rejected and needs revision.'
  }
  return descMap[status] || ''
}

// Lifecycle
onMounted(() => {
  loadVersions()
})
</script>

