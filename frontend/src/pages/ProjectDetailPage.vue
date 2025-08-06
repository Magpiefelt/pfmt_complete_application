<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error State -->
    <ErrorMessage 
      v-else-if="error" 
      :message="`Failed to load project: ${error}`"
      @retry="loadProject"
    />

    <!-- Project Detail Content -->
    <div v-else-if="project" class="space-y-6">
      <!-- Project Header Component -->
      <ProjectHeader
        :project="project"
        :view-mode="viewMode"
        :current-version="currentVersionNumber"
        :version-status="versionStatus"
        :has-draft-version="hasDraftVersion"
        :has-submitted-version="hasSubmittedVersion"
        :has-pending-changes="hasPendingChanges"
        :can-edit="canEdit"
        :can-view-draft="canViewDraft"
        :can-create-draft="canCreateDraft"
        :can-submit-for-approval="canSubmitForApproval"
        :can-approve="canApprove"
        :can-delete="canDelete"
        :user-role="currentUser?.role || ''"
        @update:view-mode="handleViewModeChange"
        @create-draft="handleCreateDraft"
        @submit-for-approval="handleSubmitForApproval"
        @approve-version="handleApproveVersion"
        @reject-version="handleRejectVersion"
        @export-project="handleExportProject"
        @print-project="handlePrintProject"
        @view-history="handleViewHistory"
        @duplicate-project="handleDuplicateProject"
        @delete-project="handleDeleteProject"
      />

      <!-- Project Tabs -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="budget">
            <div class="flex items-center space-x-1">
              <span>Budget</span>
              <span v-if="budgetHasChanges" class="inline-flex items-center justify-center w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="workflow">
            <div class="flex items-center space-x-1">
              <span>Workflow</span>
              <span v-if="workflowHasUpdates" class="inline-flex items-center justify-center w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="versions">
            <div class="flex items-center space-x-1">
              <span>Versions</span>
              <span v-if="hasPendingVersions" class="inline-flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>
          </TabsTrigger>
        </TabsList>

        <!-- Tab Content -->
        <div class="mt-6">
          <TabsContent value="overview">
            <OverviewTab
              :project="currentProjectData"
              :recent-activity="recentActivity"
            />
          </TabsContent>

          <TabsContent value="details">
            <DetailsTab
              :project="currentProjectData"
              :view-mode="viewMode"
              :can-edit="canEdit"
              @update:project="handleProjectUpdate"
              @save-changes="handleSaveChanges"
            />
          </TabsContent>

          <TabsContent value="location">
            <LocationTab
              :project="currentProjectData"
              :view-mode="viewMode"
              :can-edit="canEdit"
              @update:project="handleProjectUpdate"
              @save-changes="handleSaveChanges"
            />
          </TabsContent>

          <TabsContent value="vendors">
            <VendorsTab
              :project-id="projectId"
              :can-edit="canEdit"
              :user-role="currentUser?.role || ''"
              @vendor-added="handleVendorAdded"
              @vendor-updated="handleVendorUpdated"
              @vendor-removed="handleVendorRemoved"
            />
          </TabsContent>

          <TabsContent value="milestones">
            <MilestonesTab
              :project-id="projectId"
              :can-edit="canEdit"
              :user-role="currentUser?.role || ''"
              @meeting-completed="handleMeetingCompleted"
              @meeting-created="handleMeetingCreated"
              @meeting-updated="handleMeetingUpdated"
              @meeting-deleted="handleMeetingDeleted"
            />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetTab
              :project="currentProjectData"
              :view-mode="viewMode"
              :can-edit="canEdit"
              :budget-history="budgetHistory"
              @update:project="handleProjectUpdate"
              @save-changes="handleSaveChanges"
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab
              :project-id="projectId"
              :can-edit="canEdit"
              :user-role="currentUser?.role || ''"
              @document-uploaded="handleDocumentUploaded"
              @document-deleted="handleDocumentDeleted"
              @report-generated="handleReportGenerated"
            />
          </TabsContent>

          <TabsContent value="workflow">
            <WorkflowTab
              :project-id="projectId"
              :can-edit="canEdit"
              :user-role="currentUser?.role || ''"
              @task-completed="handleTaskCompleted"
              @task-created="handleTaskCreated"
              @task-updated="handleTaskUpdated"
            />
          </TabsContent>

          <TabsContent value="versions">
            <VersionsTab
              :project-id="projectId"
              :can-edit="canEdit"
              :can-approve="canApprove"
              :user-role="currentUser?.role || ''"
              @version-created="handleVersionCreated"
              @version-submitted="handleVersionSubmitted"
              @version-approved="handleVersionApproved"
              @version-rejected="handleVersionRejected"
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>

    <!-- Notification Container -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'

