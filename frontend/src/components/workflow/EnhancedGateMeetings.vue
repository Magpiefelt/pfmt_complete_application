<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Gate Meetings & Workflow</h3>
        <p class="text-sm text-gray-600">
          Manage project gate meetings, decisions, and workflow progression
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <Button variant="outline" @click="exportMeetings">
          <Download class="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button @click="showScheduleMeetingDialog = true">
          <Plus class="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>
    </div>

    <!-- Project Workflow Status -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <GitBranch class="h-5 w-5" />
          Project Workflow Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">
                Current State: {{ projectWorkflow.currentState || 'Not Set' }}
              </p>
              <p class="text-sm text-gray-600">
                {{ projectWorkflow.nextAction || 'No next action defined' }}
              </p>
            </div>
            <Button variant="outline" @click="updateWorkflowState">
              <Edit class="w-4 h-4 mr-2" />
              Update State
            </Button>
          </div>
          
          <!-- Workflow Progress -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Workflow Progress</span>
              <span>{{ workflowProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${workflowProgress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Filters -->
    <Card>
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label class="block text-sm font-medium text-gray-700 mb-1">Status</Label>
            <Select v-model="filters.status" @update:model-value="loadMeetings">
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label class="block text-sm font-medium text-gray-700 mb-1">Gate Type</Label>
            <Select v-model="filters.gateType" @update:model-value="loadMeetings">
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="Gate 1 - Project Initiation">Gate 1 - Project Initiation</SelectItem>
                <SelectItem value="Gate 2 - Design Approval">Gate 2 - Design Approval</SelectItem>
                <SelectItem value="Gate 3 - Construction Progress Review">Gate 3 - Construction Progress Review</SelectItem>
                <SelectItem value="Gate 4 - Project Completion">Gate 4 - Project Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label class="block text-sm font-medium text-gray-700 mb-1">Upcoming Only</Label>
            <Select v-model="filters.upcomingOnly" @update:model-value="loadMeetings">
              <SelectTrigger>
                <SelectValue placeholder="All Meetings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Meetings</SelectItem>
                <SelectItem value="true">Upcoming Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-end">
            <Button variant="outline" @click="refreshMeetings" class="w-full">
              <RefreshCw class="w-4 h-4 mr-2" />
              Refresh
            </Button>
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
      <Button variant="outline" @click="loadMeetings" class="mt-2">
        Try Again
      </Button>
    </div>

    <!-- Meetings List -->
    <div v-else class="space-y-4">
      <div v-if="filteredMeetings.length === 0" class="text-center py-8">
        <Calendar class="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-500">No gate meetings found.</p>
        <Button 
          variant="outline" 
          @click="showScheduleMeetingDialog = true"
          class="mt-4"
        >
          Schedule First Meeting
        </Button>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="meeting in filteredMeetings" 
          :key="meeting.id"
          class="border rounded-lg overflow-hidden"
        >
          <!-- Meeting Header -->
          <div 
            class="p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
            @click="toggleMeetingDetails(meeting.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar class="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">{{ meeting.gate_type }}</h4>
                  <p class="text-sm text-gray-600">{{ formatMeetingDate(meeting) }}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <Badge :variant="getStatusVariant(meeting.status)">
                  {{ formatStatus(meeting.status) }}
                </Badge>
                <ChevronDown 
                  class="h-4 w-4 text-gray-400 transition-transform"
                  :class="{ 'rotate-180': expandedMeetings.has(meeting.id) }"
                />
              </div>
            </div>
          </div>

          <!-- Meeting Details (Expandable) -->
          <div v-if="expandedMeetings.has(meeting.id)" class="p-4">
            <GateMeetingDetails
              :meeting="meeting"
              :can-edit="canEdit"
              @meeting-updated="handleMeetingUpdated"
              @action-item-updated="handleActionItemUpdated"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule Meeting Dialog -->
    <Dialog v-model:open="showScheduleMeetingDialog">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Gate Meeting</DialogTitle>
          <DialogDescription>
            Schedule a new gate meeting for this project
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <Label for="gate-type">Gate Type *</Label>
            <Select v-model="newMeeting.gateType" required>
              <SelectTrigger class="mt-1">
                <SelectValue placeholder="Select Gate Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gate 1 - Project Initiation">Gate 1 - Project Initiation</SelectItem>
                <SelectItem value="Gate 2 - Design Approval">Gate 2 - Design Approval</SelectItem>
                <SelectItem value="Gate 3 - Construction Progress Review">Gate 3 - Construction Progress Review</SelectItem>
                <SelectItem value="Gate 4 - Project Completion">Gate 4 - Project Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label for="scheduled-date">Scheduled Date *</Label>
            <Input
              id="scheduled-date"
              v-model="newMeeting.scheduledDate"
              type="date"
              required
              class="mt-1"
            />
          </div>
          <div>
            <Label for="agenda">Agenda</Label>
            <Textarea
              id="agenda"
              v-model="newMeeting.agenda"
              rows="4"
              placeholder="Meeting agenda and topics to discuss..."
              class="mt-1"
            />
          </div>
          <div>
            <Label>Attendees</Label>
            <div class="space-y-2 mt-1">
              <div v-for="(attendee, index) in newMeeting.attendees" :key="index" class="flex items-center space-x-2">
                <Input
                  v-model="attendee.name"
                  type="text"
                  placeholder="Name"
                  class="flex-1"
                />
                <Input
                  v-model="attendee.email"
                  type="email"
                  placeholder="Email"
                  class="flex-1"
                />
                <Button variant="outline" size="sm" @click="removeAttendee(index)">
                  <X class="w-4 h-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" @click="addAttendee">
                <Plus class="w-4 h-4 mr-2" />
                Add Attendee
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showScheduleMeetingDialog = false">
            Cancel
          </Button>
          <Button @click="scheduleMeeting" :disabled="!isValidMeeting">
            Schedule Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Download, Plus, RefreshCw, GitBranch, Edit, Calendar, 
  ChevronDown, X
} from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import GateMeetingDetails from './GateMeetingDetails.vue'

interface Attendee {
  name: string
  email: string
  role?: string
}

interface GateMeeting {
  id: string
  project_id: string
  gate_type: string
  scheduled_date: string
  actual_date?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  attendees?: Attendee[]
  agenda?: string
  minutes?: string
  decisions?: any[]
  action_items?: any[]
  created_by?: string
  created_at: string
  updated_at: string
}

interface Props {
  projectId: string
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'meeting-completed': [meeting: GateMeeting]
  'trigger-version-submission': [data: any]
}>()

// State
const meetings = ref<GateMeeting[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showScheduleMeetingDialog = ref(false)
const expandedMeetings = ref(new Set<string>())

const projectWorkflow = ref({
  currentState: '',
  nextAction: ''
})

const filters = ref({
  status: '',
  gateType: '',
  upcomingOnly: ''
})

const newMeeting = ref({
  gateType: '',
  scheduledDate: '',
  agenda: '',
  attendees: [{ name: '', email: '', role: '' }]
})

// Computed
const filteredMeetings = computed(() => {
  let filtered = meetings.value

  if (filters.value.status) {
    filtered = filtered.filter(m => m.status === filters.value.status)
  }

  if (filters.value.gateType) {
    filtered = filtered.filter(m => m.gate_type === filters.value.gateType)
  }

  if (filters.value.upcomingOnly === 'true') {
    const now = new Date()
    filtered = filtered.filter(m => new Date(m.scheduled_date) > now)
  }

  return filtered.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
})

const workflowProgress = computed(() => {
  const completedMeetings = meetings.value.filter(m => m.status === 'completed')
  const totalMeetings = 4 // Assuming 4 gate meetings
  return Math.round((completedMeetings.length / totalMeetings) * 100)
})

const isValidMeeting = computed(() => {
  return newMeeting.value.gateType && newMeeting.value.scheduledDate
})

// Methods
const loadMeetings = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Mock data - replace with actual API call
    meetings.value = [
      {
        id: '1',
        project_id: props.projectId,
        gate_type: 'Gate 1 - Project Initiation',
        scheduled_date: '2024-02-15',
        actual_date: '2024-02-15',
        status: 'completed',
        attendees: [
          { name: 'John Smith', email: 'john.smith@gov.ab.ca', role: 'Project Manager' },
          { name: 'Sarah Johnson', email: 'sarah.johnson@gov.ab.ca', role: 'Director' }
        ],
        agenda: 'Project initiation review, scope confirmation, budget approval',
        minutes: 'Meeting held to review project initiation documents. All stakeholders present. Project scope and budget approved.',
        decisions: [
          { decision: 'Project approved to proceed to design phase', rationale: 'All requirements met', decision_maker: 'Sarah Johnson' }
        ],
        action_items: [
          { action: 'Finalize design team selection', assignee: 'John Smith', due_date: '2024-02-28', status: 'completed' },
          { action: 'Submit environmental assessment', assignee: 'Mike Wilson', due_date: '2024-03-15', status: 'in_progress' }
        ],
        created_by: 'user1',
        created_at: '2024-02-01T10:00:00Z',
        updated_at: '2024-02-15T14:30:00Z'
      }
    ]
  } catch (err) {
    error.value = 'Failed to load gate meetings'
    console.error('Error loading meetings:', err)
  } finally {
    loading.value = false
  }
}

const formatMeetingDate = (meeting: GateMeeting) => {
  if (meeting.actual_date) {
    return `Held on ${formatDate(meeting.actual_date)}`
  }
  return `Scheduled for ${formatDate(meeting.scheduled_date)}`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA')
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default'
    case 'scheduled':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    default:
      return 'outline'
  }
}

