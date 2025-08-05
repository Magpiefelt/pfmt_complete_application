<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Gate Meetings & Milestones</h3>
        <p class="text-sm text-gray-600">Track project milestones and gate meeting progress</p>
      </div>
      <Button 
        v-if="canCreateMeeting" 
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
          <div class="flex items-center space-x-2">
            <Calendar class="h-5 w-5 text-blue-600" />
            <div>
              <p class="text-sm font-medium">Total Meetings</p>
              <p class="text-2xl font-bold">{{ meetings.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <CheckCircle class="h-5 w-5 text-green-600" />
            <div>
              <p class="text-sm font-medium">Completed</p>
              <p class="text-2xl font-bold">{{ completedMeetings.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <Clock class="h-5 w-5 text-orange-600" />
            <div>
              <p class="text-sm font-medium">Upcoming</p>
              <p class="text-2xl font-bold">{{ upcomingMeetings.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center space-x-2">
            <AlertTriangle class="h-5 w-5 text-red-600" />
            <div>
              <p class="text-sm font-medium">Overdue</p>
              <p class="text-2xl font-bold">{{ overdueMeetings.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

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
    <Card v-else>
      <CardHeader>
        <CardTitle>Gate Meetings Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="meetings.length === 0" class="text-center py-8">
          <Calendar class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500">No gate meetings scheduled yet.</p>
          <Button 
            v-if="canCreateMeeting" 
            variant="outline" 
            @click="showCreateMeetingDialog = true"
            class="mt-4"
          >
            Schedule First Meeting
          </Button>
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="meeting in sortedMeetings" 
            :key="meeting.id"
            class="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            :class="getMeetingBorderClass(meeting.planned_date, meeting.status)"
          >
            <!-- Status Icon -->
            <div class="flex-shrink-0 mt-1">
              <div 
                class="w-8 h-8 rounded-full flex items-center justify-center"
                :class="getMeetingIconBgClass(meeting.planned_date, meeting.status)"
              >
                <component 
                  :is="getMeetingIcon(meeting.status)" 
                  class="h-4 w-4"
                  :class="getMeetingIconClass(meeting.planned_date, meeting.status)"
                />
              </div>
            </div>

            <!-- Meeting Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900">{{ meeting.gate_type }}</h4>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getMeetingStatusClass(meeting.planned_date)"
                >
                  {{ getMeetingStatus(meeting.planned_date) }}
                </span>
              </div>
              
              <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                <span class="flex items-center">
                  <Calendar class="h-4 w-4 mr-1" />
                  {{ formatMeetingDate(meeting.planned_date) }}
                </span>
                <span v-if="meeting.attendees?.length" class="flex items-center">
                  <Users class="h-4 w-4 mr-1" />
                  {{ meeting.attendees.length }} attendees
                </span>
              </div>

              <p v-if="meeting.agenda" class="mt-2 text-sm text-gray-700">
                {{ truncateText(meeting.agenda, 150) }}
              </p>

              <div v-if="meeting.status === 'completed'" class="mt-2">
                <div class="flex items-center space-x-2 text-sm">
                  <CheckCircle class="h-4 w-4 text-green-600" />
                  <span class="text-green-700">Completed on {{ formatDate(meeting.actual_date) }}</span>
                  <span v-if="meeting.decision" class="text-gray-500">• Decision: {{ meeting.decision }}</span>
                </div>
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
                  <DropdownMenuItem @click="viewMeeting(meeting)">
                    <Eye class="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="canEditMeeting(meeting)" 
                    @click="editMeeting(meeting)"
                  >
                    <Edit class="h-4 w-4 mr-2" />
                    Edit Meeting
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    v-if="canCompleteMeeting(meeting)" 
                    @click="completeMeeting(meeting)"
                  >
                    <CheckCircle class="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    v-if="canDeleteMeeting(meeting)" 
                    @click="deleteMeeting(meeting)"
                    class="text-red-600"
                  >
                    <Trash2 class="h-4 w-4 mr-2" />
                    Delete Meeting
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Create Meeting Dialog -->
    <Dialog v-model:open="showCreateMeetingDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Gate Meeting</DialogTitle>
          <DialogDescription>
            Schedule a new gate meeting for this project.
          </DialogDescription>
        </DialogHeader>
        
        <form @submit.prevent="createMeeting" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Gate Type</label>
            <select 
              v-model="newMeeting.gate_type" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Gate Type</option>
              <option value="Gate 1 - Project Initiation">Gate 1 - Project Initiation</option>
              <option value="Gate 2 - Design Approval">Gate 2 - Design Approval</option>
              <option value="Gate 3 - Construction Progress Review">Gate 3 - Construction Progress Review</option>
              <option value="Gate 4 - Project Completion">Gate 4 - Project Completion</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Planned Date</label>
            <input 
              v-model="newMeeting.planned_date" 
              type="date" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Agenda (Optional)</label>
            <textarea 
              v-model="newMeeting.agenda" 
              rows="3"
              placeholder="Meeting agenda and topics to discuss..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" @click="showCreateMeetingDialog = false">
            Cancel
          </Button>
          <Button @click="createMeeting" :disabled="!isValidMeeting">
            Schedule Meeting
          </Button>
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
  Users
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { useGateMeetings } from '@/composables/useGateMeetings'
import { useFormat } from '@/composables/useFormat'
import type { GateMeeting } from '@/composables/useGateMeetings'

interface Props {
  projectId: string
  canEdit: boolean
  userRole: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'meeting-completed': [meeting: GateMeeting]
  'meeting-created': [meeting: GateMeeting]
  'meeting-updated': [meeting: GateMeeting]
  'meeting-deleted': [meetingId: string]
}>()

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

const { formatDate, truncateText } = useFormat()

// Local state
const showCreateMeetingDialog = ref(false)
const newMeeting = ref({
  gate_type: '',
  planned_date: '',
  agenda: ''
})

// Computed properties
const canCreateMeeting = computed(() => {
  return props.canEdit && ['Project Manager', 'Senior Project Manager', 'Director', 'Admin'].includes(props.userRole)
})

const completedMeetings = computed(() => 
  meetings.value.filter(m => m.status === 'completed')
)

const sortedMeetings = computed(() => 
  [...meetings.value].sort((a, b) => new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime())
)

const isValidMeeting = computed(() => {
  return newMeeting.value.gate_type && newMeeting.value.planned_date
})

// Methods
const loadMeetings = async () => {
  await fetchUpcomingMeetings({
    projectId: props.projectId,
    userRole: props.userRole
  })
}

const createMeeting = async () => {
  if (!isValidMeeting.value) return

  const success = await createMeetingApi({
    project_id: props.projectId,
    gate_type: newMeeting.value.gate_type,
    planned_date: newMeeting.value.planned_date,
    agenda: newMeeting.value.agenda || undefined
  })

  if (success) {
    showCreateMeetingDialog.value = false
    newMeeting.value = {
      gate_type: '',
      planned_date: '',
      agenda: ''
    }
    emit('meeting-created', meetings.value[meetings.value.length - 1])
  }
}

const viewMeeting = (meeting: GateMeeting) => {
  // Emit event or navigate to meeting detail
}

const editMeeting = (meeting: GateMeeting) => {
  // Open edit dialog or navigate to edit page
}

const completeMeeting = async (meeting: GateMeeting) => {
  const success = await updateMeeting(meeting.id, {
    status: 'completed',
    actual_date: new Date().toISOString()
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

const canEditMeeting = (meeting: GateMeeting) => {
  return props.canEdit && meeting.status === 'scheduled'
}

const canCompleteMeeting = (meeting: GateMeeting) => {
  return props.canEdit && meeting.status === 'scheduled'
}

const canDeleteMeeting = (meeting: GateMeeting) => {
  return props.canEdit && ['Project Manager', 'Senior Project Manager', 'Admin'].includes(props.userRole)
}

const getMeetingIcon = (status: string) => {
  const iconMap: Record<string, any> = {
    'scheduled': Calendar,
    'completed': CheckCircle,
    'cancelled': AlertTriangle
  }
  return iconMap[status] || Calendar
}

const getMeetingIconClass = (plannedDate: string, status: string) => {
  if (status === 'completed') return 'text-green-600'
  if (status === 'cancelled') return 'text-red-600'
  
  const meetingStatus = getMeetingStatus(plannedDate)
  const classMap: Record<string, string> = {
    'Overdue': 'text-red-600',
    'Today': 'text-orange-600',
    'Soon': 'text-yellow-600',
    'Upcoming': 'text-blue-600'
  }
  return classMap[meetingStatus] || 'text-blue-600'
}

const getMeetingIconBgClass = (plannedDate: string, status: string) => {
  if (status === 'completed') return 'bg-green-100'
  if (status === 'cancelled') return 'bg-red-100'
  
  const meetingStatus = getMeetingStatus(plannedDate)
  const classMap: Record<string, string> = {
    'Overdue': 'bg-red-100',
    'Today': 'bg-orange-100',
    'Soon': 'bg-yellow-100',
    'Upcoming': 'bg-blue-100'
  }
  return classMap[meetingStatus] || 'bg-blue-100'
}

const getMeetingBorderClass = (plannedDate: string, status: string) => {
  if (status === 'completed') return 'border-green-200'
  if (status === 'cancelled') return 'border-red-200'
  
  const meetingStatus = getMeetingStatus(plannedDate)
  const classMap: Record<string, string> = {
    'Overdue': 'border-red-200',
    'Today': 'border-orange-200',
    'Soon': 'border-yellow-200',
    'Upcoming': 'border-blue-200'
  }
  return classMap[meetingStatus] || 'border-gray-200'
}

// Lifecycle
onMounted(() => {
  loadMeetings()
})
</script>