// Import modular components
import ProjectHeader from '@/components/project-detail/ProjectHeader.vue'
import OverviewTab from '@/components/project-detail/OverviewTab.vue'
import DetailsTab from '@/components/project-detail/DetailsTab.vue'
import LocationTab from '@/components/project-detail/LocationTab.vue'
import VendorsTab from '@/components/project-detail/VendorsTab.vue'
import MilestonesTab from '@/components/project-detail/MilestonesTab.vue'
import BudgetTab from '@/components/project-detail/BudgetTab.vue'
import ReportsTab from '@/components/project-detail/ReportsTab.vue'
import WorkflowTab from '@/components/project-detail/WorkflowTab.vue'
import VersionsTab from '@/components/project-detail/VersionsTab.vue'

// Import composables and services
import { useProjectVersions } from '@/composables/useProjectVersions'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'
import { ProjectService } from '@/services/ProjectService'

const route = useRoute()
const authStore = useAuthStore()
const notifications = useNotifications()

// Project data
const projectId = computed(() => route.params.id as string)
const project = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// UI state
const activeTab = ref('overview')
const viewMode = ref<'draft' | 'approved'>('approved')

// Activity and history data
const recentActivity = ref<any[]>([])
const budgetHistory = ref<any[]>([])

// Use project versions composable
const {
  currentProject,
  versions,
  canCreateDraft,
  canApprove,
  hasDraftVersion,
  hasSubmittedVersion,
  canSubmitForApproval,
  versionStatus,
  getProject,
  createDraftVersion,
  submitForApproval,
  approveVersion,
  rejectVersion
} = useProjectVersions()

// Computed properties
const currentUser = computed(() => authStore.currentUser)

const currentProjectData = computed(() => {
  if (viewMode.value === 'draft' && hasDraftVersion.value) {
    return currentProject.value?.draftVersion || project.value
  }
  return project.value
})

const currentVersionNumber = computed(() => {
  return currentProject.value?.currentVersion?.version_number || 'v1.0'
})

const canEdit = computed(() => {
  const user = currentUser.value
  if (!user) return false
  
  // Can edit if viewing draft mode and user has appropriate role
  return viewMode.value === 'draft' && 
         ['Project Manager', 'Senior Project Manager', 'Director', 'Admin'].includes(user.role)
})

const canViewDraft = computed(() => {
  return hasDraftVersion.value && canEdit.value
})

const canDelete = computed(() => {
  const user = currentUser.value
  return user && ['Director', 'Admin'].includes(user.role)
})

const hasPendingChanges = computed(() => {
  return hasDraftVersion.value
})

const budgetHasChanges = computed(() => {
  // Logic to determine if budget has unsaved changes
  return false
})

const workflowHasUpdates = computed(() => {
  // Logic to determine if workflow has updates
  return false
})

const hasPendingVersions = computed(() => {
  return hasSubmittedVersion.value
})

// Methods
const loadProject = async () => {
  loading.value = true
  error.value = null

  try {
    // Load project data
    const projectData = await ProjectService.getById(projectId.value)
    project.value = projectData

    // Load project with versions
    await getProject(parseInt(projectId.value))

    // Load additional data
    await loadRecentActivity()
    await loadBudgetHistory()
  } catch (err: any) {
    error.value = err.message || 'Failed to load project'
    console.error('Error loading project:', err)
  } finally {
    loading.value = false
  }
}

const loadRecentActivity = async () => {
  // Mock recent activity data
  recentActivity.value = [
    {
      id: '1',
      type: 'budget_updated',
      description: 'Budget updated by John Smith',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '2',
      type: 'meeting_scheduled',
      description: 'Gate 2 meeting scheduled for next week',
      created_at: new Date(Date.now() - 172800000).toISOString()
    }
  ]
}

const loadBudgetHistory = async () => {
  // Mock budget history data
  budgetHistory.value = [
    {
      id: '1',
      description: 'Initial budget approved',
      date: '2024-01-15',
      user: 'Director Smith',
      amount: 15000000
    }
  ]
}

// Event handlers
const handleViewModeChange = (mode: 'draft' | 'approved') => {
  viewMode.value = mode
}

