<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Gate Meetings & Milestones</h3>
        <p class="text-sm text-gray-600">Track project milestones and gate meeting progress</p>
      </div>
      <Button 
        v-if="canCreateMeetings" 
        @click="showCreateMeetingDialog = true"
        class="flex items-center space-x-2"
      >
        <Plus class="h-4 w-4" />
        <span>Schedule Meeting</span>
      </Button>
    </div>

    <!-- Statistics Cards -->
    <MilestoneStatistics
      :total-meetings="meetings.length"
      :completed-meetings="completedMeetings.length"
      :upcoming-meetings="upcomingMeetings.length"
      :total-milestones="totalMilestonesCount"
      :completed-milestones="completedMilestonesCount"
    />

    <!-- Main Content Tabs -->
    <Tabs v-model:value="activeTab" default-value="timeline">
      <TabsList class="grid w-full grid-cols-5">
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="planning">Planning</TabsTrigger>
        <TabsTrigger value="design">Design</TabsTrigger>
        <TabsTrigger value="construction">Construction</TabsTrigger>
        <TabsTrigger value="post-construction">Post Construction</TabsTrigger>
      </TabsList>

      <!-- Gate Meetings Timeline Tab -->
      <TabsContent value="timeline">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <p class="text-red-600">{{ error }}</p>
          <Button variant="outline" @click="loadMeetings" class="mt-2">
            Try Again
          </Button>
        </div>

        <!-- Gate Meetings Timeline -->
        <GateMeetingTimeline
          v-else
          :meetings="meetings"
          :can-create-meetings="canCreateMeetings"
          :can-edit-meeting="canEditMeeting"
          :can-complete-meeting="canCompleteMeeting"
          :can-delete-meeting="canDeleteMeeting"
          @create-meeting="showCreateMeetingDialog = true"
          @view-meeting="viewMeeting"
          @edit-meeting="editMeeting"
          @complete-meeting="completeMeeting"
          @delete-meeting="deleteMeeting"
        />
      </TabsContent>

      <!-- Planning Milestones Tab -->
      <TabsContent value="planning">
        <MilestoneGrid
          phase="Planning"
          :milestone-definitions="planningMilestones"
          :milestone-data="projectMilestones"
          :can-edit="canEditMilestones"
          :view-mode="viewMode"
          @update:milestone-data="updateMilestoneData"
          @save-milestones="saveMilestones"
          @view-gate-meeting="viewGateMeetingForMilestone"
        />
      </TabsContent>

      <!-- Design Milestones Tab -->
      <TabsContent value="design">
        <MilestoneGrid
          phase="Design"
          :milestone-definitions="designMilestones"
          :milestone-data="projectMilestones"
          :can-edit="canEditMilestones"
          :view-mode="viewMode"
          @update:milestone-data="updateMilestoneData"
          @save-milestones="saveMilestones"
          @view-gate-meeting="viewGateMeetingForMilestone"
        />
      </TabsContent>

      <!-- Construction Milestones Tab -->
      <TabsContent value="construction">
        <MilestoneGrid
          phase="Construction"
          :milestone-definitions="constructionMilestones"
          :milestone-data="projectMilestones"
          :can-edit="canEditMilestones"
          :view-mode="viewMode"
          @update:milestone-data="updateMilestoneData"
          @save-milestones="saveMilestones"
          @view-gate-meeting="viewGateMeetingForMilestone"
        />
      </TabsContent>

      <!-- Post Construction Milestones Tab -->
      <TabsContent value="post-construction">
        <MilestoneGrid
          phase="Post Construction"
          :milestone-definitions="postConstructionMilestones"
          :milestone-data="projectMilestones"
          :can-edit="canEditMilestones"
          :view-mode="viewMode"
          @update:milestone-data="updateMilestoneData"
          @save-milestones="saveMilestones"
          @view-gate-meeting="viewGateMeetingForMilestone"
        />
      </TabsContent>
    </Tabs>

    <!-- Create Meeting Dialog -->
    <CreateMeetingDialog
      v-model:open="showCreateMeetingDialog"
      @submit="handleCreateMeeting"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Target
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui'
import MilestoneGrid from './MilestoneGrid.vue'
import MilestoneStatistics from './MilestoneStatistics.vue'
import CreateMeetingDialog from './CreateMeetingDialog.vue'
import GateMeetingTimeline from './GateMeetingTimeline.vue'
import { useGateMeetings } from '@/composables/useGateMeetings'
import { useMilestones } from '@/composables/useMilestones'
import { usePermissions } from '@/composables/usePermissions'
import { useFormat } from '@/composables/useFormat'
import { 
  MILESTONE_DEFINITIONS,
  type ProjectMilestones,
  type MilestoneRecord
} from '@/types/milestones'
import type { GateMeeting } from '@/composables/useGateMeetings'

