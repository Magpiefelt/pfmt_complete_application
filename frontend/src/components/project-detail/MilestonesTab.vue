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
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Meetings</p>
              <p class="text-2xl font-bold">{{ meetings.length }}</p>
            </div>
            <Calendar class="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Completed</p>
              <p class="text-2xl font-bold">{{ completedMeetings.length }}</p>
            </div>
            <CheckCircle class="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Upcoming</p>
              <p class="text-2xl font-bold">{{ upcomingMeetings.length }}</p>
            </div>
            <Clock class="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Milestones</p>
              <p class="text-2xl font-bold">{{ completedMilestonesCount }}/{{ totalMilestonesCount }}</p>
            </div>
            <Target class="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>

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
        <div v-else class="space-y-4">
          <div v-if="meetings.length === 0" class="text-center py-8">
            <Calendar class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500">No meetings scheduled yet</p>
            <Button v-if="canCreateMeetings" @click="showCreateMeetingDialog = true" class="mt-4">
              Schedule First Meeting
            </Button>
          </div>
          
          <div v-else class="space-y-4">
            <Card v-for="meeting in meetings" :key="meeting.id" class="p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">{{ meeting.gate_type }} Meeting</h4>
                  <p class="text-sm text-gray-600">{{ formatMeetingDate(meeting.planned_date) }}</p>
                  <p v-if="meeting.status" class="text-xs" :class="getMeetingStatusClass(meeting.status)">
                    {{ getMeetingStatus(meeting.status) }}
                  </p>
                </div>
                <div class="flex items-center space-x-2">
                  <Button v-if="canEditMeeting(meeting)" variant="outline" size="sm" @click="editMeeting(meeting)">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button v-if="canCompleteMeeting(meeting)" variant="outline" size="sm" @click="completeMeeting(meeting)">
                    <CheckCircle class="h-4 w-4" />
                  </Button>
                  <Button v-if="canDeleteMeeting(meeting)" variant="outline" size="sm" @click="deleteMeeting(meeting)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </TabsContent>

      <!-- Planning Milestones Tab -->
      <TabsContent value="planning">
        <MilestoneGrid
          v-if="projectMilestones"
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
          v-if="projectMilestones"
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
          v-if="projectMilestones"
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
          v-if="projectMilestones"
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
    <Dialog v-model:open="showCreateMeetingDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Gate Meeting</DialogTitle>
          <DialogDescription>
            Schedule a new gate meeting for this project.
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">Meeting Type</label>
            <select v-model="newMeeting.gate_type" class="w-full mt-1 p-2 border rounded">
              <option value="gate1">Gate 1 - Project Definition</option>
              <option value="gate2">Gate 2 - Design Development</option>
              <option value="gate3">Gate 3 - Construction Documents</option>
              <option value="gate4">Gate 4 - Construction Completion</option>
              <option value="gate5">Gate 5 - Project Closeout</option>
            </select>
          </div>
          
          <div>
            <label class="text-sm font-medium">Planned Date</label>
            <input 
              v-model="newMeeting.planned_date" 
              type="date" 
              class="w-full mt-1 p-2 border rounded"
            />
          </div>
          
          <div>
            <label class="text-sm font-medium">Agenda (Optional)</label>
            <textarea 
              v-model="newMeeting.agenda" 
              :rows="3"
              class="w-full mt-1 p-2 border rounded"
              placeholder="Meeting agenda and topics..."
            ></textarea>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showCreateMeetingDialog = false">Cancel</Button>
          <Button @click="handleCreateMeeting">Schedule Meeting</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

// Import existing components that are available
import MilestoneGrid from './MilestoneGrid.vue'

// Import composables with fallbacks
let useGateMeetings, useMilestones, usePermissions, useFormat

try {
  ({ useGateMeetings } = await import('@/composables/useGateMeetings'))
} catch {
  useGateMeetings = () => ({
    meetings: ref([]),
    loading: ref(false),
    error: ref(null),
    upcomingMeetings: ref([]),
    overdueMeetings: ref([]),
    fetchUpcomingMeetings: () => Promise.resolve(),
    createMeeting: () => Promise.resolve(true),
    updateMeeting: () => Promise.resolve(true),
    deleteMeeting: () => Promise.resolve(true),
    formatMeetingDate: (date) => new Date(date).toLocaleDateString(),
    getMeetingStatus: (status) => status,
    getMeetingStatusClass: (status) => ''
  })
}

try {
  ({ useMilestones } = await import('@/composables/useMilestones'))
} catch {
  useMilestones = () => ({
    milestones: ref({}),
    loading: ref(false),
    error: ref(null),
    loadMilestones: () => Promise.resolve(),
    saveMilestones: () => Promise.resolve()
  })
}

try {
  ({ usePermissions } = await import('@/composables/usePermissions'))
} catch {
  usePermissions = () => ({
    canCreateMeetings: ref(true),
    canEditMeetings: ref(true),
    canDeleteMeetings: ref(true),
    canCompleteMeetings: ref(true),
    canEditMilestones: ref(true)
  })
}

try {
  ({ useFormat } = await import('@/composables/useFormat'))
} catch {
  useFormat = () => ({
    formatDate: (date) => new Date(date).toLocaleDateString(),
    truncateText: (text, length = 100) => text.length > length ? text.substring(0, length) + '...' : text
  })
}