const handleProjectUpdate = (updatedProject: any) => {
  // Update local project data
  if (viewMode.value === 'draft') {
    // Update draft version
    Object.assign(project.value, updatedProject)
  }
}

const handleSaveChanges = async (changes: any) => {
  try {
    if (viewMode.value === 'draft') {
      // Save to draft version
    } else {
      // Save to current version
      await ProjectService.update(projectId.value, changes)
      Object.assign(project.value, changes)
    }
  } catch (err) {
    console.error('Error saving changes:', err)
  }
}

const handleCreateDraft = async () => {
  try {
    await createDraftVersion(parseInt(projectId.value))
    viewMode.value = 'draft'
  } catch (err) {
    console.error('Error creating draft:', err)
  }
}

const handleSubmitForApproval = async () => {
  try {
    await submitForApproval(parseInt(projectId.value))
    viewMode.value = 'approved'
  } catch (err) {
    console.error('Error submitting for approval:', err)
  }
}

const handleApproveVersion = async () => {
  try {
    const pendingVersion = versions.value.find(v => v.status === 'submitted')
    if (pendingVersion) {
      await approveVersion(parseInt(projectId.value), pendingVersion.id)
    }
  } catch (err) {
    console.error('Error approving version:', err)
  }
}

const handleRejectVersion = async () => {
  const reason = prompt('Please provide a reason for rejection:')
  if (!reason) return

  try {
    const pendingVersion = versions.value.find(v => v.status === 'submitted')
    if (pendingVersion) {
      await rejectVersion(parseInt(projectId.value), pendingVersion.id, reason)
    }
  } catch (err) {
    console.error('Error rejecting version:', err)
  }
}

// Additional action handlers
const handleExportProject = () => {
}

const handlePrintProject = () => {
  window.print()
}

const handleViewHistory = () => {
  activeTab.value = 'versions'
}

const handleDuplicateProject = () => {
}

const handleDeleteProject = async () => {
  if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
    try {
      await ProjectService.delete(projectId.value)
      // Navigate back to projects list
      window.history.back()
    } catch (err) {
      console.error('Error deleting project:', err)
    }
  }
}

// Tab-specific event handlers
const handleVendorAdded = (vendor: any) => {
}

const handleVendorUpdated = (vendor: any) => {
}

const handleVendorRemoved = (vendorId: string) => {
}

const handleMeetingCompleted = (meeting: any) => {
}

const handleMeetingCreated = (meeting: any) => {
}

const handleMeetingUpdated = (meeting: any) => {
}

const handleMeetingDeleted = (meetingId: string) => {
}

const handleDocumentUploaded = (document: any) => {
}

const handleDocumentDeleted = (documentId: string) => {
}

const handleReportGenerated = (report: any) => {
}

const handleVersionCreated = () => {
  loadProject() // Refresh project data
  notifications.versionCreated(currentVersionNumber.value + 1)
}

const handleVersionSubmitted = () => {
  loadProject() // Refresh project data
  notifications.versionSubmitted(currentVersionNumber.value)
}

const handleVersionApproved = () => {
  loadProject() // Refresh project data
  notifications.versionApproved(currentVersionNumber.value)
}

const handleVersionRejected = () => {
  loadProject() // Refresh project data
  notifications.versionRejected(currentVersionNumber.value, 'Please review the feedback and make necessary changes.')
}

const handleTaskCompleted = (taskId: string) => {
  // Handle task completion
  notifications.taskCompleted('Project task')
  console.log('Task completed:', taskId)
}

const handleTaskCreated = (task: any) => {
  // Handle new task creation
  notifications.taskAssigned(task.title || 'New task', task.assignedTo || 'team member')
  console.log('Task created:', task)
}

const handleTaskUpdated = (task: any) => {
  // Handle task update
  notifications.info('Task Updated', `"${task.title || 'Task'}" has been updated.`)
  console.log('Task updated:', task)
}

const handleMeetingCompleted = (meeting: any) => {
  notifications.meetingCompleted(meeting.gate_type || 'Meeting', meeting.decision)
}

const handleMeetingCreated = (meeting: any) => {
  notifications.meetingScheduled(meeting.gate_type || 'Meeting', meeting.planned_date)
}

const handleMeetingUpdated = (meeting: any) => {
  notifications.info('Meeting Updated', `${meeting.gate_type || 'Meeting'} has been updated.`)
}

const handleMeetingDeleted = (meetingId: string) => {
  notifications.warning('Meeting Cancelled', 'A scheduled meeting has been cancelled.')
}