interface Props {
  projectId: string
  canEdit: boolean
  userRole: string
  viewMode?: 'draft' | 'approved'
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'draft'
})

const emit = defineEmits<{
  'meeting-completed': [meeting: GateMeeting]
  'meeting-created': [meeting: GateMeeting]
  'meeting-updated': [meeting: GateMeeting]
  'meeting-deleted': [meetingId: string]
}>()

// Gate meetings functionality
const {
  meetings,
  loading,
  error,
  upcomingMeetings,
  overdueMeetings,
  fetchUpcomingMeetings,
  createMeeting: createMeetingApi,
  updateMeeting,
  deleteMeeting: deleteMeetingApi,
  formatMeetingDate,
  getMeetingStatus,
  getMeetingStatusClass
} = useGateMeetings()

// Milestone functionality
const {
  milestones: projectMilestones,
  loading: milestonesLoading,
  error: milestonesError,
  loadMilestones,
  saveMilestones: saveMilestonesApi
} = useMilestones()

// Permissions
const {
  canCreateMeetings,
  canEditMeetings,
  canDeleteMeetings,
  canCompleteMeetings,
  canEditMilestones
} = usePermissions()

const { formatDate, truncateText } = useFormat()

// Local state
const activeTab = ref('timeline')
const showCreateMeetingDialog = ref(false)

// Milestone definitions by phase
const planningMilestones = computed(() => MILESTONE_DEFINITIONS.planning)
const designMilestones = computed(() => MILESTONE_DEFINITIONS.design)
const constructionMilestones = computed(() => MILESTONE_DEFINITIONS.construction)
const postConstructionMilestones = computed(() => MILESTONE_DEFINITIONS.postConstruction)

// Computed properties
const completedMeetings = computed(() => 
  meetings.value.filter(m => m.status === 'completed')
)

// Milestone statistics
const totalMilestonesCount = computed(() => {
  return Object.values(MILESTONE_DEFINITIONS).flat().length
})

const completedMilestonesCount = computed(() => {
  if (!projectMilestones.value) return 0
  
  let count = 0
  Object.values(projectMilestones.value).forEach(phaseData => {
    Object.values(phaseData).forEach(milestone => {
      if (milestone.actual_date || milestone.is_na) {
        count++
      }
    })
  })
  return count
})

// Methods
const loadMeetings = async () => {
  await fetchUpcomingMeetings({
    projectId: props.projectId,
    userRole: props.userRole
  })
}

const handleCreateMeeting = async (meetingData: any) => {
  const success = await createMeetingApi({
    project_id: props.projectId,
    gate_type: meetingData.gate_type,
    planned_date: meetingData.planned_date,
    agenda: meetingData.agenda || undefined
  })

  if (success) {
    showCreateMeetingDialog.value = false
    emit('meeting-created', meetings.value[meetings.value.length - 1])
  }
}

const viewMeeting = (meeting: GateMeeting) => {
  // TODO: Implement meeting detail view
  console.log('View meeting:', meeting)
}

const editMeeting = (meeting: GateMeeting) => {
  // TODO: Implement meeting editing
  console.log('Edit meeting:', meeting)
}

const completeMeeting = async (meeting: GateMeeting) => {
  const success = await updateMeeting(meeting.id, {
    status: 'completed',
    actual_date: new Date().toISOString().split('T')[0]
  })

  if (success) {
    emit('meeting-completed', meeting)
  }
}

const deleteMeeting = async (meeting: GateMeeting) => {
  if (confirm('Are you sure you want to delete this meeting?')) {
    const success = await deleteMeetingApi(meeting.id)
    if (success) {
      emit('meeting-deleted', meeting.id)
    }
  }
}

// Milestone methods
const updateMilestoneData = (updatedMilestones: ProjectMilestones) => {
  // Update local milestone data
  Object.assign(projectMilestones.value, updatedMilestones)
}

const saveMilestones = async (milestoneData: ProjectMilestones) => {
  await saveMilestonesApi(props.projectId, milestoneData)
}

const viewGateMeetingForMilestone = (milestoneId: string) => {
  // Switch to timeline tab and highlight related meeting
  activeTab.value = 'timeline'
  // TODO: Implement meeting highlighting
}

// Permission methods
const canEditMeeting = (meeting: GateMeeting) => {
  return props.canEdit && canEditMeetings.value && meeting.status !== 'completed'
}

const canCompleteMeeting = (meeting: GateMeeting) => {
  return props.canEdit && canCompleteMeetings.value && meeting.status !== 'completed' && new Date(meeting.planned_date) <= new Date()
}

const canDeleteMeeting = (meeting: GateMeeting) => {
  return props.canEdit && canDeleteMeetings.value
}

// Lifecycle
onMounted(async () => {
  await loadMeetings()
  await loadMilestones(props.projectId)
})
</script>