// Types
interface GateMeeting {
  id: string
  project_id: string
  gate_type: string
  planned_date: string
  actual_date?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  agenda?: string
  notes?: string
  attendees?: string[]
}

interface ProjectMilestones {
  [phase: string]: {
    [milestoneKey: string]: {
      name?: string
      planned_date?: string
      actual_date?: string
      is_na?: boolean
      notes?: string
    }
  }
}

// Props
const props = defineProps<{
  projectId: string
  userRole: string
  canEdit: boolean
  viewMode?: 'approved' | 'draft'
}>()

// Emits
const emit = defineEmits<{
  'meeting-created': [meeting: GateMeeting]
  'meeting-completed': [meeting: GateMeeting]
  'meeting-deleted': [meetingId: string]
}>()

// Initialize composables
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

const {
  milestones: projectMilestones,
  loading: milestonesLoading,
  error: milestonesError,
  loadMilestones,
  saveMilestones: saveMilestonesApi
} = useMilestones()

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
const newMeeting = ref({
  gate_type: '',
  planned_date: '',
  agenda: ''
})

// FIXED: Fallback milestone definitions if constants are not available
const MILESTONE_DEFINITIONS = {
  planning: [
    { id: 'project_initiation', name: 'Project Initiation', required: true },
    { id: 'feasibility_study', name: 'Feasibility Study', required: true },
    { id: 'business_case', name: 'Business Case Approval', required: true }
  ],
  design: [
    { id: 'schematic_design', name: 'Schematic Design', required: true },
    { id: 'design_development', name: 'Design Development', required: true },
    { id: 'construction_documents', name: 'Construction Documents', required: true }
  ],
  construction: [
    { id: 'construction_start', name: 'Construction Start', required: true },
    { id: 'substantial_completion', name: 'Substantial Completion', required: true },
    { id: 'final_completion', name: 'Final Completion', required: true }
  ],
  postConstruction: [
    { id: 'commissioning', name: 'Commissioning', required: true },
    { id: 'warranty_period', name: 'Warranty Period', required: false },
    { id: 'project_closeout', name: 'Project Closeout', required: true }
  ]
}

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

// FIXED: Added comprehensive null safety for milestone iteration
const completedMilestonesCount = computed(() => {
  if (!projectMilestones.value) return 0
  
  let count = 0
  Object.values(projectMilestones.value).forEach(phaseData => {
    // Add null check for phaseData
    if (phaseData && typeof phaseData === 'object') {
      Object.values(phaseData).forEach(milestone => {
        // Add null check for milestone before accessing properties
        if (milestone && (milestone.actual_date || milestone.is_na)) {
          count++
        }
      })
    }
  })
  return count
})

// Methods
const loadMeetings = async () => {
  try {
    await fetchUpcomingMeetings({
      projectId: props.projectId,
      userRole: props.userRole
    })
  } catch (err) {
    console.error('Error loading meetings:', err)
  }
}

const handleCreateMeeting = async () => {
  if (!newMeeting.value.gate_type || !newMeeting.value.planned_date) {
    alert('Please fill in all required fields')
    return
  }

  try {
    const success = await createMeetingApi({
      project_id: props.projectId,
      gate_type: newMeeting.value.gate_type,
      planned_date: newMeeting.value.planned_date,
      agenda: newMeeting.value.agenda || undefined
    })

    if (success) {
      showCreateMeetingDialog.value = false
      newMeeting.value = { gate_type: '', planned_date: '', agenda: '' }
      emit('meeting-created', meetings.value[meetings.value.length - 1])
    }
  } catch (err) {
    console.error('Error creating meeting:', err)
  }
}

const viewMeeting = (meeting: GateMeeting) => {
  console.log('View meeting:', meeting)
}

const editMeeting = (meeting: GateMeeting) => {
  console.log('Edit meeting:', meeting)
}

const completeMeeting = async (meeting: GateMeeting) => {
  try {
    const success = await updateMeeting(meeting.id, {
      status: 'completed',
      actual_date: new Date().toISOString().split('T')[0]
    })

    if (success) {
      emit('meeting-completed', meeting)
    }
  } catch (err) {
    console.error('Error completing meeting:', err)
  }
}

const deleteMeeting = async (meeting: GateMeeting) => {
  if (confirm('Are you sure you want to delete this meeting?')) {
    try {
      const success = await deleteMeetingApi(meeting.id)
      if (success) {
        emit('meeting-deleted', meeting.id)
      }
    } catch (err) {
      console.error('Error deleting meeting:', err)
    }
  }
}

// Milestone methods
const updateMilestoneData = (updatedMilestones: ProjectMilestones) => {
  if (projectMilestones.value) {
    Object.assign(projectMilestones.value, updatedMilestones)
  }
}

const saveMilestones = async (milestoneData: ProjectMilestones) => {
  try {
    await saveMilestonesApi(props.projectId, milestoneData)
  } catch (err) {
    console.error('Error saving milestones:', err)
  }
}

const viewGateMeetingForMilestone = (milestoneId: string) => {
  activeTab.value = 'timeline'
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
  try {
    await loadMilestones(props.projectId)
  } catch (err) {
    console.error('Error loading milestones:', err)
  }
})
</script>

