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
                  <DropdownMenuItem @click="viewVersion(version)">
                    <Eye class="h-4 w-4 mr-2" />
                    View Version
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="canCompareVersions && !version.is_current" 
                    @click="compareWithCurrent(version)"
                  >
                    <GitCompare class="h-4 w-4 mr-2" />
                    Compare to Current
                  </DropdownMenuItem>
                  <DropdownMenuSeparator v-if="canApprove && version.status === 'submitted'" />
                  <DropdownMenuItem 
                    v-if="canApprove && version.status === 'submitted'" 
                    @click="approveVersion(version)"
                  >
                    <CheckCircle class="h-4 w-4 mr-2" />
                    Approve Version
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="canApprove && version.status === 'submitted'" 
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
}>()

const {
  currentProject,
  versions,
  loading,
  error,
  canCreateDraft,
  canSubmitForApproval,
  hasDraftVersion,
  approvedVersions,
  draftVersions,
  submittedVersions,
  createDraft: createDraftApi,
  submitForApproval: submitForApprovalApi,
  approveVersion: approveVersionApi,
  rejectVersion: rejectVersionApi,
  fetchProject,
  fetchVersions
} = useProjectVersions()

const { formatDate, formatStatus } = useFormat()
const { getVersionStatusClass, getVersionStatusIcon } = useStatusBadge()

// Local state
const showRejectVersionDialog = ref(false)
const rejectionReason = ref('')
const versionToReject = ref<any>(null)

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
  const success = await createDraftApi(props.projectId)
  if (success) {
    emit('version-created')
  }
}

const submitForApproval = async () => {
  const success = await submitForApprovalApi(props.projectId)
  if (success) {
    emit('version-submitted')
  }
}

const approveVersion = async (version: any) => {
  const success = await approveVersionApi(version.id)
  if (success) {
    emit('version-approved')
  }
}

const showRejectDialog = (version: any) => {
  versionToReject.value = version
  rejectionReason.value = ''
  showRejectVersionDialog.value = true
}

const rejectVersion = async () => {
  if (!versionToReject.value || !rejectionReason.value.trim()) return

  const success = await rejectVersionApi(versionToReject.value.id, rejectionReason.value)
  if (success) {
    showRejectVersionDialog.value = false
    versionToReject.value = null
    rejectionReason.value = ''
    emit('version-rejected')
  }
}

const viewVersion = (version: any) => {
  // Navigate to version view or emit event
}

const compareWithCurrent = (version: any) => {
  // Navigate to comparison view or emit event
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