const toggleMeetingDetails = (meetingId: string) => {
  if (expandedMeetings.value.has(meetingId)) {
    expandedMeetings.value.delete(meetingId)
  } else {
    expandedMeetings.value.add(meetingId)
  }
}

const addAttendee = () => {
  newMeeting.value.attendees.push({ name: '', email: '', role: '' })
}

const removeAttendee = (index: number) => {
  newMeeting.value.attendees.splice(index, 1)
}

const scheduleMeeting = async () => {
  try {
    // API call to schedule meeting
    const meetingData = {
      project_id: props.projectId,
      gate_type: newMeeting.value.gateType,
      scheduled_date: newMeeting.value.scheduledDate,
      agenda: newMeeting.value.agenda,
      attendees: newMeeting.value.attendees.filter(a => a.name && a.email)
    }
    
    // Mock success - replace with actual API call
    const newMeetingRecord: GateMeeting = {
      id: Date.now().toString(),
      ...meetingData,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    meetings.value.push(newMeetingRecord)
    
    showScheduleMeetingDialog.value = false
    newMeeting.value = {
      gateType: '',
      scheduledDate: '',
      agenda: '',
      attendees: [{ name: '', email: '', role: '' }]
    }
  } catch (error) {
    console.error('Error scheduling meeting:', error)
  }
}

const handleMeetingUpdated = (updatedMeeting: GateMeeting) => {
  const index = meetings.value.findIndex(m => m.id === updatedMeeting.id)
  if (index !== -1) {
    meetings.value[index] = updatedMeeting
  }
}

const handleActionItemUpdated = (actionItem: any, index: number) => {
  // Handle action item updates
  console.log('Action item updated:', actionItem, index)
}

const updateWorkflowState = () => {
  // Implementation for updating workflow state
  console.log('Update workflow state')
}

const refreshMeetings = () => {
  loadMeetings()
}

const exportMeetings = () => {
  // Implementation for exporting meetings
  console.log('Export meetings')
}

onMounted(() => {
  loadMeetings()
})

watch(filters, () => {
  // Filters are reactive, no need to reload
}, { deep: true })
</script>

